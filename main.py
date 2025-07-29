import os
import json
from datetime import datetime
from scraper_paribu import get_now_playing_movies, get_upcoming_movies
from ics import Calendar, Event
from ics.grammar.parse import ContentLine


def create_ics_from_movies(movies):
    from ics import Calendar, Event
    from datetime import datetime

    calendar = Calendar()
    calendar.name = "Paribu Cineverse Film Takvimi"
    calendar.extra.append(
    ContentLine(name="X-WR-CALNAME", value="Paribu Cineverse Film Takvimi")
    )

    
    for film in movies:
        try:
            raw_date = film.get("date", "")
            if not raw_date or len(raw_date) != 8:
                continue

            event = Event()
            event.name = film.get("title", "İsimsiz Film")
            event.begin = datetime.strptime(raw_date, "%Y%m%d")
            event.make_all_day()

            # 🎯 Açıklamaya kaynak eklemiyoruz
            lines = []
            if film.get("genre"):
                lines.append(f"🎬 Tür: {film['genre']}")
            if film.get("summary"):
                lines.append(f"📄 Özet: {film['summary']}")
            if film.get("trailer"):
                lines.append(f"▶️ Fragman: {film['trailer']}")
            if film.get("link"):
                lines.append(f"🔗 Detay: {film['link']}")
            if film.get("bilet_link"):
                lines.append(f"🎟 Bilet: {film['bilet_link']}")

            event.description = "\n".join(lines)

            # 🎨 Kategoriye göre takvim rengi
            if film.get("kaynak") == "Vizyondaki Film":
                event.categories = ["Vizyondaki Film"]
            elif film.get("kaynak") == "Gelecek Film":
                event.categories = ["Gelecek Film"]

            calendar.events.add(event)

        except Exception as e:
            print(f"❌ HATA: {film.get('title', '?')} | {e}")

    return calendar


def run():
    print("🎬 Vizyondaki filmler çekiliyor...")
    now_playing = get_now_playing_movies()
    for film in now_playing:
        film["kaynak"] = "Vizyondaki Film"

    print("🎬 Gelecek filmler çekiliyor...")
    upcoming = get_upcoming_movies()
    for film in upcoming:
        film["kaynak"] = "Gelecek Film"

    all_movies = now_playing + upcoming
    print(f"🎞 Toplam film: {len(all_movies)}")

    calendar = create_ics_from_movies(all_movies)

    os.makedirs("output", exist_ok=True)

    with open("output/film_takvimi.ics", "w", encoding="utf-8") as f:
        f.write(calendar.serialize())
    print("✅ ICS dosyası oluşturuldu: film_takvimi.ics")

    with open("output/movies_birlesik.json", "w", encoding="utf-8") as f:
        json.dump(all_movies, f, ensure_ascii=False, indent=2)

    with open("output/meta.json", "w", encoding="utf-8") as f:
        json.dump({
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    run()
