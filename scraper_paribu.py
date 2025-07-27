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

    for movie in tqdm(movie_data, desc="Film detayları alınıyor"):
        try:
            driver.get(movie["link"])
            wait = WebDriverWait(driver, 10)
            try:
                wait.until(EC.presence_of_element_located((By.CLASS_NAME, "movie-summary-tablet")))
            except:
                print(f"Bekleme zaman aşımı: {movie['link']}")
                continue

            try:
                trailer_btn = driver.find_element(By.CLASS_NAME, "video-open-btn")
                movie["trailer"] = trailer_btn.get_attribute("data-trailer-url")
            except:
                movie["trailer"] = "Fragman bağlantısı yok"

            try:
                genre = driver.find_element(By.CSS_SELECTOR, ".item-info.movie-genre small").text.strip()
                movie["genre"] = genre
            except:
                movie["genre"] = "Tür belirtilmemiş"

            try:
                summary_block = driver.find_element(By.CLASS_NAME, "movie-summary-tablet")
                paragraphs = summary_block.find_elements(By.TAG_NAME, "p")
                if paragraphs:
                    movie["summary"] = "\n".join([p.text.strip() for p in paragraphs if p.text.strip()])
                else:
                    movie["summary"] = "Özet bulunamadı"
            except:
                movie["summary"] = "Özet bulunamadı"

        except Exception as e:
            print(f"Detay alma hatası: {movie['link']} - {e}")
            movie["trailer"] = ""
            movie["genre"] = ""
            movie["summary"] = ""
            continue

    driver.quit()
    return movie_data
