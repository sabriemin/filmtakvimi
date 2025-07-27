#!/bin/bash

set -e

CHROME_DRIVER_VERSION=$(curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE)

echo "🔧 Chromedriver version: $CHROME_DRIVER_VERSION"

mkdir -p $HOME/bin

wget -N https://chromedriver.storage.googleapis.com/$CHROME_DRIVER_VERSION/chromedriver_linux64.zip
unzip -o chromedriver_linux64.zip
chmod +x chromedriver
mv -f chromedriver $HOME/bin/chromedriver

rm chromedriver_linux64.zip

# PATH güncelle (Render için)
echo 'export PATH=$HOME/bin:$PATH' >> ~/.bashrc
export PATH=$HOME/bin:$PATH

echo \"✅ Chromedriver $HOME/bin klasörüne kuruldu.\"
