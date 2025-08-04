
import React, { useEffect, useRef } from 'react'
import { Network } from 'vis-network/standalone'

export default function NetworkCanvas({ nodes, edges }) {
  const containerRef = useRef(null)
  const networkRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const data = { nodes, edges }

    const options = {
      nodes: {
        shape: 'dot',
        size: 16,
        font: { color: 'white' },
        color: { background: '#f87171', border: '#ef4444' }
      },
      edges: {
        color: '#ffffff88',
        arrows: 'to'
      },
      physics: {
        stabilization: true
      }
    }

    networkRef.current = new Network(containerRef.current, data, options)
  }, [nodes, edges])

  return (
    <div ref={containerRef} className="h-[600px] w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur" />
  )
}
