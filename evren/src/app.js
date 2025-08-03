function app() {
  return {
    isDarkMode: false,
    modalOpen: false,
    timelineMode: false,
    init() {
      initTheme();
      initModal();
      initFilters();
      initTimeline();
      initNetwork();
    }
  }
}