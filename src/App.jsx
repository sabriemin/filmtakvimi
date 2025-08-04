
import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import NetworkCanvas from './components/NetworkCanvas'

export default function App() {
  const [selectedUniverse, setSelectedUniverse] = useState('marvel')
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

  useEffect(() => {
    fetch(`/evren/data/${selectedUniverse}.json`)
      .then(res => res.json())
      .then(data => {
        setNodes(data.nodes)
        setEdges(data.edges)
      })
      .catch(err => console.error('Veri yükleme hatası:', err))
  }, [selectedUniverse])

  return (
    <div className="min-h-screen flex flex-col bg-background text-white">
      <Header />
      <FilterBar selected={selectedUniverse} setSelected={setSelectedUniverse} />
      <main className="p-4 flex-grow overflow-hidden">
        <NetworkCanvas nodes={nodes} edges={edges} />
      </main>
    </div>
  )
}
