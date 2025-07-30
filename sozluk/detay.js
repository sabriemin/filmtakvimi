const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");

let tumTerimler = [];

fetch('data/sozluk.json')
  .then(res => res.json())
  .then(data => {
    tumTerimler = data;
    const terim = data.find(item => item.slug === slug);
    const container = document.getElementById("detay");

    if (!terim) {
      container.innerHTML = "<p>Terim bulunamadı.</p><a href='index.html'>← Geri dön</a>";
      return;
    }

    const etiketHTML = terim.tags.map(tag => `<span class="etiket">${tag}</span>`).join(" ");

    const linkHTML = terim.links?.length
      ? `<ul>` + terim.links.map(link => `<li><a href="${link.url}" target="_blank">${link.label}</a></li>`).join("") + `</ul>`
      : "";

    const benzerler = tumTerimler.filter(t =>
      t.slug !== terim.slug && t.tags.some(tag => terim.tags.includes(tag))
    );

    const benzerHTML = benzerler.length
      ? `<ul>` + benzerler.map(b => `<li><a href="sozluk.html?slug=${b.slug}">${b.title}</a></li>`).join("") + `</ul>`
      : "<p>Benzer terim yok.</p>";

    container.innerHTML = `
      <h1>${terim.title}</h1>
      <p>${terim.text}</p>
      <div class="etiketler">${etiketHTML}</div>

      <h3>🔗 Dış Kaynaklar</h3>
      ${linkHTML}

      <h3>🗂️ Benzer Terimler</h3>
      ${benzerHTML}

      <a href="index.html">← Geri dön</a>
    `;
  });
