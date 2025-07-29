
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
            if film.get("bilet_link"):
                description += f"\n🎟 Hemen Bilet Al: {film['bilet_link']}"
                print("   ✅ Bilet linki eklendi.")

            event.description = description
            calendar.events.add(event)
            print("✅ Etkinlik eklendi.")
        except Exception as e:
            print(f"❌ Etkinlik oluşturulamadı: {film['title']}, Hata: {e}")
    return calendar

def run():
    print("\n🚀 Gelecek filmler alınıyor...")
    upcoming = get_upcoming_movies()

    print("\n🚀 Vizyondaki filmler alınıyor...")
    now_playing = get_now_playing_movies()

    all_movies = upcoming + now_playing
    print(f"\n🎞 Toplam film sayısı: {len(all_movies)}")

    calendar = create_ics_from_movies(all_movies)
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    ics_path = os.path.join(output_dir, "film_takvimi.ics")
    with open(ics_path, "w", encoding="utf-8") as f:
        f.writelines(calendar)
    print(f"✅ ICS dosyası: {ics_path}")

    movies_path = os.path.join(output_dir, "film_takvimi.json")
    with open(movies_path, "w", encoding="utf-8") as f:
        json.dump(all_movies, f, ensure_ascii=False, indent=2)
    print(f"📁 JSON dosyası: {movies_path}")

    meta_path = os.path.join("output", "meta.json")
    meta = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "counts": {
            "gelecek_filmler": len(upcoming),
            "vizyondakiler": len(now_playing),
            "toplam": len(all_movies)
        }
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"🗂 meta.json oluşturuldu.")

if __name__ == "__main__":
    run()
