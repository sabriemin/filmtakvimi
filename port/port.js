console.log("🎬 port.js çalışıyor");

const container = document.getElementById("graph-area");
const selector = document.getElementById("evrenSec");
const bilgiKutusu = document.getElementById("film-aciklama");

function formatFilmInfo(film) {
  return `
    <div class="film-karti">
      <img src="\${film.image}" alt="\${film.title}" class="film-afis" />
      <h3>\${film.title}</h3>
      <p><strong>📅 Vizyon Tarihi:</strong> \${film.release_date}</p>
      <p><strong>🧠 Açıklama:</strong> \${film.description}</p>
      \${film.refers_to ? `<p><strong>🔁 Gönderme:</strong> <em>\${film.refers_to}</em></p>` : ""}
    </div>
  `;
}

function yukleEvren(evren) {
  const dosya = `graph_${evren}.json`;
  fetch(dosya)
    .then(res => res.json())
    .then(veri => {
      const nodes = new vis.DataSet(veri.nodes);
      const edges = new vis.DataSet(veri.edges);

      const agVerisi = { nodes, edges };
      const ayarlar = {
        layout: {
          hierarchical: {
            direction: "LR",
            sortMethod: "directed"
          }
        },
        nodes: {
          shape: "image",
          size: 40,
          borderWidth: 2,
          shadow: true,
          font: { size: 12 },
          color: {
            border: "#333",
            background: "#fff",
            highlight: {
              border: "#0077cc",
              background: "#e3f2fd"
            }
          }
        },
        edges: {
          arrows: "to",
          color: "#888"
        },
        physics: {
          enabled: false
        },
        interaction: {
          hover: true,
          zoomView: true,
          dragView: true
        }
      };

      const ag = new vis.Network(container, agVerisi, ayarlar);

      ag.on("click", function (params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const film = nodes.get(nodeId);
          bilgiKutusu.innerHTML = formatFilmInfo(film);
        }
      });
    })
    .catch(err => {
      console.error("Veri yüklenemedi:", err);
      container.innerHTML = "<p>Grafik verisi alınamadı.</p>";
    });
}

yukleEvren("marvel");

selector.addEventListener("change", () => {
  yukleEvren(selector.value);
});
