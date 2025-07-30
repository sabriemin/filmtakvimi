console.log("📡 port.js başlatıldı");

const container = document.getElementById("graph-area");

fetch("graph.json")
  .then(response => response.json())
  .then(data => {
    const nodes = new vis.DataSet(data.nodes);
    const edges = new vis.DataSet(data.edges);

    const networkData = {
      nodes: nodes,
      edges: edges,
    };

    const options = {
      nodes: {
        shape: "dot",
        size: 20,
        font: {
          size: 16,
          color: "#333"
        }
      },
      edges: {
        arrows: "to",
        color: "#888",
        smooth: true
      },
      physics: {
        stabilization: true
      }
    };

    new vis.Network(container, networkData, options);
  })
  .catch(error => {
    console.error("Grafik verisi alınamadı:", error);
    container.innerHTML = "<p>Grafik yüklenemedi.</p>";
  });
