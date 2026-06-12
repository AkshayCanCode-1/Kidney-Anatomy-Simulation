import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import AnatomyLabels from "./AnatomyLabels.jsx";
import { interactivePartIds, kidneyParts, translations } from "../data/kidneyAnatomyData.js";
import { matchMeshToAnatomy } from "../data/kidneyMeshMap.js";

const MODEL_URL = "/models/kidney.glb";
const cameraViews = {
  full: {
    position: [0, 0.38, 5.75],
    target: [0, -0.12, 0],
  },
  leftKidney: {
    position: [-1.45, 0.62, 2.05],
    target: [-0.78, 0.42, 0.08],
  },
  rightKidney: {
    position: [1.45, 0.62, 2.05],
    target: [0.78, 0.4, 0.08],
  },
  bladder: {
    position: [0, -1.1, 2.45],
    target: [0, -1.34, 0.08],
  },
};

const PART_PRIORITY = [
  "cortex",
  "medulla",
  "leftUreter",
  "rightUreter",
  "renalArtery",
  "renalVein",
  "urinaryBladder",
  "leftKidney",
  "rightKidney",
];

function normalizeText(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function matchPartIdFromText(value) {
  const text = normalizeText(value);
  if (!text) return null;

  for (const partId of PART_PRIORITY) {
    const part = kidneyParts[partId];
    if (part.keywords.some((keyword) => text.includes(normalizeText(keyword)))) {
      return partId;
    }
  }

  return null;
}

function identifyAnatomyFromObject(object) {
  const names = [];
  let current = object;

  while (current) {
    if (current.name) names.push(current.name);
    if (current.material?.name) names.push(current.material.name);
    if (Array.isArray(current.material)) {
      current.material.forEach((material) => material?.name && names.push(material.name));
    }
    if (current.geometry?.name) names.push(current.geometry.name);
    current = current.parent;
  }

  const nameText = names.join(" ");
  const meshMatch = matchMeshToAnatomy(nameText);
  if (meshMatch.partId) return meshMatch;

  return { partId: matchPartIdFromText(nameText), side: null };
}

function nearestMarkerMatch(point) {
  if (!point) return { partId: null, side: null };

  let nearestPart = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  const clickPoint = new THREE.Vector3(point.x, point.y, point.z);

  interactivePartIds.forEach((partId) => {
    const part = kidneyParts[partId];
    const markerPoint = new THREE.Vector3(...part.labelPosition);
    const distance = clickPoint.distanceTo(markerPoint);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPart = part;
    }
  });

  return nearestDistance < 0.72 && nearestPart
    ? { partId: nearestPart.id, side: nearestPart.side ?? null }
    : { partId: null, side: null };
}

function cloneAndStoreMaterial(mesh) {
  if (mesh.userData.kidneyBaseMaterials) return;

  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const cloned = materials.map((material) => material.clone());

  mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.kidneyBaseMaterials = cloned.map((material) => ({
    color: material.color?.clone(),
    emissive: material.emissive?.clone(),
    emissiveIntensity: material.emissiveIntensity,
    opacity: material.opacity,
    transparent: material.transparent,
    depthWrite: material.depthWrite,
    roughness: material.roughness,
    metalness: material.metalness,
  }));
}

function forEachMeshMaterial(mesh, callback) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  materials.forEach(callback);
}

function isKidneySideSelection(selectedPartId, activeSide, partId, side) {
  if (selectedPartId === "leftKidney") {
    return side === "left" && ["leftKidney", "cortex", "medulla"].includes(partId);
  }
  if (selectedPartId === "rightKidney") {
    return side === "right" && ["rightKidney", "cortex", "medulla"].includes(partId);
  }
  return false;
}

function isSelectedMesh(mesh, selectedPartId, activeSide) {
  const partId = mesh.userData.kidneyPartId;
  const side = mesh.userData.kidneyPartSide;
  const vesselGroup = mesh.userData.kidneyVesselGroup;
  const isSharedVessel = mesh.userData.kidneySharedVessel;
  const isDirectSelected =
    partId &&
    partId === selectedPartId &&
    (!activeSide || !side || side === activeSide || !kidneyParts[selectedPartId]?.internal);
  const isVesselGroupSelected =
    (selectedPartId === "renalArtery" &&
      (partId === "renalArtery" || vesselGroup === "artery" || isSharedVessel)) ||
    (selectedPartId === "renalVein" &&
      (partId === "renalVein" || vesselGroup === "vein" || isSharedVessel));

  return (
    isDirectSelected ||
    isVesselGroupSelected ||
    isKidneySideSelection(selectedPartId, activeSide, partId, side)
  );
}

function selectedPartType(selectedPartId = "") {
  if (selectedPartId === "renalArtery" || selectedPartId === "renalVein") return "vessel";
  if (selectedPartId === "leftUreter" || selectedPartId === "rightUreter") return "tube";
  if (selectedPartId === "leftKidney" || selectedPartId === "rightKidney") return "kidney";
  return "organ";
}

function removeGlowMesh(mesh) {
  const glow = mesh.userData.kidneyGlowMesh;
  if (!glow) return;

  mesh.remove(glow);
  glow.material?.dispose();
  delete mesh.userData.kidneyGlowMesh;
}

function updateGlowMesh(mesh, selectedPartId, isSelected, pulse) {
  if (!isSelected || !selectedPartId) {
    removeGlowMesh(mesh);
    return;
  }

  const part = kidneyParts[selectedPartId];
  const type = selectedPartType(selectedPartId);
  
  // BackSide glow outline with smooth pulsing
  const glowOpacity = type === "vessel" ? 0.45 + pulse * 0.25 : 0.3 + pulse * 0.2;
  const glowScale = type === "vessel" || type === "tube" ? 1.05 + pulse * 0.025 : 1.028 + pulse * 0.015;

  let glow = mesh.userData.kidneyGlowMesh;
  if (!glow) {
    glow = new THREE.Mesh(
      mesh.geometry,
      new THREE.MeshBasicMaterial({
        color: part.color,
        transparent: true,
        opacity: glowOpacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      })
    );
    glow.renderOrder = 8;
    mesh.userData.kidneyGlowMesh = glow;
    mesh.add(glow);
  }

  glow.material.color.set(part.color);
  glow.material.opacity = glowOpacity;
  glow.scale.setScalar(glowScale);
}
function isMaterialMatchingSelection(material, base, selectedPartId) {
  if (!selectedPartId) return false;
  
  const matName = (material?.name ?? "").toLowerCase();
  
  // For renalArtery, only highlight red/pink materials (exclude blue/venous materials)
  if (selectedPartId === "renalArtery") {
    if (matName.includes("vein") || matName.includes("cava") || matName.includes("vena")) {
      return false;
    }
    if (base.color) {
      const isVenous = base.color.b > base.color.r * 1.15;
      if (isVenous) return false;
    }
  }
  
  // For renalVein, only highlight blue/cyan materials (exclude red/arterial materials)
  if (selectedPartId === "renalVein") {
    if (matName.includes("artery") || matName.includes("aorta") || matName.includes("descending")) {
      return false;
    }
    if (base.color) {
      const isArterial = base.color.r > base.color.b * 1.15;
      if (isArterial) return false;
    }
  }
  
  return true;
}

function applySelectionMaterial(mesh, selectedPartId, activeSide, pulse) {
  const isSelected = isSelectedMesh(mesh, selectedPartId, activeSide);
  const shouldDim = Boolean(selectedPartId) && !isSelected;
  const baseMaterials = mesh.userData.kidneyBaseMaterials ?? [];
  const highlightColor = isSelected && selectedPartId
    ? new THREE.Color(kidneyParts[selectedPartId].color)
    : null;

  // Emissive inner glow is reserved ONLY for blood vessels (renalArtery / renalVein)
  // Kidneys, bladder, ureters, cortex, medulla, pelvis keep their realistic textures
  const isVessel = selectedPartId === "renalArtery" || selectedPartId === "renalVein";

  let anyMaterialMatched = false;

  forEachMeshMaterial(mesh, (material, index) => {
    const base = baseMaterials[index];
    if (!base) return;

    // Filter selection at the material level to handle shared vessels (artery vs vein)
    const materialMatches = isSelected && isMaterialMatchingSelection(material, base, selectedPartId);
    if (materialMatches) {
      anyMaterialMatched = true;
    }
    const materialShouldDim = shouldDim || (isSelected && !materialMatches);

    if (material.color && base.color) {
      if (materialMatches) {
        // Boost brightness slightly (12%) but keep original realistic color/texture fully intact
        material.color.copy(base.color).multiplyScalar(1.12);
      } else if (materialShouldDim) {
        // Dim non-selected material to 55% brightness without changing hues
        material.color.copy(base.color).multiplyScalar(0.55);
      } else {
        // Return to normal base color
        material.color.copy(base.color);
      }
    }
    
    if (material.emissive && base.emissive) {
      if (materialMatches && highlightColor && isVessel) {
        // Subtly inject custom highlight color into the emissive channel (25% weight) for inner glow
        material.emissive.copy(highlightColor).multiplyScalar(0.25);
      } else {
        material.emissive.copy(base.emissive);
      }
    }
    
    if (typeof material.emissiveIntensity === "number") {
      material.emissiveIntensity = materialMatches && isVessel
        ? 1.2 + pulse * 0.8
        : (base.emissiveIntensity ?? 0);
    }
    
    if (typeof material.roughness === "number") {
      material.roughness = materialMatches
        ? Math.max(0.12, (base.roughness ?? 0.5) * 0.6)
        : base.roughness;
    }
    
    if (typeof material.metalness === "number") {
      material.metalness = base.metalness;
    }
    
    // Reduce opacity of non-selected parts to draw focus to the selected item
    material.opacity = materialMatches
      ? Math.max(base.opacity ?? 1, 0.98)
      : materialShouldDim
        ? Math.min(base.opacity ?? 1, 0.65)
        : base.opacity;
        
    material.transparent = base.transparent || material.opacity < 1;
    material.depthWrite = material.transparent ? false : (base.depthWrite ?? true);
    material.needsUpdate = true;
  });

  // Only show glow outline if the mesh is selected AND contains at least one matching material!
  const showGlow = isSelected && (isVessel ? anyMaterialMatched : true);
  updateGlowMesh(mesh, selectedPartId, showGlow, pulse);
}

function CameraControls({ viewPreset, resetSignal }) {
  const controlsRef = useRef();
  const { camera } = useThree();
  const desiredView = useRef(cameraViews.full);
  const isMovingToView = useRef(false);

  useEffect(() => {
    const fullView = cameraViews.full;
    camera.position.set(...fullView.position);
    camera.lookAt(...fullView.target);
    if (controlsRef.current) {
      controlsRef.current.target.set(...fullView.target);
      controlsRef.current.update();
    }
  }, [camera]);

  useEffect(() => {
    desiredView.current = cameraViews[viewPreset] ?? cameraViews.full;
    isMovingToView.current = true;
  }, [viewPreset, resetSignal]);

  useFrame(() => {
    if (!controlsRef.current || !isMovingToView.current) return;
    const nextPosition = new THREE.Vector3(...desiredView.current.position);
    const nextTarget = new THREE.Vector3(...desiredView.current.target);

    camera.position.lerp(nextPosition, 0.09);
    controlsRef.current.target.lerp(nextTarget, 0.09);
    controlsRef.current.update();

    if (
      camera.position.distanceTo(nextPosition) < 0.015 &&
      controlsRef.current.target.distanceTo(nextTarget) < 0.015
    ) {
      camera.position.copy(nextPosition);
      controlsRef.current.target.copy(nextTarget);
      controlsRef.current.update();
      isMovingToView.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      enablePan
      enableRotate
      enableZoom
      dampingFactor={0.08}
      minDistance={0.6}
      maxDistance={9.5}
      rotateSpeed={0.75}
      zoomSpeed={1}
      panSpeed={0.65}
      makeDefault
    />
  );
}

function LoadingModel({ language = "en" }) {
  return (
    <Html center>
      <div className="whitespace-nowrap rounded-md border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm">
        {translations[language]?.lblLoading ?? "Loading kidney model..."}
      </div>
    </Html>
  );
}

function KidneyScene({
  selectedPartId,
  activeSide,
  onSelectPart,
  labelsVisible,
  selectedLabelVisible,
  language,
}) {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => scene.clone(true), [scene]);

  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const scale = 3.35 / maxAxis;

    return {
      scale,
      position: [-center.x * scale, -center.y * scale, -center.z * scale],
    };
  }, [model]);

  useEffect(() => {
    const discovered = [];

    model.traverse((child) => {
      if (!child.isMesh) return;
      cloneAndStoreMaterial(child);
      const match = identifyAnatomyFromObject(child);
      if (match.partId) child.userData.kidneyPartId = match.partId;
      if (match.side) child.userData.kidneyPartSide = match.side;
      if (match.vesselGroup) child.userData.kidneyVesselGroup = match.vesselGroup;
      if (match.sharedVessel) child.userData.kidneySharedVessel = true;
      discovered.push({
        object: child.name || "(unnamed mesh)",
        material: Array.isArray(child.material)
          ? child.material.map((material) => material.name).join(", ")
          : child.material?.name || "",
        matchedPart: match.partId ?? "",
        side: match.side ?? "",
        vesselGroup: match.vesselGroup ?? "",
        sharedVessel: match.sharedVessel ? "yes" : "",
      });
    });

    if (import.meta.env.DEV) {
      console.info("Kidney GLB mesh inspection", discovered);
    }
  }, [model]);

  useFrame(({ clock }) => {
    const pulse = 0.5 + Math.sin(clock.elapsedTime * 2.4) * 0.5;

    model.traverse((child) => {
      if (child.isMesh) {
        applySelectionMaterial(child, selectedPartId, activeSide, pulse);
      }
    });
  });

  const handleModelClick = (event) => {
    event.stopPropagation();
    const meshMatch = identifyAnatomyFromObject(event.object);
    const markerMatch = meshMatch.partId ? meshMatch : nearestMarkerMatch(event.point);

    if (markerMatch.partId) {
      onSelectPart(markerMatch.partId, markerMatch.side);
    }
  };

  return (
    <>
      <group
        scale={transform.scale}
        position={transform.position}
        onClick={handleModelClick}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <primitive object={model} />
      </group>
      <AnatomyLabels
        labelsVisible={labelsVisible}
        selectedLabelVisible={selectedLabelVisible}
        selectedPartId={selectedPartId}
        activeSide={activeSide}
        onSelectPart={onSelectPart}
        language={language}
      />
    </>
  );
}

export default function KidneyModel({
  selectedPartId,
  activeSide,
  onSelectPart,
  onClearSelection,
  labelsVisible,
  selectedLabelVisible,
  resetSignal,
  viewPreset,
  language = "en",
}) {
  return (
    <Canvas
      camera={{ position: cameraViews.full.position, fov: 40 }}
      dpr={[1, 1.8]}
      shadows
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={onClearSelection}
    >
      <color attach="background" args={["#c7d2d6"]} />
      <fog attach="fog" args={["#c7d2d6", 7, 12]} />
      <ambientLight intensity={0.76} />
      <directionalLight position={[3, 4.5, 5]} intensity={2.25} castShadow />
      <directionalLight position={[-4, 2.5, -3]} intensity={0.9} color="#d7f3ff" />
      <pointLight position={[-3, 1.5, 2]} intensity={0.72} color="#f4d6b3" />
      <Suspense fallback={<LoadingModel language={language} />}>
        <KidneyScene
          selectedPartId={selectedPartId}
          activeSide={activeSide}
          onSelectPart={onSelectPart}
          labelsVisible={labelsVisible}
          selectedLabelVisible={selectedLabelVisible}
          language={language}
        />
      </Suspense>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.96, 0]}
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onClearSelection?.();
        }}
      >
        <circleGeometry args={[2.6, 64]} />
        <meshStandardMaterial color="#b8c4c7" roughness={0.95} />
      </mesh>
      <CameraControls viewPreset={viewPreset} resetSignal={resetSignal} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
