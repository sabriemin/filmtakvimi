
from scraper_paribu import get_upcoming_movies
from ics import Calendar, Event
from datetime import datetime
import os
import json  # JSON dosyası için eklendi

def create_ics_from_movies(movies):
    calendar = Calendar()
    for film in movies:
        try:
            print(f"\n🎞 Etkinlik oluşturuluyor: {film['title']}")
            event = Event()
            event.name = film["title"]
            event.begin = datetime.strptime(film["date"], "%Y%m%d").date()
            event.make_all_day()  # Tüm gün etkinlik olarak ayarla

            description = (
                f"🎬 Tür: {film.get('genre', 'Tür belirtilmemiş')}\n"
                f"📄 Özet: {film.get('summary', 'Ozet bulunamadi')}\n"
                f"▶️ Fragman: {film.get('trailer', 'Yok')}\n"
            )
            # Hemen Bilet Al varsa ekle
            if film.get("bilet_link"):
                description += f"🎟️ Hemen Bilet Al: {film['bilet_link']}\n"

            # Detay linki her zaman en sonda
            description += f"🔗 Detaylar: {film.get('link', '')}"

            event.description = description
            calendar.events.add(event)
            print("✅ Etkinlik eklendi.")
        except Exception as e:
            print(f"❌ Etkinlik oluşturulamadı: {film['title']}, Hata: {e}")
    return calendar

def run():
    print("\n📅 Film verileri alınıyor...")
    movies = get_upcoming_movies()
    print(f"🎬 Toplam film bulundu: {len(movies)}")

    calendar = create_ics_from_movies(movies)

    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    # ICS dosyası
    output_path = os.path.join(output_dir, "film_takvimi.ics")
    with open(output_path, "w", encoding="utf-8") as f:
        f.writelines(calendar)
    print(f"\n✅ ICS dosyası oluşturuldu: {output_path}")

    # meta.json (son güncelleme tarihi)
    meta_path = os.path.join(output_dir, "meta.json")
    meta = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"📁 meta.json kaydedildi.")

    # movies.json (film listesi)
    movies_path = os.path.join(output_dir, "movies.json")
    with open(movies_path, "w", encoding="utf-8") as f:
        json.dump(movies, f, ensure_ascii=False, indent=2)
    print(f"📁 movies.json kaydedildi.")

if __name__ == "__main__":
    run()
