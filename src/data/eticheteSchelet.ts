export type EticheteSchelet = {
  ro: string;
  en: string;
};

export const eticheteSchelet: Record<string, EticheteSchelet> = {
  frontal: { ro: "Os frontal", en: "Frontal bone" },
  parietal: { ro: "Oase parietale", en: "Parietal bones" },
  temporal: { ro: "Oase temporale", en: "Temporal bones" },
  occipital: { ro: "Os occipital", en: "Occipital bone" },
  sfenoid: { ro: "Os sfenoid", en: "Sphenoid bone" },
  etmoid: { ro: "Os etmoid", en: "Ethmoid bone" },
  maxilar: { ro: "Maxilare", en: "Upper jaw bones" },
  mandibula: { ro: "Mandibulă", en: "Lower jaw bone" },
  zigomatic: { ro: "Oase zigomatice", en: "Cheekbones" },
  nazal: { ro: "Oase nazale", en: "Nasal bones" },
  lacrimal: { ro: "Oase lacrimale", en: "Lacrimal bones" },
  palatin: { ro: "Oase palatine", en: "Palatine bones" },
  vomer: { ro: "Vomer", en: "Vomer" },
  "cornet-inf": { ro: "Cornete nazale inferioare", en: "Inferior nasal conchae" },
  ciocan: { ro: "Ciocane", en: "Malleus bones" },
  nicovala: { ro: "Nicovale", en: "Incus bones" },
  scarita: { ro: "Scărițe", en: "Stapes bones" },
  hioid: { ro: "Os hioid", en: "Hyoid bone" },
  "vert-cervicale": { ro: "Vertebre cervicale", en: "Cervical vertebrae" },
  "vert-toracice": { ro: "Vertebre toracice", en: "Thoracic vertebrae" },
  "vert-lombare": { ro: "Vertebre lombare", en: "Lumbar vertebrae" },
  sacrum: { ro: "Sacrum", en: "Sacrum" },
  coccis: { ro: "Coccis", en: "Coccyx" },
  stern: { ro: "Stern", en: "Sternum" },
  coaste: { ro: "Coaste", en: "Ribs" },
  clavicula: { ro: "Clavicule", en: "Clavicles" },
  scapula: { ro: "Scapule", en: "Shoulder blades" },
  humerus: { ro: "Humerus", en: "Humerus" },
  radius: { ro: "Radius", en: "Radius" },
  ulna: { ro: "Ulnă", en: "Ulna" },
  carp: { ro: "Oase carpiene", en: "Wrist bones" },
  metacarp: { ro: "Metacarpiene", en: "Palm bones" },
  "falange-mana": { ro: "Falange ale mâinii", en: "Finger bones" },
  coxal: { ro: "Oase coxale", en: "Hip bones" },
  femur: { ro: "Femur", en: "Femur" },
  rotula: { ro: "Rotulă", en: "Kneecap" },
  tibia: { ro: "Tibia", en: "Tibia" },
  fibula: { ro: "Fibulă", en: "Fibula" },
  tars: { ro: "Oase tarsiene", en: "Ankle and heel bones" },
  metatars: { ro: "Metatarsiene", en: "Midfoot bones" },
  "falange-picior": { ro: "Falange ale piciorului", en: "Toe bones" },
};

export function getEticheteSchelet(id: string | null | undefined) {
  if (!id) return undefined;
  return eticheteSchelet[id];
}

export function getEtichetaSchelet(id: string | null | undefined, lang: "ro" | "en") {
  return getEticheteSchelet(id)?.[lang];
}
