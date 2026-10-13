"""Uygulama simgelerini (PNG) üretir: python tools/ikon-uret.py
Harici kütüphane gerektirmez; şekilleri örnekleme ile kenar yumuşatarak çizer."""
import math, struct, zlib, os

KOK = os.path.join(os.path.dirname(__file__), "..", "assets", "icons")
os.makedirs(KOK, exist_ok=True)

BG1 = (12, 17, 32); BG2 = (5, 7, 13)
RED = (239, 74, 82); GOLD = (243, 195, 91); WHITE = (236, 239, 249)

def png(path, w, h, rows):
    raw = b"".join(b"\x00" + bytes(r) for r in rows)
    def chunk(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))

def ellipse_dist(x, y, cx, cy, a, b, ang):
    c, s = math.cos(ang), math.sin(ang)
    dx, dy = x - cx, y - cy
    xr, yr = dx * c + dy * s, -dx * s + dy * c
    f = (xr / a) ** 2 + (yr / b) ** 2 - 1
    gx, gy = 2 * xr / a / a, 2 * yr / b / b
    return abs(f) / max(1e-6, math.hypot(gx, gy))

def ciz(size, pad, full_bleed, rounded):
    S = 3  # örnekleme
    rows = []
    R = size * 0.22 if rounded else 0
    sc = (size - 2 * pad) / 40.0
    ox = oy = pad
    for py in range(size):
        row = []
        for px in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(S):
                for sx in range(S):
                    x = px + (sx + .5) / S; y = py + (sy + .5) / S
                    # arka plan (yuvarlatılmış kare)
                    inside = True
                    if not full_bleed:
                        qx = max(R - x, 0, x - (size - R)); qy = max(R - y, 0, y - (size - R))
                        inside = math.hypot(qx, qy) <= R if (qx and qy) else (0 <= x <= size and 0 <= y <= size)
                    if not inside: continue
                    t = (x + y) / (2 * size)
                    col = [BG1[i] * (1 - t) + BG2[i] * t for i in range(3)]
                    # hafif kırmızı parıltı
                    g = max(0, 1 - math.hypot(x - size * .5, y - size * .5) / (size * .55))
                    col = [col[i] * (1 - .35 * g) + RED[i] * .35 * g * .45 for i in range(3)]
                    # logo koordinatı (0..40)
                    lx = (x - ox) / sc; ly = (y - oy) / sc
                    lw = 1.7 * sc  # çizgi kalınlığı piksel
                    for k, ang in enumerate((0, math.pi / 3, 2 * math.pi / 3)):
                        d = ellipse_dist(lx, ly, 20, 20, 17, 7, ang) * sc
                        if d < lw / 2 + .5:
                            a = max(0, min(1, (lw / 2 + .5 - d)))
                            c2 = RED if k != 1 else (255, 120, 126)
                            col = [col[i] * (1 - a) + c2[i] * a for i in range(3)]
                    dc = math.hypot(lx - 20, ly - 20) * sc
                    if dc < 4.2 * sc + .5:
                        a = max(0, min(1, 4.2 * sc + .5 - dc)); col = [col[i] * (1 - a) + WHITE[i] * a for i in range(3)]
                    ds = math.hypot(lx - 34.7, ly - 11.5) * sc
                    if ds < 2.4 * sc + .5:
                        a = max(0, min(1, 2.4 * sc + .5 - ds)); col = [col[i] * (1 - a) + GOLD[i] * a for i in range(3)]
                    acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]; acc[3] += 255
            n = S * S
            row += [int(acc[0] / n), int(acc[1] / n), int(acc[2] / n), int(acc[3] / n)]
        rows.append(row)
    return rows

for name, size, pad, bleed, rnd in [("icon-192.png", 192, 22, False, True), ("icon-512.png", 512, 60, False, True), ("maskable-512.png", 512, 120, True, False), ("apple-touch-icon.png", 180, 26, True, False), ("favicon-32.png", 32, 2, False, True)]:
    png(os.path.join(KOK, name), size, size, ciz(size, pad, bleed, rnd))
    print("yazıldı:", name)

svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0c1120"/><stop offset="1" stop-color="#05070d"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><g fill="none" stroke="#ef4a52" stroke-width="2.2" transform="translate(12 12)"><ellipse cx="20" cy="20" rx="17" ry="7"/><ellipse cx="20" cy="20" rx="17" ry="7" transform="rotate(60 20 20)"/><ellipse cx="20" cy="20" rx="17" ry="7" transform="rotate(120 20 20)"/></g><circle cx="32" cy="32" r="4.6" fill="#eceff9"/><circle cx="46.7" cy="23.5" r="2.6" fill="#f3c35b"/></svg>'''
open(os.path.join(KOK, "icon.svg"), "w", encoding="utf-8").write(svg)
print("yazıldı: icon.svg")
