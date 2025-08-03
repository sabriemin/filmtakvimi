import React, { useState } from "react";
import NetworkGraph from "./components/NetworkGraph";
import FilterControls from "./components/FilterControls";
import TimelineToggle from "./components/TimelineToggle";
import InfoModal from "./components/InfoModal";

function App() {
  const [selectedUniverse, setSelectedUniverse] = useState("Hepsi");
  const [searchTerm, setSearchTerm] = useState("");
  const [timelineActive, setTimelineActive] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleUniverseChange = (value) => setSelectedUniverse(value);
  const handleSearch = (value) => setSearchTerm(value.toLowerCase());
  const handleTimelineToggle = () => setTimelineActive((prev) => !prev);

  return (
    <div>
      <div className="ui-top-controls">
        <FilterControls
          universes={[
            "Marvel", "DC", "Pixar", "Star Wars",
            "Avatar: The Last Airbender", "Avatar (Pandora)",
            "Harry Potter", "Middle-earth", "The Matrix"
          ]}
          selected={selectedUniverse}
          onChange={handleUniverseChange}
          onSearch={handleSearch}
        />
        <TimelineToggle active={timelineActive} onToggle={handleTimelineToggle} />
      </div>

      <NetworkGraph
        universe={selectedUniverse}
        search={searchTerm}
        timeline={timelineActive}
        onNodeClick={setSelectedNode}
      />

      <InfoModal node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}

export default App;