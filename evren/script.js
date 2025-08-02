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
      "Marvel": { color: { background: "red", border: "darkred" } },
      "DC": { color: { background: "blue", border: "navy" } },
      "Pixar": { color: { background: "orange", border: "darkorange" } },
      "Star Wars": { color: { background: "lightblue", border: "steelblue" } }
    },
    physics: { stabilization: true }
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

      if (!selectedNodes.includes(nodeId)) {
        selectedNodes.push(nodeId);
        if (selectedNodes.length > 2) selectedNodes.shift();
      }
    }
  });
}

function closeInfoBox() {
  infoBox.classList.add("hidden");
  overlay.classList.add("hidden");
}

function setupThemeToggle() {
  const btn = document.createElement("button");
  btn.textContent = "🌙 Tema Değiştir";
  btn.onclick = () => {
    document.body.classList.toggle("dark");
    applyLabelTheme();
    setupModalInteraction();
  };
  document.body.insertBefore(btn, container);
}

function setupUniverseDropdown() {
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
  document.body.insertBefore(select, container);
}


function setupSearchBox() {
  const input = document.createElement("input");
  input.placeholder = "Ara...";
  input.oninput = () => {
    const term = input.value.toLowerCase();
    allNodes.forEach(n => {
      const match = n.label && n.label.toLowerCase().includes(term);
      allNodes.update({ id: n.id, hidden: !match });
    });
  };
  document.body.insertBefore(input, container);
}

function setupTimelineToggle() {
  const btn = document.createElement("button");
  btn.textContent = "📅 Zaman Çizelgesi";
  let timelineActive = false;

  btn.onclick = () => {
    if (!timelineActive) {
      const nodes = allNodes.get().map(n => {
        const x = new Date(n.release_date).getTime() / 10000000;
        return { ...n, x, y: n.level || 0, physics: false, fixed: true };
      });
      allNodes.clear();
      allNodes.add(nodes);
      showYearMarkers();
      timelineActive = true;
      btn.textContent = "🔁 Normal Görünüm";
    } else {
      document.querySelectorAll(".year-marker").forEach(e => e.remove());
      allNodes.clear(); allEdges.clear();
      loadUniverseData().then(drawNetwork);
      timelineActive = false;
      btn.textContent = "📅 Zaman Çizelgesi";
    }
  };
  document.body.insertBefore(btn, container);
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
  allNodes.forEach(n => {
    allNodes.update({ id: n.id, font: { color: fontColor } });
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
    enhanceCompareModalStyle();
    overlay.classList.remove("hidden");
  });
}

function setupTypeFilterCheckboxes() {
  const checkboxes = document.querySelectorAll(".type-filter");
  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const selectedTypes = Array.from(checkboxes)
        .filter(c => c.checked)
        .map(c => c.dataset.type);

      allEdges.forEach(edge => {
        const match = selectedTypes.includes(edge.type);
        allEdges.update({ id: edge.id, hidden: !match });
      });
    });
  });
}

function selectAllConnections(selectAll) {
  const connectionFilters = document.querySelectorAll(".type-filter");
  connectionFilters.forEach(cb => {
    cb.checked = selectAll;
  });
  applyConnectionFilters();
}

function applyConnectionFilters() {
  const checkboxes = document.querySelectorAll(".type-filter");
  const selectedTypes = Array.from(checkboxes)
    .filter(c => c.checked)
    .map(c => c.dataset.type);

  allEdges.forEach(edge => {
    const match = selectedTypes.includes(edge.type);
    allEdges.update({ id: edge.id, hidden: !match });
  });
}

function init() {
  loadUniverseData().then(() => {
    drawNetwork();
    setupThemeToggle();
    setupUniverseDropdown();
    setupSearchBox();
    setupTimelineToggle();
    setupCompareButtonNew();
    setupTypeFilterCheckboxes();
    applyLabelTheme();
    setupModalInteraction();
  });
}

document.addEventListener("DOMContentLoaded", init);



function setupModalInteraction() {
  // Kapatma butonu oluştur
  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "10px";
  closeBtn.style.right = "20px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "24px";
  closeBtn.style.color = "#aaa";
  closeBtn.title = "Kapat";
  closeBtn.onclick = closeInfoBox;
  infoBox.appendChild(closeBtn);

  // Overlay'e tıklanınca kapat
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeInfoBox();
    }
  });

  // ESC ile kapat
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeInfoBox();
    }
  });
}


function enhanceCompareModalStyle() {
  const box = document.getElementById("compare-box");
  const overlay = document.getElementById("modal-overlay");

  if (box) {
    box.style.maxWidth = "700px";
    box.style.margin = "auto";
    box.style.padding = "20px";
    box.style.backgroundColor = "#fff";
    box.style.borderRadius = "12px";
    box.style.boxShadow = "0 0 20px rgba(0,0,0,0.2)";
    box.style.position = "relative";
    box.style.maxHeight = "80vh";
    box.style.overflowY = "auto";
    box.style.color = "#000";
  }

  if (overlay) {
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.backdropFilter = "blur(6px)";
  }

  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "10px";
  closeBtn.style.right = "20px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "24px";
  closeBtn.style.color = "#aaa";
  closeBtn.title = "Kapat";
  closeBtn.onclick = closeInfoBox;
  box.appendChild(closeBtn);
}
