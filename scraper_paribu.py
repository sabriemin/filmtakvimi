from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime
from tqdm import tqdm
import time
import uuid
import os


def setup_driver():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3')
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
    service = Service("/usr/local/bin/chromedriver")
    return webdriver.Chrome(service=service, options=options)


def extract_movie_card(element):
    try:
        title = element.find_element(By.CLASS_NAME, "movie-name").text.strip()
        date_text = element.find_element(By.CLASS_NAME, "movie-release-date").text.strip()
        day, month, year = date_text.split(".")
        iso_date = f"{year}{month}{day}"

        link_elements = element.find_elements(By.TAG_NAME, "a")
        link = link_elements[0].get_attribute("href") if link_elements else ""
        if not link.startswith("http"):
            link = "https://www.paribucineverse.com" + link

        bilet_link = None
        bilet_btns = element.find_elements(By.CLASS_NAME, "btn-ticket")
        for btn in bilet_btns:
            href = btn.get_attribute("href")
            if href:
                bilet_link = href if href.startswith("http") else "https://www.paribucineverse.com" + href
                break

        return {
            "title": title,
            "date": iso_date,
            "link": link,
            "bilet_link": bilet_link
        }
    except Exception as e:
        print(f"❌ Film kartı hatası: {e}")
        return None


def get_movies(base_url, title_message):
    print(f"🎬 {title_message}")
    driver = setup_driver()
    driver.get(base_url)
    time.sleep(5)

    movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
    print(f"🎞️ {len(movie_elements)} film bulundu")
    movie_data = []

    for element in tqdm(movie_elements, desc="🎞️ Film kartları alınıyor"):
        movie = extract_movie_card(element)
        if movie:
            print(f"✅ Kart alındı: {movie['title']} | 🎬 Bilet: {'VAR' if movie['bilet_link'] else 'YOK'}")
            movie_data.append(movie)

    driver.quit()
    print(f"🏁 İşlem tamamlandı: {len(movie_data)} film döndürüldü")
    return movie_data


def get_upcoming_movies():
    return get_movies("https://www.paribucineverse.com/gelecek-filmler", "Gelecek filmler çekiliyor...")


def get_now_playing_movies():
    return get_movies("https://www.paribucineverse.com/vizyondakiler", "Vizyondaki filmler çekiliyor...")
