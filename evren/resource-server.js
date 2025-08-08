import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config();

const app = express();
function loadTotpSecret(){
  try {
    if (fs.existsSync(SECRET_STORE)) {
      const raw = fs.readFileSync(SECRET_STORE, 'utf8');
      const j = JSON.parse(raw);
      if (j && j.base32) return j.base32;
    }
  } catch {}
  return null;
}
function saveTotpSecret(base32){
  try {
    fs.writeFileSync(SECRET_STORE, JSON.stringify({ base32 }, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

app.use(cookieParser());
function isProtectedPath(p){
  // exact match for files like /admin.html or prefix match for folders like /admin
  return PROTECTED_PATHS.some(x => x.endsWith('.html') ? p === x : p.startsWith(x));
}

app.use(express.json());

const WEB_PORT = process.env.WEB_PORT || 3000;
const STATIC_ROOT = process.env.STATIC_ROOT || '.';
const PROTECTED_PATHS = (process.env.PROTECTED_PATHS || '/admin.html,/admin').split(',').map(s=>s.trim()).filter(Boolean);
const COOKIE_NAME = process.env.COOKIE_NAME || 'admin_token';
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || 'false') === 'true';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOTP_ISSUER = process.env.TOTP_ISSUER || 'FilmEvreni';
const TOTP_LABEL = process.env.TOTP_LABEL || 'admin@film-evreni';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-password'; // used for initial TOTP setup
const SECRET_STORE = path.join(STATIC_ROOT, 'totp-secret.json');


/**
 * Token extractor: from Authorization: Bearer <token> or cookie.
 */
function getToken(req){
  const h = req.headers['authorization'];
  if (h && h.startsWith('Bearer ')) return h.slice(7);
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  return null;
}

/**
 * Protect /hidden/* routes
 */

/**
 * Helper endpoint to set token cookie from client (optional)
 * Body: { token }
 */
app.post('/set-token', (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    jwt.verify(token, JWT_SECRET);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: COOKIE_SECURE,
      maxAge: 1000 * 60 * 60 // 1 hour (browser cap; actual token controls)
    });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid token' });
  }
});

/**
 * Serve static files after middleware
 */

/**
 * POST /totp/setup
 * Body: { password }
 * Generates a new TOTP secret (base32) + otpauth URL + QR (data URL).
 * Protect this with admin password so sadece yetkili kişi QR üretebilsin.
 */
app.post('/totp/setup', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password || password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

    const existing = loadTotpSecret();
    if (existing) {
      // Secret already exists; don't rotate silently.
      return res.status(409).json({ error: 'Secret already set. Rotate explicitly if needed.' });
    }

    const secret = speakeasy.generateSecret({
      name: `${TOTP_ISSUER}:${TOTP_LABEL}`,
      issuer: TOTP_ISSUER,
      length: 20
    });

    if (!saveTotpSecret(secret.base32)) {
      return res.status(500).json({ error: 'Failed to persist secret' });
    }

    const otpauth = secret.otpauth_url;
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    res.json({ base32: secret.base32, otpauth, qr: qrDataUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /totp/verify
 * Body: { token }
 * Verifies the TOTP code and issues a short-lived JWT (cookie).
 */
app.post('/totp/verify', (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Missing token' });
    const base32 = loadTotpSecret();
    if (!base32) return res.status(503).json({ error: 'TOTP not initialized' });

    const ok = speakeasy.totp.verify({
      secret: base32,
      encoding: 'base32',
      token: String(token),
      window: 1
    });

    if (!ok) return res.status(401).json({ error: 'Invalid code' });

    const jwtToken = jwt.sign({ sub: 'admin', mfa: true, scope: ['admin'] }, JWT_SECRET, { expiresIn: '30m' });
    res.cookie(COOKIE_NAME, jwtToken, { httpOnly: true, sameSite: 'Lax', secure: COOKIE_SECURE, maxAge: 30*60*1000 });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
});



/* PROTECTION MIDDLEWARE (paths) */
/**
 * GET /verify-token
 * Returns 200 if JWT valid, otherwise 401.
 */
app.get('/verify-token', (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ ok:false });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ ok:true, sub: payload.sub, exp: payload.exp });
  } catch (e) {
    return res.status(401).json({ ok:false });
  }
});

app.use((req, res, next) => {
  if (!isProtectedPath(req.path)) return next();
  const token = getToken(req);
  if (!token) return res.status(401).send('Unauthorized');
  try {
    jwt.verify(token, JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
});

app.use(express.static(STATIC_ROOT, {
  setHeaders(res, filepath){
    // Never cache admin files too long
    if (filepath.includes('/hidden/')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

// SPA-ish fallback or 404
app.use((req, res) => {
  const indexPath = path.join(STATIC_ROOT, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(path.resolve(indexPath));
  res.status(404).send('Not found');
});

app.listen(WEB_PORT, () => {
  console.log(`Web server running on http://localhost:${WEB_PORT}`);
});
