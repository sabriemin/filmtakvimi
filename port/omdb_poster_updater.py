import json
import requests
import time

API_KEY = "ec1e9b0"  # OMDb API anahtarınız
INPUT_FILE = "graph_marvel.json"
OUTPUT_FILE = "graph_marvel_updated.json"

def get_poster_url(title):
    url = f"http://www.omdbapi.com/?t={title}&apikey={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        poster = data.get("Poster")
        return poster if poster and poster != "N/A" else None
    return None

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    for node in data["nodes"]:
        title = node.get("label")
        print(f"🔍 {title} için afiş aranıyor...")
        poster_url = get_poster_url(title)
        if poster_url:
            node["image"] = poster_url
            print(f"✅ Bulundu: {poster_url}")
        else:
            print("❌ Afiş bulunamadı.")
        time.sleep(1)  # API rate limit'e karşı 1sn bekle

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Güncellenmiş dosya: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
