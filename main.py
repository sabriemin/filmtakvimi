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
    print("\n🎥 Film türünü seçin:")
    print("1. Gelecek filmler")
    print("2. Vizyondaki filmler")
    choice = input("Seçiminiz (1/2): ").strip()

    if choice == "2":
        movies = get_now_playing_movies()
        filename = "vizyondakiler"
    else:
        movies = get_upcoming_movies()
        filename = "gelecek_filmler"

    print(f"\n🎬 Toplam film bulundu: {len(movies)}")
    calendar = create_ics_from_movies(movies)

    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, f"{filename}.ics")
    with open(output_path, "w", encoding="utf-8") as f:
        f.writelines(calendar)
    print(f"\n✅ ICS dosyası oluşturuldu: {output_path}")

    meta_path = os.path.join(output_dir, "meta.json")
    meta = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "type": "vizyondaki" if choice == "2" else "gelecek"
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"📁 meta.json kaydedildi.")

    movies_path = os.path.join(output_dir, f"{filename}.json")
    with open(movies_path, "w", encoding="utf-8") as f:
        json.dump(movies, f, ensure_ascii=False, indent=2)
    print(f"📁 {filename}.json kaydedildi.")

if __name__ == "__main__":
    run()