
from scraper_paribu_updated import film_verilerini_getir
from ics import Calendar, Event
from datetime import datetime
import pytz

def takvimi_olustur():
    calendar = Calendar()
    filmler = film_verilerini_getir()

    for film in filmler:
        etkinlik = Event()
        etkinlik.name = film["isim"]
        etkinlik.begin = datetime.strptime(film["tarih"], "%d.%m.%Y").replace(tzinfo=pytz.UTC)
        etkinlik.duration = {"days": 1}

        description = f"{film['ozet']}

Fragman: {film['fragman']}"
        if "bilet_link" in film:
            description += f"\n\n🎟 Hemen Bilet Al: {film['bilet_link']}"
            print(f"🎟 Bilet linki bulundu ve açıklamaya eklendi: {film['bilet_link']}")
        else:
            print(f"ℹ️ Bilet linki bulunamadı: {film['isim']}")

        etkinlik.description = description
        etkinlik.location = "Türkiye Geneli"
        etkinlik.categories = [film["tur"]]

        calendar.events.add(etkinlik)

    with open("/mnt/data/film_takvimi_guncel.ics", "w", encoding="utf-8") as f:
        f.writelines(calendar)

takvimi_olustur()
