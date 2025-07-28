from playwright.sync_api import sync_playwright
from ics import Calendar, Event
from datetime import datetime
import os
import json

BASE_URL = "https://www.paribucineverse.com"


def get_movies_from_paribu(category_url: str):
    movies = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(category_url)
        page.wait_for_timeout(3000)
        movie_links = page.locator(".card.movie-card a.text-link")
        count = movie_links.count()

        for i in range(count):
            link = movie_links.nth(i).get_attribute("href")
            if not link:
                continue
            detail_url = f"{BASE_URL}{link}"
            try:
                page.goto(detail_url)
                page.wait_for_timeout(1000)
                title = page.locator("h1.text-h3.text-lg-h2.font-bold").inner_text().strip()
                date_text = page.locator(".mb-2 span.text-subtitle-2.font-bold").inner_text().strip()
                genre = page.locator(".movie-tags .text-subtitle-2 span").all_inner_texts()
                summary = page.locator(".text-body-1.text-sm.text-justify").inner_text().strip()
                trailer_elem = page.locator("iframe")
                trailer = trailer_elem.get_attribute("src") if trailer_elem.count() > 0 else None
                
                try:
                    date_obj = datetime.strptime(date_text, "%d.%m.%Y")
                    formatted_date = date_obj.strftime("%Y%m%d")
                except:
                    formatted_date = datetime.now().strftime("%Y%m%d")

                movie = {
                    "title": title,
                    "date": formatted_date,
                    "genre": ", ".join(genre),
                    "summary": summary,
                    "trailer": trailer,
                    "link": detail_url
                }
                movies.append(movie)
            except Exception as e:
                print(f"❌ Film detayları alınamadı: {detail_url}, Hata: {e}")

        browser.close()
    return movies


def get_upcoming_movies():
    return get_movies_from_paribu("https://www.paribucineverse.com/gelecek-filmler")

def get_now_playing_movies():
    return get_movies_from_paribu("https://www.paribucineverse.com/vizyondaki-filmler")

def create_ics_from_movies(movies):
    calendar = Calendar()
    for film in movies:
        try:
            print(f"\n🎬 Etkinlik oluşturuluyor: {film['title']}")
            event = Event()
            event.name = film["title"]
            event.begin = datetime.strptime(film["date"], "%Y%m%d").date()
            event.make_all_day()
            description = (
                f"🎬 Tür: {film.get('genre', 'Tür belirtilmemiş')}\n"
                f"📄 Özet: {film.get('summary', 'Özet bulunamadı')}\n"
                f"▶️ Fragman: {film.get('trailer', 'Yok')}\n"
                f"🔗 Detaylar: {film.get('link', '')}"
            )
            event.description = description
            calendar.events.add(event)
            print("✅ Etkinlik eklendi.")
        except Exception as e:
            print(f"❌ Etkinlik oluşturulamadı: {film['title']}, Hata: {e}")
    return calendar

def run():
    print("\n📅 Film verileri alınıyor...")
    upcoming = get_upcoming_movies()
    now_playing = get_now_playing_movies()
    movies = upcoming + now_playing
    print(f"🎬 Toplam film bulundu: {len(movies)}")

    calendar = create_ics_from_movies(movies)
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    with open(os.path.join(output_dir, "film_takvimi.ics"), "w", encoding="utf-8") as f:
        f.writelines(calendar)
    print(f"\n✅ ICS dosyası oluşturuldu.")

    meta = { "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S") }
    with open(os.path.join(output_dir, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("📁 meta.json kaydedildi.")

    with open(os.path.join(output_dir, "movies.json"), "w", encoding="utf-8") as f:
        json.dump(movies, f, ensure_ascii=False, indent=2)
    print("📁 movies.json kaydedildi.")

if __name__ == "__main__":
    run()
