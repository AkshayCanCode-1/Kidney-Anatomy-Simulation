import { Html, Line } from "@react-three/drei";
import { interactivePartIds, kidneyParts } from "../data/kidneyAnatomyData.js";

const mainLabelIds = Object.values(kidneyParts)
  .filter((part) => part.mainLabel)
  .map((part) => part.id);

function resolvePartPosition(part, activeSide) {
  if (!part.internal || activeSide !== "right") return part.labelPosition;
  return [Math.abs(part.labelPosition[0]), part.labelPosition[1], part.labelPosition[2]];
}

function resolveLabelOffset(part, isSelected, activeSide) {
  const offset = isSelected
    ? (part.selectedLabelOffset ?? part.labelOffset ?? [0.3, 0.12, 0])
    : (part.labelOffset ?? [0.3, 0.12, 0]);
  if (!part.internal || activeSide !== "right") return offset;
  return [Math.abs(offset[0]), offset[1], offset[2] ?? 0];
}

function lineEndForLabel(labelOffset, isSelected) {
  const lineReach = isSelected ? 0.97 : 0.9;
  return [
    labelOffset[0] * lineReach,
    labelOffset[1] * lineReach,
    (labelOffset[2] ?? 0) * lineReach,
  ];
}

export default function AnatomyLabels({
  labelsVisible,
  selectedLabelVisible,
  selectedPartId,
  activeSide,
  onSelectPart,
  language = "en",
}) {
  return (
    <>
      {interactivePartIds.map((partId) => {
        const part = kidneyParts[partId];
        const isSelected = selectedPartId === part.id;
        const showSelectedLabel =
          (labelsVisible || selectedLabelVisible) && Boolean(selectedPartId) && isSelected;
        const showSmallLabel =
          labelsVisible && !isSelected && mainLabelIds.includes(part.id);
        const showText = showSelectedLabel || showSmallLabel;
        const labelOffset = resolveLabelOffset(part, isSelected, activeSide);
        const connectorEnd = lineEndForLabel(labelOffset, isSelected);
        const partPosition = resolvePartPosition(part, activeSide);
        const clickSide = part.side ?? (part.internal ? activeSide : null);
        const connectorColor = isSelected ? part.color : "#475569";

        return (
          <group key={part.id} position={partPosition}>
            <mesh
              onClick={(event) => {
                event.stopPropagation();
                onSelectPart(part.id, clickSide);
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "";
              }}
            >
              <sphereGeometry args={[part.markerSize, 24, 24]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {showText && (
              <>
                <Line
                  points={[
                    [0, 0, 0],
                    connectorEnd,
                  ]}
                  color={connectorColor}
                  lineWidth={isSelected ? 1.6 : 1.2}
                  transparent
                  opacity={isSelected ? 0.95 : 0.75}
                  depthTest={true}
                />
                <Html
                  center
                  distanceFactor={8}
                  position={labelOffset}
                  zIndexRange={[20, 0]}
                >
                  <div
                    className={`anatomy-label pointer-events-none whitespace-nowrap backdrop-blur-sm ${isSelected ? 'selected' : 'opacity-85'}`}
                    style={{ 
                      borderColor: isSelected ? part.color : "rgba(15, 23, 42, 0.12)",
                      '--part-color': part.color 
                    }}
                  >
                    {language === "ta" && part.ta?.shortLabel ? part.ta.shortLabel : part.shortLabel}
                  </div>
                </Html>
              </>
            )}
          </group>
        );
      })}
    </>
  );
}
