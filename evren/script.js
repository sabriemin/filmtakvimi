
const container = document.getElementById("network");
const infoBox = document.getElementById("info-box");
const overlay = document.getElementById("modal-overlay");
const titleEl = document.getElementById("info-title");
const descEl = document.getElementById("info-description");
const refersEl = document.getElementById("info-refers");

const dataFiles = {
  "Marvel": "data/marvel.json",
  "DC": "data/dc.json",
  "Pixar": "data/pixar.json",
  "Star Wars": "data/starwars.json"
};

let allNodes = new vis.DataSet();
let allEdges = new vis.DataSet();
let network;
let universeNodesMap = {};
let selectedNodes = [];
let selectedCompareNodes = [];

function loadUniverseData() {
  const promises = Object.entries(dataFiles).map(([universe, path]) =>
    fetch(path)
      .then(res => res.json())
      .then(data => {
        const nodes = data.nodes.map(n => ({
          ...n,
          universe,
          group: universe,
          title: n.label
        }));
        allNodes.add(nodes);

        const coloredEdges = data.edges.map(e => {
          const colorMap = {
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
          return {
            ...e,
            color: { color: colorMap[e.type] || "#999" },
            arrows: "to"
          };
        });
        allEdges.add(coloredEdges);
        universeNodesMap[universe] = nodes.map(n => n.id);
      })
  );
  return Promise.all(promises);
}

function drawNetwork() {
  const data = {
    nodes: allNodes,
    edges: allEdges
  };
  const options = {
    nodes: {
      shape: "image",
      size: 25,
      font: { color: "#fff", size: 14 }
    },
    edges: {
      arrows: "to",
      color: "#888"
    },
    layout: {
      improvedLayout: true
    },
    groups: {
      Marvel: { color: { background: "red", border: "darkred" } },
      DC: { color: { background: "blue", border: "navy" } },
      Pixar: { color: { background: "orange", border: "darkorange" } },
      "Star Wars": { color: { background: "lightblue", border: "steelblue" } }
    },
    physics: {
      stabilization: true
    }
  };

  network = new vis.Network(container, data, options);

  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const node = allNodes.get(nodeId);

      titleEl.innerHTML = node.label || "Bilinmeyen";
      const typeIcon = node.type === "dizi" ? "📺 Dizi" : "🎬 Film";
      const dateInfo = node.release_date ? `🗓️ ${node.release_date}` : "";
      const metaInfo = `<div style="margin-top: 6px; font-size: 14px; color: gray;">${typeIcon} &nbsp; ${dateInfo}</div>`;
      titleEl.innerHTML += metaInfo;

      descEl.innerHTML = "<b>🎞️ Özeti</b><br>" + (node.description || "Açıklama yok.");
      refersEl.innerHTML = "<b>📌 Gönderme</b><br>" + (node.refers_to || "Yok.");

      const addBtn = document.createElement("button");
      addBtn.textContent = "🎯 Karşılaştırmaya Ekle";
      addBtn.onclick = () => handleAddToCompare(node.id);
      descEl.appendChild(document.createElement("br"));
      descEl.appendChild(addBtn);

      infoBox.classList.remove("hidden");
      overlay.classList.remove("hidden");
    }
  });
}

function handleAddToCompare(nodeId) {
  if (!selectedCompareNodes.includes(nodeId)) {
    selectedCompareNodes.push(nodeId);
    if (selectedCompareNodes.length > 2) selectedCompareNodes.shift();
  }
  updateCompareButtonState();
}

function updateCompareButtonState() {
  const compareBtn = document.getElementById("compare-btn");
  compareBtn.disabled = selectedCompareNodes.length !== 2;
}

function setupCompareButtonNew() {
  const btn = document.getElementById("compare-btn");
  btn.addEventListener("click", () => {
    const box = document.getElementById("compare-box");
    const content = document.getElementById("compare-content");

    if (selectedCompareNodes.length !== 2) {
      content.innerHTML = "Lütfen iki film/dizi seçin.";
    } else {
      const a = allNodes.get(selectedCompareNodes[0]);
      const b = allNodes.get(selectedCompareNodes[1]);
      content.innerHTML = `
        <h3>${a.label} ↔ ${b.label}</h3>
        <p><b>Açıklamalar:</b><br>${a.description}<hr>${b.description}</p>
        <p><b>Referanslar:</b><br>${a.refers_to}<hr>${b.refers_to}</p>
        <p><b>Yayın Tarihleri:</b> ${a.release_date} ↔ ${b.release_date}</p>
      `;
    }
    box.classList.remove("hidden");
    overlay.classList.remove("hidden");
  });
}

function init() {
  loadUniverseData().then(() => {
    drawNetwork();
    setupCompareButtonNew();
  });
}

init();
