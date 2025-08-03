// src/utils.js

export const edgeColors = {
  "devam": "#2980b9",
  "ön hikaye": "#e67e22",
  "yan hikaye": "#8e44ad",
  "evren geçişi": "#c0392b",
  "görsel gönderme": "#7f8c8d",
  "karakter göndermesi": "#27ae60",
  "kurumsal gönderme": "#6e4b25",
  "zaman çizgisi bağlantısı": "#1abc9c",
  "karakter geçişi": "#2ecc71",
  "tematik benzerlik": "#f1c40f",
  "duygu ve bilinç teması": "#9b59b6",
  "konseptsel devam": "#34495e",
  "şehir yaşamı paralelliği": "#d35400",
  "iç film/karakter kökeni": "#7d3c98",
  "multiverse birleşmesi": "#e84393",
  "paralel Kang anlatımı": "#16a085"
};

export function formatUniverseName(name) {
  const map = {
    "avatar_last_airbender": "Avatar: Son Hava Bükücü",
    "avatar_pandora": "Avatar (Pandora)",
    "dc": "DC",
    "marvel": "Marvel",
    "harrypotter": "Harry Potter",
    "matrix": "Matrix",
    "middleearth": "Orta Dünya",
    "pixar": "Pixar",
    "starwars": "Star Wars"
  };
  return map[name] || name;
}
