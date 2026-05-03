import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PartographEntry } from '@/src/types';
import { format } from 'date-fns';

interface Props {
  entries: PartographEntry[];
}

export default function PartographChart({ entries }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || entries.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 60, bottom: 50, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sorted entries by time
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    const firstEntryTime = new Date(sortedEntries[0].recordedAt);
    
    // X scale: Hours since admission
    const maxHours = Math.max(12, d3.max(sortedEntries, e => 
      (new Date(e.recordedAt).getTime() - firstEntryTime.getTime()) / (1000 * 60 * 60)
    ) || 0) + 2;

    const x = d3.scaleLinear()
      .domain([0, maxHours])
      .range([0, width]);

    // Y scale: Dilation (0-10) and Descent (0-5)
    // Dilation is 0 to 10 (bottom to top)
    // Descent is 5 to 0 (top to bottom) - standard partograph representation
    const y = d3.scaleLinear()
      .domain([0, 10])
      .range([height, 0]);

    // Add Grid
    g.append("g")
      .attr("class", "grid text-slate-100")
      .call(d3.axisBottom(x).ticks(maxHours).tickSize(height).tickFormat(() => ""))
      .call(g => g.select(".domain").remove());

    g.append("g")
      .attr("class", "grid text-slate-100")
      .call(d3.axisLeft(y).ticks(10).tickSize(-width).tickFormat(() => ""))
      .call(g => g.select(".domain").remove());

    // WHO ALERT LINE: Starts at 3cm at hour 0, progresses at 1cm/hr
    const alertLineData = [
      { h: 0, v: 4 },
      { h: 6, v: 10 }
    ];

    const alertLine = d3.line<{h: number, v: number}>()
      .x(d => x(d.h))
      .y(d => y(d.v));

    g.append("path")
      .datum(alertLineData)
      .attr("fill", "none")
      .attr("stroke", "#BA7517")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("d", alertLine);

    g.append("text")
      .attr("x", x(4))
      .attr("y", y(8))
      .attr("fill", "#BA7517")
      .attr("class", "text-[10px] font-bold uppercase tracking-widest")
      .text("Alert Line");

    // WHO ACTION LINE: 4 hours to the right of Alert Line
    const actionLineData = alertLineData.map(d => ({ h: d.h + 4, v: d.v }));
    
    g.append("path")
      .datum(actionLineData)
      .attr("fill", "none")
      .attr("stroke", "#A32D2D")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("d", alertLine);

    g.append("text")
      .attr("x", x(8))
      .attr("y", y(8))
      .attr("fill", "#A32D2D")
      .attr("class", "text-[10px] font-bold uppercase tracking-widest")
      .text("Action Line");

    // Dilation Path (Cervicogram)
    const dilationPath = d3.line<PartographEntry>()
      .x(e => x((new Date(e.recordedAt).getTime() - firstEntryTime.getTime()) / (1000 * 60 * 60)))
      .y(e => y(e.cervicalDilation));

    g.append("path")
      .datum(sortedEntries)
      .attr("fill", "none")
      .attr("stroke", "#0F6E56")
      .attr("stroke-width", 3)
      .attr("d", dilationPath);

    // Dilation Points (Crosses X)
    sortedEntries.forEach(e => {
        const h = (new Date(e.recordedAt).getTime() - firstEntryTime.getTime()) / (1000 * 60 * 60);
        g.append("text")
          .attr("x", x(h))
          .attr("y", y(e.cervicalDilation))
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("fill", "#0F6E56")
          .attr("font-weight", "bold")
          .attr("font-size", "14px")
          .text("X");
    });

    // Descent Path (O)
    // We map 0-5 fifths to 10-0 for visual descent
    const descentPath = d3.line<PartographEntry>()
      .x(e => x((new Date(e.recordedAt).getTime() - firstEntryTime.getTime()) / (1000 * 60 * 60)))
      .y(e => y(10 - (e.fetalHeadDescent * 2)));

    g.append("path")
      .datum(sortedEntries)
      .attr("fill", "none")
      .attr("stroke", "#639922")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "3,3")
      .attr("d", descentPath);

    sortedEntries.forEach(e => {
      const h = (new Date(e.recordedAt).getTime() - firstEntryTime.getTime()) / (1000 * 60 * 60);
      g.append("circle")
        .attr("cx", x(h))
        .attr("cy", y(10 - (e.fetalHeadDescent * 2)))
        .attr("r", 5)
        .attr("fill", "white")
        .attr("stroke", "#639922")
        .attr("stroke-width", 2);
    });

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(maxHours))
      .attr("class", "text-[10px] font-mono");

    g.append("g")
      .call(d3.axisLeft(y).ticks(10))
      .attr("class", "text-[10px] font-mono");

    // Labels
    svg.append("text")
      .attr("x", margin.left + width / 2)
      .attr("y", height + margin.top + 40)
      .attr("text-anchor", "middle")
      .attr("class", "text-[10px] uppercase font-bold text-slate-400 tracking-widest")
      .text("Hours Since Admission");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(margin.top + height / 2))
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("class", "text-[10px] uppercase font-bold text-slate-400 tracking-widest")
      .text("Dilation (cm) / Descent (fifths)");

  }, [entries]);

  return (
    <div className="w-full bg-white bento-card p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="bento-card-title">Cervicogram Trends</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 text-[#0F6E56] font-bold flex items-center justify-center">X</div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Dilation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-[#639922]"></div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Descent</span>
          </div>
        </div>
      </div>
      <svg ref={svgRef} className="w-full min-w-[600px] h-[400px]" />
    </div>
  );
}
