from scraper_paribu import get_upcoming_movies, get_now_playing_movies
from ics import Calendar, Event
from datetime import datetime
import os
import json

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

def run():
    print("\n📅 Film verileri alınıyor...")
    upcoming = get_upcoming_movies()
    now_playing = get_now_playing_movies()
    movies = upcoming + now_playing
    print(🎬 Toplam film bulundu: {len(movies)}")

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
