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
  });
}

init();