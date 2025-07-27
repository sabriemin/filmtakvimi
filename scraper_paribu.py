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

def get_upcoming_movies():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3')
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

    service = Service()
    driver = webdriver.Chrome(service=service, options=options)

    base_url = "https://www.paribucineverse.com/gelecek-filmler"
    driver.get(base_url)
    time.sleep(5)

    movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
    movie_data = []

    for element in tqdm(movie_elements, desc="Film kartları alınıyor"):
        try:
            title = element.find_element(By.CLASS_NAME, "movie-title").text.strip()
            date = element.find_element(By.CLASS_NAME, "movie-date").text.strip()
            link = element.find_element(By.TAG_NAME, "a").get_attribute("href")

            day, month, year = date.split(".")
            iso_date = f"{year}{month}{day}"

            movie_data.append({
                "title": title,
                "date": iso_date,
                "link": link
            })
        except Exception:
            continue

    wait = WebDriverWait(driver, 20)

    for movie in tqdm(movie_data, desc="Film detayları alınıyor"):
        try:
            driver.get(movie["link"])
            wait.until(EC.presence_of_element_located((By.CLASS_NAME, "content-detail-container")))

            try:
                trailer_btn = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "video-open-btn")))
                movie["trailer"] = trailer_btn.get_attribute("data-trailer-url")
            except Exception:
                movie["trailer"] = "Fragman bağlantısı yok"

            try:
                genre_el = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".item-info.movie-genre small")))
                movie["genre"] = genre_el.text.strip()
            except Exception:
                movie["genre"] = "Tür belirtilmemiş"

            try:
                summary_block = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "movie-summary-tablet")))
                paragraphs = summary_block.find_elements(By.TAG_NAME, "p")
                if paragraphs:
                    movie["summary"] = "\n".join([p.text.strip() for p in paragraphs if p.text.strip()])
                else:
                    movie["summary"] = "Özet bulunamadı"
            except Exception:
                movie["summary"] = "Özet bulunamadı"

        except Exception as e:
            print(f"HATA - Sayfa açılamadı: {movie['link']} -> {e}")
            continue

    driver.quit()
    return movie_data
