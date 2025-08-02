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

function loadUniverseData() {
  const promises = Object.entries(dataFiles).map(([universe, path]) =>
    fetch(path).then(res => res.json()).then(data => {
      const nodes = data.nodes.map(n => ({
        ...n,
        universe,
        group: universe,
        title: n.label,
      }));
      allNodes.add(nodes);
      allEdges.add(data.edges);
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
      const node = allNodes.get(params.nodes[0]);
      titleEl.textContent = node.label || "Bilinmeyen";
      descEl.textContent = node.description || "Açıklama yok.";
      refersEl.textContent = node.refers_to || "";
      infoBox.classList.remove("hidden");
      overlay.classList.remove("hidden");
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

function enableCompareMode() {
  let selectedNodes = [];
  const compareBox = document.createElement("div");
  compareBox.id = "compare-box";
  compareBox.style.position = "fixed";
  compareBox.style.top = "50%";
  compareBox.style.left = "50%";
  compareBox.style.transform = "translate(-50%, -50%)";
  compareBox.style.zIndex = "200";
  compareBox.style.background = "#333";
  compareBox.style.color = "white";
  compareBox.style.padding = "20px";
  compareBox.style.borderRadius = "12px";
  compareBox.style.display = "none";

  const content = document.createElement("div");
  content.id = "compare-content";
  compareBox.appendChild(content);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Kapat";
  closeBtn.onclick = () => {
    compareBox.style.display = "none";
    selectedNodes = [];
  };
  compareBox.appendChild(closeBtn);
  document.body.appendChild(compareBox);

  network.on("doubleClick", function (params) {
    if (params.nodes.length > 0) {
      const node = allNodes.get(params.nodes[0]);
      if (selectedNodes.length < 2) {
        selectedNodes.push(node);
      }
      if (selectedNodes.length === 2) {
        const [a, b] = selectedNodes;
        content.innerHTML = `
          <h3>${a.label} ↔ ${b.label}</h3>
          <p><b>Açıklamalar:</b><br>${a.description}<hr>${b.description}</p>
          <p><b>Referanslar:</b><br>${a.refers_to}<hr>${b.refers_to}</p>
          <p><b>Yayın Tarihleri:</b> ${a.release_date} ↔ ${b.release_date}</p>
        `;
        compareBox.style.display = "block";
      }
    }
  });
}

function init() {
  loadUniverseData().then(() => {
    drawNetwork();
    setupThemeToggle();
    setupUniverseDropdown();
    setupSearchBox();
    setupTimelineToggle();
    enableCompareMode();
  });
}

init();