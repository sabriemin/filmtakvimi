
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

def build_movie_dict_from_attributes(driver, element, base_url):
    try:
        # karttaki tüm bilgiler önceden alınır (stale error koruması)
        data = {
            "title": element.get_attribute("data-movie-title") or "",
            "genre": element.get_attribute("data-movie-genre") or "",
            "categories": element.get_attribute("data-category2") or "",
            "rating_raw": element.get_attribute("data-rate") or "",
            "slug_url": element.get_attribute("data-slug-url") or "",
        }

        data["rating"] = str(float(data["rating_raw"]) / 10000) if data["rating_raw"] else ""

        try:
            bilet_btn = element.find_element(By.CLASS_NAME, "movie-quick-buy-ticket-btn")
            data["bilet_link"] = bilet_btn.get_attribute("href")
        except:
            data["bilet_link"] = ""

        try:
            incele_btn = element.find_element(By.CLASS_NAME, "movie-banner-incept-btn")
            relative_detail = incele_btn.get_attribute("href")
            data["detail_link"] = base_url + relative_detail
        except:
            data["detail_link"] = ""

        try:
            trailer_area = element.find_element(By.CLASS_NAME, "movie-trailer-area")
            data["trailer"] = trailer_area.get_attribute("data-trailer-url")
        except:
            data["trailer"] = ""

        try:
            img_tag = element.find_element(By.CLASS_NAME, "movie-list-banner-img")
            data["poster"] = img_tag.get_attribute("src")
        except:
            data["poster"] = ""

        try:
            duration_tag = element.find_element(By.CLASS_NAME, "movie-time")
            data["duration"] = duration_tag.text.strip()
        except:
            data["duration"] = ""

        return data

    except Exception as e:
        print(f"❌ Hata (attribute okuma): {e}")
        return None

def parse_movie_element(driver, data):
    try:
        summary = get_summary(driver, data["detail_link"]) if data["detail_link"] else "Özet bulunamadı"
        today = datetime.today().strftime("%Y%m%d")

        return {
            "title": data["title"],
            "date": today,
            "link": data["detail_link"],
            "bilet_link": data["bilet_link"],
            "genre": data["genre"],
            "categories": data["categories"],
            "rating": data["rating"],
            "poster": data["poster"],
            "duration": data["duration"],
            "trailer": data["trailer"],
            "summary": summary
        }
    except Exception as e:
        print(f"❌ Hata (parse): {e}")
        return None

def get_movies_from_page(url_path):
    print(f"🎬 Sayfa çekiliyor: {url_path}")
    base_url = "https://www.paribucineverse.com"
    driver = setup_driver()
    movie_data = []

    try:
        driver.get(base_url + url_path)
        time.sleep(5)

        movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
        print(f"🎞️ {len(movie_elements)} film bulundu")

        for element in tqdm(movie_elements, desc="🎬 Kartlar işleniyor"):
            attr_data = build_movie_dict_from_attributes(driver, element, base_url)
            if attr_data:
                movie = parse_movie_element(driver, attr_data)
                if movie:
                    movie_data.append(movie)

        return movie_data
    finally:
        driver.quit()
        print("🏁 İşlem tamamlandı.")

def get_now_playing_movies():
    return get_movies_from_page("/vizyondakiler")

def get_upcoming_movies():
    return get_movies_from_page("/gelecek-filmler")
