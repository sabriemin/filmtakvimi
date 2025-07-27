from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
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
                "link": link,
                "trailer": "",
                "genre": "",
                "summary": ""
            })
        except Exception:
            continue

    # Render'da detay sayfaları sorunlu olduğu için bu adım atlandı
    print("Render ortamında detay bilgileri atlandı.")

    driver.quit()
    return movie_data
