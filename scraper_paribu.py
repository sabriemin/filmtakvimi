
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from tqdm import tqdm
from datetime import datetime
import time

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

def parse_movie_element(driver, element, base_url):
    try:
        title = element.get_attribute("data-movie-title")
        genre = element.get_attribute("data-movie-genre")
        categories = element.get_attribute("data-category2")
        rating_raw = element.get_attribute("data-rate")
        rating = str(float(rating_raw) / 10000) if rating_raw else ""
        slug_url = element.get_attribute("data-slug-url")

        try:
            bilet_btn = element.find_element(By.CLASS_NAME, "movie-quick-buy-ticket-btn")
            bilet_link = bilet_btn.get_attribute("href")
        except:
            bilet_link = ""

        try:
            incele_btn = element.find_element(By.CLASS_NAME, "movie-banner-incept-btn")
            relative_detail = incele_btn.get_attribute("href")
            detail_link = base_url + relative_detail
        except:
            detail_link = ""

        try:
            trailer_area = element.find_element(By.CLASS_NAME, "movie-trailer-area")
            trailer = trailer_area.get_attribute("data-trailer-url")
        except:
            trailer = ""

        try:
            img_tag = element.find_element(By.CLASS_NAME, "movie-list-banner-img")
            poster = img_tag.get_attribute("src")
        except:
            poster = ""

        try:
            duration_tag = element.find_element(By.CLASS_NAME, "movie-time")
            duration = duration_tag.text.strip()
        except:
            duration = ""

        today = datetime.today().strftime("%Y%m%d")

        summary = get_summary(driver, detail_link) if detail_link else "Özet bulunamadı"

        return {
            "title": title or "",
            "date": today,
            "link": detail_link or "",
            "bilet_link": bilet_link or "",
            "genre": genre or "",
            "categories": categories or "",
            "rating": rating,
            "poster": poster,
            "duration": duration,
            "trailer": trailer,
            "summary": summary
        }

    except Exception as e:
        print(f"❌ Hata: {e}")
        return None

def get_now_playing_movies():
    print("🎬 Vizyondaki filmler çekiliyor...")
    base_url = "https://www.paribucineverse.com"
    driver = setup_driver()

    try:
        driver.get(base_url + "/vizyondakiler")
        time.sleep(5)

        movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
        print(f"🎞️ {len(movie_elements)} film bulundu")

        movie_data = []
        for element in tqdm(movie_elements, desc="🎞️ Kartlar alınıyor"):
            movie = parse_movie_element(driver, element, base_url)
            if movie:
                movie_data.append(movie)

        return movie_data
    finally:
        driver.quit()
        print("🏁 İşlem tamamlandı.")

def get_upcoming_movies():
    print("🚀 Gelecek filmler çekiliyor...")
    base_url = "https://www.paribucineverse.com"
    driver = setup_driver()

    try:
        driver.get(base_url + "/gelecek-filmler")
        time.sleep(5)

        movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
        print(f"🎬 {len(movie_elements)} gelecek film bulundu")

        movie_data = []
        for element in tqdm(movie_elements, desc="🎬 Kartlar alınıyor"):
            movie = parse_movie_element(driver, element, base_url)
            if movie:
                movie_data.append(movie)

        return movie_data
    finally:
        driver.quit()
        print("🏁 İşlem tamamlandı.")
