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
  const loadPromises = Object.entries(dataFiles).map(([universe, path]) =>
    fetch(path).then(r => r.json()).then(data => {
      data.nodes.forEach(n => {
        allNodes.add({...n, universe });
      });
      allEdges.add(data.edges);
    })
  );

  return Promise.all(loadPromises);
}

function drawNetwork() {
  const data = {
    nodes: allNodes,
    edges: allEdges
  };
  const options = {
    nodes: {
      shape: "image",
      size: 30,
      font: { color: "white" }
    },
    edges: {
      arrows: "to",
      color: "#999"
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
      descEl.textContent = node.description || "";
      refersEl.textContent = node.refers_to ? `Referans: ${node.refers_to}` : "";
      infoBox.classList.remove("hidden");
    }
  });
}

function init() {
  loadUniverseData().then(() => {
    drawNetwork();
    setupSelector();
  });
}

function setupSelector() {
  const select = document.createElement("select");
  const optionAll = new Option("Hepsi", "Hepsi");
  select.appendChild(optionAll);

  Object.keys(dataFiles).forEach(u => {
    select.appendChild(new Option(u, u));
  });

  select.onchange = () => {
    const universe = select.value;
    allNodes.forEach(n => {
      allNodes.update({ id: n.id, hidden: (universe !== "Hepsi" && n.universe !== universe) });
    });
  };

  document.body.insertBefore(select, container);
}

function closeInfoBox() {
  infoBox.classList.add("hidden");
}

init();