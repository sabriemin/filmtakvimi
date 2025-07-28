from scraper_paribu import get_upcoming_movies
from ics import Calendar, Event
from datetime import datetime
import os

def create_ics_from_movies(movies):
    calendar = Calendar()
    for film in movies:
        try:
            event = Event()
            event.name = film["title"]
            event.begin = datetime.strptime(film["date"], "%Y%m%d").date()
            event.make_all_day()  # Tüm gün etkinlik olarak ayarla

            description = (
                f"🎨 Tür: {film.get('genre', 'Tür belirtilmemiş')}\n"
                f"📄 Özet: {film.get('summary', 'Ozet bulunamadi')}\n"
                f"▶️ Fragman: {film.get('trailer', 'Yok')}\n"
                f"🔗 Detaylar: {film.get('link', '')}"
            )
            event.description = description

            calendar.events.add(event)
        except Exception as e:
            print(f"Etkinlik oluşturulamadı: {film['title']}, {e}")
    return calendar

def run():
    movies = get_upcoming_movies()
    calendar = create_ics_from_movies(movies)

    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "film_takvimi.ics")

    with open(output_path, "w", encoding="utf-8") as f:
        f.writelines(calendar)

    print(f"✅ ICS dosyası oluşturuldu: {output_path}")

if __name__ == "__main__":
    run()
