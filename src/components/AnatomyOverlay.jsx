import { useCallback, useEffect, useRef } from "react";
import { interactivePartIds, kidneyParts } from "../data/kidneyAnatomyData.js";

/* ─── constants ─── */

const mainLabelIds = Object.values(kidneyParts)
  .filter((p) => p.mainLabel)
  .map((p) => p.id);

const LABEL_GAP = 10;          // min vertical gap between labels
const EDGE_PAD_Y = 75;         // top/bottom safe zone
const OFFSET_GAP = 55;         // horizontal gap from anchor to label edge

/* ─── helpers ─── */

/** Resolve vertical overlaps for a column of labels */
function resolveCollisions(labels, containerH) {
  labels.sort((a, b) => a.desiredY - b.desiredY);

  // First pass — position at desired Y, push down if overlapping previous
  for (let i = 0; i < labels.length; i++) {
    if (i === 0) {
      labels[i].y = Math.max(EDGE_PAD_Y, labels[i].desiredY);
    } else {
      const prev = labels[i - 1];
      const minY = prev.y + prev.h + LABEL_GAP;
      labels[i].y = Math.max(minY, labels[i].desiredY);
    }
  }

  // Clamp last label to container bottom
  for (let i = labels.length - 1; i >= 0; i--) {
    const maxY = containerH - EDGE_PAD_Y - labels[i].h;
    if (labels[i].y > maxY) {
      labels[i].y = Math.max(EDGE_PAD_Y, maxY);
    }
    // Push previous up if needed
    if (i > 0) {
      const curr = labels[i];
      const prev = labels[i - 1];
      const maxPrevY = curr.y - LABEL_GAP - prev.h;
      if (prev.y > maxPrevY) {
        prev.y = Math.max(EDGE_PAD_Y, maxPrevY);
      }
    }
  }
}

/* ─── component ─── */

export default function AnatomyOverlay({
  screenCoordsRef,
  containerRef,
  labelsVisible,
  selectedLabelVisible,
  selectedPartId,
  activeSide,
  onSelectPart,
  language = "en",
}) {
  const labelRefs = useRef({});
  const pathRefs = useRef({});
  const rafId = useRef(null);

  // ── Build visible parts list (used for React state checks) ──
  const getVisibleParts = useCallback(() => {
    const parts = [];
    for (const partId of interactivePartIds) {
      const part = kidneyParts[partId];
      const isSelected = selectedPartId === partId;
      const showSelected =
        (labelsVisible || selectedLabelVisible) && Boolean(selectedPartId) && isSelected;
      const showSmall = labelsVisible && !isSelected && mainLabelIds.includes(partId);

      if (showSelected || showSmall) {
        parts.push({ partId, part, isSelected });
      }
    }
    return parts;
  }, [labelsVisible, selectedLabelVisible, selectedPartId]);

  // ── frame loop to sync overlay elements with camera ──
  useEffect(() => {
    let running = true;

    function tick() {
      if (!running) return;

      const coords = screenCoordsRef?.current;
      const container = containerRef?.current;
      if (!coords || !container) {
        rafId.current = requestAnimationFrame(tick);
        return;
      }

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const centerX = cw / 2;

      const leftLabels = [];
      const rightLabels = [];
      const processedPartIds = new Set();

      for (const partId of interactivePartIds) {
        const part = kidneyParts[partId];
        const isSelected = selectedPartId === partId;
        const showSelected =
          (labelsVisible || selectedLabelVisible) && Boolean(selectedPartId) && isSelected;
        const showSmall = labelsVisible && !isSelected && mainLabelIds.includes(partId);

        const sc = coords[partId];
        const labelEl = labelRefs.current[partId];
        const pathEl = pathRefs.current[partId];

        // Hide inactive/invisible labels
        if (!sc || !sc.visible || !(showSelected || showSmall)) {
          if (labelEl) {
            labelEl.style.opacity = "0";
            labelEl.style.pointerEvents = "none";
          }
          if (pathEl) {
            pathEl.style.strokeOpacity = "0";
          }
          continue;
        }

        processedPartIds.add(partId);

        const lw = labelEl?.offsetWidth ?? 130;
        const lh = labelEl?.offsetHeight ?? 36;
        const isLeftSide = sc.x < centerX;

        const entry = {
          partId,
          anchorX: sc.x,
          anchorY: sc.y,
          w: lw,
          h: lh,
          desiredY: sc.y - lh / 2, // vertically centered on anchor
          y: 0,                     // will be set by resolveCollisions
          isSelected,
          isLeftSide,
          occluded: sc.occluded,
        };

        if (isLeftSide) {
          // Place label to the left of the anchor
          entry.labelX = Math.max(15, sc.x - lw - OFFSET_GAP);
          leftLabels.push(entry);
        } else {
          // Place label to the right of the anchor
          entry.labelX = Math.min(cw - 15 - lw, sc.x + OFFSET_GAP);
          rightLabels.push(entry);
        }
      }

      // Resolve vertical collisions to prevent overlapping labels
      resolveCollisions(leftLabels, ch);
      resolveCollisions(rightLabels, ch);

      // Apply changes directly to DOM nodes
      for (const entry of [...leftLabels, ...rightLabels]) {
        const labelEl = labelRefs.current[entry.partId];
        const pathEl = pathRefs.current[entry.partId];
        if (!labelEl || !pathEl) continue;

        // GPU-accelerated direct coordinate translation
        labelEl.style.transform = `translate3d(${entry.labelX}px, ${entry.y}px, 0)`;
        
        // Update label card opacity based on occlusion
        labelEl.style.opacity = entry.occluded ? "0.22" : "1";
        labelEl.style.pointerEvents = entry.occluded && !entry.isSelected ? "none" : "auto";

        // Dynamic docking: attach connection line directly to the nearest edge of the label box
        let dockX = entry.labelX;
        let dockY = entry.y + entry.h / 2;

        if (entry.anchorX < entry.labelX) {
          dockX = entry.labelX;
        } else if (entry.anchorX > entry.labelX + entry.w) {
          dockX = entry.labelX + entry.w;
        } else {
          if (Math.abs(entry.anchorX - entry.labelX) < Math.abs(entry.anchorX - (entry.labelX + entry.w))) {
            dockX = entry.labelX;
          } else {
            dockX = entry.labelX + entry.w;
          }
        }

        // Draw direct straight line path
        pathEl.setAttribute("d", `M ${entry.anchorX} ${entry.anchorY} L ${dockX} ${dockY}`);
        
        // Hide connector lines completely if the part is occluded to avoid lines piercing the 3D geometry
        const lineOpacity = entry.occluded ? 0 : (entry.isSelected ? 1.0 : 0.65);
        pathEl.style.strokeOpacity = String(lineOpacity);
        pathEl.style.strokeWidth = entry.isSelected ? "3px" : "1.8px";
      }

      rafId.current = requestAnimationFrame(tick);
    }

    rafId.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [screenCoordsRef, containerRef, getVisibleParts, selectedPartId, labelsVisible, selectedLabelVisible]);

  return (
    <>
      {/* SVG connector overlay */}
      <svg
        className="anatomy-svg-overlay"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 5,
          overflow: "visible",
        }}
      >
        {interactivePartIds.map((partId) => {
          const part = kidneyParts[partId];
          return (
            <path
              key={partId}
              ref={(el) => {
                if (el) pathRefs.current[partId] = el;
              }}
              fill="none"
              stroke={part.color}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{
                strokeOpacity: 0, // initially hidden
                transition: "stroke-opacity 0.25s ease, stroke 0.25s ease, stroke-width 0.25s ease",
              }}
            />
          );
        })}
      </svg>

      {/* HTML label cards */}
      <div
        className="anatomy-labels-overlay"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 6,
          overflow: "hidden",
        }}
      >
        {interactivePartIds.map((partId) => {
          const part = kidneyParts[partId];
          const isSelected = selectedPartId === partId;

          const labelText =
            language === "ta" && part.ta?.shortLabel
              ? part.ta.shortLabel
              : part.shortLabel;

          const clickSide = part.side ?? (part.internal ? activeSide : null);

          return (
            <div
              key={partId}
              ref={(el) => {
                if (el) labelRefs.current[partId] = el;
              }}
              className={`anatomy-label ${isSelected ? "selected" : ""}`}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                opacity: 0, // initially hidden
                pointerEvents: "none",
                borderColor: isSelected ? part.color : undefined,
                "--part-color": part.color,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transform: "translate3d(-9999px, -9999px, 0)", // initially offscreen
              }}
              onClick={() => onSelectPart(partId, clickSide)}
            >
              {labelText}
            </div>
          );
        })}
      </div>
    </>
  );
}
