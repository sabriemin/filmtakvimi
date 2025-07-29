import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re

def get_upcoming_movies():
    url = "https://www.paribucineverse.com/gelecek-filmler"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    movies = []
    movie_blocks = soup.find_all("div", class_="movie-box")

    for block in movie_blocks:
        try:
            title = block.find("div", class_="movie-title").get_text(strip=True)
            link = "https://www.paribucineverse.com" + block.find("a")["href"]

            date_text = block.find("div", class_="date").get_text(strip=True)
            match = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", date_text)
            if match:
                day, month, year = match.groups()
                date = f"{year}{month}{day}"
            else:
                date = datetime.now().strftime("%Y%m%d")

            detail_response = requests.get(link)
            detail_soup = BeautifulSoup(detail_response.text, "html.parser")

            # Tür ve özet bilgisi
            genre = detail_soup.find("div", class_="type")
            summary = detail_soup.find("div", class_="text")
            genre = genre.get_text(strip=True) if genre else "Tür belirtilmemiş"
            summary = summary.get_text(strip=True) if summary else "Özet bulunamadı"

            # Fragman linki (varsa)
            trailer_tag = detail_soup.find("a", string="Fragmanı İzle")
            trailer = trailer_tag["href"] if trailer_tag else None

            # "Hemen Bilet Al" linki (varsa)
            bilet_button = detail_soup.find("a", class_="btn", string=lambda t: t and "Hemen Bilet Al" in t)
            bilet_link = bilet_button["href"] if bilet_button else None

            if bilet_link:
                print(f"🎬 '{title}' filmi için 🎟 Hemen Bilet Al bağlantısı bulundu.")
            else:
                print(f"🎬 '{title}' filmi için 🎟 bilet bağlantısı YOK.")

            movies.append({
                "title": title,
                "date": date,
                "genre": genre,
                "summary": summary,
                "trailer": trailer,
                "link": link,
                "bilet_link": bilet_link
            })
        except Exception as e:
            print(f"❌ Film bilgisi alınamadı: {e}")

    return movies
