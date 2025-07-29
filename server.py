from flask import Flask, send_file, render_template_string, request, jsonify
from threading import Thread
import subprocess, time, os, json, requests
from datetime import datetime, timedelta
from collections import Counter
from dotenv import load_dotenv


app = Flask(__name__)

REPO = "sabriemin/filmtakvimi"  # kendi repo adını yaz

@app.route("/run", methods=["POST"])
def run_workflow():
    data = request.get_json()
    token = data.get("token")

    if not token:
        return "❌ Token gerekli", 400

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    response = requests.post(
        f"https://api.github.com/repos/{REPO}/actions/workflows/manual_update.yml/dispatches",
        json={"ref": "main"},
        headers=headers
    )

    if response.status_code == 204:
        return "✅ Güncelleme GitHub Actions ile başlatıldı."
    else:
        return f"❌ Hata: {response.text}", 500



app = Flask(__name__)

@app.route("/")
def index():
    return render_template_string("""
        <h1>🎮 Film Takvimi</h1>
        <p><a href='/ics'>🎯 Takvimi indir</a></p>
        <p><a href='/run'>🔁 Takvimi manuel güncelle</a></p>
    """)

@app.route("/ics")
def serve_ics():
    path = os.path.join("output", "film_takvimi.ics")
    log_path = os.path.join("output", "ics_download_logs.json")

    ip = request.remote_addr
    ua = request.headers.get("User-Agent", "")
    today = datetime.utcnow().strftime("%Y-%m-%d")

    try:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "ip": ip,
            "ua": ua,
            "date": today
        }

        if os.path.exists(log_path):
            with open(log_path, "r", encoding="utf-8") as f:
                logs = json.load(f)
        else:
            logs = []

        already_logged = any(
            l.get("ip") == ip and l.get("ua") == ua and l.get("date") == today
            for l in logs
        )

        if not already_logged:
            logs.append(log_entry)
            with open(log_path, "w", encoding="utf-8") as f:
                json.dump(logs, f, indent=2, ensure_ascii=False)

    except Exception as e:
        print("⚠️ Log kaydı yapılamadı:", e)

    if os.path.exists(path) and os.path.getsize(path) > 0:
        return send_file(path, mimetype="text/calendar")
    return "ICS dosyası bulunamadı veya boş.", 404

@app.route("/api/stats")
def api_stats():
    log_path = os.path.join("output", "ics_download_logs.json")
    try:
        if not os.path.exists(log_path):
            return jsonify({"total": 0, "today": 0, "last_7_days": 0})

        with open(log_path, "r", encoding="utf-8") as f:
            logs = json.load(f)

        today = datetime.utcnow().strftime("%Y-%m-%d")
        last_7 = [(datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]

        total = len(logs)
        today_count = sum(1 for l in logs if l.get("date") == today)
        last_7_count = sum(1 for l in logs if l.get("date") in last_7)

        return jsonify({
            "total": total,
            "today": today_count,
            "last_7_days": last_7_count
        })
    except Exception as e:
        print("⚠️ İstatistik hatası:", e)
        return jsonify({"error": "Veri okunamadı"}), 500

@app.route("/api/stats/daily")
def api_daily_stats():
    log_path = os.path.join("output", "ics_download_logs.json")
    try:
        if not os.path.exists(log_path):
            return jsonify({"labels": [], "counts": []})

        with open(log_path, "r", encoding="utf-8") as f:
            logs = json.load(f)

        days = [l.get("date") for l in logs if l.get("date")]
        counter = Counter(days)
        sorted_items = sorted(counter.items())

        labels = [item[0] for item in sorted_items]
        counts = [item[1] for item in sorted_items]

        return jsonify({"labels": labels, "counts": counts})
    except Exception as e:
        print("⚠️ Günlük istatistik hatası:", e)
        return jsonify({"labels": [], "counts": []})

@app.route("/run")
def manual_trigger():
    def run_scraper():
        try:
            print("\n🛠 Manuel çalıştırma başlatıldı.")
            result = subprocess.run(["python", "main.py"], capture_output=True, text=True)
            print("📤 stdout:")
            print(result.stdout)
            if result.stderr:
                print("⚠️ stderr:")
                print(result.stderr)
        except Exception as e:
            print("🚨 Manuel çalıştırma hatası:", e)

    Thread(target=run_scraper).start()
    return "Arka planda güncelleme başlatıldı. Lütfen bir süre sonra tekrar deneyin.", 200

@app.route("/admin-log", methods=["POST"])
def admin_log():
    log_path = os.path.join("output", "admin_logs.json")
    try:
        log_entry = request.get_json()
        if not log_entry:
            return "Invalid data", 400
        if os.path.exists(log_path):
            with open(log_path, "r", encoding="utf-8") as f:
                logs = json.load(f)
        else:
            logs = []
        logs.append(log_entry)
        with open(log_path, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2, ensure_ascii=False)
        return "OK", 200
    except Exception as e:
        print("⚠️ Admin log kaydedilemedi:", e)
        return "Error", 500

def update_ics_periodically():
    while True:
        try:
            print("\n🔁 ICS verisi otomatik güncelleniyor...")
            result = subprocess.run(["python", "main.py"], capture_output=True, text=True)
            print("📤 stdout:")
            print(result.stdout)
            if result.stderr:
                print("⚠️ stderr:")
                print(result.stderr)
        except Exception as e:
            print("🚨 Zamanlı güncelleme hatası:", e)
        time.sleep(3600 * 3)

if __name__ == "__main__":
    Thread(target=update_ics_periodically, daemon=True).start()
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
