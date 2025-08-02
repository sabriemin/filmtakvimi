const container = document.getElementById("network");
const infoBox = document.getElementById("info-box");
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
      shape: "dot",
      size: 20,
      font: {
        color: "white",
        size: 14,
        face: "arial"
      }
    },
    edges: {
      arrows: "to",
      color: {
        color: "#999",
        highlight: "#fff"
      }
    },
    groups: {
      "Marvel": { color: { background: "red", border: "darkred" } },
      "DC": { color: { background: "blue", border: "navy" } },
      "Pixar": { color: { background: "orange", border: "darkorange" } },
      "Star Wars": { color: { background: "lightblue", border: "steelblue" } }
    },
    layout: {
      improvedLayout: true
    },
    physics: {
      stabilization: true
    }
  };

  network = new vis.Network(container, data, options);

  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const node = allNodes.get(params.nodes[0]);
      titleEl.textContent = node.label || "Bilinmeyen";
      descEl.textContent = node.description || "Açıklama bulunamadı.";
      refersEl.textContent = node.refers_to || "";
      infoBox.classList.remove("hidden");
    }
  });
}

function closeInfoBox() {
  infoBox.classList.add("hidden");
}

function setupThemeToggle() {
  const btn = document.createElement("button");
  btn.textContent = "🌙 Tema Değiştir";
  btn.onclick = () => document.body.classList.toggle("dark");
  document.body.insertBefore(btn, container);
}

function setupUniverseFilter() {
  const select = document.createElement("select");
  select.innerHTML = '<option value="Hepsi">Hepsi</option>' +
    Object.keys(dataFiles).map(u => `<option value="${u}">${u}</option>`).join("");
  select.onchange = () => {
    const val = select.value;
    allNodes.forEach(n => {
      allNodes.update({ id: n.id, hidden: (val !== "Hepsi" && n.universe !== val) });
    });
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
      allNodes.update({ id: n.id, hidden: term && !match });
    });
  };
  document.body.insertBefore(input, container);
}

function init() {
  loadUniverseData().then(() => {
    drawNetwork();
    setupThemeToggle();
    setupUniverseFilter();
    setupSearchBox();
    setupTimelineToggle();
    setupGroupCheckboxes();
  });
}

init();


function setupTimelineToggle() {
  const btn = document.createElement("button");
  btn.id = "timeline-toggle";
  btn.textContent = "📅 Zaman Çizelgesi";
  let active = false;

  btn.onclick = () => {
    if (!active) {
      const nodes = allNodes.get();
      const dateSorted = nodes
        .filter(n => n.release_date)
        .map(n => ({
          ...n,
          x: new Date(n.release_date).getTime() / 10000000, // normalize
          y: n.level || 0,
          fixed: true,
          physics: false
        }));
      allNodes.clear();
      allNodes.add(dateSorted);
      active = true;
      btn.textContent = "🔁 Normal Görünüm";
      showYearMarkers();
    } else {
      allNodes.clear();
      loadUniverseData().then(() => {
        drawNetwork();
        active = false;
        btn.textContent = "📅 Zaman Çizelgesi";
        document.querySelectorAll('.year-marker').forEach(e => e.remove());
      });
    }
  };

  document.body.insertBefore(btn, container);
}


function setupGroupCheckboxes() {
  const containerDiv = document.createElement("div");
  containerDiv.style.margin = "8px";

  Object.keys(dataFiles).forEach(universe => {
    const label = document.createElement("label");
    label.style.marginRight = "10px";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.value = universe;

    checkbox.onchange = () => {
      const activeGroups = Array.from(containerDiv.querySelectorAll("input:checked")).map(c => c.value);
      allNodes.forEach(n => {
        const visible = activeGroups.includes(n.universe);
        allNodes.update({ id: n.id, hidden: !visible });
      });
    };

    label.appendChild(checkbox);
    label.append(" " + universe);
    containerDiv.appendChild(label);
  });

  document.body.insertBefore(containerDiv, document.getElementById("network"));
}


function showYearMarkers() {
  // Önce varsa eski yıl işaretlerini kaldıralım
  document.querySelectorAll(".year-marker").forEach(e => e.remove());

  const yearSet = new Set();
  allNodes.forEach(n => {
    if (n.release_date) {
      const year = new Date(n.release_date).getFullYear();
      yearSet.add(year);
    }
  });

  const years = Array.from(yearSet).sort();

  years.forEach((year, idx) => {
    const div = document.createElement("div");
    div.className = "year-marker";
    div.textContent = year;
    div.style.position = "absolute";
    div.style.top = "0";
    div.style.left = `${idx * 120 + 80}px`; // tahmini konum
    div.style.color = "gray";
    div.style.fontSize = "12px";
    div.style.zIndex = "10";
    document.body.appendChild(div);
  });
}


let selectedNodes = [];

function enableCompareMode() {
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
  compareBox.style.border = "1px solid #666";
  compareBox.style.borderRadius = "12px";
  compareBox.style.display = "none";
  compareBox.style.maxWidth = "600px";
  compareBox.style.overflowY = "auto";

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

  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const node = allNodes.get(params.nodes[0]);
      if (selectedNodes.length < 2) {
        selectedNodes.push(node);
      }

      if (selectedNodes.length === 2) {
        const [a, b] = selectedNodes;
        const html = `
          <h3>${a.label} ↔ ${b.label}</h3>
          <p><b>Açıklamalar:</b><br>${a.description || "Yok"}<br><hr>${b.description || "Yok"}</p>
          <p><b>Referanslar:</b><br>${a.refers_to || "Yok"}<br><hr>${b.refers_to || "Yok"}</p>
          <p><b>Yayın Tarihleri:</b> ${a.release_date || "?"} ↔ ${b.release_date || "?"}</p>
        `;
        document.getElementById("compare-content").innerHTML = html;
        compareBox.style.display = "block";
      }
    }
  });
}

enableCompareMode();