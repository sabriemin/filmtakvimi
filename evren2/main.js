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
  "Star Wars": "data/starwars.json",
  "Avatar: The Last Airbender": "data/avatar_last_airbender.json",
  "Avatar (Pandora)": "data/avatar_pandora.json",
  "Harry Potter": "data/harrypotter.json",
  "Middle-earth": "data/middleearth.json",
  "The Matrix": "data/matrix.json"
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
        console.log('✅ Veri yüklendi:', universe, data);
        const nodes = data.nodes.map(n => ({
  shape: "circularImage",
  image: n.image,
  borderWidth: 2,
  borderWidthSelected: 4,
  color: {
    border: document.body.classList.contains("dark") ? "#fff" : "#111"
  },
          ...n,
          universe,
          group: universe,
          title: n.label
        }));
        allNodes.add(nodes);

        const coloredEdges = data.edges.map(e => {
          let color = "#999";
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
          if (colorMap[e.type]) color = colorMap[e.type];
          return { ...e, color: { color }, arrows: "to" };
        });
        allEdges.add(coloredEdges);

        universeNodesMap[universe] = nodes.map(n => n.id);
      })
  );
  return Promise.all(promises);
}

function drawNetwork() {
  const container = document.getElementById("network");
  const data = { nodes: allNodes, edges: allEdges };
  const options = getNetworkOptions();

  network = new vis.Network(container, data, options);

  setupNodeClickEvents();
  network.on("stabilized", () => {
    console.log("✅ Ağ çizimi tamamlandı");
  });
}

// getNetworkOptions moved to modules/draw.js
  return {
    nodes: {
      shape: "dot",
      size: 25,
      font: { color: "#fff", size: 14 }
    },
    edges: {
      arrows: "to",
      color: "#888"
    },
    layout: { improvedLayout: true },
    physics: { stabilization: true }
  };
}

// setupNodeClickEvents moved to modules/draw.js
  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const node = allNodes.get(nodeId);
      if (!node) return;

      if (selectedNodes.length === 0) {
        selectedNodes.push(node);
        showInfo(node);
      } else if (selectedNodes.length === 1 && selectedNodes[0].id !== node.id) {
        selectedNodes.push(node);
        showComparison(selectedNodes[0], selectedNodes[1]);
        selectedNodes = [];
      } else {
        selectedNodes = [node];
        showInfo(node);
      }
    }
  });
}
}

 function showInfo(node) {
  titleEl.innerHTML = node.label || "Bilinmeyen";
  const typeIcon = node.type === "dizi" ? "📺 Dizi" : "🎬 Film";
  const dateInfo = node.release_date ? `🗓️ ${node.release_date}` : "";
  const metaInfo = `<div style="margin-top: 6px; font-size: 14px; color: gray;">${typeIcon} &nbsp; ${dateInfo}</div>`;
  titleEl.innerHTML += metaInfo;

  descEl.innerHTML = "<b>🎞️ Özeti</b><br>" + (node.description ?? "Açıklama yok.");
  refersEl.innerHTML = "<b>📌 Gönderme</b><br>" + (node.refers_to ?? "Yok.");

  const addBtn = document.createElement("button");
  addBtn.textContent = "🎯 Karşılaştırmaya Ekle";
  addBtn.onclick = () => handleAddToCompare(node.id);
  descEl.appendChild(document.createElement("br"));
  descEl.appendChild(addBtn);

  infoBox.classList.remove("hidden");
  overlay.classList.remove("hidden");
}



function closeInfoBox() {
  infoBox.classList.add("hidden");
  overlay.classList.add("hidden");
}




function showYearMarkers() {
  document.querySelectorAll(".year-marker").forEach(e => e.remove());
  const years = [...new Set(allNodes.get().map(n => new Date(n.release_date).getFullYear()))].sort();
  years.forEach((year, i) => {
    const div = document.createElement("div");
    div.className = "year-marker";
    div.textContent = year;
    div.style.position = "absolute";
    div.style.top = "0";
    div.style.left = `${i * 120 + 80}px`;
    div.style.color = "gray";
    div.style.fontSize = "12px";
    div.style.zIndex = "10";
    document.body.appendChild(div);
  });
}

function applyLabelTheme() {
  const dark = document.body.classList.contains("dark");
  const fontColor = dark ? "#ffffff" : "#111111";
  const borderColor = dark ? "#ffffff" : "#111111";
  allNodes.forEach(n => {
    allNodes.update({
      id: n.id,
      font: { color: fontColor },
      color: { border: borderColor }
    });
  });

}

function updateCompareButtonState() {
  const compareBtn = document.getElementById("compare-btn");
  if (compareBtn) {
    compareBtn.disabled = selectedCompareNodes.length !== 2;
  }
}

function handleAddToCompare(nodeId) {
  if (!selectedCompareNodes.includes(nodeId)) {
    selectedCompareNodes.push(nodeId);
    if (selectedCompareNodes.length > 2) selectedCompareNodes.shift();
  }
  updateCompareButtonState();
}

function setupCompareButtonNew() {
  const btn = document.getElementById("compare-btn");
  if (!btn) return;

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
    console.log('📦 Tüm veriler başarıyla yüklendi.');
    drawNetwork();
    createTopControls();
    setupCompareButtonNew();
});
}
document.addEventListener("DOMContentLoaded", init); 

function createTopControls() {
  const wrapper = document.createElement("div");
  wrapper.className = "ui-top-controls";

  const themeBtn = document.createElement("button");
  themeBtn.textContent = "🌙 Tema Değiştir";
  themeBtn.onclick = () => {
    document.body.classList.toggle("dark");
    applyLabelTheme();
  };

  const select = document.createElement("select");
  select.innerHTML = '<option value="Hepsi">Hepsi</option>' +
    Object.keys(dataFiles).map(u => `<option value="${u}">${u}</option>`).join("");
  select.onchange = () => {
    const selected = select.value;
    allNodes.forEach(n => {
      allNodes.update({ id: n.id, hidden: selected !== "Hepsi" && n.universe !== selected });
    });
    if (selected !== "Hepsi") {
      const ids = universeNodesMap[selected];
      network.fit({ nodes: ids, animation: true });
    }
  };

  const input = document.createElement("input");
  input.placeholder = "Ara...";
  input.oninput = () => {
    const term = input.value.toLowerCase();
    allNodes.forEach(n => {
      const match = n.label && n.label.toLowerCase().includes(term);
      allNodes.update({ id: n.id, hidden: !match });
    });
  };

  const timelineBtn = document.createElement("button");
  timelineBtn.textContent = "📅 Zaman Çizelgesi";
  let timelineActive = false;
  timelineBtn.onclick = () => {
    if (!timelineActive) {
      const nodes = allNodes.get().map(n => {
        const x = new Date(n.release_date).getTime() / 10000000;
        return { ...n, x, y: n.level || 0, physics: false, fixed: true };
      });
      allNodes.clear();
      allNodes.add(nodes);
      showYearMarkers();
      timelineActive = true;
      timelineBtn.textContent = "🔁 Normal Görünüm";
    } else {
      document.querySelectorAll(".year-marker").forEach(e => e.remove());
      allNodes.clear(); allEdges.clear();
      loadUniverseData().then(drawNetwork);
      timelineActive = false;
      timelineBtn.textContent = "📅 Zaman Çizelgesi";
    }
  };

  wrapper.appendChild(themeBtn);
  wrapper.appendChild(select);
  wrapper.appendChild(input);
  wrapper.appendChild(timelineBtn);
  document.body.appendChild(wrapper);
}



overlay.addEventListener("click", closeInfoBox);