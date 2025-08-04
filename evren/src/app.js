import { setupNetwork } from './network.js';
import { applyFilters, initFilters } from './filters.js';

export function app() {
  return {
    network: null,
    allNodes: [],
    allEdges: [],
    nodes: null,
    edges: null,
    filteredNodes: [],
    filteredEdges: [],
    search: '',
    selectedUniverse: '',
    selectedEdgeType: '',
    maxYear: new Date().getFullYear(),
    timelineMode: false,
    modalOpen: false,
    modalNode: null,
    universeList: [],
    edgeTypeList: [],
    isDarkMode: false,
    lang: 'tr',

    edgeColors: {
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
    },

    init() {
      this.loadData();
      this.isDarkMode = localStorage.getItem('darkMode') === 'true';
      this.lang = localStorage.getItem('lang') || 'tr';
      initFilters(this);
    },

    async loadData() {
      const evrenler = [
        "avatar_last_airbender",
        "avatar_pandora",
        "dc",
        "harrypotter",
        "marvel",
        "matrix",
        "middleearth",
        "pixar",
        "starwars"
      ];
      let nodesTemp = [];
      let edgesTemp = [];
      for (const evren of evrenler) {
        const res = await fetch('data/' + evren + '.json');
        const data = await res.json();
        nodesTemp = nodesTemp.concat(data.nodes.map(n => ({...n, universe: evren})));
        edgesTemp = edgesTemp.concat(data.edges);
      }
      this.allNodes = nodesTemp;
      this.allEdges = edgesTemp;

      this.universeList = [...new Set(this.allNodes.map(n => n.universe))];
      this.edgeTypeList = [...new Set(this.allEdges.map(e => e.type))].filter(t => t);

      this.network = setupNetwork(this);
      applyFilters(this);
    },

    toggleTimeline() {
      this.timelineMode = !this.timelineMode;
      applyFilters(this);
    },

    toggleTheme() {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('darkMode', this.isDarkMode);
    },

    formatUniverseName(name) {
      const map = {
        "avatar_last_airbender": "Avatar: Son Hava Bükücü",
        "avatar_pandora": "Avatar (Pandora)",
        "dc": "DC",
        "marvel": "Marvel",
        "harrypotter": "Harry Potter",
        "matrix": "Matrix",
        "middleearth": "Orta Dünya",
        "pixar": "Pixar",
        "starwars": "Star Wars"
      };
      return map[name] || name;
    }
  }
}

window.app = app;
