// src/app.js
import { setupNetwork } from './network.js';
import { applyFiltersFactory } from './filters.js';
import { toggleTimelineFactory } from './timeline.js';
import { toggleThemeFactory } from './theme.js';
import { edgeColors, formatUniverseName } from './utils.js';

function createApp() {
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
    edgeColors,

    init() {
      this.loadData();
      this.isDarkMode = localStorage.getItem('darkMode') === 'true';
      this.lang = localStorage.getItem('lang') || 'tr';

      let debounceTimeout = null;
      this.$watch('search', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          this.applyFilters();
        }, 300);
      });

      this.$watch('selectedUniverse', () => this.applyFilters());
      this.$watch('selectedEdgeType', () => this.applyFilters());
      this.$watch('maxYear', () => this.applyFilters());
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

      setupNetwork(this);
      this.applyFilters();
    },

    applyFilters: null,
    toggleTimeline: null,
    toggleTheme: null,
    formatUniverseName
  };
}

const appObj = createApp();
appObj.applyFilters = applyFiltersFactory(appObj);
appObj.toggleTimeline = toggleTimelineFactory(appObj);
appObj.toggleTheme = toggleThemeFactory(appObj);

Alpine.data('app', () => appObj);
