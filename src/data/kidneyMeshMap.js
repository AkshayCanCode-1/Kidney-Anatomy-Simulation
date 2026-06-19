export const anatomyMeshGroups = {
  renalArtery: [
    "R_Renal_Artery",
    "L_Renal_Artery",
    "Descending_Aorta",
    "Descending_Aorta.001",
    "R_Interloblar_Blood_vessel",
    "L_Interloblar_Blood_vessel",
    "Right_Cartical_Blood_vessels",
    "Left_Cartical_Blood_vessels",
    "renal_artery",
    "renalartery",
  ],
  renalVein: [
    "R_Renal_Vein",
    "L_Renal_Vein",
    "Inferior_Vena_Cava",
    "Inferior_Vena_Cava.001",
    "R_Interloblar_Blood_vessel",
    "L_Interloblar_Blood_vessel",
    "Right_Cartical_Blood_vessels",
    "Left_Cartical_Blood_vessels",
    "renal_vein",
    "renalvein",
  ],
};

const sharedVesselPatterns = [
  "interloblar_blood_vessel",
  "cartical_blood_vessels",
  "cortical_blood_vessels",
];

export const kidneyMeshNameMap = [
  { partId: "cortex", side: "left", patterns: ["l_cortex", "left_cortex", "left_cartical", "l_cartical"] },
  { partId: "cortex", side: "right", patterns: ["r_cortex", "right_cortex", "right_cartical", "r_cartical"] },
  { partId: "medulla", side: "left", patterns: ["l_medulla", "left_medulla"] },
  { partId: "medulla", side: "right", patterns: ["r_medulla", "right_medulla"] },
  { partId: "medulla", side: "left", patterns: ["l_renal_column", "left_renal_column"] },
  { partId: "medulla", side: "right", patterns: ["r_renal_column", "right_renal_column"] },
  { partId: "leftKidney", side: "left", patterns: ["l_capsule", "left_capsule"] },
  { partId: "rightKidney", side: "right", patterns: ["r_capsule", "right_capsule"] },
  { partId: "leftUreter", side: "left", patterns: ["l_ureter", "left_ureter", "leftureter"] },
  { partId: "rightUreter", side: "right", patterns: ["r_ureter", "right_ureter", "rightureter"] },
  { partId: "renalArtery", vesselGroup: "artery", patterns: anatomyMeshGroups.renalArtery },
  { partId: "renalVein", vesselGroup: "vein", patterns: anatomyMeshGroups.renalVein },
  { partId: "urinaryBladder", patterns: ["bladder", "urinary_bladder", "urinarybladder"] },
  { partId: "leftKidney", side: "left", patterns: ["l_kidney", "left_kidney", "leftkidney"] },
  { partId: "rightKidney", side: "right", patterns: ["r_kidney", "right_kidney", "rightkidney"] },
];

export function normalizeMeshText(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function matchMeshToAnatomy(value = "") {
  const text = normalizeMeshText(value);

  for (const item of kidneyMeshNameMap) {
    if (item.patterns.some((pattern) => text.includes(normalizeMeshText(pattern)))) {
      return {
        partId: item.partId,
        side: item.side ?? null,
        vesselGroup: item.vesselGroup ?? null,
        sharedVessel: sharedVesselPatterns.some((pattern) => text.includes(normalizeMeshText(pattern))),
      };
    }
  }

  return { partId: null, side: null, vesselGroup: null, sharedVessel: false };
}
