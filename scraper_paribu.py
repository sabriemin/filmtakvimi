from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime
from tqdm import tqdm
import time

def setup_driver():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3')
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
    service = Service("/usr/local/bin/chromedriver")
    return webdriver.Chrome(service=service, options=options)

def extract_movie_details(driver, movie):
    try:
        driver.get(movie["link"])
        wait = WebDriverWait(driver, 30)
        wait.until(
            EC.any_of(
                EC.presence_of_element_located((By.CLASS_NAME, "movie-summary-tablet")),
                EC.presence_of_element_located((By.CLASS_NAME, "movie-details")),
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
        )

        try:
            trailer_btn = driver.find_element(By.CLASS_NAME, "video-open-btn")
            movie["trailer"] = trailer_btn.get_attribute("data-trailer-url")
        except:
            movie["trailer"] = ""

        try:
            genre = driver.find_element(By.CSS_SELECTOR, ".item-info.movie-genre small").text.strip()
            movie["genre"] = genre
        except:
            movie["genre"] = ""

        try:
            summary_block = driver.find_element(By.CLASS_NAME, "movie-summary-tablet")
            paragraphs = summary_block.find_elements(By.TAG_NAME, "p")
            movie["summary"] = "\n".join([p.text.strip() for p in paragraphs if p.text.strip()])
        except:
            movie["summary"] = ""

    except Exception as e:
        print(f"❌ Detay alınamadı: {movie['title']} - {e}")
        movie["trailer"] = ""
        movie["genre"] = ""
        movie["summary"] = ""

    return movie

def scrape_movies(section_slug):
    driver = setup_driver()
    url = f"https://www.paribucineverse.com/{section_slug}"
    driver.get(url)
    time.sleep(5)

    movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
    print(f"🎬 {section_slug.upper()} için {len(movie_elements)} film bulundu")
    movies = []

    for element in tqdm(movie_elements, desc=f"📦 {section_slug} filmler alınıyor"):
        try:
            title = element.find_element(By.CLASS_NAME, "movie-title").text.strip()

            try:
                date = element.find_element(By.CLASS_NAME, "movie-date").text.strip()
                day, month, year = date.split(".")
                iso_date = f"{year}{month}{day}"
            except:
                iso_date = datetime.today().strftime("%Y%m%d")

            try:
                link = element.find_element(By.CLASS_NAME, "movie-banner-incept-btn").get_attribute("href")
            except:
                links = element.find_elements(By.TAG_NAME, "a")
                link = links[0].get_attribute("href") if links else ""

            if not link.startswith("http"):
                link = "https://www.paribucineverse.com" + link

            try:
                bilet_btn = element.find_element(By.CLASS_NAME, "movie-quick-buy-ticket-btn")
                bilet_link = bilet_btn.get_attribute("href")
                if not bilet_link.startswith("http"):
                    bilet_link = "https://www.paribucineverse.com" + bilet_link
            except:
                bilet_link = None

            movie = {
                "title": title,
                "date": iso_date,
                "link": link,
                "bilet_link": bilet_link
            }
            movies.append(movie)
        except Exception as e:
            print(f"⚠️ Kart alınamadı: {e}")
            continue

    for i in tqdm(range(len(movies)), desc=f"🔍 {section_slug} detaylar"):
        movies[i] = extract_movie_details(driver, movies[i])

    driver.quit()
    return movies

def get_all_movies():
    print("🚀 Tüm filmler çekiliyor (gelecek + vizyondaki)...")
    future_movies = scrape_movies("gelecek-filmler")
    now_playing_movies = scrape_movies("vizyondakiler")
    return {
        "future": future_movies,
        "now_playing": now_playing_movies
    }

# Doğrudan çalıştırma için
if __name__ == "__main__":
    movies = get_all_movies()
    print(f"📅 Gelecek film sayısı: {len(movies['future'])}")
    print(f"🎬 Vizyondaki film sayısı: {len(movies['now_playing'])}")
