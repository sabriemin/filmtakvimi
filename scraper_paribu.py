
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from tqdm import tqdm
from datetime import datetime
from bs4 import BeautifulSoup
import time
import uuid

def setup_driver():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3')
    options.add_argument("user-agent=Mozilla/5.0")
    service = Service("/usr/local/bin/chromedriver")
    return webdriver.Chrome(service=service, options=options)

def get_summary(driver, detail_url):
    try:
        driver.get(detail_url)
        time.sleep(2)
        summary_tag = driver.find_element(By.CSS_SELECTOR, ".film-summary > p")
        return summary_tag.text.strip() if summary_tag else "Özet bulunamadı"
    except:
        return "Özet bulunamadı"

def parse_movie_element_html(driver, html, base_url):
    try:
        soup = BeautifulSoup(html, "html.parser")

        title = soup.get("data-movie-title", "").strip()
        genre = soup.get("data-movie-genre", "").strip()
        categories = soup.get("data-category2", "").strip()
        rating_raw = soup.get("data-rate", "")
        rating = str(float(rating_raw) / 10000) if rating_raw else ""
        slug_url = soup.get("data-slug-url", "")
        poster = soup.select_one(".movie-list-banner-img")
        poster_url = poster["src"] if poster and poster.has_attr("src") else ""

        duration_tag = soup.select_one(".movie-time")
        duration = duration_tag.text.strip() if duration_tag else ""

        bilet_btn = soup.select_one(".movie-quick-buy-ticket-btn")
        bilet_link = bilet_btn["href"] if bilet_btn and bilet_btn.has_attr("href") else ""

        detail_btn = soup.select_one(".movie-banner-incept-btn")
        relative_detail = detail_btn["href"] if detail_btn and detail_btn.has_attr("href") else ""
        detail_link = base_url + relative_detail if relative_detail else ""

        trailer_area = soup.select_one(".movie-trailer-area")
        trailer = trailer_area["data-trailer-url"] if trailer_area and trailer_area.has_attr("data-trailer-url") else ""

        summary = get_summary(driver, detail_link) if detail_link else "Özet bulunamadı"
        today = datetime.today().strftime("%Y%m%d")

        return {
            "title": title,
            "date": today,
            "link": detail_link,
            "bilet_link": bilet_link,
            "genre": genre,
            "categories": categories,
            "rating": rating,
            "poster": poster_url,
            "duration": duration,
            "trailer": trailer,
            "summary": summary
        }
    except Exception as e:
        print(f"❌ Hata (parse html): {e}")
        return None

def get_movies_from_page(url_path):
    print(f"🎬 Sayfa çekiliyor: {url_path}")
    base_url = "https://www.paribucineverse.com"
    driver = setup_driver()
    movie_data = []

    try:
        driver.get(base_url + url_path)
        time.sleep(5)

        elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
        print(f"🎞️ {len(elements)} film bulundu")

        for element in tqdm(elements, desc="🎬 Kartlar işleniyor"):
            try:
                outer_html = element.get_attribute("outerHTML")
                movie = parse_movie_element_html(driver, outer_html, base_url)
                if movie:
                    movie_data.append(movie)
            except Exception as e:
                print(f"❌ Hata (kart): {e}")

        return movie_data
    finally:
        driver.quit()
        print("🏁 İşlem tamamlandı.")

def get_now_playing_movies():
    return get_movies_from_page("/vizyondakiler")

def get_upcoming_movies():
    return get_movies_from_page("/gelecek-filmler")
