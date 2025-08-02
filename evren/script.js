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

function loadUniverseData() {
  const promises = Object.entries(dataFiles).map(([universe, path]) =>
    fetch(path)
      .then(res => res.json())
      .then(data => {
        const nodes = data.nodes.map(n => ({
          ...n,
          universe,
          group: universe,
          title: n.label,
        }));
        allNodes.add(nodes);

        const coloredEdges = data.edges.map(e => {
          let color = "#999";
          if (e.type === "devam") color = "#f39c12";
          else if (e.type === "spinoff") color = "#3498db";
          else if (e.type === "aynievren") color = "#2ecc71";
          else if (e.type === "alternatif") color = "#9b59b6";
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
      font: {
        color: "#fff",
        size: 14
      }
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
      infoBox.classList.remove("hidden");
      overlay.classList.remove("hidden");

      // Karşılaştırma için
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
  btn.onclick = () => document.body.classList.toggle("dark");
    applyLabelTheme();
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
    if (!term) {
      allNodes.forEach(n => allNodes.update({ id: n.id, hidden: false }));
      return;
    }
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
      allNodes.clear(); allNodes.add(nodes);
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

function setupCompareButton() {
  const btn = document.getElementById("compare-btn");
  btn.addEventListener("click", () => {
    const box = document.getElementById("compare-box");
    const content = document.getElementById("compare-content");

    if (selectedNodes.length !== 2) {
      content.innerHTML = "Lütfen iki öğe seçin.";
    } else {
      const a = allNodes.get(selectedNodes[0]);
      const b = allNodes.get(selectedNodes[1]);
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
    setupThemeToggle();
    setupUniverseDropdown();
    setupSearchBox();
    setupTimelineToggle();
    setupCompareButton();
    addCheckboxes();
    setupCheckboxCompare();
    setupTypeFilterCheckboxes();
    applyLabelTheme();
  });
}

init();

function addCheckboxes() {
  const canvas = network.canvas.frame.canvas;
  const parent = canvas.parentElement;
  const nodeCheckboxes = {};

  allNodes.forEach((node) => {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "node-checkbox";
    box.style.position = "absolute";
    box.style.zIndex = 101;
    box.dataset.nodeId = node.id;
    box.onclick = e => e.stopPropagation(); // ağ tıklamasını engelle

    parent.appendChild(box);
    nodeCheckboxes[node.id] = box;
  });

  network.on("afterDrawing", () => {
    const positions = network.getPositions();
    const canvasRect = network.body.container.getBoundingClientRect();

    allNodes.forEach((node) => {
      const pos = network.canvasToDOM(positions[node.id]);
      const box = nodeCheckboxes[node.id];
      if (box) {
        box.style.left = `${pos.x + canvasRect.left - 10}px`;
        box.style.top = `${pos.y + canvasRect.top - 10}px`;
      }
    });
  });
}

// checkbox ile seçilenleri karşılaştır
function setupCheckboxCompare() {
  const btn = document.getElementById("compare-btn");
  btn.addEventListener("click", () => {
    const checkedBoxes = document.querySelectorAll(".node-checkbox:checked");
    if (checkedBoxes.length !== 2) {
      document.getElementById("compare-content").innerHTML = "Lütfen iki film/dizi seçin.";
    } else {
      const ids = Array.from(checkedBoxes).map(cb => cb.dataset.nodeId);
      const [a, b] = ids.map(id => allNodes.get(id));
      document.getElementById("compare-content").innerHTML = `
        <h3>${a.label} ↔ ${b.label}</h3>
        <p><b>Açıklamalar:</b><br>${a.description}<hr>${b.description}</p>
        <p><b>Referanslar:</b><br>${a.refers_to}<hr>${b.refers_to}</p>
        <p><b>Yayın Tarihleri:</b> ${a.release_date} ↔ ${b.release_date}</p>
      `;
    }

    document.getElementById("compare-box").classList.remove("hidden");
    document.getElementById("modal-overlay").classList.remove("hidden");
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

function applyLabelTheme() {
  const dark = document.body.classList.contains("dark");
  const fontColor = dark ? "#ffffff" : "#111111";

  allNodes.forEach(n => {
    allNodes.update({ id: n.id, font: { color: fontColor } });
  });
}