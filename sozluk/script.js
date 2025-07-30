let tumTerimler = [];

fetch('data/sozluk.json')
  .then(response => response.json())
  .then(data => {
    tumTerimler = data.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    harfButonlariniOlustur();
    terimleriGoster(tumTerimler);
  });

function terimleriGoster(veri) {
  const container = document.getElementById("sozluk-listesi");
  container.innerHTML = "";

  veri.forEach(terim => {
    const div = document.createElement("div");
    div.classList.add("terim");

    const etiketHTML = terim.tags
      .map(tag => `<span class="etiket" data-tag="${tag}">${tag}</span>`)
      .join(" ");

    div.innerHTML = `
      <h2><a href="sozluk.html?slug=${terim.slug}">${terim.title}</a></h2>
      <p>${terim.text}</p>
      <div class="etiketler">${etiketHTML}</div>
    `;

    container.appendChild(div);
  });

  document.querySelectorAll(".etiket").forEach(el => {
    el.addEventListener("click", () => {
      const seciliTag = el.getAttribute("data-tag");
      const filtreli = tumTerimler.filter(t => t.tags.includes(seciliTag));
      terimleriGoster(filtreli);
    });
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

function harfButonlariniOlustur() {
  const harfContainer = document.getElementById("harf-filtre");
  const harfler = [..."ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ"];

  harfler.forEach(harf => {
    const buton = document.createElement("button");
    buton.textContent = harf;
    buton.addEventListener("click", () => {
      const filtreli = tumTerimler.filter(terim =>
        terim.title.toUpperCase().startsWith(harf)
      );
      terimleriGoster(filtreli);
    });
    harfContainer.appendChild(buton);
  });

  const tumu = document.createElement("button");
  tumu.textContent = "Tümü";
  tumu.addEventListener("click", () => terimleriGoster(tumTerimler));
  harfContainer.prepend(tumu);
}
