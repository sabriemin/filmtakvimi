from playwright.sync_api import sync_playwright
from ics import Calendar, Event
from datetime import datetime
import os
import json
import time

# ✔⃣ Film verilerini Paribu Cineverse'ten çek

def get_movies():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://www.paribucineverse.com/gelecek-filmler")

        page.wait_for_selector(".movie-card")
        cards = page.query_selector_all(".movie-card")
        movies = []

        for card in cards:
            try:
                title = card.query_selector(".movie-title").inner_text().strip()
                date_raw = card.query_selector(".movie-date").inner_text().strip()
                link = card.query_selector("a").get_attribute("href")
                url = "https://www.paribucineverse.com" + link

                # Detay sayfasına git
                detail = browser.new_page()
                detail.goto(url)
                detail.wait_for_selector(".movie-detail")
                time.sleep(0.5)

                summary = detail.query_selector(".synopsis")
                genre = detail.query_selector(".movie-tags span")
                trailer_tag = detail.query_selector("iframe")

                movie = {
                    "title": title,
                    "date": datetime.strptime(date_raw, "%d.%m.%Y").strftime("%Y%m%d"),
                    "summary": summary.inner_text().strip() if summary else "",
                    "genre": genre.inner_text().strip() if genre else "",
                    "trailer": trailer_tag.get_attribute("src") if trailer_tag else "",
                    "link": url,
                }

                movies.append(movie)
                detail.close()

            except Exception as e:
                print(f"Hata: {e}")

        browser.close()
        return movies

# ✅ ICS dosyası oluştur

def create_ics_from_movies(movies):
    calendar = Calendar()
    for film in movies:
        try:
            print(f"\n🎮 Etkinlik oluşturuluyor: {film['title']}")
            event = Event()
            event.name = film["title"]
            event.begin = datetime.strptime(film["date"], "%Y%m%d").date()
            event.make_all_day()
            description = (
                f"🎮 Tür: {film.get('genre', 'Tür belirtilmemiş')}\n"
                f"📄 Özet: {film.get('summary', 'Ozet bulunamadi')}\n"
                f"▶️ Fragman: {film.get('trailer', 'Yok')}\n"
                f"🔗 Detaylar: {film.get('link', '')}"
            )
            event.description = description
            calendar.events.add(event)
            print("✅ Etkinlik eklendi.")
        except Exception as e:
            print(f"❌ Etkinlik oluşturulamadı: {film['title']}, Hata: {e}")
    return calendar

# ⬆️ Ana fonksiyon

def run():
    print("\n🗓️ Film verileri alınıyor...")
    movies = get_movies()
    print(f"🎮 Toplam film bulundu: {len(movies)}")

    calendar = create_ics_from_movies(movies)
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    with open(os.path.join(output_dir, "film_takvimi.ics"), "w", encoding="utf-8") as f:
        f.writelines(calendar)
    print("\n✅ ICS dosyası oluşturuldu.")

    meta = {"last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    with open(os.path.join(output_dir, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("📁 meta.json kaydedildi.")

    with open(os.path.join(output_dir, "movies.json"), "w", encoding="utf-8") as f:
        json.dump(movies, f, ensure_ascii=False, indent=2)
    print("📁 movies.json kaydedildi.")

if __name__ == "__main__":
    run()
