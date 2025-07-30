console.log("🎬 port.js çalışıyor");

const container = document.getElementById("graph-area");
const selector = document.getElementById("evrenSec");
const aciklamaAlani = document.getElementById("film-aciklama");

function yukleEvren(evren) {
  const dosya = `graph_${evren}.json`;
  fetch(dosya)
    .then(res => res.json())
    .then(veri => {
      const nodes = new vis.DataSet(veri.nodes);
      const edges = new vis.DataSet(veri.edges);

      const agVerisi = { nodes, edges };
      const ayarlar = {
        nodes: {
          shape: "dot",
          size: 16,
          font: { size: 14 }
        },
        edges: {
          arrows: "to",
          color: "#888"
        },
        physics: {
          stabilization: true
        }
      };

      const ag = new vis.Network(container, agVerisi, ayarlar);

      ag.on("click", function (params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const nodeData = nodes.get(nodeId);
          aciklamaAlani.textContent = nodeData.description || "Açıklama yok.";
        }
      });
    })
    .catch(err => {
      console.error("Veri yüklenemedi:", err);
      container.innerHTML = "<p>Grafik verisi alınamadı.</p>";
    });
}

// Sayfa yüklendiğinde Marvel'ı getir
yukleEvren("marvel");

// Kullanıcı seçim yaptığında tekrar yükle
selector.addEventListener("change", () => {
  yukleEvren(selector.value);
});
