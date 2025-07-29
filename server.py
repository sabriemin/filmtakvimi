from flask import Flask, send_file, render_template_string
from threading import Thread
import subprocess
import time
import os
import json

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
    if os.path.exists(path) and os.path.getsize(path) > 0:
        stats_path = os.path.join("output", "stats.json")
        try:
            from datetime import datetime
            today = datetime.today().strftime("%Y-%m-%d")
            if os.path.exists(stats_path):
                with open(stats_path, "r", encoding="utf-8") as f:
                    stats = json.load(f)
            else:
                stats = {"daily": {}, "total": 0}
            stats["daily"][today] = stats["daily"].get(today, 0) + 1
            stats["total"] = stats.get("total", 0) + 1
            with open(stats_path, "w", encoding="utf-8") as f:
                json.dump(stats, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print("⚠️ Sayaç güncellenemedi:", e)
        return send_file(path, mimetype="text/calendar")
    return "ICS dosyasi bulunamadi veya bos.", 404

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
        time.sleep(3600 * 6)

if __name__ == "__main__":
    Thread(target=update_ics_periodically, daemon=True).start()
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
