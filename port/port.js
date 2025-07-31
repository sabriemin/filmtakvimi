console.log("🎬 port.js immersive modda çalışıyor");

const container = document.getElementById("graph-area");
const selector = document.getElementById("evrenSec");
const modal = document.getElementById("film-modal");
const modalClose = document.getElementById("modal-close");
const filmAciklama = document.getElementById("film-aciklama");

function formatFilmModal(film) {
  let html = "";
  html += '<div class="modal-content-inner">';
  html += '<img src="' + film.image + '" alt="' + film.title + '" />';
  html += "<h3>" + film.title + "</h3>";
  html += "<p><strong>📅 Vizyon Tarihi:</strong> " + film.release_date + "</p>";
  html += "<p><strong>🧠 Açıklama:</strong> " + film.description + "</p>";
  if (film.refers_to) {
    html += "<p><strong>🔁 Gönderme:</strong> <em>" + film.refers_to + "</em></p>";
  }
  html += "</div>";
  return html;
}

function yukleEvren(evren) {
  const dosya = "graph_" + evren + "_yillara_gore.json";
  fetch(dosya)
    .then(function (res) {
      return res.json();
    })
    .then(function (veri) {
      const nodes = new vis.DataSet(veri.nodes);
      const edges = new vis.DataSet(veri.edges);
      const agVerisi = { nodes: nodes, edges: edges };

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
    .catch(function (err) {
      console.error("Veri yüklenemedi:", err);
    });
}

modalClose.addEventListener("click", function () {
  modal.classList.add("hidden");
});

selector.addEventListener("change", function () {
  yukleEvren(selector.value);
});

yukleEvren("marvel");
