// Ağı oluşturmak için
const container = document.getElementById("network");
const infoBox = document.getElementById("info-box");
const titleEl = document.getElementById("info-title");
const descEl = document.getElementById("info-description");
const refersEl = document.getElementById("info-refers");// Ağı oluşturmak için
const container = document.getElementById("network");
const infoBox = document.getElementById("info-box");
const titleEl = document.getElementById("info-title");
const descEl = document.getElementById("info-description");
const refersEl = document.getElementById("info-refers");

let allNodes = [];
let allEdges = [];
let network;
let currentUniverse = "Hepsi";

const backgroundEl = document.createElement("div");
backgroundEl.style.position = "fixed";
backgroundEl.style.top = 0;
backgroundEl.style.left = 0;
backgroundEl.style.width = "100vw";
backgroundEl.style.height = "100vh";
backgroundEl.style.zIndex = "-1";
backgroundEl.style.backgroundSize = "cover";
backgroundEl.style.backgroundPosition = "center";
backgroundEl.style.opacity = "0.1";
backgroundEl.style.filter = "blur(12px)";
document.body.appendChild(backgroundEl);

function updateBackground(universe) {
  if (universe === "Marvel") {
    backgroundEl.style.backgroundImage = "url('images/marvel.jpg')";
  } else if (universe === "DC") {
    backgroundEl.style.backgroundImage = "url('images/dc.jpg')";
  } else if (universe === "Star Wars") {
    backgroundEl.style.backgroundImage = "url('images/starwars.jpg')";
  } else {
    backgroundEl.style.backgroundImage = "linear-gradient(to bottom right, #0f2027, #203a43, #2c5364)";
  }
}

Promise.all([
  fetch("data/graph_marvel_yillara_gore.json").then(res => res.json()),
  fetch("data/graph_dc_yillara_gore.json").then(res => res.json()),
  fetch("data/graph_starwars_yillara_gore.json").then(res => res.json())
]).then(([marvelData, dcData, swData]) => {
  const addUniverseTag = (data, universe) => {
    return data.nodes.map(n => ({ ...n, universe }))
  };

  const combinedNodes = [
    ...addUniverseTag(marvelData, "Marvel"),
    ...addUniverseTag(dcData, "DC"),
    ...addUniverseTag(swData, "Star Wars")
  ];

  const combinedEdges = [
    ...marvelData.edges,
    ...dcData.edges,
    ...swData.edges
  ];

  allNodes = new vis.DataSet(
    combinedNodes.map((n, idx) => ({
      id: n.id,
      label: `${n.label}`,
      image: n.image,
      shape: "image",
      title: n.title,
      description: n.description,
      refers_to: n.refers_to,
      group: n.type,
      level: n.level,
      x: (n.type === 'dizi' ? 300 : 0),
      y: n.level * 300,
      fixed: true,
      universe: n.universe
    }))
  );

  allEdges = new vis.DataSet(
    combinedEdges.map((e) => ({
      from: e.from,
      to: e.to,
      color: {
        color: e.type === "devam" ? "#ffffff" : e.type === "evren-geçişi" ? "#00ffff" : "#ff9900"
      },
      arrows: "to"
    }))
  );

  const dataSet = {
    nodes: allNodes,
    edges: allEdges,
  };

  const options = {
    nodes: {
      shape: "image",
      size: 40,
      font: { color: "#fff" },
      borderWidth: 1
    },
    edges: {
      width: 2,
      smooth: {
        type: "cubicBezier",
        forceDirection: "horizontal",
        roundness: 0.4
      }
    },
    layout: {
      hierarchical: {
        enabled: true,
        direction: "UD",
        sortMethod: "directed",
        levelSeparation: 150,
        nodeSpacing: 100
      }
    },
    physics: false,
    interaction: {
      hover: false,
      tooltipDelay: 100,
      dragNodes: true
    },
    groups: {
      film: {
        color: { background: "#ff4444" }
      },
      dizi: {
        color: { background: "#4488ff" }
      }
    }
  };

  network = new vis.Network(container, dataSet, options);

  network.setOptions({
    layout: {
      hierarchical: {
        enabled: true,
        direction: "UD",
        sortMethod: "directed",
        levelSeparation: 180,
        nodeSpacing: 150
      }
    }
  });

  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const node = allNodes.get(params.nodes[0]);
      titleEl.textContent = node.title;
      descEl.innerHTML = `<strong>Film Özeti:</strong><br>${node.description}`;
      refersEl.innerHTML = `<strong>Göndermeler:</strong><br>${node.refers_to}`;
      infoBox.classList.remove("hidden");
      infoBox.style.position = "fixed";
      infoBox.style.left = "50%";
      infoBox.style.top = "50%";
      infoBox.style.transform = "translate(-50%, -50%)";
      infoBox.style.zIndex = "200";

      if (window.innerWidth < 600) {
        infoBox.style.width = "90vw";
        infoBox.style.maxHeight = "70vh";
        infoBox.style.overflowY = "auto";
        infoBox.style.fontSize = "13px";
      } else {
        infoBox.style.width = "auto";
        infoBox.style.maxHeight = "none";
        infoBox.style.fontSize = "inherit";
      }
    }
  });

  createSearchBox();
  createLegendBox();
  createUniverseTabs();
  updateBackground(currentUniverse);
});

function createLegendBox() {
  const legend = document.createElement("div");
  legend.style.position = "absolute";
  legend.style.bottom = "10px";
  legend.style.left = "10px";
  legend.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  legend.style.padding = "10px 16px";
  legend.style.color = "white";
  legend.style.border = "1px solid #555";
  legend.style.borderRadius = "6px";
  legend.style.zIndex = "99";
  legend.style.maxWidth = "90vw";
  legend.style.boxSizing = "border-box";
  legend.style.fontSize = window.innerWidth < 600 ? "12px" : "13px";

  legend.innerHTML = `
    <div><span style='color:#fff'>⬤</span> Devam</div>
    <div><span style='color:#00ffff'>⬤</span> Evren Geçişi</div>
    <div><span style='color:#ff9900'>⬤</span> Yan Hikâye</div>
  `;

  window.addEventListener("resize", () => {
    legend.style.fontSize = window.innerWidth < 600 ? "12px" : "13px";
    legend.style.maxWidth = window.innerWidth < 600 ? "90vw" : "300px";
  });

  document.body.appendChild(legend);
}

function closeInfoBox() {
  document.getElementById("info-box").classList.add("hidden");
}

function createSearchBox() {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "🔎 Film veya dizi ara...";
  input.style.position = "static";
  input.style.transform = "none";
  input.style.zIndex = "100";
  input.style.padding = "8px 16px";
  input.style.borderRadius = "25px";
  input.style.border = "1px solid #ccc";
  input.style.outline = "none";
  input.style.background = "#111";
  input.style.color = "white";
  input.style.fontSize = "14px";
  input.style.boxShadow = "0 0 6px rgba(255, 255, 255, 0.2)";
  input.style.maxWidth = "90vw";
  input.style.boxSizing = "border-box";
  window.addEventListener("resize", () => {
    input.style.fontSize = window.innerWidth < 600 ? "12px" : "14px";
    input.style.width = window.innerWidth < 600 ? "80%" : "auto";
  });
  input.oninput = function () {
    const value = input.value.toLowerCase();
    const match = allNodes.get().find(
      (n) => n.label.toLowerCase().includes(value) &&
             (currentUniverse === "Hepsi" || n.universe === currentUniverse)
    );
    if (match) {
      network.focus(match.id, { scale: 1.5, animation: true });
    }
  };
  return input;
}

function createUniverseTabs() {
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.top = "10px";
  wrapper.style.left = "50%";
  wrapper.style.transform = "translateX(-50%)";
  wrapper.style.zIndex = "100";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "6px";
  wrapper.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  wrapper.style.padding = "12px";
  wrapper.style.borderRadius = "12px";
  wrapper.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.4)";

  const input = createSearchBox();
  wrapper.appendChild(input);

  const select = document.createElement("select");
  select.style.padding = "6px 12px";
  select.style.borderRadius = "4px";
  select.style.border = "1px solid #555";
  select.style.backgroundColor = "#222";
  select.style.color = "#fff";
  select.style.cursor = "pointer";
  select.style.marginTop = "8px";

  const universeList = ["Hepsi", "Marvel", "DC", "Star Wars"];
  universeList.forEach((universe) => {
    const option = document.createElement("option");
    option.value = universe;
    option.textContent = universe;
    select.appendChild(option);
  });

  select.onchange = () => {
    const universe = select.value;
    currentUniverse = universe;
    const canvas = document.getElementById("network");
    canvas.style.transition = "opacity 0.3s";
    canvas.style.opacity = 0;
    setTimeout(() => {
      updateBackground(universe);
      const filtered = allNodes.get().map((n) => ({
        ...n,
        hidden: universe === "Hepsi" ? false : n.universe !== universe,
        shape: "image",
        image: n.image,
        title: n.title,
        description: n.description,
        refers_to: n.refers_to,
        group: n.group,
        level: n.level
      }));
      allNodes.clear();
      allNodes.add(filtered);

      const visibleNodes = allNodes.get().filter(n => !n.hidden).map(n => n.id);
      if (visibleNodes.length > 0) {
        network.fit({ nodes: visibleNodes, animation: true });
      }
      canvas.style.opacity = 1;
    }, 300);
  };

  wrapper.appendChild(select);
  document.body.appendChild(wrapper);
}


let allNodes = [];
let allEdges = [];
let network;
let currentUniverse = "Hepsi";

const backgroundEl = document.createElement("div");
backgroundEl.style.position = "fixed";
backgroundEl.style.top = 0;
backgroundEl.style.left = 0;
backgroundEl.style.width = "100vw";
backgroundEl.style.height = "100vh";
backgroundEl.style.zIndex = "-1";
backgroundEl.style.backgroundSize = "cover";
backgroundEl.style.backgroundPosition = "center";
backgroundEl.style.opacity = "0.1";
backgroundEl.style.filter = "blur(12px)";
document.body.appendChild(backgroundEl);

function updateBackground(universe) {
  if (universe === "Marvel") {
    backgroundEl.style.backgroundImage = "url('images/marvel.jpg')";
  } else if (universe === "DC") {
    backgroundEl.style.backgroundImage = "url('images/dc.jpg')";
  } else if (universe === "Star Wars") {
    backgroundEl.style.backgroundImage = "url('images/starwars.jpg')";
  } else {
    backgroundEl.style.backgroundImage = "linear-gradient(to bottom right, #0f2027, #203a43, #2c5364)";
  }
}

Promise.all([
  fetch("data/graph_marvel_yillara_gore.json").then(res => res.json()),
  fetch("data/graph_dc_yillara_gore.json").then(res => res.json()),
  fetch("data/graph_starwars_yillara_gore.json").then(res => res.json())
]).then(([marvelData, dcData, swData]) => {
  const addUniverseTag = (data, universe) => {
    return data.nodes.map(n => ({ ...n, universe }))
  };

  const combinedNodes = [
    ...addUniverseTag(marvelData, "Marvel"),
    ...addUniverseTag(dcData, "DC"),
    ...addUniverseTag(swData, "Star Wars")
  ];

  const combinedEdges = [
    ...marvelData.edges,
    ...dcData.edges,
    ...swData.edges
];

  allNodes = new vis.DataSet(
    combinedNodes.map((n, idx) => ({
      id: n.id,
      label: `${n.label}`,
      image: n.image,
      shape: "image",
      title: n.title,
      description: n.description,
      refers_to: n.refers_to,
      group: n.type,
      level: n.level,
      x: (n.type === 'dizi' ? 300 : 0),
      y: n.level * 300,
      fixed: true,
      universe: n.universe
    }))
  ) => ({
      id: n.id,
      label: `${n.label}`,
      image: n.image,
      shape: "image",
      title: n.title,
      description: n.description,
      refers_to: n.refers_to,
      group: n.type,
      level: n.level,
      universe: n.universe
    }))
  );

  allEdges = new vis.DataSet(
    combinedEdges.map((e) => ({
      from: e.from,
      to: e.to,
      color: {
        color: e.type === "devam" ? "#ffffff" : e.type === "evren-geçişi" ? "#00ffff" : "#ff9900"
      },
      arrows: "to"
    }))
  );

  const dataSet = {
    nodes: allNodes,
    edges: allEdges,
  };

  const options = {
    nodes: {
      shape: "image",
      size: 40,
      font: { color: "#fff" },
      borderWidth: 1,
      chosen: {
        node(values, id, selected, hovering) {
          if (hovering) {
            values.size = 50;
            values.borderWidth = 3;
          }
        }
      }
    },
    edges: {
      width: 2,
      smooth: {
        type: "cubicBezier",
        forceDirection: "horizontal",
        roundness: 0.4
      }
    },
    layout: {
      hierarchical: {
        enabled: true,
        direction: "UD",
        sortMethod: "directed",
        levelSeparation: 150,
        nodeSpacing: 100
      }
    },
    physics: false,
    interaction: {
      hover: false,
      tooltipDelay: 100,
      dragNodes: true
    },
    groups: {
      film: {
        color: { background: "#ff4444" }
      },
      dizi: {
        color: { background: "#4488ff" }
      }
    }
  };

  network = new vis.Network(container, dataSet, options);

  network.setOptions({
    layout: {
      hierarchical: {
        enabled: true,
        direction: "UD",
        sortMethod: "directed",
        levelSeparation: 180,
        nodeSpacing: 150
      }
    }
  });
  allNodes.forEach(node => {
    
  });

  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const node = allNodes.get(params.nodes[0]);
      titleEl.textContent = node.title;
      descEl.innerHTML = `<strong>Film Özeti:</strong><br>${node.description}`;
      refersEl.innerHTML = `<strong>Göndermeler:</strong><br>${node.refers_to}`;
      infoBox.classList.remove("hidden");
      infoBox.style.position = "fixed";
      infoBox.style.left = "50%";
      infoBox.style.top = "50%";
      infoBox.style.transform = "translate(-50%, -50%)";
      infoBox.style.zIndex = "200";

      if (window.innerWidth < 600) {
        infoBox.style.width = "90vw";
        infoBox.style.maxHeight = "70vh";
        infoBox.style.overflowY = "auto";
        infoBox.style.fontSize = "13px";
      } else {
        infoBox.style.width = "auto";
        infoBox.style.maxHeight = "none";
        infoBox.style.fontSize = "inherit";
      }
    }
  });

  createSearchBox();
  createLegendBox();
  createUniverseTabs();
  updateBackground(currentUniverse);
});

function createLegendBox() {
  const legend = document.createElement("div");
  legend.style.position = "absolute";
  legend.style.bottom = "10px";
  legend.style.left = "10px";
  legend.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  legend.style.padding = "10px 16px";
  legend.style.color = "white";
  legend.style.border = "1px solid #555";
  legend.style.borderRadius = "6px";
  legend.style.zIndex = "99";
  legend.style.maxWidth = "90vw";
  legend.style.boxSizing = "border-box";
  legend.style.fontSize = window.innerWidth < 600 ? "12px" : "13px";

  legend.innerHTML = `
    <div><span style='color:#fff'>⬤</span> Devam</div>
    <div><span style='color:#00ffff'>⬤</span> Evren Geçişi</div>
    <div><span style='color:#ff9900'>⬤</span> Yan Hikâye</div>
  `;

  window.addEventListener("resize", () => {
    legend.style.fontSize = window.innerWidth < 600 ? "12px" : "13px";
    legend.style.maxWidth = window.innerWidth < 600 ? "90vw" : "300px";
  });

  document.body.appendChild(legend);
}

function closeInfoBox() {
  document.getElementById("info-box").classList.add("hidden");
}

function createSearchBox() {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "🔎 Film veya dizi ara...";
  input.style.position = "static";
  input.style.transform = "none";
  input.style.zIndex = "100";
  input.style.padding = "8px 16px";
  input.style.borderRadius = "25px";
  input.style.border = "1px solid #ccc";
  input.style.outline = "none";
  input.style.background = "#111";
  input.style.color = "white";
  input.style.fontSize = "14px";
  input.style.boxShadow = "0 0 6px rgba(255, 255, 255, 0.2)";
  input.style.maxWidth = "90vw";
  input.style.boxSizing = "border-box";
  window.addEventListener("resize", () => {
    input.style.fontSize = window.innerWidth < 600 ? "12px" : "14px";
    input.style.width = window.innerWidth < 600 ? "80%" : "auto";
  });
  input.oninput = function () {
    const value = input.value.toLowerCase();
    const match = allNodes.get().find(
      (n) => n.label.toLowerCase().includes(value) &&
             (currentUniverse === "Hepsi" || n.universe === currentUniverse)
    );
    if (match) {
      network.focus(match.id, { scale: 1.5, animation: true });
    }
  };
  return input;
}

function createUniverseTabs() {
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.top = "10px";
  wrapper.style.left = "50%";
  wrapper.style.transform = "translateX(-50%)";
  wrapper.style.zIndex = "100";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "6px";
  wrapper.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  wrapper.style.padding = "12px";
  wrapper.style.borderRadius = "12px";
  wrapper.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.4)";

  const input = createSearchBox();
  wrapper.appendChild(input);

  const select = document.createElement("select");
  select.style.padding = "6px 12px";
  select.style.borderRadius = "4px";
  select.style.border = "1px solid #555";
  select.style.backgroundColor = "#222";
  select.style.color = "#fff";
  select.style.cursor = "pointer";
  select.style.marginTop = "8px";

  const universeList = ["Hepsi", "Marvel", "DC", "Star Wars"];
  universeList.forEach((universe) => {
    const option = document.createElement("option");
    option.value = universe;
    option.textContent = universe;
    select.appendChild(option);
  });

  select.onchange = () => {
    const universe = select.value;
    currentUniverse = universe;
    const canvas = document.getElementById("network");
    canvas.style.transition = "opacity 0.3s";
    canvas.style.opacity = 0;
    setTimeout(() => {
      updateBackground(universe);
      const filtered = allNodes.get().map((n) => ({
        ...n,
        hidden: universe === "Hepsi" ? false : n.universe !== universe,
        shape: "image",
        image: n.image,
        title: n.title,
        description: n.description,
        refers_to: n.refers_to,
        group: n.group,
        level: n.level
      }));
      allNodes.clear();
      allNodes.add(filtered);

      const visibleNodes = allNodes.get().filter(n => !n.hidden).map(n => n.id);
      if (visibleNodes.length > 0) {
        network.fit({ nodes: visibleNodes, animation: true });
      }
      canvas.style.opacity = 1;
    }, 300);
  };

  wrapper.appendChild(select);
  document.body.appendChild(wrapper);
}
