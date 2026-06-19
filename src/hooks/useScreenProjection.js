import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { interactivePartIds, kidneyParts } from "../data/kidneyAnatomyData.js";

/**
 * Inner component that must be rendered inside the R3F Canvas.
 * Every frame, it projects each anatomy part's 3D anchor position
 * into 2D screen-pixel coordinates and writes them to `screenCoordsRef`.
 */
export function ScreenProjector({
  screenCoordsRef,
  activeSide,
  modelScale = 1,
  modelPosition = [0, 0, 0],
  model,
  partMeshesRef,
}) {
  const { camera, gl } = useThree();
  const tempVec = useRef(new THREE.Vector3());
  const targetWorldPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!screenCoordsRef.current) return;

    const canvas = gl.domElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const results = {};

    // Find the kidney center Z coordinate for occlusion checks
    let kidneyCenterZ = -0.15 * modelScale + modelPosition[2];
    const kidneyKey = activeSide === "right" ? "rightKidney" : "leftKidney";
    const kidneyMeshes = partMeshesRef?.current?.[kidneyKey] || [];
    if (kidneyMeshes.length > 0) {
      const firstMesh = kidneyMeshes[0];
      firstMesh.updateWorldMatrix(true, false);
      const localCenter = new THREE.Vector3();
      firstMesh.geometry.boundingBox.getCenter(localCenter);
      const worldCenter = localCenter.clone().applyMatrix4(firstMesh.matrixWorld);
      kidneyCenterZ = worldCenter.z;
    }

    for (const partId of interactivePartIds) {
      const part = kidneyParts[partId];
      if (!part) continue;

      let meshes = partMeshesRef?.current?.[partId] || [];
      let hasMeshes = meshes.length > 0;

      if (hasMeshes) {
        const targetSide = part.side ?? (part.internal || partId === "renalArtery" || partId === "renalVein" ? activeSide : null);
        if (targetSide) {
          const filtered = meshes.filter(mesh => mesh.userData.kidneyPartSide === targetSide);
          if (filtered.length > 0) {
            meshes = filtered;
          }
        }

        const sum = new THREE.Vector3(0, 0, 0);
        meshes.forEach((mesh) => {
          mesh.updateWorldMatrix(true, false);
          const localCenter = new THREE.Vector3();
          mesh.geometry.boundingBox.getCenter(localCenter);
          const worldCenter = localCenter.clone().applyMatrix4(mesh.matrixWorld);
          sum.add(worldCenter);
        });
        targetWorldPos.current.copy(sum.divideScalar(meshes.length));

        // Apply outward horizontal offset for outer boundaries of the kidneys
        if (partId === "leftKidney") {
          targetWorldPos.current.x += 0.18 * modelScale;
        } else if (partId === "rightKidney") {
          targetWorldPos.current.x -= 0.18 * modelScale;
        }
      } else {
        // Fallback to static coordinates
        let pos = part.labelPosition;
        if (!pos) continue;
        if (part.internal && activeSide === "right") {
          pos = [-Math.abs(pos[0]), pos[1], pos[2]];
        }

        const transformedX = pos[0] * modelScale + modelPosition[0];
        const transformedY = pos[1] * modelScale + modelPosition[1];
        const transformedZ = pos[2] * modelScale + modelPosition[2];

        targetWorldPos.current.set(transformedX, transformedY, transformedZ);
      }

      // Project to NDC (-1..+1)
      tempVec.current.copy(targetWorldPos.current);
      tempVec.current.project(camera);

      // NDC → screen pixels
      const x = (tempVec.current.x * 0.5 + 0.5) * w;
      const y = (-tempVec.current.y * 0.5 + 0.5) * h;

      // Visibility check
      let visible =
        tempVec.current.z > 0 &&
        tempVec.current.z < 1 &&
        x > -200 &&
        x < w + 200 &&
        y > -200 &&
        y < h + 200;

      // Occlusion check
      let occluded = false;
      if (visible && part.internal) {
        if (camera.position.z < kidneyCenterZ) {
          occluded = true;
        }
      }

      results[partId] = { x, y, visible, occluded };
    }

    screenCoordsRef.current = results;
  });

  return null;
}
