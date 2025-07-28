from flask import Flask, send_file, render_template_string
from threading import Thread
import subprocess
import time
import os

app = Flask(__name__)

@app.route("/")
def index():
    return render_template_string("""
        <h1>🎮 Film Takvimi</h1>
        <p><a href='/ics'>🎯 Takvimi indir</a></p>
    """)

@app.route("/ics")
def serve_ics():
    path = os.path.join("output", "film_takvimi.ics")
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return send_file(path, mimetype="text/calendar")
    return "ICS dosyasi bulunamadi veya bos.", 404

@app.route("/run")
def manual_trigger():
    try:
        print("🛠 Manuel çalıştırma tetiklendi.")
        result = subprocess.run(["python", "main.py"], capture_output=True, text=True)
        print(result.stdout)
        return "ICS güncellendi.", 200
    except Exception as e:
        return f"Hata oluştu: {e}", 500

def update_ics_periodically():
    while True:
        try:
            print("🔄 ICS verisi guncelleniyor...")
            result = subprocess.run(["python", "main.py"], capture_output=True, text=True)
            print(result.stdout)
            if result.stderr:
                print("stderr:", result.stderr)
        except Exception as e:
            print("Hata olustu:", e)
        time.sleep(3600 * 6)  # 6 saatte bir guncelle

if __name__ == "__main__":
    Thread(target=update_ics_periodically, daemon=True).start()
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
