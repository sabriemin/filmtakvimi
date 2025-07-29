
import json
from ics import Calendar, Event
from datetime import datetime

with open("films.json", "r", encoding="utf-8") as f:
    films = json.load(f)

calendar = Calendar()

for film in films:
    event = Event()
    event.name = film["baslik"]
    event.begin = datetime.strptime(film["tarih"], "%Y-%m-%d")
    if film.get("bilet_link"):
        event.description = f"{film['ozet']}\n\n🎟 Hemen Bilet Al: {film['bilet_link']}"
    else:
        event.description = film["ozet"]
    calendar.events.add(event)

with open("film_takvimi.ics", "w", encoding="utf-8") as f:
    f.writelines(calendar)
