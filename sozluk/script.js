let tumTerimler = [];

fetch('data/sozluk.json')
  .then(res => res.json())
  .then(data => {
    tumTerimler = data.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    terimleriGoster(tumTerimler);
  });

function terimleriGoster(veri) {
  const container = document.getElementById("sozluk-listesi");
  container.innerHTML = "";

  veri.forEach(terim => {
    const div = document.createElement("div");
    div.classList.add("terim-karti");

    const etiketHTML = terim.tags.map(tag => `<span class="etiket">${tag}</span>`).join(" ");

    const linkHTML = terim.links?.length
      ? `<strong>🔗 Dış Kaynaklar:</strong><ul>` +
        terim.links.map(link => `<li><a href="${link.url}" target="_blank">${link.label}</a></li>`).join("") +
        `</ul>`
      : "";

    const benzerler = tumTerimler.filter(t =>
      t.slug !== terim.slug && t.tags.some(tag => terim.tags.includes(tag))
    );

    const benzerHTML = benzerler.length
      ? `<strong>🗂️ Benzer Terimler:</strong><ul>` +
        benzerler.map(b => `<li>${b.title}</li>`).join("") +
        `</ul>`
      : "";

    div.innerHTML = `
      <h2>${terim.title}</h2>
      <p>${terim.text}</p>
      <div class="etiketler">${etiketHTML}</div>
      <div class="diger-bilgiler">
        ${linkHTML}
        ${benzerHTML}
      </div>
    `;

    container.appendChild(div);
  });
}

document.getElementById("arama").addEventListener("input", function () {
  const aranan = this.value.toLowerCase();

  const filtreli = tumTerimler.filter(terim =>
    terim.title.toLowerCase().includes(aranan) ||
    terim.text.toLowerCase().includes(aranan)
  );

  terimleriGoster(filtreli);
});
