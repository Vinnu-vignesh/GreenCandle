import { useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────
// Fibonacci levels
// ─────────────────────────────────────────────
const FIB_LEVELS     = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_FAN_ANGLES = [0.236, 0.382, 0.5, 0.618, 0.786];
const FIB_COLORS = {
  0:     '#ffffff',
  0.236: '#ef4444',
  0.382: '#f97316',
  0.5:   '#fbbf24',
  0.618: '#22c55e',
  0.786: '#3b82f6',
  1:     '#a855f7',
};

// ─────────────────────────────────────────────
// Coord helpers
// ─────────────────────────────────────────────
function getChartCoords(chart, series) {
  // Returns functions to convert between canvas-px and chart price/time
  const toCanvasX = (logicalIndex) => {
    try { return chart.timeScale().logicalToCoordinate(logicalIndex); } catch { return null; }
  };
  const toCanvasY = (price) => {
    try { return series.priceToCoordinate(price); } catch { return null; }
  };
  const toLogical = (x) => {
    try { return chart.timeScale().coordinateToLogical(x); } catch { return null; }
  };
  const toPrice   = (y) => {
    try { return series.coordinateToPrice(y); } catch { return null; }
  };
  return { toCanvasX, toCanvasY, toLogical, toPrice };
}

// Is point near line segment?
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function DrawingToolsCanvas({
  chartRef,
  seriesRef,
  containerRef,
  activeTool,
  setActiveTool,
  drawings,
  setDrawings,
}) {
  const canvasRef     = useRef(null);
  const drawingRef    = useRef(null);   // current in-progress drawing
  const isDrawingRef  = useRef(false);
  const hoverIdxRef   = useRef(-1);
  const selectedIdxRef = useRef(-1);

  // ── Convert pixel pos relative to canvas ──
  const relPos = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // ─────────────────────────────────────────
  // RENDER ENGINE
  // ─────────────────────────────────────────
  const render = useCallback(() => {
    const canvas  = canvasRef.current;
    const chart   = chartRef.current;
    const series  = seriesRef.current;
    if (!canvas || !chart || !series) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { toCanvasX, toCanvasY } = getChartCoords(chart, series);

    const drawList = [...drawings];
    if (drawingRef.current) drawList.push(drawingRef.current);

    drawList.forEach((d, idx) => {
      const isHovered  = hoverIdxRef.current  === idx && idx < drawings.length;
      const isSelected = selectedIdxRef.current === idx && idx < drawings.length;

      const x1 = toCanvasX(d.lx1);
      const y1 = toCanvasY(d.py1);
      const x2 = d.lx2 != null ? toCanvasX(d.lx2) : null;
      const y2 = d.py2 != null ? toCanvasY(d.py2) : null;

      if (x1 == null) return;

      const color   = isSelected ? '#60a5fa' : isHovered ? '#93c5fd' : (d.color || '#facc15');
      const lw      = isSelected || isHovered ? 2 : 1.5;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth   = lw;
      ctx.setLineDash([]);
      ctx.font        = '11px Inter, sans-serif';
      ctx.textBaseline = 'middle';

      switch (d.type) {
        // ── Trend Line ──
        case 'line': {
          if (x2 == null) break;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          break;
        }

        // ── Ray (extends from p1 through p2 to canvas edge) ──
        case 'ray': {
          if (x2 == null) break;
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.max(canvas.width, canvas.height) * 3;
          const mag = Math.hypot(dx, dy) || 1;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 + (dx / mag) * len, y1 + (dy / mag) * len);
          ctx.stroke();
          break;
        }

        // ── Extended Line (both directions) ──
        case 'extline': {
          if (x2 == null) break;
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.max(canvas.width, canvas.height) * 3;
          const mag = Math.hypot(dx, dy) || 1;
          ctx.beginPath();
          ctx.moveTo(x1 - (dx / mag) * len, y1 - (dy / mag) * len);
          ctx.lineTo(x1 + (dx / mag) * len, y1 + (dy / mag) * len);
          ctx.stroke();
          break;
        }

        // ── Horizontal Line ──
        case 'hline': {
          ctx.beginPath();
          ctx.moveTo(0, y1);
          ctx.lineTo(canvas.width, y1);
          ctx.stroke();
          // Label
          ctx.fillStyle = color;
          ctx.fillText(`${d.py1.toFixed(2)}`, 6, y1 - 8);
          break;
        }

        // ── Vertical Line ──
        case 'vline': {
          ctx.beginPath();
          ctx.moveTo(x1, 0);
          ctx.lineTo(x1, canvas.height);
          ctx.stroke();
          break;
        }

        // ── Rectangle ──
        case 'rect': {
          if (x2 == null) break;
          ctx.fillStyle = color + '18';
          ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          break;
        }

        // ── Circle / Ellipse ──
        case 'circle': {
          if (x2 == null) break;
          const rx = Math.abs(x2 - x1) / 2;
          const ry = Math.abs(y2 - y1) / 2;
          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2;
          ctx.fillStyle   = color + '18';
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        }

        // ── Fibonacci Retracement ──
        case 'fib': {
          if (x2 == null) break;
          const priceRange = d.py2 - d.py1;
          FIB_LEVELS.forEach(level => {
            const price = d.py1 + priceRange * level;
            const cy    = toCanvasY(price);
            if (cy == null) return;
            const fibColor = FIB_COLORS[level] || '#fff';
            ctx.strokeStyle = fibColor;
            ctx.lineWidth   = level === 0 || level === 1 ? 1.5 : 1;
            ctx.setLineDash(level === 0 || level === 1 ? [] : [4, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, cy);
            ctx.lineTo(x2, cy);
            ctx.stroke();
            // Label
            ctx.fillStyle = fibColor;
            ctx.setLineDash([]);
            const label = `${(level * 100).toFixed(1)}%  ${price.toFixed(2)}`;
            ctx.fillText(label, x2 + 6, cy);
          });
          // Draw the two anchor lines
          ctx.strokeStyle = color;
          ctx.lineWidth   = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, y2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x2, y1); ctx.lineTo(x2, y2); ctx.stroke();
          ctx.setLineDash([]);
          break;
        }

        // ── Fibonacci Fan ──
        case 'fibfan': {
          if (x2 == null) break;
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.max(canvas.width, canvas.height) * 2;
          // Base line
          ctx.strokeStyle = color;
          ctx.lineWidth   = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          // Fan lines
          FIB_FAN_ANGLES.forEach(level => {
            const fanDy = dy * level;
            const mag   = Math.hypot(dx, fanDy) || 1;
            const nx    = dx / mag, ny = fanDy / mag;
            const fibColor = FIB_COLORS[level] || '#fff';
            ctx.strokeStyle = fibColor;
            ctx.lineWidth   = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + nx * len, y1 + ny * len);
            ctx.stroke();
            ctx.setLineDash([]);
            // Label near end
            const labelX = x1 + nx * 120;
            const labelY = y1 + ny * 120;
            ctx.fillStyle = fibColor;
            ctx.fillText(`${(level * 100).toFixed(1)}%`, labelX + 4, labelY);
          });
          break;
        }

        // ── Andrews Pitchfork ──
        case 'pitchfork': {
          if (!d.lx3) break;
          const x3 = toCanvasX(d.lx3);
          const y3 = toCanvasY(d.py3);
          if (x3 == null) break;
          // Midpoint of P2-P3
          const midX = (x2 + x3) / 2;
          const midY = (y2 + y3) / 2;
          // Median line: P1 → midpoint
          const dx = midX - x1, dy = midY - y1;
          const scale = 3;
          ctx.strokeStyle = color;
          ctx.lineWidth   = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 + dx * scale, y1 + dy * scale);
          ctx.stroke();
          // Upper prong: parallel from P2
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 + dx * scale, y2 + dy * scale);
          ctx.stroke();
          // Lower prong: parallel from P3
          ctx.beginPath();
          ctx.moveTo(x3, y3);
          ctx.lineTo(x3 + dx * scale, y3 + dy * scale);
          ctx.stroke();
          ctx.setLineDash([]);
          // Handles
          [{ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x3, y: y3 }].forEach(pt => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fill();
          });
          break;
        }

        // ── Text Annotation ──
        case 'text': {
          ctx.fillStyle   = color;
          ctx.font        = 'bold 13px Inter, sans-serif';
          ctx.fillText(d.text || 'Note', x1, y1);
          // Border box
          const tw = ctx.measureText(d.text || 'Note').width;
          ctx.strokeStyle = color + '55';
          ctx.lineWidth   = 1;
          ctx.strokeRect(x1 - 3, y1 - 13, tw + 6, 18);
          break;
        }

        default: break;
      }

      ctx.restore();

      // Draw handle dots on selected
      if ((isSelected || isHovered) && idx < drawings.length) {
        const handles = getHandles(d, toCanvasX, toCanvasY);
        handles.forEach(h => {
          ctx.save();
          ctx.fillStyle   = '#3b82f6';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth   = 1.5;
          ctx.beginPath();
          ctx.arc(h.x, h.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });
      }
    });
  }, [drawings]);

  // ─────────────────────────────────────────
  // Handle dots for drag-resizing (future)
  // ─────────────────────────────────────────
  function getHandles(d, toCanvasX, toCanvasY) {
    const h = [];
    const x1 = toCanvasX(d.lx1), y1 = toCanvasY(d.py1);
    if (x1 != null) h.push({ x: x1, y: y1 });
    if (d.lx2 != null) {
      const x2 = toCanvasX(d.lx2), y2 = toCanvasY(d.py2);
      if (x2 != null) h.push({ x: x2, y: y2 });
    }
    if (d.lx3 != null) {
      const x3 = toCanvasX(d.lx3), y3 = toCanvasY(d.py3);
      if (x3 != null) h.push({ x: x3, y: y3 });
    }
    return h;
  }

  // ─────────────────────────────────────────
  // HIT TEST — find drawing under cursor
  // ─────────────────────────────────────────
  const hitTest = useCallback((px, py) => {
    const chart  = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return -1;
    const { toCanvasX, toCanvasY } = getChartCoords(chart, series);
    const canvas = canvasRef.current;

    for (let i = drawings.length - 1; i >= 0; i--) {
      const d  = drawings[i];
      const x1 = toCanvasX(d.lx1), y1 = toCanvasY(d.py1);
      if (x1 == null) continue;
      const x2 = d.lx2 != null ? toCanvasX(d.lx2) : null;
      const y2 = d.py2 != null ? toCanvasY(d.py2) : null;

      const THRESH = 8;

      switch (d.type) {
        case 'hline':
          if (Math.abs(py - y1) < THRESH) return i;
          break;
        case 'vline':
          if (Math.abs(px - x1) < THRESH) return i;
          break;
        case 'line':
        case 'ray':
        case 'extline':
          if (x2 != null && distToSegment(px, py, x1, y1, x2, y2) < THRESH) return i;
          break;
        case 'rect':
        case 'circle':
        case 'fib':
        case 'fibfan':
          if (x2 != null) {
            const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
            if (px >= minX - THRESH && px <= maxX + THRESH && py >= minY - THRESH && py <= maxY + THRESH) return i;
          }
          break;
        case 'text':
          if (Math.abs(px - x1) < 60 && Math.abs(py - y1) < 14) return i;
          break;
        case 'pitchfork': {
          if (x2 != null) {
            const midX = (x2 + (toCanvasX(d.lx3) || x2)) / 2;
            const midY = (y2 + (toCanvasY(d.py3) || y2)) / 2;
            if (distToSegment(px, py, x1, y1, midX, midY) < THRESH) return i;
          }
          break;
        }
        default: break;
      }
    }
    return -1;
  }, [drawings, chartRef, seriesRef]);

  // ─────────────────────────────────────────
  // MOUSE EVENTS
  // ─────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (!activeTool) return;
    e.preventDefault();
    e.stopPropagation();

    const chart  = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const { x, y }       = relPos(e);
    const { toLogical, toPrice } = getChartCoords(chart, series);
    const lx = toLogical(x);
    const py = toPrice(y);
    if (lx == null || py == null) return;

    // Delete tool
    if (activeTool === 'delete') {
      const idx = hitTest(x, y);
      if (idx >= 0) {
        setDrawings(prev => prev.filter((_, i) => i !== idx));
        selectedIdxRef.current = -1;
      }
      return;
    }

    // Cursor / select mode
    if (activeTool === 'cursor') {
      const idx = hitTest(x, y);
      selectedIdxRef.current = idx;
      render();
      return;
    }

    // Instant single-click tools
    if (activeTool === 'hline') {
      setDrawings(prev => [...prev, { type: 'hline', lx1: lx, py1: py, color: '#facc15' }]);
      render();
      return;
    }
    if (activeTool === 'vline') {
      setDrawings(prev => [...prev, { type: 'vline', lx1: lx, py1: py, color: '#facc15' }]);
      render();
      return;
    }
    if (activeTool === 'text') {
      const text = window.prompt('Enter annotation text:', 'Note');
      if (text) setDrawings(prev => [...prev, { type: 'text', lx1: lx, py1: py, text, color: '#facc15' }]);
      return;
    }

    // Pitchfork — needs 3 points, handled in stages
    if (activeTool === 'pitchfork') {
      // If mid-draw with 2 points, add 3rd to complete
      if (drawingRef.current?.type === 'pitchfork' && drawingRef.current.lx2 != null && drawingRef.current.lx3 == null) {
        drawingRef.current.lx3 = lx;
        drawingRef.current.py3 = py;
        setDrawings(prev => [...prev, { ...drawingRef.current }]);
        drawingRef.current = null;
        isDrawingRef.current = false;
        return;
      }
      if (drawingRef.current?.type === 'pitchfork' && drawingRef.current.lx3 != null) {
        // Already done, reset
        drawingRef.current = null;
      }
    }

    // Start two-point drawing
    isDrawingRef.current = true;
    drawingRef.current = {
      type: activeTool,
      lx1: lx, py1: py,
      lx2: lx, py2: py,
      color: '#facc15',
    };
  }, [activeTool, hitTest, render, setDrawings, chartRef, seriesRef]);

  const handleMouseMove = useCallback((e) => {
    const chart  = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const { x, y }            = relPos(e);
    const { toLogical, toPrice } = getChartCoords(chart, series);
    const lx = toLogical(x);
    const py = toPrice(y);

    // Update hover
    if (!isDrawingRef.current && activeTool === 'cursor') {
      hoverIdxRef.current = hitTest(x, y);
    }

    if (!isDrawingRef.current || !drawingRef.current) {
      render();
      return;
    }

    if (lx == null || py == null) return;

    // For pitchfork stage 2 (p1+p2 placed, moving toward p3)
    if (drawingRef.current.type === 'pitchfork' && drawingRef.current.lx3 == null) {
      if (drawingRef.current.lx2 != null) {
        // preview p3 position
        drawingRef.current.lx3 = lx;
        drawingRef.current.py3 = py;
        drawingRef.current.lx3 = null; // don't commit yet, just show preview via py3
      }
    }

    drawingRef.current.lx2 = lx;
    drawingRef.current.py2 = py;
    render();
  }, [activeTool, hitTest, render, chartRef, seriesRef]);

  const handleMouseUp = useCallback((e) => {
    if (!isDrawingRef.current || !drawingRef.current) return;
    isDrawingRef.current = false;

    const d = drawingRef.current;

    // Pitchfork needs 3 clicks; keep drawing state for 3rd click
    if (d.type === 'pitchfork') {
      // Store p1+p2, wait for p3 click
      drawingRef.current = { ...d, lx3: null, py3: null };
      return;
    }

    // Discard trivial drawings
    const { x, y } = relPos(e);
    const chart  = chartRef.current;
    const series = seriesRef.current;
    if (chart && series) {
      const { toCanvasX, toCanvasY } = getChartCoords(chart, series);
      const x1 = toCanvasX(d.lx1), y1 = toCanvasY(d.py1);
      const x2 = toCanvasX(d.lx2), y2 = toCanvasY(d.py2);
      if (x1 != null && x2 != null && Math.hypot(x2 - x1, y2 - y1) < 5) {
        drawingRef.current = null;
        render();
        return;
      }
    }

    setDrawings(prev => [...prev, { ...d }]);
    drawingRef.current = null;
    render();
  }, [render, setDrawings, chartRef, seriesRef]);

  // ─────────────────────────────────────────
  // Keyboard: Escape, Delete, Ctrl+Z
  // ─────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        drawingRef.current   = null;
        isDrawingRef.current = false;
        selectedIdxRef.current = -1;
        setActiveTool(null);
        render();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const idx = selectedIdxRef.current;
        if (idx >= 0) {
          setDrawings(prev => prev.filter((_, i) => i !== idx));
          selectedIdxRef.current = -1;
          render();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        setDrawings(prev => {
          if (prev.length === 0) return prev;
          return prev.slice(0, -1);
        });
        render();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setActiveTool, setDrawings, render]);

  // ─────────────────────────────────────────
  // Sync canvas size to container
  // ─────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
      render();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef, render]);

  // ─────────────────────────────────────────
  // Redraw on ANY chart scale change
  // (time axis scroll/zoom + price axis rescale)
  // ─────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // 1. Horizontal: time-scale logical range changes
    const unsubTime = chart.timeScale().subscribeVisibleLogicalRangeChange(render);

    // 2. Vertical: lightweight-charts v4 has no direct price-scale-change event,
    //    so we poll via crosshair moves (fires during mouse interaction) AND
    //    a fast RAF loop that checks price range and re-renders if it changed.
    const unsubCross = chart.subscribeCrosshairMove(render);

    // 3. RAF poll — catches y-axis double-click auto-fit & programmatic scale changes
    let lastMin = null, lastMax = null;
    let rafId;
    const poll = () => {
      try {
        const series = seriesRef.current;
        if (series) {
          // coordinateToPrice on top/bottom edges as a proxy for current price range
          const h = canvasRef.current?.height ?? 0;
          const curMin = series.coordinateToPrice(h);
          const curMax = series.coordinateToPrice(0);
          if (curMin !== lastMin || curMax !== lastMax) {
            lastMin = curMin;
            lastMax = curMax;
            render();
          }
        }
      } catch (_) {}
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);

    return () => {
      try { chart.timeScale().unsubscribeVisibleLogicalRangeChange(render); } catch (_) {}
      try { chart.unsubscribeCrosshairMove(render); } catch (_) {}
      cancelAnimationFrame(rafId);
    };
  }, [chartRef, seriesRef, render]);

  // Redraw when drawings change
  useEffect(() => { render(); }, [drawings, render]);

  // ─────────────────────────────────────────
  // Cursor style
  // ─────────────────────────────────────────
  const getCursor = () => {
    if (!activeTool || activeTool === 'cursor') return 'default';
    if (activeTool === 'delete') return 'not-allowed';
    return 'crosshair';
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'absolute',
        inset:         0,
        zIndex:        10,
        pointerEvents: activeTool ? 'all' : 'none',
        cursor:        getCursor(),
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}
