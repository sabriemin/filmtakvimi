function formatUniverseName(name) {
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