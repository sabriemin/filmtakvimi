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
    print("\U0001F680 Başlıyoruz: Gelecek filmler çekilecek...")

    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3')
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

    service = Service("/usr/local/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)

    base_url = "https://www.paribucineverse.com/gelecek-filmler"
    driver.get(base_url)
    time.sleep(5)

    movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
    print(f"\U0001F3AC {len(movie_elements)} film bulundu")
    movie_data = []

    for element in tqdm(movie_elements, desc="\U0001F3AC Film kartları alınıyor"):
        try:
            title = element.find_element(By.CLASS_NAME, "movie-title").text.strip()
            date = element.find_element(By.CLASS_NAME, "movie-date").text.strip()

            try:
                incele_link = element.find_element(By.CLASS_NAME, "movie-banner-incept-btn").get_attribute("href")
            except:
                incele_link = None

            if not incele_link:
                link_elements = element.find_elements(By.TAG_NAME, "a")
                if link_elements:
                    incele_link = link_elements[0].get_attribute("href")

            if not incele_link.startswith("http"):
                link = "https://www.paribucineverse.com" + incele_link
            else:
                link = incele_link

            try:
                bilet_btn = element.find_element(By.CLASS_NAME, "movie-banner-ticket-btn")
                bilet_href = bilet_btn.get_attribute("href")
                if not bilet_href.startswith("http"):
                    bilet_link = "https://www.paribucineverse.com" + bilet_href
                else:
                    bilet_link = bilet_href
            except:
                bilet_link = None

            day, month, year = date.split(".")
            iso_date = f"{year}{month}{day}"

            movie_data.append({
                "title": title,
                "date": iso_date,
                "link": link,
                "bilet_link": bilet_link
            })
            print(f"✅ Kart alındı: {title} | 🎬 Bilet: {'VAR' if bilet_link else 'YOK'}")

        except Exception as e:
            print(f"⚠️ Kart alınamadı: {e}")
            continue

    for movie in tqdm(movie_data, desc="📂 Film detayları alınıyor"):
        try:
            driver.get(movie["link"])
            wait = WebDriverWait(driver, 60)
            try:
                wait.until(
                    EC.any_of(
                        EC.presence_of_element_located((By.CLASS_NAME, "movie-summary-tablet")),
                        EC.presence_of_element_located((By.CLASS_NAME, "movie-details")),
                        EC.presence_of_element_located((By.TAG_NAME, "body"))
                    )
                )
            except:
                print(f"⏱ Bekleme zaman aşımı: {movie['title']} — Sayfa yüklenmedi.")
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

            print(f"📌 Detay eklendi: {movie['title']}")

        except Exception as e:
            print(f"❌ Detay alma hatası: {movie['title']} - {e}")
            movie["trailer"] = ""
            movie["genre"] = ""
            movie["summary"] = ""
            continue

    driver.quit()
    print(f"🏁 İşlem tamamlandı: {len(movie_data)} film döndürüldü")
    return movie_data
