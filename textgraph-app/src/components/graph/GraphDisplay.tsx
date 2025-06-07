"use client"; // Graph visualization libraries typically need client-side rendering

import React, { useEffect, useRef, useState } from 'react';
// Import ForceGraphMethods for the ref type
import ForceGraph2D, { GraphData, NodeObject, LinkObject, ForceGraphMethods } from 'react-force-graph-2d';

export interface GraphNode extends NodeObject {
  id: string;
  label?: string;
  type?: string;
}

export interface GraphLink extends LinkObject {
  id?: string;
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
}

export interface GraphDisplayProps {
  nodes: GraphNode[];
  edges: GraphLink[];
  width?: number;
  height?: number;
}

const GraphDisplay: React.FC<GraphDisplayProps> = ({ nodes, edges, width, height }) => {
  // Use ForceGraphMethods for the ref type
  const graphRef = useRef<ForceGraphMethods>();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const links = edges.map(edge => ({
      ...edge,
      source: typeof edge.source === 'object' && edge.source !== null && 'id' in edge.source ? (edge.source as GraphNode).id : edge.source,
      target: typeof edge.target === 'object' && edge.target !== null && 'id' in edge.target ? (edge.target as GraphNode).id : edge.target,
    }));
    setGraphData({ nodes, links });
  }, [nodes, edges]);

  useEffect(() => {
    if (width === undefined || height === undefined) {
      const handleResize = () => {
        const parent = graphRef.current?.closestDiv; // This is hypothetical from react-force-graph docs
        if (parent) {
          setContainerSize({ width: parent.offsetWidth, height: parent.offsetHeight });
        } else if (typeof window !== "undefined") {
          setContainerSize({ width: window.innerWidth * 0.8, height: window.innerHeight * 0.7 });
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      setContainerSize({ width, height });
    }
  }, [width, height]);

  if (!nodes || !edges) {
    return <p>Loading graph data...</p>;
  }

  if (nodes.length === 0) {
    return <p>No data to display in the graph.</p>;
  }

  return (
    <div style={{ border: '1px solid #ccc', width: containerSize.width, height: containerSize.height }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeId="id"
        nodeLabel="label"
        nodeAutoColorBy="type"
        linkSource="source"
        linkTarget="target"
        linkLabel="label"
        width={containerSize.width}
        height={containerSize.height}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.label || '';
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(node.x! - bckgDimensions[0] / 2, node.y! - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = node.color || 'rgba(0,0,0,1)';
          ctx.fillText(label, node.x!, node.y!);

          node.__bckgDimensions = bckgDimensions;
        }}
      />
    </div>
  );
};

export default GraphDisplay;
