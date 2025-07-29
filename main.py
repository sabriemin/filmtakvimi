import json
from ics import Calendar, Event
from datetime import datetime
import pytz

with open("movies.json", "r", encoding="utf-8") as f:
    films = json.load(f)

calendar = Calendar()
istanbul_tz = pytz.timezone("Europe/Istanbul")

for film in films:
    event = Event()
    event.name = film["title"]

    description = f"{film['ozet']}"

    if film.get("bilet_linki"):
        description += f"\n\n🎟️ Hemen Bilet Al: {film['bilet_linki']}"

    event.description = description

    try:
        dt = datetime.strptime(film["tarih"], "%d.%m.%Y")
        dt = istanbul_tz.localize(dt)
        event.begin = dt
    except:
        continue

    calendar.events.add(event)

with open("film_takvimi.ics", "w", encoding="utf-8") as f:
    f.writelines(calendar)
