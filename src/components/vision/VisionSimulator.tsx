/**
 * VisionSimulator — cabinet optic virtual 3D care simulează deficiențe de
 * vedere peste o scenă Three.js, pentru secțiunea „Optică & Vedere" din Santix.
 *
 * Blurul pentru MIOPIE și HIPERMETROPIE este un Depth of Field real
 * (EffectComposer + RenderPass + BokehPass): doar planurile aflate departe de
 * planul de focalizare se blurează. Puterea blurului este dată de o DIOPTRIE
 * medicală selectabilă (-1 .. -12 dpt / +1 .. +10 dpt), iar slider-ul de
 * intensitate (0-100%) acționează ca multiplicator / progresie a bolii.
 *   - Miopie  → focalizare aproape; cu cât dioptria e mai mare, cu atât planul
 *     clar se apropie de cameră (la -12 dpt, aproape totul devine ceață).
 *   - Hipermetropie → focalizare departe; rețeta de aproape se înnegurează.
 * Restul deficiențelor (astigmatism, cataractă, glaucom, DMLV, daltonism)
 * rămân efecte CSS/SVG, corecte pentru ele.
 *
 * Tema (Light / Dark) se sincronizează cu butonul „Luminos / Întunecat" din
 * header (clasa `light-mode` + evenimentul `santix-theme-change`), sau poate fi
 * controlată explicit prin prop-ul `isLightMode`. Luminile, fundalul, grila și
 * materialele se actualizează fără re-crearea scenei (prin refs).
 *
 * Plimbă-te cu WASD, privește prin drag (mouse / touch). Întreaga scenă este
 * distrusă la unmount — fără memory leaks. Demo educațional, nu un diagnostic.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Eye, Glasses, Lightbulb, Stethoscope } from "lucide-react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { dispatchOnboardingStep } from "@/lib/onboarding";
import { useLanguage } from "@/lib/useLanguage";

type DeficiencyId =
  | "none"
  | "myopia"
  | "hyperopia"
  | "astigmatism"
  | "cataract"
  | "glaucoma"
  | "amd"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia";

type Deficiency = {
  id: DeficiencyId;
  ro: string;
  en: string;
  descRo: string;
  descEn: string;
  bioRo: string;
  bioEn: string;
  sympRo: string;
  sympEn: string;
  corrRo: string;
  corrEn: string;
};

const DEFICIENCIES: Deficiency[] = [
  {
    id: "none",
    ro: "Fără deficiență",
    en: "No deficiency",
    descRo: "Vedere de referință. Alege o deficiență pentru a vedea cum se schimbă câmpul vizual.",
    descEn: "Reference vision. Pick a deficiency to see how the field of view changes.",
    bioRo:
      "Lumina se focalizează exact pe retină, așa că imaginea este clară la toate distanțele — și tabelul din fund, și cartea de aproape.",
    bioEn:
      "Light focuses exactly on the retina, so the image is sharp at every distance — both the far chart and the near book.",
    sympRo: "—",
    sympEn: "—",
    corrRo: "—",
    corrEn: "—",
  },
  {
    id: "myopia",
    ro: "Miopie (dioptrii negative)",
    en: "Myopia (short-sight)",
    descRo:
      "Obiectele depărtate apar neclare. Dioptria stabilește blurul, intensitatea îl multiplică.",
    descEn: "Distant objects appear blurry. The diopter sets the blur, intensity multiplies it.",
    bioRo:
      "Globul ocular este prea lung (sau corneea prea curbată), iar lumina se focalizează ÎN FAȚA retinei. De aceea obiectele depărtate apar neclare, dar cele apropiate rămân clare.",
    bioEn:
      "The eyeball is too long (or the cornea too curved), so light focuses IN FRONT of the retina. Distant objects blur while near ones stay sharp.",
    sympRo:
      "Vedere încețoșată la distanță, mijitul ochilor, oboseală oculară și dureri de cap la condus sau privind tabla.",
    sympEn:
      "Blurry distance vision, squinting, eye strain and headaches when driving or looking at a board.",
    corrRo:
      "Lentile divergente (cu minus / concave), lentile de contact sau chirurgie laser (LASIK/PRK).",
    corrEn: "Diverging (minus / concave) lenses, contact lenses or laser surgery (LASIK/PRK).",
  },
  {
    id: "hyperopia",
    ro: "Hipermetropie (dioptrii pozitive)",
    en: "Hyperopia (long-sight)",
    descRo:
      "Obiectele apropiate apar neclare. Dioptria stabilește blurul, intensitatea îl multiplică.",
    descEn: "Near objects appear blurry. The diopter sets the blur, intensity multiplies it.",
    bioRo:
      "Globul ocular este prea scurt, iar lumina se focalizează ÎN SPATELE retinei. Efortul de focalizare pe aproape este mare, așa că rețeta de pe masă apare neclară, dar tabelul din fund e clar.",
    bioEn:
      "The eyeball is too short, so light focuses BEHIND the retina. Focusing up close is hard, so the near prescription blurs while the far chart stays sharp.",
    sympRo:
      "Dificultate la citit de aproape, oboseală și dureri de cap după muncă de aproape, ochi obosiți seara.",
    sympEn:
      "Trouble reading up close, fatigue and headaches after near work, tired eyes in the evening.",
    corrRo: "Lentile convergente (cu plus / convexe), lentile de contact sau chirurgie refractivă.",
    corrEn: "Converging (plus / convex) lenses, contact lenses or refractive surgery.",
  },
  {
    id: "astigmatism",
    ro: "Astigmatism",
    en: "Astigmatism",
    descRo: "Imagine ușor dublată și întinsă pe orizontală, peste un blur fin.",
    descEn: "Slightly doubled image stretched horizontally over a soft blur.",
    bioRo:
      "Corneea sau cristalinul au o curbură neregulată (ca o minge de rugby), așa că lumina se focalizează în mai multe puncte. Imaginea apare dublată și distorsionată la orice distanță.",
    bioEn:
      "The cornea or lens is irregularly curved (like a rugby ball), so light focuses at several points. The image looks doubled and distorted at any distance.",
    sympRo:
      "Imagini ușor duble sau umbrite, distorsiunea liniilor, oboseală oculară și vedere neclară la aproape și la distanță.",
    sympEn:
      "Slightly doubled or ghosted images, distorted lines, eye strain and blur both near and far.",
    corrRo: "Lentile cilindrice (torice), lentile de contact torice sau chirurgie laser.",
    corrEn: "Cylindrical (toric) lenses, toric contact lenses or laser surgery.",
  },
  {
    id: "cataract",
    ro: "Cataractă",
    en: "Cataract",
    descRo: "Văl lăptos: contrast redus, tentă gălbuie și lumină împrăștiată (glare).",
    descEn: "Milky veil: reduced contrast, yellow tint and scattered light (glare).",
    bioRo:
      "Cristalinul își pierde transparența și devine opac, ca o fereastră aburită. Lumina este împrăștiată, contrastul scade și culorile capătă o tentă gălbuie.",
    bioEn:
      "The lens loses transparency and turns opaque, like a fogged window. Light scatters, contrast drops and colours take on a yellow tint.",
    sympRo:
      "Vedere cețoasă/lăptoasă, culori spălăcite, halouri în jurul luminilor și vedere nocturnă slabă.",
    sympEn: "Cloudy/milky vision, washed-out colours, halos around lights and poor night vision.",
    corrRo:
      "Operație de cataractă: cristalinul opac este înlocuit cu un cristalin artificial (implant).",
    corrEn: "Cataract surgery: the cloudy lens is replaced with an artificial lens implant.",
  },
  {
    id: "glaucoma",
    ro: "Glaucom — vedere tunel",
    en: "Glaucoma — tunnel vision",
    descRo: "Câmpul periferic se închide treptat; scade și sensibilitatea la contrast.",
    descEn: "The peripheral field closes in; contrast sensitivity drops too.",
    bioRo:
      "Presiunea intraoculară crescută afectează nervul optic. Se pierde întâi vederea periferică, lăsând treptat doar un tunel central.",
    bioEn:
      "Raised eye pressure damages the optic nerve. Peripheral vision is lost first, gradually leaving only a central tunnel.",
    sympRo:
      "Îngustarea treptată a câmpului vizual, vedere de tunel, dificultăți la mers și la condus. Adesea fără durere la început.",
    sympEn:
      "Gradual narrowing of the visual field, tunnel vision, trouble walking and driving. Often painless at first.",
    corrRo:
      "Vederea pierdută nu se reface; progresia se oprește prin picături, laser sau chirurgie pentru scăderea presiunii.",
    corrEn:
      "Lost vision can't be restored; progression is halted with drops, laser or surgery to lower pressure.",
  },
  {
    id: "amd",
    ro: "Degenerescență maculară (DMLV)",
    en: "Macular degeneration",
    descRo: "Pată întunecată în centrul vederii, iar liniile drepte apar ondulate.",
    descEn: "A dark central spot, and straight lines appear wavy.",
    bioRo:
      "Macula (centrul retinei, responsabilă de detalii fine) se degradează. Apare o pată întunecată exact în centrul vederii, unde te uiți direct.",
    bioEn:
      "The macula (the retina's centre, responsible for fine detail) degrades. A dark spot appears right where you look.",
    sympRo:
      "Pată întunecată sau lipsă în centru, linii drepte văzute ondulat, dificultate la citit și la recunoașterea fețelor.",
    sympEn:
      "A dark or missing spot in the centre, straight lines appearing wavy, trouble reading and recognising faces.",
    corrRo:
      "Injecții intravitreene (anti-VEGF), suplimente specifice și terapie laser; controlul factorilor de risc.",
    corrEn:
      "Intravitreal injections (anti-VEGF), specific supplements and laser therapy; control of risk factors.",
  },
  {
    id: "protanopia",
    ro: "Daltonism — protanopie",
    en: "Colour blindness — protanopia",
    descRo: "Lipsa receptorilor pentru roșu. Roșu și verde devin greu de distins.",
    descEn: "Missing red receptors. Red and green become hard to tell apart.",
    bioRo:
      "Lipsesc conurile sensibile la roșu (conuri L). Roșul apare întunecat și se confundă cu verdele și maro.",
    bioEn:
      "The red-sensitive cones (L cones) are missing. Red looks dark and is confused with green and brown.",
    sympRo:
      "Confuzia roșu–verde, roșul perceput mai întunecat, dificultate la semafoare și coduri color.",
    sympEn:
      "Red–green confusion, red seen as darker, trouble with traffic lights and colour codes.",
    corrRo:
      "Nu există tratament; ochelari/filtre speciale și aplicații pot ajuta la distingerea culorilor.",
    corrEn: "There's no cure; special glasses/filters and apps can help distinguish colours.",
  },
  {
    id: "deuteranopia",
    ro: "Daltonism — deuteranopie",
    en: "Colour blindness — deuteranopia",
    descRo: "Lipsa receptorilor pentru verde — cea mai frecventă formă.",
    descEn: "Missing green receptors — the most common form.",
    bioRo:
      "Lipsesc conurile sensibile la verde (conuri M) — cea mai frecventă formă de daltonism. Roșu și verde sunt greu de distins.",
    bioEn:
      "The green-sensitive cones (M cones) are missing — the most common form. Red and green are hard to separate.",
    sympRo:
      "Confuzia roșu–verde, dificultate la hărți colorate, fructe coapte vs. necoapte, coduri color.",
    sympEn: "Red–green confusion, trouble with colour maps, ripe vs unripe fruit, colour codes.",
    corrRo:
      "Nu există tratament; ochelari/filtre speciale și aplicații pot ajuta la distingerea culorilor.",
    corrEn: "There's no cure; special glasses/filters and apps can help distinguish colours.",
  },
  {
    id: "tritanopia",
    ro: "Daltonism — tritanopie",
    en: "Colour blindness — tritanopia",
    descRo: "Lipsa receptorilor pentru albastru. Albastru și galben se confundă.",
    descEn: "Missing blue receptors. Blue and yellow get confused.",
    bioRo:
      "Lipsesc conurile sensibile la albastru (conuri S), o formă rară. Albastru și galben se confundă.",
    bioEn:
      "The blue-sensitive cones (S cones) are missing, a rare form. Blue and yellow get confused.",
    sympRo: "Confuzia albastru–galben, dificultate la nuanțele de albastru/verde și roz/roșu.",
    sympEn: "Blue–yellow confusion, trouble with blue/green and pink/red shades.",
    corrRo: "Nu există tratament; filtre și aplicații specializate pot ajuta în viața de zi cu zi.",
    corrEn: "There's no cure; specialised filters and apps can help in daily life.",
  },
];

// Dioptrii medicale reale + câteva valori exagerate pentru impact vizual.
const MYOPIA_DIOPTERS = ["-1.00", "-3.00", "-6.00", "-12.00"];
const HYPEROPIA_DIOPTERS = ["+1.00", "+3.00", "+6.00", "+10.00"];

// Clinical classification of refractive errors: low ≤ 3 D, moderate 3–6 D,
// high > 6 D; ≥ 10 D is in the pathological range.
function diopterSeverity(mag: number, isEn: boolean): string {
  if (mag <= 3) return isEn ? "low" : "ușoară";
  if (mag <= 6) return isEn ? "moderate" : "medie";
  if (mag < 10) return isEn ? "high" : "mare";
  return isEn ? "very high (pathological)" : "foarte mare (patologică)";
}

// ── Patient profiles: one realistic case per deficiency ────────────────────

// Action noun for the correction toggle, per deficiency type.
const CORRECTION_ACTION: Record<DeficiencyId, { ro: string; en: string }> = {
  none: { ro: "corecția", en: "correction" },
  myopia: { ro: "lentila de corecție", en: "the corrective lens" },
  hyperopia: { ro: "lentila de corecție", en: "the corrective lens" },
  astigmatism: { ro: "lentila torică", en: "the toric lens" },
  cataract: { ro: "operația (cristalin artificial)", en: "surgery (artificial lens)" },
  glaucoma: { ro: "tratamentul", en: "the treatment" },
  amd: { ro: "tratamentul", en: "the treatment" },
  protanopia: { ro: "filtrul corector", en: "the corrective filter" },
  deuteranopia: { ro: "filtrul corector", en: "the corrective filter" },
  tritanopia: { ro: "filtrul corector", en: "the corrective filter" },
};

type VisionStyles = {
  filter: string;
  vignette: React.CSSProperties;
  macular: React.CSSProperties;
};

// CSS-side effects for everything that is NOT a depth-of-field defect.
// Myopia & hyperopia return filter "none" — those are handled in 3D by BokehPass.
function computeVision(type: DeficiencyId, v: number): VisionStyles {
  const vignette: React.CSSProperties = { opacity: 0 };
  const macular: React.CSSProperties = { opacity: 0 };
  let filter = "none";

  switch (type) {
    case "myopia":
    case "hyperopia":
      filter = "none";
      break;
    case "astigmatism": {
      const b = ((v / 100) * 2.2).toFixed(1);
      const g = ((v / 100) * 6).toFixed(1);
      filter = `blur(${b}px) drop-shadow(${g}px 0 2px rgba(0,0,0,0.5)) drop-shadow(-${g}px 0 2px rgba(0,0,0,0.5))`;
      break;
    }
    case "cataract": {
      filter = `blur(${((v / 100) * 5).toFixed(1)}px) brightness(${(1 - (v / 100) * 0.18).toFixed(2)}) contrast(${(1 - (v / 100) * 0.32).toFixed(2)}) sepia(${((v / 100) * 0.5).toFixed(2)})`;
      // Glare: cristalinul opac împrăștie lumina, adăugând un văl alb-gălbui
      // uniform peste tot câmpul vizual (de aceea apar halouri la lumini).
      vignette.opacity = 1;
      vignette.background = `radial-gradient(circle, rgba(252,246,225,${(0.06 + (v / 100) * 0.18).toFixed(2)}) 0%, rgba(252,246,225,${(0.12 + (v / 100) * 0.3).toFixed(2)}) 100%)`;
      break;
    }
    case "protanopia":
      filter = "url(#santix-protanopia)";
      break;
    case "deuteranopia":
      filter = "url(#santix-deuteranopia)";
      break;
    case "tritanopia":
      filter = "url(#santix-tritanopia)";
      break;
    case "glaucoma": {
      const clearR = 58 - (v / 100) * 44;
      vignette.opacity = 1;
      vignette.background = `radial-gradient(circle, transparent ${clearR}%, rgba(3,4,2,0.98) ${clearR + 22}%)`;
      // Glaucomul afectează și sensibilitatea la contrast, nu doar câmpul
      // periferic — imaginea rămasă în "tunel" e ușor ștearsă și întunecată.
      filter = `contrast(${(1 - (v / 100) * 0.15).toFixed(2)}) brightness(${(1 - (v / 100) * 0.08).toFixed(2)})`;
      break;
    }
    case "amd": {
      const spot = 9 + (v / 100) * 24;
      macular.opacity = 1;
      macular.background = `radial-gradient(circle, rgba(18,18,16,0.96) 0%, rgba(18,18,16,0.88) ${spot}%, transparent ${spot + 18}%)`;
      // Metamorfopsie — semnul distinctiv al DMLV: liniile drepte apar
      // ondulate (testul cu grila Amsler). Aplicată prin filtrul SVG de
      // deplasare definit mai jos, cu intensitatea legată de slider.
      filter = `url(#santix-metamorphopsia) blur(${((v / 100) * 1).toFixed(1)}px)`;
      break;
    }
    case "none":
    default:
      filter = "none";
  }

  return { filter, vignette, macular };
}

// ── 2D canvas textures drawn at runtime ────────────────────────────────────

function makeSnellenTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1320;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f6f4ee";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#0d0d0d";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const rows: { text: string; size: number }[] = [
    { text: "E", size: 230 },
    { text: "F P", size: 150 },
    { text: "T O Z", size: 108 },
    { text: "L P E D", size: 78 },
    { text: "P E C F D", size: 56 },
    { text: "E D F C Z P", size: 40 },
    { text: "F E L O P Z D", size: 28 },
  ];
  let y = 150;
  rows.forEach((r) => {
    ctx.font = `bold ${r.size}px Arial, sans-serif`;
    ctx.fillText(r.text, c.width / 2, y);
    y += r.size * 0.85 + 46;
  });

  ctx.font = "bold 30px Arial, sans-serif";
  ctx.fillStyle = "#9333EA";
  ctx.fillText("SANTIX · OPTIC", c.width / 2, c.height - 54);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Generic open reading book on the desk — the NEAR object whose fine print
// blurs under hyperopia. The interactive prescription is a separate HTML panel.
function makeBookTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 768;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fbf7ec";
  ctx.fillRect(0, 0, c.width, c.height);
  const grad = ctx.createLinearGradient(c.width / 2 - 60, 0, c.width / 2 + 60, 0);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.14)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(c.width / 2 - 60, 0, 120, c.height);

  ctx.fillStyle = "#1a1a1a";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.font = "bold 40px Georgia, serif";
  ctx.fillText("Îngrijirea vederii", 70, 56);

  ctx.font = "22px Georgia, serif";
  const left = [
    "Ochiul focalizează lumina pe retină printr-un",
    "sistem de lentile: corneea și cristalinul.",
    "",
    "Când imaginea nu se aliniază perfect pe retină",
    "apar erorile de refracție: miopia, hipermetropia",
    "și astigmatismul.",
    "",
    "Citește acest text de aproape: la hipermetropie",
    "rândurile fine devin neclare și obositoare, iar",
    "lentilele potrivite readuc claritatea instant.",
  ];
  let ly = 140;
  left.forEach((ln) => {
    ctx.fillText(ln, 70, ly);
    ly += 40;
  });

  const right = [
    "Punctul cel mai îndepărtat văzut clar",
    "depinde de dioptrii: la -1 D este la 1 m,",
    "iar la -12 D la doar ~8 cm.",
    "",
    "De aceea miopia severă cere o corecție",
    "puternică pentru a vedea în depărtare.",
  ];
  let ry = 140;
  right.forEach((ln) => {
    ctx.fillText(ln, c.width / 2 + 70, ry);
    ry += 40;
  });

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── Bokeh uniform helper typing ────────────────────────────────────────────
type BokehUniforms = {
  focus: THREE.IUniform<number>;
  aperture: THREE.IUniform<number>;
  maxblur: THREE.IUniform<number>;
  aspect: THREE.IUniform<number>;
};

// Room constants shared between scene creation and the theme-sync effect.
const ROOM_W = 24;
const ROOM_H = 8;
const Z_BACK = -12;
const Z_FRONT = 8;

// World positions of the two depth-of-field targets. Focus is computed live as
// the camera→target distance each frame, so the focused plane stays locked on
// the target even while the user walks around (hyperopia keeps the far chart
// perfectly sharp; myopia keeps the near book sharp until severe diopters).
const CHART_POS = new THREE.Vector3(0, 2.7, Z_BACK + 0.2);
const BOOK_POS = new THREE.Vector3(0, 1.02, 4.05);

function DeficiencySelect({
  value,
  onChange,
  lang,
  isLightMode,
}: {
  value: DeficiencyId;
  onChange: (id: DeficiencyId) => void;
  lang: "ro" | "en";
  isLightMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = DEFICIENCIES.find((d) => d.id === value) ?? DEFICIENCIES[0];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  const triggerCls = isLightMode
    ? "border-slate-300 bg-white text-slate-800 hover:border-violet-400 hover:bg-violet-50"
    : "border-[#9333EA]/25 bg-[#171b13]/80 text-[#f5e9d0] hover:border-[#9333EA]/60 hover:bg-[#9333EA]/10";
  const menuCls = isLightMode
    ? "border-slate-200 bg-white shadow-xl"
    : "border-[#9333EA]/25 bg-[#14180f] shadow-[0_18px_50px_-18px_rgba(0,0,0,0.9)]";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${triggerCls}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{lang === "en" ? current.en : current.ro}</span>
        <ChevronDown
          className={`size-4 shrink-0 ${isLightMode ? "text-violet-600" : "text-[#9333EA]"} transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className={`absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[260px] overflow-y-auto rounded-xl border p-1.5 backdrop-blur-xl ${menuCls}`}
            role="listbox"
          >
            {DEFICIENCIES.map((d) => {
              const active = d.id === value;
              const itemCls = active
                ? isLightMode
                  ? "bg-violet-100 text-violet-700"
                  : "bg-[#9333EA]/20 text-[#d9b8ff]"
                : isLightMode
                  ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  : "text-[#f5e9d0]/80 hover:bg-white/5 hover:text-[#f5e9d0]";
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(d.id);
                      setOpen(false);
                    }}
                    className={`w-full truncate rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${itemCls}`}
                    role="option"
                    aria-selected={active}
                  >
                    {lang === "en" ? d.en : d.ro}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function VisionSimulator({ isLightMode: isLightModeProp }: { isLightMode?: boolean } = {}) {
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Theme: explicit prop wins; otherwise sync with the Santix header toggle.
  const [detectedLight, setDetectedLight] = useState(
    () =>
      typeof document !== "undefined" && document.documentElement.classList.contains("light-mode"),
  );
  useEffect(() => {
    if (isLightModeProp !== undefined) return;
    const sync = () => setDetectedLight(document.documentElement.classList.contains("light-mode"));
    sync();
    window.addEventListener("santix-theme-change", sync);
    return () => window.removeEventListener("santix-theme-change", sync);
  }, [isLightModeProp]);
  const isLightMode = isLightModeProp ?? detectedLight;

  const [deficiency, setDeficiency] = useState<DeficiencyId>("none");
  const [diopter, setDiopter] = useState("-3.00");
  const [intensity, setIntensity] = useState(50);
  // Correction toggle: when on, the inverse optical effect is applied (vision is
  // corrected — blur/distortion cancelled), demonstrating glasses/treatment.
  const [corrected, setCorrected] = useState(false);

  const isDof = deficiency === "myopia" || deficiency === "hyperopia";
  const diopterOptions = deficiency === "hyperopia" ? HYPEROPIA_DIOPTERS : MYOPIA_DIOPTERS;

  const selectDeficiency = (id: DeficiencyId) => {
    setDeficiency(id);
    setCorrected(false);
    if (id === "myopia") setDiopter("-3.00");
    else if (id === "hyperopia") setDiopter("+3.00");
  };

  // Live values read by the render loop without re-running the scene effect.
  const fxRef = useRef({ deficiency, intensity, diopter, corrected });
  useEffect(() => {
    fxRef.current = { deficiency, intensity, diopter, corrected };
  }, [deficiency, intensity, diopter, corrected]);

  // Refs to mutable scene objects updated by the theme-sync effect.
  const sceneRef = useRef<THREE.Scene | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const hemiRef = useRef<THREE.HemisphereLight | null>(null);
  const wallMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const floorMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const isLightInitRef = useRef(isLightMode);
  isLightInitRef.current = isLightMode;

  // When corrected, the CSS-side effects are cleared too (vision restored).
  const vision = useMemo(
    () => computeVision(corrected ? "none" : deficiency, intensity),
    [deficiency, intensity, corrected],
  );
  const current = DEFICIENCIES.find((d) => d.id === deficiency) ?? DEFICIENCIES[0];

  const diopterMag = Math.abs(parseFloat(diopter)) || 0;
  const farPointMeters = diopterMag > 0 ? (1 / diopterMag).toFixed(2) : "∞";
  // Prescription OD/OS for refractive errors (OS is 0.25 D closer to zero).
  const correctionNoun = isEn ? CORRECTION_ACTION[deficiency].en : CORRECTION_ACTION[deficiency].ro;
  // Amplitudinea metamorfopsiei (DMLV): crește cu progresia, zero când e corectat.
  const amdWarp = !corrected && deficiency === "amd" ? 6 + (intensity / 100) * 16 : 0;

  // ── theme sync: background, fog, lights, grid, surface materials ──
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const bgHex = isLightMode ? 0xe2e8f0 : 0x090d16;
    scene.background = new THREE.Color(bgHex);
    if (scene.fog) (scene.fog as THREE.Fog).color.setHex(bgHex);
    if (ambientRef.current) ambientRef.current.intensity = isLightMode ? 1.5 : 1.05;
    if (hemiRef.current) {
      hemiRef.current.groundColor.setHex(isLightMode ? 0xcbd5e1 : 0x444444);
      hemiRef.current.intensity = isLightMode ? 0.8 : 0.6;
    }
    if (wallMatRef.current) wallMatRef.current.color.setHex(isLightMode ? 0xeef2f7 : 0x171b13);
    if (floorMatRef.current) floorMatRef.current.color.setHex(isLightMode ? 0xd2d9e2 : 0x0e1109);
    if (gridRef.current) {
      const gm = gridRef.current.material as THREE.LineBasicMaterial;
      gm.vertexColors = false;
      gm.color.setHex(isLightMode ? 0x94a3b8 : 0x1c2a30);
      gm.needsUpdate = true;
    }
  }, [isLightMode]);

  // ── Three.js scene (imperative, fully torn down on unmount) ──────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const lightInit = isLightInitRef.current;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const bgHex = lightInit ? 0xe2e8f0 : 0x090d16;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.Fog(bgHex, 24, 50);
    sceneRef.current = scene;

    // near/far kept tight (ratio ~80:1) for good depth-buffer precision at the
    // far chart, so the depth-of-field focus locks cleanly on it.
    const camera = new THREE.PerspectiveCamera(62, 1, 0.5, 40);
    camera.position.set(0, 1.6, 6);
    camera.rotation.order = "YXZ";

    // ── brighter, balanced lighting ──
    const ambient = new THREE.AmbientLight(0xffffff, lightInit ? 1.5 : 1.05);
    ambientRef.current = ambient;
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(
      0xffffff,
      lightInit ? 0xcbd5e1 : 0x444444,
      lightInit ? 0.8 : 0.6,
    );
    hemi.position.set(0, ROOM_H, 0);
    hemiRef.current = hemi;
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 0.6);
    key.position.set(6, 10, 8);
    scene.add(key);
    const cyan = new THREE.PointLight(0x00f2fe, 0.5, 40);
    cyan.position.set(-6, 3.5, 2);
    scene.add(cyan);
    const violet = new THREE.PointLight(0x9333ea, 0.5, 40);
    violet.position.set(6, 3.5, -2);
    scene.add(violet);
    const chartLight = new THREE.SpotLight(0xffffff, 1.0, 30, Math.PI / 5, 0.5);
    chartLight.position.set(0, 5, -4);
    chartLight.target.position.set(0, 2.5, -12);
    scene.add(chartLight, chartLight.target);

    // ── room shell, balanced materials (roughness 0.4 / metalness 0.1) ──
    const wallMat = new THREE.MeshStandardMaterial({
      color: lightInit ? 0xeef2f7 : 0x171b13,
      roughness: 0.4,
      metalness: 0.1,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      color: lightInit ? 0xd2d9e2 : 0x0e1109,
      roughness: 0.4,
      metalness: 0.1,
    });
    wallMatRef.current = wallMat;
    floorMatRef.current = floorMat;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, Z_FRONT - Z_BACK), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, (Z_BACK + Z_FRONT) / 2);
    scene.add(floor);

    const grid = new THREE.GridHelper(
      ROOM_W,
      24,
      lightInit ? 0x94a3b8 : 0x1c2a30,
      lightInit ? 0x94a3b8 : 0x1c2a30,
    );
    {
      const gm = grid.material as THREE.LineBasicMaterial;
      gm.transparent = true;
      gm.opacity = 0.5;
    }
    grid.position.set(0, 0.02, (Z_BACK + Z_FRONT) / 2);
    gridRef.current = grid;
    scene.add(grid);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, Z_FRONT - Z_BACK), wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, ROOM_H, (Z_BACK + Z_FRONT) / 2);
    scene.add(ceiling);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), wallMat);
    backWall.position.set(0, ROOM_H / 2, Z_BACK);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(Z_FRONT - Z_BACK, ROOM_H), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-ROOM_W / 2, ROOM_H / 2, (Z_BACK + Z_FRONT) / 2);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(Z_FRONT - Z_BACK, ROOM_H), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(ROOM_W / 2, ROOM_H / 2, (Z_BACK + Z_FRONT) / 2);
    scene.add(rightWall);

    // neon accent strips (always lit — visible in both themes)
    const stripGeo = new THREE.PlaneGeometry(0.06, ROOM_H);
    const stripL = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: 0x00f2fe }));
    stripL.position.set(-3.4, ROOM_H / 2, Z_BACK + 0.05);
    const stripR = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: 0x9333ea }));
    stripR.position.set(3.4, ROOM_H / 2, Z_BACK + 0.05);
    scene.add(stripL, stripR);

    // ── Snellen chart on the back wall (far) ──
    const snellenTex = makeSnellenTexture();
    const chart = new THREE.Mesh(
      new THREE.PlaneGeometry(2.9, 3.74),
      new THREE.MeshBasicMaterial({ map: snellenTex }),
    );
    chart.position.set(0, 2.7, Z_BACK + 0.2);
    scene.add(chart);
    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 3.94),
      new THREE.MeshBasicMaterial({ color: 0x2a2f24 }),
    );
    frame.position.set(0, 2.7, Z_BACK + 0.15);
    scene.add(frame);

    // ── desk + prescription near the camera ──
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.0, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.5, metalness: 0.1 }),
    );
    desk.position.set(0, 0.5, 4);
    scene.add(desk);

    const bookTex = makeBookTexture();
    const book = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.12),
      new THREE.MeshBasicMaterial({ map: bookTex, side: THREE.DoubleSide }),
    );
    book.position.set(0, 1.02, 4.05);
    book.rotation.x = -Math.PI / 2 + 0.62;
    scene.add(book);

    // ── colour reference samples ──
    const sampleColors = [0xe23b3b, 0x35b04a, 0x3361e2, 0xe2c12d, 0xe27a1f, 0x8b3be2];
    sampleColors.forEach((col, i) => {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 20, 20),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.1 }),
      );
      s.position.set(-2.5 + i, 0.26, -1.5);
      scene.add(s);
    });

    // ── post-processing: Depth of Field via BokehPass ──
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bokehPass = new BokehPass(scene, camera, { focus: 10, aperture: 0.00001, maxblur: 0.0 });
    composer.addPass(bokehPass);
    const bokeh = bokehPass.uniforms as unknown as BokehUniforms;

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      bokeh.aspect.value = w / h;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // ── look + move ──
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let yaw = 0;
    let pitch = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const startDrag = (x: number, y: number) => {
      dragging = true;
      lastX = x;
      lastY = y;
    };
    const moveDrag = (x: number, y: number) => {
      if (!dragging) return;
      const dx = x - lastX;
      const dy = y - lastY;
      lastX = x;
      lastY = y;
      yaw -= dx * 0.0045;
      pitch -= dy * 0.0045;
      pitch = Math.max(-1.1, Math.min(1.1, pitch));
    };
    const endDrag = () => {
      dragging = false;
    };

    const onMouseDown = (e: MouseEvent) => startDrag(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
      e.preventDefault();
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrag);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", endDrag);

    const clock = new THREE.Clock();
    const fwdV = new THREE.Vector3();
    const rightV = new THREE.Vector3();
    const moveV = new THREE.Vector3();
    const tmpFocus = new THREE.Vector3();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const speed = 3.1 * dt;

      camera.rotation.y = yaw;
      camera.rotation.x = pitch;

      fwdV.set(0, 0, -1).applyQuaternion(camera.quaternion);
      fwdV.y = 0;
      fwdV.normalize();
      rightV.set(1, 0, 0).applyQuaternion(camera.quaternion);
      rightV.y = 0;
      rightV.normalize();
      moveV.set(0, 0, 0);
      if (keys["KeyW"]) moveV.add(fwdV);
      if (keys["KeyS"]) moveV.sub(fwdV);
      if (keys["KeyD"]) moveV.add(rightV);
      if (keys["KeyA"]) moveV.sub(rightV);
      if (moveV.lengthSq() > 0) {
        moveV.normalize().multiplyScalar(speed);
        camera.position.add(moveV);
        camera.position.x = Math.max(-ROOM_W / 2 + 1, Math.min(ROOM_W / 2 - 1, camera.position.x));
        camera.position.z = Math.max(Z_BACK + 1.5, Math.min(Z_FRONT - 1, camera.position.z));
      }

      // ── depth-of-field driven by diopter (base) × intensity (multiplier) ──
      // When the correction lens is active, the inverse effect cancels the blur.
      const { deficiency: def, intensity: inten, diopter: dpt, corrected: corr } = fxRef.current;
      if (corr || (def !== "myopia" && def !== "hyperopia")) {
        bokeh.maxblur.value = 0;
        bokeh.aperture.value = 0.00001;
      } else {
        const t = inten / 100;
        const mag = Math.abs(parseFloat(dpt)) || 0;
        // Live camera→target distance (camera-space forward depth) so the focus
        // plane stays locked on the target regardless of where the user walks.
        camera.updateMatrixWorld();
        camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
        const focusTarget = def === "hyperopia" ? CHART_POS : BOOK_POS;
        tmpFocus.copy(focusTarget).applyMatrix4(camera.matrixWorldInverse);
        const targetDist = Math.max(0.3, -tmpFocus.z);
        if (def === "hyperopia") {
          const dptF = Math.min(mag / 10, 1);
          const sev = dptF * (0.4 + 0.6 * t);
          // Focus stays exactly on the far chart. A LOW aperture gives a deep far
          // field, so the chart stays sharp even at +10 D and despite depth-buffer
          // imprecision — yet the very near book still blurs hard (huge defocus).
          bokeh.focus.value = targetDist;
          bokeh.aperture.value = 0.012;
          bokeh.maxblur.value = 0.004 + sev * 0.03;
        } else {
          const dptF = Math.min(mag / 12, 1);
          const sev = dptF * (0.4 + 0.6 * t);
          // Mild myopia: focus on the near book (chart blurs). Severe myopia:
          // the clear plane is pulled in front of the book so even near fogs.
          // Higher aperture so distance blurs hard and severe myopia fogs near.
          bokeh.focus.value = THREE.MathUtils.lerp(targetDist, 0.4, dptF);
          bokeh.aperture.value = 0.05;
          bokeh.maxblur.value = 0.004 + sev * 0.03;
        }
      }

      composer.render();
    };

    resize();
    animate();

    // ── teardown: stop the loop and free every GPU resource ──
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endDrag);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", endDrag);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        const mats = Array.isArray(mat) ? mat : mat ? [mat] : [];
        mats.forEach((m) => {
          const withMap = m as THREE.MeshBasicMaterial;
          if (withMap.map) withMap.map.dispose();
          m.dispose();
        });
      });
      snellenTex.dispose();
      bookTex.dispose();
      composer.dispose();
      renderer.dispose();
      sceneRef.current = null;
      ambientRef.current = null;
      hemiRef.current = null;
      wallMatRef.current = null;
      floorMatRef.current = null;
      gridRef.current = null;
    };
  }, []);

  // ── theme-aware UI classes ──
  const panelCls = isLightMode
    ? "border border-slate-300/80 bg-white/85 text-slate-800 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.35)]"
    : "border border-[#9333EA]/25 bg-[#11140f]/72 text-[#f5e9d0] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]";
  const accentCls = isLightMode ? "text-violet-600" : "text-[#9333EA]";
  const cyanCls = isLightMode ? "text-cyan-600" : "text-[#00f2fe]";
  const subCls = isLightMode ? "text-slate-500" : "text-[#f5e9d0]/55";
  const bodyCls = isLightMode ? "text-slate-600" : "text-[#f5e9d0]/80";
  const hintCls = isLightMode ? "bg-white/75 text-slate-600" : "bg-[#11140f]/70 text-[#f5e9d0]/90";

  return (
    <div
      ref={wrapRef}
      className={`absolute inset-0 m-4 mt-2 overflow-hidden rounded-3xl ${isLightMode ? "bg-[#e2e8f0]" : "bg-[#090d16]"}`}
      onPointerDownCapture={(e) => {
        // doar interacțiunile cu scena 3D contează ca "schimbă perspectiva"
        if ((e.target as HTMLElement).tagName === "CANVAS") dispatchOnboardingStep("perspective");
      }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
        style={{ filter: vision.filter, transition: "filter 0.35s ease" }}
      />

      {/* effect overlays (glaucoma tunnel / macular spot) */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={vision.vignette}
      />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={vision.macular}
      />

      {/* crosshair */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border ${isLightMode ? "border-slate-600/60" : "border-white/50"}`}
      />

      {/* hint */}
      <div
        className={`pointer-events-none absolute left-1/2 top-3 max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-lg px-3 py-1.5 text-center text-[11px] backdrop-blur-sm lg:top-auto lg:bottom-4 lg:max-w-none ${hintCls}`}
      >
        {isEn
          ? "WASD to walk · drag to look · far chart vs. near reading"
          : "WASD ca să mergi · trage ca să privești · tabel la distanță vs. citit de aproape"}
      </div>

      {/* Panourile. Sub lg: o singură coloană derulabilă peste partea de jos a
          canvasului (control → rețetă → diagnostic), ca ele să nu se mai
          suprapună, iar scena 3D rămâne vizibilă și manevrabilă deasupra.
          De la lg în sus: exact poziționarea absolută de dinainte. */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 top-[38%] flex flex-col gap-3 overflow-y-auto p-3 lg:pointer-events-none lg:inset-0 lg:top-0 lg:block lg:overflow-visible lg:p-0">
        {/* right-side stack: control + dynamic info card share one flex column so
          they can never overlap, even at the largest text-size setting. */}
        <div className="contents lg:pointer-events-none lg:absolute lg:right-4 lg:top-4 lg:bottom-4 lg:flex lg:w-[330px] lg:max-w-[calc(100%-2rem)] lg:flex-col lg:gap-3">
          {/* control panel — natural height; its dropdown can overflow freely */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className={`pointer-events-auto relative z-30 order-1 shrink-0 rounded-2xl p-5 backdrop-blur-md lg:order-none ${panelCls}`}
          >
            <div className="mb-4 flex items-center gap-2.5">
              <div
                className={`flex size-9 items-center justify-center rounded-xl ring-1 ${isLightMode ? "bg-violet-100 ring-violet-200" : "bg-gradient-to-br from-[#9333EA]/35 to-[#00f2fe]/10 ring-[#9333EA]/30"}`}
              >
                <Glasses className={`size-4.5 ${accentCls}`} />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight">
                  {isEn ? "Optic cabinet simulator" : "Simulator cabinet optic"}
                </h2>
                <p className={`text-[11px] ${subCls}`}>
                  {isEn
                    ? "Educational demo, not a diagnosis"
                    : "Demo educațional, nu un diagnostic"}
                </p>
              </div>
            </div>

            <label
              className={`mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] ${accentCls}`}
            >
              {isEn ? "Deficiency" : "Deficiență"}
            </label>
            <DeficiencySelect
              value={deficiency}
              onChange={selectDeficiency}
              lang={lang}
              isLightMode={isLightMode}
            />

            {/* diopter selector — only for refractive errors */}
            <AnimatePresence initial={false}>
              {isDof && (
                <motion.div
                  key="diopters"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="mt-4"
                >
                  <label
                    className={`mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.14em] ${accentCls}`}
                  >
                    {isEn ? "Diopters" : "Dioptrii"}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {diopterOptions.map((d) => {
                      const active = d === diopter;
                      const cls = active
                        ? isLightMode
                          ? "bg-violet-600 text-white border-violet-600 shadow-[0_4px_14px_-6px_rgba(124,58,237,0.8)]"
                          : "bg-[#9333EA] text-white border-[#9333EA] shadow-[0_0_14px_-4px_#9333EA]"
                        : isLightMode
                          ? "border-slate-300 text-slate-600 hover:border-violet-400"
                          : "border-[#9333EA]/25 text-[#f5e9d0]/80 hover:border-[#9333EA]/60";
                      return (
                        <motion.button
                          key={d}
                          type="button"
                          whileTap={{ scale: 0.92 }}
                          onClick={() => {
                            setDiopter(d);
                            dispatchOnboardingStep("diagnosis");
                          }}
                          className={`rounded-lg border px-1 py-1.5 text-[11px] font-semibold tabular-nums transition-all ${cls}`}
                        >
                          {d}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 mb-1.5 flex items-center justify-between">
              <label
                htmlFor="vs-intensity"
                className={`text-[10.5px] font-semibold uppercase tracking-[0.14em] ${accentCls}`}
              >
                {isDof ? (isEn ? "Progression" : "Progresie") : isEn ? "Intensity" : "Intensitate"}
              </label>
              <span
                className={`text-xs font-bold tabular-nums ${isLightMode ? "text-violet-700" : "text-[#d9b8ff]"}`}
              >
                {intensity}
              </span>
            </div>
            <input
              id="vs-intensity"
              type="range"
              min={0}
              max={100}
              value={intensity}
              onChange={(e) => {
                setIntensity(Number(e.target.value));
                dispatchOnboardingStep("diagnosis");
              }}
              className={`santix-range h-1.5 w-full cursor-pointer rounded-full ${isLightMode ? "bg-slate-200" : "bg-white/15"}`}
              style={{ accentColor: "#9333EA" }}
            />

            <div
              className={`mt-4 flex gap-2 rounded-xl border p-3 ${isLightMode ? "border-cyan-200 bg-cyan-50" : "border-[#00f2fe]/15 bg-[#00f2fe]/[0.05]"}`}
            >
              <Eye className={`mt-0.5 size-3.5 shrink-0 ${cyanCls}`} />
              <p className={`text-[11.5px] leading-relaxed ${bodyCls}`}>
                {isEn ? current.descEn : current.descRo}
              </p>
            </div>

            {/* Comutatorul de corecție: arată cum lentila/tratamentul potrivit
                anulează efectul optic. Trăia în fișa de pacient, acum eliminată. */}
            {deficiency !== "none" && (
              <>
                <button
                  type="button"
                  onClick={() => setCorrected((c) => !c)}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12.5px] font-bold text-white transition-all ${
                    corrected
                      ? "bg-emerald-500 shadow-[0_0_22px_-6px_rgba(16,185,129,0.85)] hover:bg-emerald-600"
                      : "bg-gradient-to-br from-[#9333EA] to-[#00f2fe] shadow-[0_8px_22px_-12px_rgba(147,51,234,0.9)] hover:-translate-y-[1px]"
                  }`}
                >
                  {corrected ? <Check className="size-4" /> : <Glasses className="size-4" />}
                  {corrected
                    ? isEn
                      ? `Disable ${correctionNoun}`
                      : `Dezactivează ${correctionNoun}`
                    : isEn
                      ? `Enable ${correctionNoun}`
                      : `Activează ${correctionNoun}`}
                </button>
                <p
                  className={`mt-2 text-center text-[10.5px] ${corrected ? "text-emerald-400" : subCls}`}
                >
                  {corrected
                    ? isEn
                      ? "Vision corrected — the optical effect is cancelled."
                      : "Vedere corectată — efectul optic este anulat."
                    : isEn
                      ? "See how the right correction restores the simulated vision."
                      : "Vezi cum corecția potrivită reface vederea simulată."}
                </p>
              </>
            )}
          </motion.div>

          {/* dynamic medical info card */}
          <AnimatePresence mode="wait">
            {deficiency !== "none" && (
              <motion.aside
                key={deficiency}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.22 }}
                className={`pointer-events-auto relative z-10 order-3 shrink-0 rounded-2xl p-5 backdrop-blur-md lg:order-none lg:mt-auto lg:min-h-0 lg:shrink lg:overflow-y-auto ${panelCls}`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-bold tracking-tight">
                    {isEn ? current.en : current.ro}
                  </h3>
                  {isDof && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${isLightMode ? "bg-violet-100 text-violet-700" : "bg-[#9333EA]/20 text-[#d9b8ff]"}`}
                    >
                      {diopter} dpt · {diopterSeverity(diopterMag, isEn)}
                    </span>
                  )}
                </div>

                <p className={`mb-3 text-[12px] leading-relaxed ${bodyCls}`}>
                  {isEn ? current.bioEn : current.bioRo}
                </p>

                {isDof && (
                  <div
                    className={`mb-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] ${isLightMode ? "bg-violet-50 text-violet-700" : "bg-[#9333EA]/10 text-[#d9b8ff]"}`}
                  >
                    <Lightbulb className="size-3 shrink-0" />
                    {deficiency === "myopia"
                      ? isEn
                        ? `Far point in focus: ~${farPointMeters} m — beyond it everything fogs out.`
                        : `Punct îndepărtat clar: ~${farPointMeters} m — dincolo de el, totul se încețoșează.`
                      : isEn
                        ? "Increased focusing effort: near reading becomes blurry and tiring."
                        : "Efort de focalizare crescut: cititul de aproape devine neclar și obositor."}
                  </div>
                )}

                <div className="mb-2.5 flex gap-2">
                  <Eye className={`mt-0.5 size-3.5 shrink-0 ${cyanCls}`} />
                  <div>
                    <div
                      className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${isLightMode ? "text-cyan-700" : "text-[#00f2fe]/80"}`}
                    >
                      {isEn ? "Symptoms" : "Simptome"}
                    </div>
                    <p
                      className={`text-[11.5px] leading-relaxed ${isLightMode ? "text-slate-600" : "text-[#f5e9d0]/75"}`}
                    >
                      {isEn ? current.sympEn : current.sympRo}
                    </p>
                  </div>
                </div>

                <div
                  className={`flex gap-2 rounded-xl border p-2.5 ${isLightMode ? "border-violet-200 bg-violet-50" : "border-[#9333EA]/20 bg-[#9333EA]/[0.07]"}`}
                >
                  <Stethoscope className={`mt-0.5 size-3.5 shrink-0 ${accentCls}`} />
                  <div>
                    <div
                      className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${isLightMode ? "text-violet-700" : "text-[#d9b8ff]"}`}
                    >
                      {isEn ? "Correction" : "Corectare"}
                    </div>
                    <p className={`text-[11.5px] leading-relaxed ${bodyCls}`}>
                      {isEn ? current.corrEn : current.corrRo}
                    </p>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* hidden SVG colour-matrix filters for colour blindness */}
      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          <filter id="santix-protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"
            />
          </filter>
          <filter id="santix-deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"
            />
          </filter>
          <filter id="santix-tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"
            />
          </filter>
          {/* Metamorfopsie (DMLV): liniile drepte apar ondulate */}
          <filter id="santix-metamorphopsia" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.018"
              numOctaves="1"
              seed="7"
              result="warp"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="warp"
              scale={amdWarp}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
