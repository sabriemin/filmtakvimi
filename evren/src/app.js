
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
      "devam": "#2980b9"
    },

    init() {
      this.loadData();
      this.isDarkMode = true;
      initFilters(this);
    },

    async loadData() {
      const res = await fetch('data/marvel.json');
      const data = await res.json();
      this.allNodes = data.nodes;
      this.allEdges = data.edges;
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
    },

    formatUniverseName(name) {
      return name;
    }
  }
}

window.app = app;
