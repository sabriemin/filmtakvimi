
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime
from tqdm import tqdm
import time

def get_upcoming_movies():
    print("🚀 Başlıyoruz: Gelecek filmler çekilecek...")

    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3')
    options.add_argument("user-agent=Mozilla/5.0")

    service = Service("/usr/local/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)

    driver.get("https://www.paribucineverse.com/gelecek-filmler")
    time.sleep(5)

    movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
    print(f"🎞 {len(movie_elements)} gelecek film bulundu")
    movie_data = []

    for element in tqdm(movie_elements, desc="🎬 Film kartları alınıyor"):
        try:
            title = element.find_element(By.CLASS_NAME, "movie-title").text.strip()
            date = element.find_element(By.CLASS_NAME, "movie-date").text.strip()
            link = element.find_element(By.TAG_NAME, "a").get_attribute("href")
            day, month, year = date.split(".")
            iso_date = f"{year}{month}{day}"
            movie_data.append({"title": title, "date": iso_date, "link": link})
        except:
            continue

    for movie in tqdm(movie_data, desc="📂 Film detayları alınıyor"):
        try:
            driver.get(movie["link"])
            wait = WebDriverWait(driver, 40)
            wait.until(
                EC.any_of(
                    EC.presence_of_element_located((By.CLASS_NAME, "movie-summary-tablet")),
                    EC.presence_of_element_located((By.CLASS_NAME, "movie-details"))
                )
            )
            try:
                movie["trailer"] = driver.find_element(By.CLASS_NAME, "video-open-btn").get_attribute("data-trailer-url")
            except:
                movie["trailer"] = "Fragman bağlantısı yok"

            try:
                movie["genre"] = driver.find_element(By.CSS_SELECTOR, ".item-info.movie-genre small").text.strip()
            except:
                movie["genre"] = "Tür belirtilmemiş"

            try:
                summary_block = driver.find_element(By.CLASS_NAME, "movie-summary-tablet")
                paragraphs = summary_block.find_elements(By.TAG_NAME, "p")
                movie["summary"] = "
".join([p.text.strip() for p in paragraphs if p.text.strip()]) or "Özet bulunamadı"
            except:
                movie["summary"] = "Özet bulunamadı"

        except:
            movie["trailer"] = ""
            movie["genre"] = ""
            movie["summary"] = "Özet bulunamadı"
            continue

    driver.quit()
    return movie_data

def get_now_playing_movies():
    print("🎥 Vizyondaki filmler çekiliyor...")

    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3')
    options.add_argument("user-agent=Mozilla/5.0")

    service = Service("/usr/local/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)

    driver.get("https://www.paribucineverse.com/vizyondakiler")
    time.sleep(5)

    movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
    print(f"🍿 {len(movie_elements)} vizyon filmi bulundu")
    movie_data = []

    for element in tqdm(movie_elements, desc="🎞 Vizyon film kartları"):
        try:
            title = element.find_element(By.CLASS_NAME, "movie-title").text.strip()
            date = datetime.today().strftime("%Y%m%d")
            link = element.find_element(By.TAG_NAME, "a").get_attribute("href")
            movie_data.append({"title": title, "date": date, "link": link})
        except:
            continue

    for movie in tqdm(movie_data, desc="📂 Vizyon film detayları"):
        try:
            driver.get(movie["link"])
            wait = WebDriverWait(driver, 40)
            wait.until(
                EC.any_of(
                    EC.presence_of_element_located((By.CLASS_NAME, "movie-summary-tablet")),
                    EC.presence_of_element_located((By.CLASS_NAME, "movie-details"))
                )
            )
            try:
                movie["trailer"] = driver.find_element(By.CLASS_NAME, "video-open-btn").get_attribute("data-trailer-url")
            except:
                movie["trailer"] = "Fragman bağlantısı yok"

            try:
                movie["genre"] = driver.find_element(By.CSS_SELECTOR, ".item-info.movie-genre small").text.strip()
            except:
                movie["genre"] = "Tür belirtilmemiş"

            try:
                summary_block = driver.find_element(By.CLASS_NAME, "movie-summary-tablet")
                paragraphs = summary_block.find_elements(By.TAG_NAME, "p")
                movie["summary"] = "
".join([p.text.strip() for p in paragraphs if p.text.strip()]) or "Özet bulunamadı"
            except:
                movie["summary"] = "Özet bulunamadı"

        except:
            movie["trailer"] = ""
            movie["genre"] = ""
            movie["summary"] = "Özet bulunamadı"
            continue

    driver.quit()
    return movie_data
