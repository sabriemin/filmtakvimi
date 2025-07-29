
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from datetime import datetime
from tqdm import tqdm
import time

def extract_movie_details(driver, movie):
    try:
        driver.get(movie["link"])
        time.sleep(3)

        try:
            trailer_btn = driver.find_element(By.CLASS_NAME, "video-button")
            movie["trailer"] = trailer_btn.get_attribute("data-bs-video-src") or "Fragman bağlantısı yok"
        except:
            movie["trailer"] = "Fragman bağlantısı yok"

        try:
            info_blocks = driver.find_elements(By.CLASS_NAME, "item-info")
            for block in info_blocks:
                label = block.find_element(By.TAG_NAME, "b").text.strip()
                content = block.find_element(By.TAG_NAME, "small").text.strip()
                if "Tür" in label:
                    movie["genre"] = content
                if "Vizyon Tarihi" in label:
                    if "." in content:
                        day, month, year = content.split(".")
                        movie["date"] = f"{year}{month}{day}"
        except:
            movie["genre"] = "Tür belirtilmemiş"

        try:
            paragraphs = driver.find_elements(By.CLASS_NAME, "movie-paragraph")
            if paragraphs:
                movie["summary"] = "\n".join(p.text.strip() for p in paragraphs if p.text.strip())
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

def get_now_playing_movies():
    print("🎬 Vizyondaki filmler çekiliyor...")

    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3')
    options.add_argument("user-agent=Mozilla/5.0")

    service = Service("/usr/local/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)

    try:
        driver.get("https://www.paribucineverse.com/vizyondakiler")
        time.sleep(5)

        movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
        print(f"🎞️ {len(movie_elements)} film bulundu")

        movie_data = []

        for element in tqdm(movie_elements, desc="🎞️ Kartlar alınıyor"):
            try:
                title = element.find_element(By.CLASS_NAME, "movie-title").text.strip()
                link = element.find_element(By.TAG_NAME, "a").get_attribute("href")

                date = datetime.today().strftime("%d.%m.%Y")
                iso_date = datetime.today().strftime("%Y%m%d")

                movie = {
                    "title": title,
                    "date": iso_date,
                    "link": link,
                    "bilet_link": link
                }
                movie_data.append(movie)
            except Exception as e:
                print(f"❌ Kart hatası: {e}")

        for movie in tqdm(movie_data, desc="📂 Detaylar alınıyor"):
            extract_movie_details(driver, movie)

        return movie_data

    finally:
        driver.quit()
        print("🏁 İşlem tamamlandı.")

def get_upcoming_movies():
    print("🚀 Gelecek filmler çekiliyor...")

    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3')
    options.add_argument("user-agent=Mozilla/5.0")

    service = Service("/usr/local/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)

    try:
        driver.get("https://www.paribucineverse.com/gelecek-filmler")
        time.sleep(5)

        movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
        print(f"🎬 {len(movie_elements)} gelecek film bulundu")

        movie_data = []

        for element in tqdm(movie_elements, desc="🎬 Kartlar alınıyor"):
            try:
                title = element.find_element(By.CLASS_NAME, "movie-title").text.strip()
                link = element.find_element(By.TAG_NAME, "a").get_attribute("href")

                movie = {
                    "title": title,
                    "date": "00000000",
                    "link": link,
                    "bilet_link": None
                }
                movie_data.append(movie)
            except Exception as e:
                print(f"❌ Kart hatası: {e}")

        for movie in tqdm(movie_data, desc="📂 Detaylar alınıyor"):
            extract_movie_details(driver, movie)

        return movie_data

    finally:
        driver.quit()
        print("🏁 İşlem tamamlandı.")
