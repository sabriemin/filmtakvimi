console.log("🎬 port.js soy ağacı modda çalışıyor");

const container = document.getElementById("graph-area");
const selector = document.getElementById("evrenSec");
const modal = document.getElementById("film-modal");
const modalClose = document.getElementById("modal-close");
const filmAciklama = document.getElementById("film-aciklama");

function formatFilmModal(film) {
  return `
    <div class="modal-content-inner">
      <img src="${film.image}" alt="${film.title}" />
      <h3>${film.title}</h3>
      <p><strong>📅 Vizyon Tarihi:</strong> ${film.release_date}</p>
      <p><strong>🧠 Açıklama:</strong> ${film.description}</p>
      ${film.refers_to ? `<p><strong>🔁 Gönderme:</strong> <em>${film.refers_to}</em></p>` : ""}
    </div>
  `;
}

function edgeStyle(edge) {
  const styles = {
    devam: {
      dashes: false,
      color: '#ffffff'
    },
    "yan-hikaye": {
      dashes: true,
      color: '#44ccff'
    },
    "evren-geçişi": {
      dashes: [5, 5],
      color: '#cc66ff'
    }
  };
  return styles[edge.type] || { color: '#aaa' };
}

function yukleEvren(evren) {
  const dosya = "graph_" + evren + "_yillara_gore.json";
  fetch(dosya)
    .then(res => res.json())
    .then(veri => {
      const nodes = new vis.DataSet(veri.nodes);
      const styledEdges = veri.edges.map(edge => {
        const style = edgeStyle(edge);
        return {
          ...edge,
          arrows: { to: { enabled: true, scaleFactor: 1.1 } },
          color: style.color,
          dashes: style.dashes
        };
      });

      const edges = new vis.DataSet(styledEdges);
      const agVerisi = { nodes, edges };

      const ayarlar = {
        layout: {
          hierarchical: {
            direction: "UD",
            sortMethod: "directed",
            levelSeparation: 180,
            nodeSpacing: 120
          }
        },
        nodes: {
          shape: "image",
          size: 50,
          borderWidth: 2,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.5)',
            size: 10,
            x: 5,
            y: 5
          }
        },
        edges: {
          smooth: {
            type: 'cubicBezier',
            forceDirection: 'vertical',
            roundness: 0.4
          }
        },
        interaction: {
          hover: true,
          navigationButtons: true,
          keyboard: true
        },
        physics: {
          enabled: false
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
    .catch(err => console.error("Veri yüklenemedi:", err));
}

modalClose.addEventListener("click", () => modal.classList.add("hidden"));
selector.addEventListener("change", () => yukleEvren(selector.value));
yukleEvren("marvel");