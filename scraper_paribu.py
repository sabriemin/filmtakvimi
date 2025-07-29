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

                for btn in bilet_btns:
                    href = btn.get_attribute("href")
                    if href:
                        bilet_link = "https://www.paribucineverse.com" + href if not href.startswith("http") else href
                        break
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

        # Detay sayfasına girince:
            except:
                print(f"⏱ Bekleme zaman aşımı: {movie['title']} — Sayfa yüklenmedi.")
                continue

            except:
                movie["trailer"] = "Fragman bağlantısı yok"

            except:
                movie["genre"] = "Tür belirtilmemiş"

                if paragraphs:
                    movie["summary"] = "\n".join([p.text.strip() for p in paragraphs if p.text.strip()])
                else:
                    movie["summary"] = "Özet bulunamadı"
            except:
                movie["summary"] = "Özet bulunamadı"

            
    for block in info_blocks:
            if "Vizyon Tarihi" in label:
                date_text = block.find_element(By.TAG_NAME, "small").text.strip()
                if date_text and "." in date_text:
                    day, month, year = date_text.split(".")
                    iso_date = f"{year}{month}{day}"
                    movie["date"] = iso_date
                    print(f"📅 Vizyon tarihi bulundu: {movie['title']} → {iso_date}")
                    break
        except:
            continue
except:
    print(f"📅 Vizyon tarihi alınamadı: {movie['title']}")


            
            try:
                info_blocks = driver.find_elements(By.CLASS_NAME, "item-info")
                for block in info_blocks:
                    try:
                        label = block.find_element(By.TAG_NAME, "b").text.strip()
                        if "Vizyon Tarihi" in label:
                            date_text = block.find_element(By.TAG_NAME, "small").text.strip()
                            if date_text and "." in date_text:
                                day, month, year = date_text.split(".")
                                iso_date = f"{year}{month}{day}"
                                movie["date"] = iso_date
                                print(f"📅 Vizyon tarihi bulundu: {movie['title']} → {iso_date}")
                                break
                    except:
                        continue
            except Exception as e:
                print(f"📅 Vizyon tarihi alınamadı: {movie['title']} – Hata: {e}")

            print(f"📌 Detay eklendi: {movie['title']}")

        except Exception as e:
            print(f"❌ Detay alma hatası: {movie['title']} - {e}")
            movie["trailer"] = ""
            movie["genre"] = ""
            movie["summary"] = ""
            continue
            except:
                print(f"⏱ Bekleme zaman aşımı: {movie['title']} — Sayfa yüklenmedi.")
                continue

            except:
                movie["trailer"] = "Fragman bağlantısı yok"

            except:
                movie["genre"] = "Tür belirtilmemiş"

                if paragraphs:
                    movie["summary"] = "\n".join([p.text.strip() for p in paragraphs if p.text.strip()])
                else:
                    movie["summary"] = "Özet bulunamadı"
            except:
                movie["summary"] = "Özet bulunamadı"

            

    for block in info_blocks:
            if "Vizyon Tarihi" in label:
                date_text = block.find_element(By.TAG_NAME, "small").text.strip()
                if date_text and "." in date_text:
                    day, month, year = date_text.split(".")
                    iso_date = f"{year}{month}{day}"
                    movie["date"] = iso_date
                    print(f"📅 Vizyon tarihi bulundu: {movie['title']} → {iso_date}")
                    break
        except:
            continue
except:
    print(f"📅 Vizyon tarihi alınamadı: {movie['title']}")



            try:
                info_blocks = driver.find_elements(By.CLASS_NAME, "item-info")
                for block in info_blocks:
                    try:
                        label = block.find_element(By.TAG_NAME, "b").text.strip()
                        if "Vizyon Tarihi" in label:
                            date_text = block.find_element(By.TAG_NAME, "small").text.strip()
                            if date_text and "." in date_text:
                                day, month, year = date_text.split(".")
                                iso_date = f"{year}{month}{day}"
                                movie["date"] = iso_date
                                print(f"📅 Vizyon tarihi bulundu: {movie['title']} → {iso_date}")
                                break
                    except:
                        continue
            except Exception as e:
                print(f"📅 Vizyon tarihi alınamadı: {movie['title']} – Hata: {e}")

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

def get_now_playing_movies():
    print("\n🎬 Başlıyoruz: Vizyondaki filmler çekilecek...")

    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3')
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

    service = Service("/usr/local/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)

    base_url = "https://www.paribucineverse.com/vizyondakiler"
    driver.get(base_url)
    time.sleep(5)

    movie_elements = driver.find_elements(By.CLASS_NAME, "movie-list-banner-item")
    print(f"🎞️ {len(movie_elements)} vizyondaki film bulundu")
    movie_data = []

    for element in tqdm(movie_elements, desc="🎞️ Film kartları alınıyor"):

            except:
                date = datetime.today().strftime("%d.%m.%Y")

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

                for btn in bilet_btns:
                    href = btn.get_attribute("href")
                    if href:
                        bilet_link = "https://www.paribucineverse.com" + href if not href.startswith("http") else href
                        break
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

        # Detay sayfasına girince:
            except:
                print(f"⏱ Bekleme zaman aşımı: {movie['title']} — Sayfa yüklenmedi.")
                continue

            except:
                movie["trailer"] = "Fragman bağlantısı yok"

            except:
                movie["genre"] = "Tür belirtilmemiş"

                if paragraphs:
                    movie["summary"] = "\n".join([p.text.strip() for p in paragraphs if p.text.strip()])
                else:
                    movie["summary"] = "Özet bulunamadı"
            except:
                movie["summary"] = "Özet bulunamadı"

            
    for block in info_blocks:
            if "Vizyon Tarihi" in label:
                date_text = block.find_element(By.TAG_NAME, "small").text.strip()
                if date_text and "." in date_text:
                    day, month, year = date_text.split(".")
                    iso_date = f"{year}{month}{day}"
                    movie["date"] = iso_date
                    print(f"📅 Vizyon tarihi bulundu: {movie['title']} → {iso_date}")
                    break
        except:
            continue
except:
    print(f"📅 Vizyon tarihi alınamadı: {movie['title']}")


            
            try:
                info_blocks = driver.find_elements(By.CLASS_NAME, "item-info")
                for block in info_blocks:
                    try:
                        label = block.find_element(By.TAG_NAME, "b").text.strip()
                        if "Vizyon Tarihi" in label:
                            date_text = block.find_element(By.TAG_NAME, "small").text.strip()
                            if date_text and "." in date_text:
                                day, month, year = date_text.split(".")
                                iso_date = f"{year}{month}{day}"
                                movie["date"] = iso_date
                                print(f"📅 Vizyon tarihi bulundu: {movie['title']} → {iso_date}")
                                break
                    except:
                        continue
            except Exception as e:
                print(f"📅 Vizyon tarihi alınamadı: {movie['title']} – Hata: {e}")

            print(f"📌 Detay eklendi: {movie['title']}")

        except Exception as e:
            print(f"❌ Detay alma hatası: {movie['title']} - {e}")
            movie["trailer"] = ""
            movie["genre"] = ""
            movie["summary"] = ""
            continue
            except:
                print(f"⏱ Bekleme zaman aşımı: {movie['title']} — Sayfa yüklenmedi.")
                continue

            except:
                movie["trailer"] = "Fragman bağlantısı yok"

            except:
                movie["genre"] = "Tür belirtilmemiş"

                if paragraphs:
                    movie["summary"] = "\n".join([p.text.strip() for p in paragraphs if p.text.strip()])
                else:
                    movie["summary"] = "Özet bulunamadı"
            except:
                movie["summary"] = "Özet bulunamadı"

            

    for block in info_blocks:
            if "Vizyon Tarihi" in label:
                date_text = block.find_element(By.TAG_NAME, "small").text.strip()
                if date_text and "." in date_text:
                    day, month, year = date_text.split(".")
                    iso_date = f"{year}{month}{day}"
                    movie["date"] = iso_date
                    print(f"📅 Vizyon tarihi bulundu: {movie['title']} → {iso_date}")
                    break
        except:
            continue
except:
    print(f"📅 Vizyon tarihi alınamadı: {movie['title']}")



            try:
                info_blocks = driver.find_elements(By.CLASS_NAME, "item-info")
                for block in info_blocks:
                    try:
                        label = block.find_element(By.TAG_NAME, "b").text.strip()
                        if "Vizyon Tarihi" in label:
                            date_text = block.find_element(By.TAG_NAME, "small").text.strip()
                            if date_text and "." in date_text:
                                day, month, year = date_text.split(".")
                                iso_date = f"{year}{month}{day}"
                                movie["date"] = iso_date
                                print(f"📅 Vizyon tarihi bulundu: {movie['title']} → {iso_date}")
                                break
                    except:
                        continue
            except Exception as e:
                print(f"📅 Vizyon tarihi alınamadı: {movie['title']} – Hata: {e}")

            print(f"📌 Detay eklendi: {movie['title']}")

        except Exception as e:
            print(f"❌ Detay alma hatası: {movie['title']} - {e}")
            movie["trailer"] = ""
            movie["genre"] = ""
            movie["summary"] = ""
            continue

    driver.quit()
    print(f"🏁 İşlem tamamlandı: {len(movie_data)} vizyondaki film döndürüldü")
    return movie_data