// Ağı oluşturmak için
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
  } else {
    backgroundEl.style.backgroundImage = "none";
  }
}

Promise.all([
  fetch("data/graph_marvel_yillara_gore.json").then(res => res.json()),
  fetch("data/graph_dc_yillara_gore.json").then(res => res.json())
]).then(([marvelData, dcData]) => {
  const addUniverseTag = (data, universe) => {
    return data.nodes.map(n => ({ ...n, universe }))
  };

  const combinedNodes = [
    ...addUniverseTag(marvelData, "Marvel"),
    ...addUniverseTag(dcData, "DC")
  ];

  const combinedEdges = [
    ...marvelData.edges,
    ...dcData.edges
  ];

  allNodes = new vis.DataSet(
    combinedNodes.map((n) => ({
      id: n.id,
      label: `${n.label}\n(${n.release_date?.split('-')[0] || ''})`,
      image: n.image
      shape: "circularImage",
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
        color:
          e.type === "devam"
            ? "#ffffff"
            : e.type === "evren-geçişi"
            ? "#00ffff"
            : "#ff9900",
      },
      arrows: "to",
    }))
  );

  const dataSet = {
    nodes: allNodes,
    edges: allEdges,
  };

  const options = {
    nodes: {
      shape: "circularImage",
      size: 40,
      font: { color: "#fff" },
      borderWidth: 1,
    },
    edges: {
      width: 2,
      smooth: {
        type: "cubicBezier",
        forceDirection: "horizontal",
        roundness: 0.4,
      },
    },
    layout: {
      hierarchical: {
        enabled: true,
        direction: "UD",
        sortMethod: "directed",
        levelSeparation: 150,
        nodeSpacing: 100,
      },
    },
    physics: false,
    interaction: {
      hover: true,
      tooltipDelay: 100,
      dragNodes: true,
    },
    groups: {
      film: {
        color: { background: "#ff4444" },
      },
      dizi: {
        color: { background: "#4488ff" },
      },
    },
  };

  network = new vis.Network(container, dataSet, options);
  allNodes.forEach(node => {
    network.body.nodes[node.id].options = {
      ...network.body.nodes[node.id].options,
      title: node.description.slice(0, 200) + '...'
    };
  });

  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const node = allNodes.get(params.nodes[0]);
      titleEl.textContent = node.title;
      descEl.innerHTML = `<strong>Film Özeti:</strong><br>${node.description}`;
      refersEl.innerHTML = `<strong>Göndermeler:</strong><br>${node.refers_to}`;
      infoBox.classList.remove("hidden");
    }
  });

  createSearchBox();
  createLegendBox();
  createUniverseTabs();
  showUniverseSelectorModal();
});

function showUniverseSelectorModal() {
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = "100vw";
  modal.style.height = "100vh";
  modal.style.backgroundColor = "rgba(0,0,0,0.85)";
  modal.style.zIndex = 999;
  modal.style.display = "flex";
  modal.style.flexDirection = "column";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.innerHTML = `
    <h2 style="color: white; margin-bottom: 20px; font-size: 1.5rem;">Evren Seçin</h2>
    <div style="display: flex; gap: 20px;">
      <button style="padding: 12px 24px; background: #cc0000; color: white; border: none; font-size: 16px; border-radius: 6px; cursor: pointer;" onclick="selectUniverse('Marvel')">Marvel</button>
      <button style="padding: 12px 24px; background: #0044cc; color: white; border: none; font-size: 16px; border-radius: 6px; cursor: pointer;" onclick="selectUniverse('DC')">DC</button>
      <button style="padding: 12px 24px; background: #444; color: white; border: none; font-size: 16px; border-radius: 6px; cursor: pointer;" onclick="selectUniverse('Hepsi')">Tüm Evrenler</button>
    </div>`;
  document.body.appendChild(modal);
  window.selectUniverse = function (universe) {
    currentUniverse = universe;
    updateBackground(universe);
    allNodes.update(
      allNodes.get().map((n) => ({
        ...n,
        hidden: universe === "Hepsi" ? false : n.universe !== universe,
      }))
    );
    modal.remove();
  };
}

function createLegendBox() {
  const legend = document.createElement("div");
  legend.style.position = "absolute";
  legend.style.bottom = "10px";
  legend.style.left = "10px";
  legend.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  legend.style.padding = "10px 16px";
  legend.style.color = "white";
  legend.style.fontSize = "13px";
  legend.style.border = "1px solid #555";
  legend.style.borderRadius = "6px";
  legend.style.zIndex = "99";
  legend.innerHTML = `
    <div><span style='color:#fff'>⬤</span> Devam</div>
    <div><span style='color:#00ffff'>⬤</span> Evren Geçişi</div>
    <div><span style='color:#ff9900'>⬤</span> Yan Hikâye</div>
  `;
  document.body.appendChild(legend);
}

function closeInfoBox() {
  document.getElementById("info-box").classList.add("hidden");
}

function createSearchBox() {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "🔎 Film veya dizi ara...";
  input.style.position = "absolute";
  input.style.top = "10px";
  input.style.left = "10px";
  input.style.zIndex = "100";
  input.style.padding = "8px 16px";
  input.style.borderRadius = "25px";
  input.style.border = "1px solid #ccc";
  input.style.outline = "none";
  input.style.background = "#111";
  input.style.color = "white";
  input.style.fontSize = "14px";
  input.style.boxShadow = "0 0 6px rgba(255, 255, 255, 0.2)";

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
  document.body.appendChild(input);
}

function createUniverseTabs() {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.right = "10px";
  container.style.zIndex = "100";
  container.style.display = "flex";
  container.style.gap = "6px";

  ["Hepsi", "Marvel", "DC"].forEach((universe) => {
    const btn = document.createElement("button");
    btn.textContent = universe;
    btn.style.padding = "6px 12px";
    btn.style.backgroundColor = "#222";
    btn.style.color = "#fff";
    btn.style.border = "1px solid #555";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";
    btn.onclick = () => {
      currentUniverse = universe;
      updateBackground(universe);
      allNodes.update(
        allNodes.get().map((n) => ({
          ...n,
          hidden: universe === "Hepsi" ? false : n.universe !== universe,
        }))
      );
    };
    container.appendChild(btn);
  });

  document.body.appendChild(container);
}
