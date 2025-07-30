console.log("🎬 port.js immersive modda çalışıyor");

const container = document.getElementById("graph-area");
const selector = document.getElementById("evrenSec");
const modal = document.getElementById("film-modal");
const modalClose = document.getElementById("modal-close");
const filmAciklama = document.getElementById("film-aciklama");

function formatFilmModal(film) {
  return \`
    <div class="modal-content-inner">
      <img src="\${film.image}" alt="\${film.title}" />
      <h3>\${film.title}</h3>
      <p><strong>📅 Vizyon Tarihi:</strong> \${film.release_date}</p>
      <p><strong>🧠 Açıklama:</strong> \${film.description}</p>
      \${film.refers_to ? `<p><strong>🔁 Gönderme:</strong> <em>\${film.refers_to}</em></p>` : ""}
    </div>
  \`;
}

function yukleEvren(evren) {
  const dosya = \`graph_\${evren}.json\`;
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
          shadow: true
        },
        edges: {
          arrows: "to",
          color: "#aaa"
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
          filmAciklama.innerHTML = formatFilmModal(film);
          modal.classList.remove("hidden");
        }
      });
    })
    .catch(err => {
      console.error("Veri yüklenemedi:", err);
    });
}

modalClose.addEventListener("click", () => {
  modal.classList.add("hidden");
});

selector.addEventListener("change", () => {
  yukleEvren(selector.value);
});

yukleEvren("marvel");
