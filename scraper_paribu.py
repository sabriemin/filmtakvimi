
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from ics import Calendar, Event

def baslangic_mesaji():
    print("🎬 Film verileri alınıyor...\n")
    print("🚀 Başlıyoruz:")
    print("   🔹 https://www.paribucineverse.com/gelecek-filmler adresinden *gelecek filmler* çekilecek...")
    print("   🔹 https://www.paribucineverse.com/vizyondakiler adresinden *vizyondaki filmler* çekilecek...\n")

def get_films_from_url(url):
    headers = {
        "User-Agent": "Mozilla/5.0"
    }
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, "html.parser")
    film_cards = soup.find_all("div", class_="movie-item")
    films = []
    for card in film_cards:
        title = card.find("div", class_="movie-title").text.strip()
        detail = card.find("div", class_="movie-info").text.strip() if card.find("div", class_="movie-info") else ""
        trailer = ""
        trailer_tag = card.find("a", class_="movie-trailer")
        if trailer_tag:
            trailer = trailer_tag.get("href", "")
        films.append({
            "title": title,
            "detail": detail,
            "trailer": trailer
        })
    return films

def generate_ics_file(films, filename):
    cal = Calendar()
    for film in films:
        event = Event()
        event.name = film["title"]
        event.begin = datetime.now().date()
        event.description = f'{film["detail"]}\nFragman: {film["trailer"]}'
        cal.events.add(event)
    with open(filename, 'w', encoding='utf-8') as f:
        f.writelines(cal)
    print(f"📅 Takvim dosyası oluşturuldu: {filename}")

if __name__ == "__main__":
    baslangic_mesaji()
    url_gelecek = "https://www.paribucineverse.com/gelecek-filmler"
    url_vizyonda = "https://www.paribucineverse.com/vizyondakiler"
    films_gelecek = get_films_from_url(url_gelecek)
    films_vizyonda = get_films_from_url(url_vizyonda)
    all_films = films_gelecek + films_vizyonda
    generate_ics_file(all_films, "paribu_cineverse_film_takvimi.ics")
