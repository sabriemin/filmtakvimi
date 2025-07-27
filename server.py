from flask import Flask, send_file, render_template_string
from threading import Thread
import subprocess
import time
import os

app = Flask(__name__)

@app.route("/")
def index():
    return render_template_string("""
        <h1>🎬 Film Takvimi</h1>
        <p><a href='/ics'>🎯 Takvimi indir</a></p>
    """)

@app.route("/ics")
def serve_ics():
    path = os.path.join("output", "film_takvimi.ics")
    if os.path.exists(path):
        return send_file(path, mimetype="text/calendar")
    return "ICS dosyası bulunamadı", 404

def update_ics_periodically():
    while True:
        try:
            print("🔄 ICS verisi güncelleniyor...")
            subprocess.run(["python", "main.py"], check=True)
        except Exception as e:
            print("Hata oluştu:", e)
        time.sleep(3600 * 6)  # 6 saatte bir güncelle

if __name__ == "__main__":
    Thread(target=update_ics_periodically, daemon=True).start()
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
