export type PainLevel = "usor" | "mediu" | "consultare_doctor";

export interface SymptomAnalysis {
  nivel: PainLevel;
  title?: string;
  cauze: string[];
  recomandare: string;
  explicatieNivel: string;
  redFlags: string[];
}

export interface SymptomValidation {
  ok: boolean;
  message?: string;
}

export interface PainLevelDetails {
  label: string;
  labelEn: string;
  tone: string;
  summary: string;
  summaryEn: string;
  keywords: string[];
}

export const painLevels: Record<PainLevel, PainLevelDetails> = {
  usor: {
    label: "Ușor",
    labelEn: "Minor",
    tone: "bg-success/15 border-success/30 text-success",
    summary: "Disconfort minor, de obicei legat de efort, postură sau oboseală locală.",
    summaryEn: "Minor discomfort, usually related to exertion, posture or local fatigue.",
    keywords: ["ușor", "usor", "jenă", "jena", "oboseală", "oboseala", "crampă", "crampa", "după efort", "dupa efort"],
  },
  mediu: {
    label: "Mediu",
    labelEn: "Moderate",
    tone: "bg-[oklch(0.82_0.16_85_/_0.18)] border-[oklch(0.72_0.16_85_/_0.35)] text-[oklch(0.46_0.13_70)]",
    summary: "Durere persistentă sau limitare la mișcare care merită monitorizată atent.",
    summaryEn: "Persistent pain or movement restriction worth monitoring carefully.",
    keywords: ["persistent", "moderat", "mediu", "limitare", "umflat", "inflamat", "arsură", "arsura", "tensiune", "înțepătură", "intepatura"],
  },
  consultare_doctor: {
    label: "Consultare doctor",
    labelEn: "See a doctor",
    tone: "bg-destructive/10 border-destructive/30 text-destructive",
    summary: "Semne care pot indica o problemă importantă și justifică evaluare medicală.",
    summaryEn: "Signs that may indicate a significant problem and justify medical evaluation.",
    keywords: [
      "sever",
      "insuportabil",
      "nu pot",
      "amorțeală",
      "amorteala",
      "slăbiciune",
      "slabiciune",
      "ruptură",
      "ruptura",
      "traumă",
      "trauma",
      "febră",
      "febra",
      "deformare",
      "pocnit",
      "pocnitură",
      "pocnitura",
    ],
  },
};

export function getPainLevelLabel(nivel: PainLevel, lang: "ro" | "en"): string {
  return lang === "en" ? painLevels[nivel].labelEn : painLevels[nivel].label;
}

export interface PainQuestionOption {
  label: string;
  score: Partial<Record<PainLevel, number>>;
  finding?: string;
}

export interface PainQuestion {
  id: string;
  question: string;
  options: PainQuestionOption[];
}

export type PainTissueType = "os" | "muschi" | "tendon" | "organ";

type PainQuestionContext = {
  structureId?: string;
  selectedName?: string;
  segment?: string;
  group?: string;
};


const baseQuestionsRo: PainQuestion[] = [
  {
    id: "varsta",
    question: "Ce vârstă are persoana?",
    options: [
      { label: "Sub 12 ani", score: { mediu: 1, consultare_doctor: 1 }, finding: "copil" },
      { label: "12-64 ani", score: { usor: 1 }, finding: "adult" },
      { label: "65+ ani", score: { mediu: 1, consultare_doctor: 1 }, finding: "vârstă înaintată" },
    ],
  },
  {
    id: "intensitate",
    question: "Cât de intensă este durerea?",
    options: [
      { label: "Ușoară, suportabilă", score: { usor: 2 }, finding: "durere ușoară" },
      { label: "Moderată, deranjează mișcarea", score: { mediu: 3 }, finding: "durere moderată cu limitare" },
      { label: "Severă sau insuportabilă", score: { consultare_doctor: 5 }, finding: "durere severă" },
    ],
  },
  {
    id: "debut",
    question: "Cum a început?",
    options: [
      { label: "Treptat, după efort", score: { usor: 2, mediu: 1 }, finding: "debut după efort" },
      { label: "Brusc, în timpul unei mișcări", score: { mediu: 2, consultare_doctor: 1 }, finding: "debut brusc" },
      { label: "După lovitură, cădere sau pocnet", score: { consultare_doctor: 5 }, finding: "traumă sau pocnet" },
    ],
  },
  {
    id: "functie",
    question: "Poți folosi zona afectată?",
    options: [
      { label: "Da, aproape normal", score: { usor: 2 }, finding: "funcție păstrată" },
      { label: "Da, dar cu limitare", score: { mediu: 3 }, finding: "funcție limitată" },
      { label: "Nu pot folosi zona", score: { consultare_doctor: 5 }, finding: "imposibilitate funcțională" },
    ],
  },
  {
    id: "semne",
    question: "Există semne vizibile sau simptome asociate?",
    options: [
      { label: "Nu, doar disconfort", score: { usor: 2 }, finding: "fără semne vizibile" },
      { label: "Umflare ușoară sau sensibilitate", score: { mediu: 2 }, finding: "umflare sau sensibilitate" },
      { label: "Vânătaie mare, deformare, febră, amorțeală sau slăbiciune", score: { consultare_doctor: 6 }, finding: "semne de alarmă" },
    ],
  },
  {
    id: "durata",
    question: "De cât timp persistă?",
    options: [
      { label: "Mai puțin de 24-48 ore", score: { usor: 1 }, finding: "durată scurtă" },
      { label: "Câteva zile și nu trece", score: { mediu: 2 }, finding: "persistență de câteva zile" },
      { label: "Se agravează sau revine frecvent", score: { consultare_doctor: 2, mediu: 2 }, finding: "agravare sau recurență" },
    ],
  },
];

const tissueQuestionsRo: Partial<Record<"os" | "muschi" | "tendon", PainQuestion[]>> = {
  muschi: [
    {
      id: "muschi_contractie",
      question: "Durerea apare mai ales când contractezi mușchiul?",
      options: [
        { label: "Da, dar pot continua mișcarea", score: { usor: 1, mediu: 1 }, finding: "durere la contracție" },
        { label: "Da, limitează clar mișcarea", score: { mediu: 3 }, finding: "durere musculară cu limitare" },
        { label: "Da, cu pierdere de forță", score: { consultare_doctor: 4 }, finding: "pierdere de forță" },
      ],
    },
  ],
  tendon: [
    {
      id: "tendon_miscare",
      question: "Durerea apare pe traseul tendonului la mișcări repetate?",
      options: [
        { label: "Da, doar după efort", score: { usor: 1 }, finding: "durere tendinoasă după efort" },
        { label: "Da, aproape la fiecare mișcare", score: { mediu: 3 }, finding: "durere tendinoasă repetitivă" },
        { label: "Da, cu pocnet sau pierdere de funcție", score: { consultare_doctor: 5 }, finding: "posibilă leziune de tendon" },
      ],
    },
  ],
  os: [
    {
      id: "os_sprijin",
      question: "Durerea crește la sprijin sau presiune pe os?",
      options: [
        { label: "Puțin", score: { usor: 1 }, finding: "sensibilitate osoasă ușoară" },
        { label: "Da, clar", score: { mediu: 3 }, finding: "durere la sprijin" },
        { label: "Nu pot sprijini sau există deformare", score: { consultare_doctor: 5 }, finding: "imposibilitate de sprijin" },
      ],
    },
  ],
};

const organQuestionsRo: PainQuestion[] = [
  {
    id: "varsta",
    question: "Ce vârstă are persoana?",
    options: [
      { label: "Sub 12 ani", score: { mediu: 1, consultare_doctor: 1 }, finding: "copil" },
      { label: "12-64 ani", score: { usor: 1 }, finding: "adult" },
      { label: "65+ ani", score: { mediu: 1, consultare_doctor: 1 }, finding: "vârstă înaintată" },
    ],
  },
  {
    id: "intensitate",
    question: "Cât de intens este disconfortul sau durerea?",
    options: [
      { label: "Ușor, suportabil", score: { usor: 2 }, finding: "disconfort ușor" },
      { label: "Moderat, deranjează activitatea", score: { mediu: 3 }, finding: "disconfort moderat" },
      { label: "Sever, brusc sau greu de suportat", score: { consultare_doctor: 5 }, finding: "durere severă" },
    ],
  },
  {
    id: "debut",
    question: "Cum a apărut?",
    options: [
      { label: "Treptat sau după masă/efort", score: { usor: 1, mediu: 1 }, finding: "debut treptat" },
      { label: "Brusc, fără cauză clară", score: { mediu: 3 }, finding: "debut brusc" },
      { label: "Brusc, cu stare foarte rea", score: { consultare_doctor: 5 }, finding: "debut brusc sever" },
    ],
  },
  {
    id: "semne",
    question: "Există simptome asociate?",
    options: [
      { label: "Nu, doar disconfort local", score: { usor: 2 }, finding: "fără simptome asociate" },
      { label: "Greață, tuse, urinare modificată sau digestie dificilă", score: { mediu: 3 }, finding: "simptome asociate moderate" },
      {
        label: "Febră mare, lipsă de aer, durere în piept, leșin sau sânge în urină/scaun",
        score: { consultare_doctor: 7 },
        finding: "semne de alarmă organice",
      },
    ],
  },
  {
    id: "durata",
    question: "De cât timp persistă?",
    options: [
      { label: "Mai puțin de 24 ore și se ameliorează", score: { usor: 1 }, finding: "durată scurtă" },
      { label: "Câteva zile sau revine frecvent", score: { mediu: 2 }, finding: "persistență" },
      { label: "Se agravează rapid", score: { consultare_doctor: 4 }, finding: "agravare rapidă" },
    ],
  },
];

const organSpecificQuestionsRo: Record<string, PainQuestion> = {
  "organ:inima": {
    id: "organ_inima",
    question: "Apare apăsare în piept, palpitații sau lipsă de aer?",
    options: [
      { label: "Nu", score: { usor: 1 }, finding: "fără simptome cardiace importante" },
      { label: "Da, la efort sau stres", score: { mediu: 3 }, finding: "simptome cardiace la efort" },
      { label: "Da, în repaus, cu lipsă de aer sau leșin", score: { consultare_doctor: 7 }, finding: "semne cardiace de alarmă" },
    ],
  },
  "organ:plamani": {
    id: "organ_plamani",
    question: "Ai dificultăți de respirație, tuse persistentă sau durere la respirație?",
    options: [
      { label: "Nu", score: { usor: 1 }, finding: "fără dificultate respiratorie" },
      { label: "Ușor, mai ales la efort", score: { mediu: 3 }, finding: "disconfort respirator la efort" },
      { label: "Da, lipsă de aer în repaus, buze vineții sau durere toracică", score: { consultare_doctor: 7 }, finding: "semne respiratorii de alarmă" },
    ],
  },
  "organ:ficat": {
    id: "organ_ficat",
    question: "Apare durere în dreapta sus, greață sau îngălbenirea pielii/ochilor?",
    options: [
      { label: "Nu", score: { usor: 1 }, finding: "fără semne hepatice evidente" },
      { label: "Durere sau greață ușoară", score: { mediu: 3 }, finding: "simptome digestive/hepatice moderate" },
      { label: "Piele/ochi galbeni, urină foarte închisă sau durere severă", score: { consultare_doctor: 6 }, finding: "semne hepatice de alarmă" },
    ],
  },
  "organ:stomac": {
    id: "organ_stomac",
    question: "Disconfortul este legat de masă, arsuri sau vărsături?",
    options: [
      { label: "Ușor și trecător", score: { usor: 2 }, finding: "disconfort gastric ușor" },
      { label: "Arsuri, greață sau vărsături repetate", score: { mediu: 3 }, finding: "simptome gastrice moderate" },
      { label: "Vărsături cu sânge, scaun negru sau durere severă", score: { consultare_doctor: 7 }, finding: "semne gastrice de alarmă" },
    ],
  },
  "organ:rinichi": {
    id: "organ_rinichi",
    question: "Ai durere lombară, usturime la urinare sau sânge în urină?",
    options: [
      { label: "Nu", score: { usor: 1 }, finding: "fără semne urinare evidente" },
      { label: "Usturime, urinări dese sau durere lombară moderată", score: { mediu: 3 }, finding: "simptome urinare moderate" },
      { label: "Febră, frisoane, sânge în urină sau durere foarte puternică", score: { consultare_doctor: 7 }, finding: "semne renale de alarmă" },
    ],
  },
  "organ:intestine": {
    id: "organ_intestine",
    question: "Există balonare, diaree/constipație sau sânge în scaun?",
    options: [
      { label: "Nu, doar disconfort trecător", score: { usor: 1 }, finding: "disconfort intestinal ușor" },
      { label: "Balonare, diaree sau constipație câteva zile", score: { mediu: 3 }, finding: "simptome intestinale moderate" },
      { label: "Sânge în scaun, durere severă sau abdomen foarte umflat", score: { consultare_doctor: 7 }, finding: "semne intestinale de alarmă" },
    ],
  },
  "organ:splina": {
    id: "organ_splina",
    question: "Durerea este în stânga sus sau a apărut după lovitură în abdomen?",
    options: [
      { label: "Nu", score: { usor: 1 }, finding: "fără semne splenice evidente" },
      { label: "Disconfort în stânga sus", score: { mediu: 3 }, finding: "durere în stânga sus" },
      { label: "După lovitură, cu amețeală sau durere severă", score: { consultare_doctor: 7 }, finding: "semne splenice de alarmă" },
    ],
  },
  "organ:pancreas": {
    id: "organ_pancreas",
    question: "Durerea este sus în abdomen și merge spre spate?",
    options: [
      { label: "Nu", score: { usor: 1 }, finding: "fără tipar pancreatic evident" },
      { label: "Da, ușor/moderat, cu greață", score: { mediu: 3 }, finding: "simptome pancreatice moderate" },
      { label: "Da, sever, cu vărsături sau stare generală proastă", score: { consultare_doctor: 7 }, finding: "semne pancreatice de alarmă" },
    ],
  },
  "organ:vezica-urinara": {
    id: "organ_vezica",
    question: "Ai usturime, urinări dese sau nu poți urina?",
    options: [
      { label: "Nu", score: { usor: 1 }, finding: "fără semne vezicale evidente" },
      { label: "Usturime sau urinări dese", score: { mediu: 3 }, finding: "simptome urinare joase" },
      { label: "Nu pot urina, am febră sau sânge în urină", score: { consultare_doctor: 7 }, finding: "semne urinare de alarmă" },
    ],
  },
  "organ:esofag": {
    id: "organ_esofag",
    question: "Ai arsuri, durere la înghițire sau dificultate la înghițire?",
    options: [
      { label: "Arsuri rare, trecătoare", score: { usor: 1 }, finding: "reflux ușor posibil" },
      { label: "Durere sau arsură frecventă", score: { mediu: 3 }, finding: "simptome esofagiene moderate" },
      { label: "Nu pot înghiți, durere severă sau sânge", score: { consultare_doctor: 7 }, finding: "semne esofagiene de alarmă" },
    ],
  },
  "organ:trahee": {
    id: "organ_trahee",
    question: "Respirația este zgomotoasă sau simți că aerul trece greu?",
    options: [
      { label: "Nu", score: { usor: 1 }, finding: "fără semne traheale evidente" },
      { label: "Ușor, cu tuse sau iritație", score: { mediu: 3 }, finding: "iritare respiratorie moderată" },
      { label: "Da, respirație dificilă, șuierat sever sau sufocare", score: { consultare_doctor: 8 }, finding: "semne de obstrucție respiratorie" },
    ],
  },
};

const muscleSpecificQuestionsRo: Record<string, PainQuestion> = {
  "muschi:muschii-bratului": {
    id: "muschi_brat_specific",
    question: "Durerea apare când ridici, împingi sau tragi cu brațul?",
    options: [
      { label: "Doar după efort", score: { usor: 1 }, finding: "disconfort la efortul brațului" },
      { label: "Da, limitează forța", score: { mediu: 3 }, finding: "limitare la braț" },
      { label: "Da, cu pierdere clară de forță sau umflare mare", score: { consultare_doctor: 5 }, finding: "semne musculare importante la braț" },
    ],
  },
  "muschi:muschii-antebratului": {
    id: "muschi_antebrat_specific",
    question: "Durerea crește la strângerea pumnului sau mișcarea încheieturii?",
    options: [
      { label: "Puțin, după folosire", score: { usor: 1 }, finding: "suprasolicitare antebraț" },
      { label: "Da, scade priza", score: { mediu: 3 }, finding: "priză slăbită" },
      { label: "Da, cu amorțeală sau slăbiciune în degete", score: { consultare_doctor: 5 }, finding: "semne neurologice în antebraț/mână" },
    ],
  },
  "muschi:muschii-umarului": {
    id: "muschi_umar_specific",
    question: "Poți ridica brațul deasupra capului?",
    options: [
      { label: "Da, aproape normal", score: { usor: 1 }, finding: "mobilitate păstrată la umăr" },
      { label: "Doar cu durere sau limitare", score: { mediu: 3 }, finding: "limitare la umăr" },
      { label: "Nu pot ridica brațul sau a apărut după traumatism", score: { consultare_doctor: 5 }, finding: "semne de alarmă la umăr" },
    ],
  },
  "muschi:muschii-mainii": {
    id: "muschi_mana_specific",
    question: "Durerea afectează prinderea obiectelor sau mișcarea degetelor?",
    options: [
      { label: "Nu, doar disconfort", score: { usor: 1 }, finding: "funcție păstrată la mână" },
      { label: "Da, prind mai greu", score: { mediu: 3 }, finding: "priză redusă" },
      { label: "Nu pot mișca normal degetele sau apare amorțeală", score: { consultare_doctor: 5 }, finding: "semne importante la mână" },
    ],
  },
  "muschi:muschii-coapsei": {
    id: "muschi_coapsa_specific",
    question: "Durerea apare la mers, urcat scări sau genuflexiune?",
    options: [
      { label: "Doar după efort", score: { usor: 1 }, finding: "oboseală la coapsă" },
      { label: "Da, limitează mersul", score: { mediu: 3 }, finding: "mers limitat" },
      { label: "Da, nu pot sprijini bine piciorul", score: { consultare_doctor: 5 }, finding: "limitare severă la coapsă" },
    ],
  },
  "muschi:muschii-gambei": {
    id: "muschi_gamba_specific",
    question: "Durerea apare la mers, alergare sau ridicare pe vârfuri?",
    options: [
      { label: "Doar după efort", score: { usor: 1 }, finding: "suprasolicitare gambă" },
      { label: "Da, mă face să șchiopătez", score: { mediu: 3 }, finding: "șchiopătat" },
      { label: "Da, cu umflare, roșeață sau durere bruscă intensă", score: { consultare_doctor: 6 }, finding: "semne importante la gambă" },
    ],
  },
  "muschi:muschii-piciorului": {
    id: "muschi_picior_specific",
    question: "Durerea apare când calci sau împingi în talpă?",
    options: [
      { label: "Puțin", score: { usor: 1 }, finding: "disconfort plantar ușor" },
      { label: "Da, limitează sprijinul", score: { mediu: 3 }, finding: "sprijin limitat" },
      { label: "Nu pot călca sau există umflare mare", score: { consultare_doctor: 5 }, finding: "imposibilitate de sprijin" },
    ],
  },
  "muschi:muschii-soldului": {
    id: "muschi_sold_specific",
    question: "Durerea apare la mers, rotația șoldului sau ridicarea piciorului?",
    options: [
      { label: "Doar după efort", score: { usor: 1 }, finding: "disconfort la șold după efort" },
      { label: "Da, limitează pasul", score: { mediu: 3 }, finding: "mobilitate redusă la șold" },
      { label: "Nu pot merge normal sau durerea a apărut după cădere", score: { consultare_doctor: 5 }, finding: "semne de alarmă la șold" },
    ],
  },
  "muschi:muschii-spatelui": {
    id: "muschi_spate_specific",
    question: "Durerea crește la aplecare, ridicare sau răsucire?",
    options: [
      { label: "Ușor, mai ales după postură/efort", score: { usor: 1 }, finding: "tensiune de spate" },
      { label: "Da, limitează mișcarea", score: { mediu: 3 }, finding: "spate blocat parțial" },
      { label: "Da, cu amorțeală/slăbiciune pe picior sau pierdere de control urinar", score: { consultare_doctor: 7 }, finding: "semne neurologice la spate" },
    ],
  },
  "muschi:muschii-capului-gatului": {
    id: "muschi_gat_specific",
    question: "Durerea crește când întorci capul sau menții gâtul într-o poziție?",
    options: [
      { label: "Ușor, ca tensiune", score: { usor: 1 }, finding: "tensiune cervicală" },
      { label: "Da, limitează rotația", score: { mediu: 3 }, finding: "gât rigid" },
      { label: "Da, cu febră, durere severă de cap sau amorțeală", score: { consultare_doctor: 6 }, finding: "semne cervicale de alarmă" },
    ],
  },
  "muschi:muschii-toracelui": {
    id: "muschi_torace_specific",
    question: "Durerea crește la respirație profundă, tuse sau împins?",
    options: [
      { label: "Doar după efort", score: { usor: 1 }, finding: "disconfort toracic muscular" },
      { label: "Da, dar pot respira normal", score: { mediu: 3 }, finding: "durere toracică mecanică" },
      { label: "Da, cu lipsă de aer, apăsare în piept sau amețeală", score: { consultare_doctor: 7 }, finding: "semne toracice de alarmă" },
    ],
  },
  "muschi:abdomen": {
    id: "muschi_abdomen_specific",
    question: "Durerea crește când încordezi abdomenul, tușești sau te ridici din culcat?",
    options: [
      { label: "Doar ușor, după efort", score: { usor: 1 }, finding: "tensiune abdominală musculară" },
      { label: "Da, limitează flexia trunchiului", score: { mediu: 3 }, finding: "limitare abdominală musculară" },
      { label: "Da, cu durere severă, febră sau abdomen foarte sensibil", score: { consultare_doctor: 7 }, finding: "semne abdominale de alarmă" },
    ],
  },
};


const baseQuestionsEn: PainQuestion[] = [
  {
    id: "varsta",
    question: "How old is the person?",
    options: [
      { label: "Under 12", score: { mediu: 1, consultare_doctor: 1 }, finding: "child" },
      { label: "12–64", score: { usor: 1 }, finding: "adult" },
      { label: "65+", score: { mediu: 1, consultare_doctor: 1 }, finding: "older adult" },
    ],
  },
  {
    id: "intensitate",
    question: "How intense is the pain?",
    options: [
      { label: "Mild, tolerable", score: { usor: 2 }, finding: "mild pain" },
      { label: "Moderate, restricts movement", score: { mediu: 3 }, finding: "moderate pain with restriction" },
      { label: "Severe or unbearable", score: { consultare_doctor: 5 }, finding: "severe pain" },
    ],
  },
  {
    id: "debut",
    question: "How did it start?",
    options: [
      { label: "Gradually, after exertion", score: { usor: 2, mediu: 1 }, finding: "onset after exertion" },
      { label: "Suddenly, during a movement", score: { mediu: 2, consultare_doctor: 1 }, finding: "sudden onset" },
      { label: "After a blow, fall or snap", score: { consultare_doctor: 5 }, finding: "trauma or snap" },
    ],
  },
  {
    id: "functie",
    question: "Can you use the affected area?",
    options: [
      { label: "Yes, almost normally", score: { usor: 2 }, finding: "function preserved" },
      { label: "Yes, but with limitation", score: { mediu: 3 }, finding: "limited function" },
      { label: "Cannot use the area", score: { consultare_doctor: 5 }, finding: "functional impossibility" },
    ],
  },
  {
    id: "semne",
    question: "Are there visible signs or associated symptoms?",
    options: [
      { label: "No, just discomfort", score: { usor: 2 }, finding: "no visible signs" },
      { label: "Mild swelling or tenderness", score: { mediu: 2 }, finding: "swelling or tenderness" },
      { label: "Large bruise, deformity, fever, numbness or weakness", score: { consultare_doctor: 6 }, finding: "red flag signs" },
    ],
  },
  {
    id: "durata",
    question: "How long has it persisted?",
    options: [
      { label: "Less than 24–48 hours", score: { usor: 1 }, finding: "short duration" },
      { label: "A few days without improvement", score: { mediu: 2 }, finding: "persistent for several days" },
      { label: "Getting worse or recurring", score: { consultare_doctor: 2, mediu: 2 }, finding: "worsening or recurrence" },
    ],
  },
];

const tissueQuestionsEn: Partial<Record<"os" | "muschi" | "tendon", PainQuestion[]>> = {
  muschi: [
    {
      id: "muschi_contractie",
      question: "Does the pain appear mainly when contracting the muscle?",
      options: [
        { label: "Yes, but I can continue", score: { usor: 1, mediu: 1 }, finding: "pain on contraction" },
        { label: "Yes, clearly limits movement", score: { mediu: 3 }, finding: "muscular pain with restriction" },
        { label: "Yes, with loss of strength", score: { consultare_doctor: 4 }, finding: "loss of strength" },
      ],
    },
  ],
  tendon: [
    {
      id: "tendon_miscare",
      question: "Does the pain appear along the tendon with repetitive movements?",
      options: [
        { label: "Yes, only after exertion", score: { usor: 1 }, finding: "tendinous pain after exertion" },
        { label: "Yes, with almost every movement", score: { mediu: 3 }, finding: "repetitive tendinous pain" },
        { label: "Yes, with a snap or loss of function", score: { consultare_doctor: 5 }, finding: "possible tendon injury" },
      ],
    },
  ],
  os: [
    {
      id: "os_sprijin",
      question: "Does pain increase with weight-bearing or pressure on the bone?",
      options: [
        { label: "Slightly", score: { usor: 1 }, finding: "mild bone tenderness" },
        { label: "Yes, clearly", score: { mediu: 3 }, finding: "pain on weight-bearing" },
        { label: "Cannot bear weight or there is deformity", score: { consultare_doctor: 5 }, finding: "inability to bear weight" },
      ],
    },
  ],
};

const organQuestionsEn: PainQuestion[] = [
  {
    id: "varsta",
    question: "How old is the person?",
    options: [
      { label: "Under 12", score: { mediu: 1, consultare_doctor: 1 }, finding: "child" },
      { label: "12-64", score: { usor: 1 }, finding: "adult" },
      { label: "65+", score: { mediu: 1, consultare_doctor: 1 }, finding: "older adult" },
    ],
  },
  {
    id: "intensitate",
    question: "How intense is the discomfort or pain?",
    options: [
      { label: "Mild, tolerable", score: { usor: 2 }, finding: "mild discomfort" },
      { label: "Moderate, affects activity", score: { mediu: 3 }, finding: "moderate discomfort" },
      { label: "Severe, sudden or hard to tolerate", score: { consultare_doctor: 5 }, finding: "severe pain" },
    ],
  },
  {
    id: "debut",
    question: "How did it start?",
    options: [
      { label: "Gradually or after food/exertion", score: { usor: 1, mediu: 1 }, finding: "gradual onset" },
      { label: "Suddenly, without a clear cause", score: { mediu: 3 }, finding: "sudden onset" },
      { label: "Suddenly, with feeling very unwell", score: { consultare_doctor: 5 }, finding: "severe sudden onset" },
    ],
  },
  {
    id: "semne",
    question: "Are there associated symptoms?",
    options: [
      { label: "No, only local discomfort", score: { usor: 2 }, finding: "no associated symptoms" },
      { label: "Nausea, cough, urinary changes or digestive difficulty", score: { mediu: 3 }, finding: "moderate associated symptoms" },
      {
        label: "High fever, shortness of breath, chest pain, fainting or blood in urine/stool",
        score: { consultare_doctor: 7 },
        finding: "organ red flag signs",
      },
    ],
  },
  {
    id: "durata",
    question: "How long has it persisted?",
    options: [
      { label: "Less than 24 hours and improving", score: { usor: 1 }, finding: "short duration" },
      { label: "Several days or recurring often", score: { mediu: 2 }, finding: "persistence" },
      { label: "Worsening quickly", score: { consultare_doctor: 4 }, finding: "rapid worsening" },
    ],
  },
];

const organSpecificQuestionsEn: Record<string, PainQuestion> = {
  "organ:inima": {
    id: "organ_inima",
    question: "Is there chest pressure, palpitations or shortness of breath?",
    options: [
      { label: "No", score: { usor: 1 }, finding: "no important heart symptoms" },
      { label: "Yes, with effort or stress", score: { mediu: 3 }, finding: "heart symptoms with effort" },
      { label: "Yes, at rest, with shortness of breath or fainting", score: { consultare_doctor: 7 }, finding: "heart red flag signs" },
    ],
  },
  "organ:plamani": {
    id: "organ_plamani",
    question: "Do you have breathing difficulty, persistent cough or pain while breathing?",
    options: [
      { label: "No", score: { usor: 1 }, finding: "no breathing difficulty" },
      { label: "Mild, mostly with effort", score: { mediu: 3 }, finding: "breathing discomfort with effort" },
      { label: "Yes, shortness of breath at rest, blue lips or chest pain", score: { consultare_doctor: 7 }, finding: "respiratory red flag signs" },
    ],
  },
  "organ:ficat": {
    id: "organ_ficat",
    question: "Is there upper-right pain, nausea or yellowing of the skin/eyes?",
    options: [
      { label: "No", score: { usor: 1 }, finding: "no clear liver signs" },
      { label: "Mild pain or nausea", score: { mediu: 3 }, finding: "moderate digestive/liver symptoms" },
      { label: "Yellow skin/eyes, very dark urine or severe pain", score: { consultare_doctor: 6 }, finding: "liver red flag signs" },
    ],
  },
  "organ:stomac": {
    id: "organ_stomac",
    question: "Is the discomfort related to meals, heartburn or vomiting?",
    options: [
      { label: "Mild and temporary", score: { usor: 2 }, finding: "mild gastric discomfort" },
      { label: "Heartburn, nausea or repeated vomiting", score: { mediu: 3 }, finding: "moderate gastric symptoms" },
      { label: "Vomiting blood, black stool or severe pain", score: { consultare_doctor: 7 }, finding: "gastric red flag signs" },
    ],
  },
  "organ:rinichi": {
    id: "organ_rinichi",
    question: "Do you have lower-back/flank pain, burning urination or blood in urine?",
    options: [
      { label: "No", score: { usor: 1 }, finding: "no clear urinary signs" },
      { label: "Burning, frequent urination or moderate flank pain", score: { mediu: 3 }, finding: "moderate urinary symptoms" },
      { label: "Fever, chills, blood in urine or very strong pain", score: { consultare_doctor: 7 }, finding: "kidney red flag signs" },
    ],
  },
  "organ:intestine": {
    id: "organ_intestine",
    question: "Is there bloating, diarrhea/constipation or blood in stool?",
    options: [
      { label: "No, only temporary discomfort", score: { usor: 1 }, finding: "mild intestinal discomfort" },
      { label: "Bloating, diarrhea or constipation for a few days", score: { mediu: 3 }, finding: "moderate intestinal symptoms" },
      { label: "Blood in stool, severe pain or very swollen abdomen", score: { consultare_doctor: 7 }, finding: "intestinal red flag signs" },
    ],
  },
  "organ:splina": {
    id: "organ_splina",
    question: "Is the pain in the upper left abdomen or after a blow to the abdomen?",
    options: [
      { label: "No", score: { usor: 1 }, finding: "no clear spleen signs" },
      { label: "Upper-left discomfort", score: { mediu: 3 }, finding: "upper-left pain" },
      { label: "After a blow, with dizziness or severe pain", score: { consultare_doctor: 7 }, finding: "spleen red flag signs" },
    ],
  },
  "organ:pancreas": {
    id: "organ_pancreas",
    question: "Is the pain high in the abdomen and spreading toward the back?",
    options: [
      { label: "No", score: { usor: 1 }, finding: "no clear pancreatic pattern" },
      { label: "Yes, mild/moderate, with nausea", score: { mediu: 3 }, finding: "moderate pancreatic symptoms" },
      { label: "Yes, severe, with vomiting or feeling very unwell", score: { consultare_doctor: 7 }, finding: "pancreatic red flag signs" },
    ],
  },
  "organ:vezica-urinara": {
    id: "organ_vezica",
    question: "Do you have burning, frequent urination or inability to urinate?",
    options: [
      { label: "No", score: { usor: 1 }, finding: "no clear bladder signs" },
      { label: "Burning or frequent urination", score: { mediu: 3 }, finding: "lower urinary symptoms" },
      { label: "Cannot urinate, fever or blood in urine", score: { consultare_doctor: 7 }, finding: "urinary red flag signs" },
    ],
  },
  "organ:esofag": {
    id: "organ_esofag",
    question: "Do you have heartburn, pain when swallowing or trouble swallowing?",
    options: [
      { label: "Rare, temporary heartburn", score: { usor: 1 }, finding: "possible mild reflux" },
      { label: "Frequent pain or burning", score: { mediu: 3 }, finding: "moderate esophageal symptoms" },
      { label: "Cannot swallow, severe pain or bleeding", score: { consultare_doctor: 7 }, finding: "esophageal red flag signs" },
    ],
  },
  "organ:trahee": {
    id: "organ_trahee",
    question: "Is breathing noisy or does air feel blocked?",
    options: [
      { label: "No", score: { usor: 1 }, finding: "no clear tracheal signs" },
      { label: "Mild, with cough or irritation", score: { mediu: 3 }, finding: "moderate airway irritation" },
      { label: "Yes, difficult breathing, severe wheeze/noisy breathing or choking", score: { consultare_doctor: 8 }, finding: "airway obstruction signs" },
    ],
  },
};

const muscleSpecificQuestionsEn: Record<string, PainQuestion> = {
  "muschi:muschii-bratului": {
    id: "muschi_brat_specific",
    question: "Does pain appear when lifting, pushing or pulling with the arm?",
    options: [
      { label: "Only after effort", score: { usor: 1 }, finding: "arm effort discomfort" },
      { label: "Yes, it limits strength", score: { mediu: 3 }, finding: "arm limitation" },
      { label: "Yes, with clear loss of strength or major swelling", score: { consultare_doctor: 5 }, finding: "important arm muscle signs" },
    ],
  },
  "muschi:muschii-antebratului": {
    id: "muschi_antebrat_specific",
    question: "Does pain increase when gripping or moving the wrist?",
    options: [
      { label: "Slightly, after use", score: { usor: 1 }, finding: "forearm overuse" },
      { label: "Yes, grip is weaker", score: { mediu: 3 }, finding: "weaker grip" },
      { label: "Yes, with numbness or weakness in the fingers", score: { consultare_doctor: 5 }, finding: "forearm/hand neurological signs" },
    ],
  },
  "muschi:muschii-umarului": {
    id: "muschi_umar_specific",
    question: "Can you raise the arm above the head?",
    options: [
      { label: "Yes, almost normally", score: { usor: 1 }, finding: "shoulder mobility preserved" },
      { label: "Only with pain or limitation", score: { mediu: 3 }, finding: "shoulder limitation" },
      { label: "Cannot raise it or it started after trauma", score: { consultare_doctor: 5 }, finding: "shoulder red flag signs" },
    ],
  },
  "muschi:muschii-mainii": {
    id: "muschi_mana_specific",
    question: "Does pain affect gripping objects or moving the fingers?",
    options: [
      { label: "No, just discomfort", score: { usor: 1 }, finding: "hand function preserved" },
      { label: "Yes, gripping is harder", score: { mediu: 3 }, finding: "reduced grip" },
      { label: "Cannot move fingers normally or numbness appears", score: { consultare_doctor: 5 }, finding: "important hand signs" },
    ],
  },
  "muschi:muschii-coapsei": {
    id: "muschi_coapsa_specific",
    question: "Does pain appear when walking, climbing stairs or squatting?",
    options: [
      { label: "Only after effort", score: { usor: 1 }, finding: "thigh fatigue" },
      { label: "Yes, it limits walking", score: { mediu: 3 }, finding: "walking limited" },
      { label: "Yes, I cannot support the leg well", score: { consultare_doctor: 5 }, finding: "severe thigh limitation" },
    ],
  },
  "muschi:muschii-gambei": {
    id: "muschi_gamba_specific",
    question: "Does pain appear when walking, running or rising on tiptoe?",
    options: [
      { label: "Only after effort", score: { usor: 1 }, finding: "calf overuse" },
      { label: "Yes, it makes me limp", score: { mediu: 3 }, finding: "limping" },
      { label: "Yes, with swelling, redness or sudden intense pain", score: { consultare_doctor: 6 }, finding: "important calf signs" },
    ],
  },
  "muschi:muschii-piciorului": {
    id: "muschi_picior_specific",
    question: "Does pain appear when stepping or pushing through the sole?",
    options: [
      { label: "Slightly", score: { usor: 1 }, finding: "mild plantar discomfort" },
      { label: "Yes, it limits support", score: { mediu: 3 }, finding: "limited support" },
      { label: "Cannot step or there is major swelling", score: { consultare_doctor: 5 }, finding: "inability to bear weight" },
    ],
  },
  "muschi:muschii-soldului": {
    id: "muschi_sold_specific",
    question: "Does pain appear when walking, rotating the hip or lifting the leg?",
    options: [
      { label: "Only after effort", score: { usor: 1 }, finding: "hip discomfort after effort" },
      { label: "Yes, it limits the step", score: { mediu: 3 }, finding: "reduced hip mobility" },
      { label: "Cannot walk normally or it started after a fall", score: { consultare_doctor: 5 }, finding: "hip red flag signs" },
    ],
  },
  "muschi:muschii-spatelui": {
    id: "muschi_spate_specific",
    question: "Does pain increase when bending, lifting or twisting?",
    options: [
      { label: "Mildly, mostly after posture/effort", score: { usor: 1 }, finding: "back tension" },
      { label: "Yes, it limits movement", score: { mediu: 3 }, finding: "partly locked back" },
      { label: "Yes, with leg numbness/weakness or loss of bladder control", score: { consultare_doctor: 7 }, finding: "back neurological signs" },
    ],
  },
  "muschi:muschii-capului-gatului": {
    id: "muschi_gat_specific",
    question: "Does pain increase when turning the head or holding the neck in one position?",
    options: [
      { label: "Mild, like tension", score: { usor: 1 }, finding: "neck tension" },
      { label: "Yes, rotation is limited", score: { mediu: 3 }, finding: "stiff neck" },
      { label: "Yes, with fever, severe headache or numbness", score: { consultare_doctor: 6 }, finding: "neck red flag signs" },
    ],
  },
  "muschi:muschii-toracelui": {
    id: "muschi_torace_specific",
    question: "Does pain increase with deep breathing, coughing or pushing?",
    options: [
      { label: "Only after effort", score: { usor: 1 }, finding: "muscular chest discomfort" },
      { label: "Yes, but I can breathe normally", score: { mediu: 3 }, finding: "mechanical chest pain" },
      { label: "Yes, with shortness of breath, chest pressure or dizziness", score: { consultare_doctor: 7 }, finding: "chest red flag signs" },
    ],
  },
  "muschi:abdomen": {
    id: "muschi_abdomen_specific",
    question: "Does pain increase when tightening the abdomen, coughing or sitting up?",
    options: [
      { label: "Only mildly, after effort", score: { usor: 1 }, finding: "muscular abdominal tension" },
      { label: "Yes, it limits trunk flexion", score: { mediu: 3 }, finding: "muscular abdominal limitation" },
      { label: "Yes, with severe pain, fever or very tender abdomen", score: { consultare_doctor: 7 }, finding: "abdominal red flag signs" },
    ],
  },
};


export const musclePainKnowledge = {
  default: {
    usor: [
      "suprasolicitare după antrenament sau efort repetitiv",
      "crampă musculară ușoară cauzată de oboseală sau hidratare insuficientă",
      "tensiune locală produsă de postură sau încălzire incompletă",
    ],
    mediu: [
      "întindere musculară moderată",
      "contractură cu limitare la mișcare",
      "inflamație locală după efort intens sau mișcare repetitivă",
    ],
    consultare_doctor: [
      "posibilă ruptură musculară sau leziune importantă",
      "durere severă asociată cu umflare, vânătaie sau pierdere de forță",
      "simptome neurologice precum amorțeală, slăbiciune sau durere care coboară pe membru",
    ],
  },
  tendon: {
    usor: [
      "iritare ușoară a tendonului după efort",
      "tensiune locală la începutul mișcării",
      "suprasolicitare minoră prin mișcări repetitive",
    ],
    mediu: [
      "tendinită sau tendinopatie incipientă",
      "inflamație persistentă la solicitare",
      "durere la mișcare repetată sau la presiune locală",
    ],
    consultare_doctor: [
      "posibilă ruptură parțială sau completă de tendon",
      "durere bruscă după un pocnet sau traumă",
      "pierdere de funcție ori imposibilitatea folosirii segmentului afectat",
    ],
  },
  os: {
    usor: [
      "contuzie ușoară sau disconfort mecanic",
      "durere minoră după presiune sau activitate",
      "sensibilitate locală fără limitare importantă",
    ],
    mediu: [
      "inflamație articulară sau suprasolicitare mecanică",
      "durere persistentă la sprijin sau mișcare",
      "posibilă iritație periostală după efort repetitiv",
    ],
    consultare_doctor: [
      "posibilă fractură, fisură sau traumatism important",
      "durere severă cu deformare, umflare sau imposibilitate de sprijin",
      "durere osoasă persistentă care nu se ameliorează",
    ],
  },
} as const;

const musclePainKnowledgeEn = {
  default: {
    usor: [
      "overuse after training or repetitive effort",
      "mild muscle cramp due to fatigue or insufficient hydration",
      "local tension from posture or inadequate warm-up",
    ],
    mediu: [
      "moderate muscle strain",
      "contracture with movement restriction",
      "local inflammation after intense effort or repetitive movement",
    ],
    consultare_doctor: [
      "possible muscle tear or significant injury",
      "severe pain associated with swelling, bruising or loss of strength",
      "neurological symptoms such as numbness, weakness or pain radiating along the limb",
    ],
  },
  tendon: {
    usor: [
      "mild tendon irritation after exertion",
      "local tension at the start of movement",
      "minor overuse from repetitive movements",
    ],
    mediu: [
      "tendinitis or early tendinopathy",
      "persistent inflammation under load",
      "pain with repetitive movement or local pressure",
    ],
    consultare_doctor: [
      "possible partial or complete tendon rupture",
      "sudden pain after a snap or trauma",
      "loss of function or inability to use the affected segment",
    ],
  },
  os: {
    usor: [
      "mild contusion or mechanical discomfort",
      "minor pain after pressure or activity",
      "local tenderness without significant restriction",
    ],
    mediu: [
      "joint inflammation or mechanical overuse",
      "persistent pain with weight-bearing or movement",
      "possible periosteal irritation after repetitive effort",
    ],
    consultare_doctor: [
      "possible fracture, fissure or significant trauma",
      "severe pain with deformity, swelling or inability to bear weight",
      "persistent bone pain that does not improve",
    ],
  },
} as const;

const organPainKnowledge = {
  usor: [
    "disconfort funcțional ușor sau tranzitoriu",
    "iritație digestivă, respiratorie sau urinară minoră, în funcție de organ",
    "simptome generale fără semne de alarmă evidente",
  ],
  mediu: [
    "simptome persistente care merită urmărite atent",
    "posibilă inflamație sau iritație a organului selectat",
    "manifestări asociate precum greață, tuse, urinare modificată sau digestie dificilă",
  ],
  consultare_doctor: [
    "semne de alarmă legate de organe interne",
    "durere severă, debut brusc sau agravare rapidă",
    "simptome precum lipsă de aer, durere în piept, febră mare, leșin sau sânge în urină/scaun",
  ],
} as const;

const organPainKnowledgeEn = {
  usor: [
    "mild or temporary functional discomfort",
    "minor digestive, respiratory or urinary irritation depending on the selected organ",
    "general symptoms without obvious red flag signs",
  ],
  mediu: [
    "persistent symptoms worth monitoring carefully",
    "possible inflammation or irritation of the selected organ",
    "associated signs such as nausea, cough, urinary changes or digestive difficulty",
  ],
  consultare_doctor: [
    "red flag signs related to internal organs",
    "severe pain, sudden onset or rapid worsening",
    "symptoms such as shortness of breath, chest pain, high fever, fainting or blood in urine/stool",
  ],
} as const;


export function classifyPainLocally(symptoms: string): PainLevel {
  const text = symptoms.toLowerCase();
  if (painLevels.consultare_doctor.keywords.some((word) => text.includes(word))) return "consultare_doctor";
  if (painLevels.mediu.keywords.some((word) => text.includes(word))) return "mediu";
  return "usor";
}

export function getKnowledgeFor(tissueType: PainTissueType) {
  if (tissueType === "organ") return organPainKnowledge;
  if (tissueType === "tendon") return musclePainKnowledge.tendon;
  if (tissueType === "os") return musclePainKnowledge.os;
  return musclePainKnowledge.default;
}

export function getPainQuestions(
  tissueType: PainTissueType,
  lang: "ro" | "en" = "ro",
  context: PainQuestionContext = {},
): PainQuestion[] {
  if (tissueType === "organ") {
    const specific = (lang === "en" ? organSpecificQuestionsEn : organSpecificQuestionsRo)[
      context.structureId ?? ""
    ];
    return [
      ...(lang === "en" ? organQuestionsEn : organQuestionsRo),
      ...(specific ? [specific] : []),
    ];
  }

  if (lang === "en") {
    return [
      ...baseQuestionsEn,
      ...(tissueQuestionsEn[tissueType] ?? []),
      ...getMuscleSpecificQuestions("en", context),
    ];
  }
  return [
    ...baseQuestionsRo,
    ...(tissueQuestionsRo[tissueType] ?? []),
    ...getMuscleSpecificQuestions("ro", context),
  ];
}

function getMuscleSpecificQuestions(
  lang: "ro" | "en",
  context: PainQuestionContext,
): PainQuestion[] {
  const map = lang === "en" ? muscleSpecificQuestionsEn : muscleSpecificQuestionsRo;
  const key = context.structureId ?? "";
  const inferredKey = inferMuscleQuestionKey(context);
  const question = map[key] ?? (inferredKey ? map[inferredKey] : undefined);
  return question ? [question] : [];
}

function inferMuscleQuestionKey(context: PainQuestionContext): string | null {
  const text = [context.structureId, context.selectedName, context.segment, context.group]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  if (text.includes("antebrat") || text.includes("forearm")) return "muschi:muschii-antebratului";
  if (text.includes("umar") || text.includes("shoulder")) return "muschi:muschii-umarului";
  if (text.includes("mana") || text.includes("main") || text.includes("hand")) return "muschi:muschii-mainii";
  if (text.includes("coaps") || text.includes("thigh")) return "muschi:muschii-coapsei";
  if (text.includes("gamba") || text.includes("calf")) return "muschi:muschii-gambei";
  if (text.includes("laba piciorului") || text.includes("talpa") || text.includes("foot")) return "muschi:muschii-piciorului";
  if (text.includes("sold") || text.includes("hip")) return "muschi:muschii-soldului";
  if (text.includes("spate") || text.includes("dorsal") || text.includes("back")) return "muschi:muschii-spatelui";
  if (text.includes("abdomen") || text.includes("abdominal")) return "muschi:abdomen";
  if (text.includes("cap") || text.includes("gat") || text.includes("ceafa") || text.includes("neck")) {
    return "muschi:muschii-capului-gatului";
  }
  if (text.includes("torace") || text.includes("piept") || text.includes("pectoral") || text.includes("intercostal") || text.includes("thorax")) {
    return "muschi:muschii-toracelui";
  }
  if (text.includes("brat") || text.includes("arm")) return "muschi:muschii-bratului";

  return null;
}

export function validateAnswerConsistency(
  answers: Record<string, number>,
  lang: "ro" | "en" = "ro",
): SymptomValidation {
  const intensity = answers.intensitate;
  const functionLevel = answers.functie;
  const signs = answers.semne;

  if (intensity === 0 && functionLevel === 2) {
    return {
      ok: false,
      message:
        lang === "en"
          ? "You selected mild pain, but also that you cannot use the area. These answers contradict each other. If you cannot use the area, the pain is no longer mild."
          : "Ai selectat durere ușoară, dar și că nu poți folosi zona. Aceste răspunsuri se contrazic. Dacă nu poți folosi zona, durerea/problema nu mai este ușoară.",
    };
  }

  if (intensity === 0 && signs === 2) {
    return {
      ok: false,
      message:
        lang === "en"
          ? "You selected mild pain, but also red flag signs such as deformity, fever, numbness or weakness. Please review your answers."
          : "Ai selectat durere ușoară, dar și semne de alarmă precum deformare, febră, amorțeală sau slăbiciune. Revizuiește răspunsurile.",
    };
  }

  if (functionLevel === 2 && signs === 0) {
    return {
      ok: false,
      message:
        lang === "en"
          ? "You selected that you cannot use the area, but said there are no associated signs. Please clarify: is there weakness, numbness, swelling, trauma or severe pain?"
          : "Ai selectat că nu poți folosi zona, dar ai spus că nu există semne asociate. Te rog clarifică: există slăbiciune, amorțeală, umflare, traumă sau durere severă?",
    };
  }

  return { ok: true };
}

export function analyzePainLocally({
  tissueType,
  selectedName,
  answers,
  segment,
  group,
  structureId,
  lang = "ro",
}: {
  tissueType: PainTissueType;
  selectedName: string;
  answers: Record<string, number>;
  segment?: string;
  group?: string;
  structureId?: string;
  lang?: "ro" | "en";
}): SymptomAnalysis {
  const consistency = validateAnswerConsistency(answers, lang);
  if (!consistency.ok) {
    return {
      nivel: "consultare_doctor",
      cauze:
        lang === "en"
          ? ["Answers are contradictory and do not allow a correct triage."]
          : ["Răspunsurile sunt contradictorii și nu permit un triaj corect."],
      recomandare:
        consistency.message ??
        (lang === "en"
          ? "Review your answers before the verdict."
          : "Revizuiește răspunsurile înainte de verdict."),
      explicatieNivel:
        lang === "en"
          ? "Verdict blocked: the information provided is contradictory."
          : "Verdict blocat: informațiile introduse se contrazic.",
      redFlags:
        lang === "en" ? ["contradictory answers"] : ["răspunsuri contradictorii"],
    };
  }

  const scores: Record<PainLevel, number> = { usor: 0, mediu: 0, consultare_doctor: 0 };
  const findings: string[] = [];

  for (const question of getPainQuestions(tissueType, lang, {
    structureId,
    selectedName,
    segment,
    group,
  })) {
    const optionIndex = answers[question.id];
    const option = Number.isInteger(optionIndex) ? question.options[optionIndex] : undefined;
    if (!option) continue;
    for (const [level, score] of Object.entries(option.score) as Array<[PainLevel, number]>) {
      scores[level] += score;
    }
    if (option.finding) findings.push(option.finding);
  }

  const zoneRisk = getZoneRisk({ selectedName, segment, group, lang });
  scores.mediu += zoneRisk.mediumBoost;
  scores.consultare_doctor += zoneRisk.doctorBoost;
  if (zoneRisk.finding) findings.push(zoneRisk.finding);

  const intensity = answers.intensitate;
  const signs = answers.semne;
  const debut = answers.debut;
  const duration = answers.durata;
  const functionLevel = answers.functie;
  const structureRisk = getStructureRiskCategory({ selectedName, segment, group, tissueType });
  const isSmallDistalStructure = structureRisk === "small_bone";
  const hasSeverePain = intensity === 2;
  const hasTrauma = debut === 2;
  const hasMajorRedFlag = signs === 2 || functionLevel === 2;
  const hasPersistenceOrWorsening = duration === 1 || duration === 2;
  const hasFunctionalLimitation = functionLevel === 1 || functionLevel === 2;

  if (isSmallDistalStructure && hasSeverePain) {
    scores.consultare_doctor -= 3;
    scores.mediu += 3;
  }

  if (zoneRisk.level === "high" && intensity === 1) {
    scores.consultare_doctor += 4;
    findings.push(
      lang === "en" ? "moderate pain in a sensitive area" : "durere moderată într-o zonă sensibilă",
    );
  }

  if (zoneRisk.level === "high" && [1, 2].includes(signs ?? -1)) {
    scores.consultare_doctor += signs === 2 ? 4 : 2;
    findings.push(
      lang === "en" ? "associated signs in a sensitive area" : "semne asociate într-o zonă sensibilă",
    );
  }

  if (zoneRisk.level === "high" && ([1, 2].includes(debut ?? -1) || [1, 2].includes(duration ?? -1))) {
    scores.consultare_doctor += 2;
  }

  if (zoneRisk.level !== "low" && functionLevel === 2) {
    scores.consultare_doctor += 2;
  }

  const smallStructureResult = tissueType !== "organ" && isSmallDistalStructure
    ? buildSmallStructureAnalysis({
        tissueType, scores, findings, hasSeverePain, hasTrauma,
        hasMajorRedFlag, hasPersistenceOrWorsening, hasFunctionalLimitation, lang,
      })
    : null;

  if (smallStructureResult) return smallStructureResult;

  const level = pickLevel(scores);
  const knowledge = lang === "en"
    ? tissueType === "organ"
      ? organPainKnowledgeEn
      : tissueType === "tendon"
        ? musclePainKnowledgeEn.tendon
        : tissueType === "os"
          ? musclePainKnowledgeEn.os
          : musclePainKnowledgeEn.default
    : getKnowledgeFor(tissueType);
  const details = painLevels[level];
  const label = lang === "en" ? details.labelEn : details.label;
  const summary = lang === "en" ? details.summaryEn : details.summary;
  const noFindings = lang === "en" ? "general symptoms described" : "simptome generale descrise";
  const indicators = lang === "en" ? "Indicators" : "Indicatori";

  return {
    nivel: level,
    cauze: [...knowledge[level]].slice(0, 3),
    recomandare: buildRecommendation(level, lang),
    explicatieNivel: `${label}: ${summary} ${indicators}: ${findings.length ? findings.join(", ") : noFindings}.`,
    redFlags: findings.filter((finding) =>
      lang === "en"
        ? ["trauma", "snap", "red flag", "impossibility", "loss of", "severe"].some((w) => finding.includes(w))
        : ["traumă", "pocnet", "alarmă", "imposibilitate", "pierdere", "severă"].some((word) => finding.includes(word)),
    ),
  };
}


function buildSmallStructureAnalysis({
  tissueType,
  scores,
  findings,
  hasSeverePain,
  hasTrauma,
  hasMajorRedFlag,
  hasPersistenceOrWorsening,
  hasFunctionalLimitation,
  lang = "ro",
}: {
  tissueType: "os" | "muschi" | "tendon";
  scores: Record<PainLevel, number>;
  findings: string[];
  hasSeverePain: boolean;
  hasTrauma: boolean;
  hasMajorRedFlag: boolean;
  hasPersistenceOrWorsening: boolean;
  hasFunctionalLimitation: boolean;
  lang?: "ro" | "en";
}): SymptomAnalysis | null {
  const isEn = lang === "en";
  const indicators = isEn ? "Indicators" : "Indicatori";

  const redFlagWords = isEn
    ? ["red flag", "impossibility", "deformity", "numbness", "weakness"]
    : ["alarmă", "imposibilitate", "deformare", "amorțeală", "slăbiciune"];

  if (hasMajorRedFlag) {
    return {
      nivel: "consultare_doctor",
      title: isEn ? "Rapid consultation" : "Consult rapid",
      cauze: isEn
        ? [
            "significant injury to a finger or small structure",
            "possible fracture, dislocation or tendon/ligament damage if there is deformity or inability to move",
            "possible neurovascular involvement if there is numbness, loss of sensation or abnormal colour",
          ]
        : [
            "leziune importantă a degetului sau a unei structuri mici",
            "posibilă fractură, luxație sau afectare de tendon/ligament dacă există deformare sau imposibilitate de mișcare",
            "afectare neurovasculară posibilă dacă există amorțeală, pierdere de sensibilitate sau culoare anormală",
          ],
      recomandare: isEn
        ? "These signs may indicate a significant injury. Rapid medical consultation is recommended, especially if the finger is deformed, you cannot bend/extend it normally, numbness, major swelling or abnormal colour appears."
        : "Aceste semne pot indica o leziune importantă. Este recomandat consult medical rapid, mai ales dacă degetul este deformat, nu îl poți îndoi/întinde normal, apare amorțeală, umflare mare sau culoare anormală.",
      explicatieNivel: isEn
        ? `Rapid consultation: verdict is driven by real red flag signs, not just pain intensity. ${indicators}: ${findings.join(", ")}.`
        : `Consult rapid: verdictul este determinat de semne de alarmă reale, nu doar de intensitatea durerii. ${indicators}: ${findings.join(", ")}.`,
      redFlags: findings.filter((f) => redFlagWords.some((w) => f.includes(w))),
    };
  }

  if (hasSeverePain && hasTrauma) {
    return {
      nivel: "consultare_doctor",
      title: isEn ? "Medical consultation recommended" : "Consult medical recomandat",
      cauze: isEn
        ? [
            "local contusion after a blow",
            "sprain or irritation of a finger joint",
            "possible fissure or fracture if pain remains intense or new signs appear",
          ]
        : [
            "contuzie locală după lovitură",
            "entorsă sau iritație a articulației degetului",
            "fisură sau fractură posibilă dacă durerea rămâne intensă ori apar semne noi",
          ],
      recomandare: isEn
        ? "Severe finger pain after a blow may indicate a contusion, sprain or possible fissure/fracture. If there is deformity, major swelling, numbness or you cannot move the finger, seek rapid consultation."
        : "Durerea severă la deget după o lovitură poate indica o contuzie, entorsă sau posibilă fisură/fractură. Dacă există deformare, umflare mare, amorțeală sau nu poți mișca degetul, cere consult rapid.",
      explicatieNivel: isEn
        ? `Medical consultation recommended: severe pain is associated with trauma/blow. ${indicators}: ${findings.join(", ")}.`
        : `Consult medical recomandat: durerea severă este asociată cu traumă/lovitură. ${indicators}: ${findings.join(", ")}.`,
      redFlags: findings.filter((f) =>
        isEn ? ["trauma", "snap"].some((w) => f.includes(w)) : ["traumă", "pocnet"].some((w) => f.includes(w)),
      ),
    };
  }

  if (hasSeverePain) {
    return {
      nivel: "mediu",
      title: isEn
        ? hasPersistenceOrWorsening ? "Consult if it persists" : "Careful monitoring"
        : hasPersistenceOrWorsening ? "Consult dacă persistă" : "Monitorizare atentă",
      cauze: isEn
        ? [
            "local irritation or overuse of the finger",
            "local inflammation without major red flag signs",
            "possible injury if pain persists, worsens or functional restriction appears",
          ]
        : [
            "iritație locală sau suprasolicitare a degetului",
            "inflamație locală fără semne majore de alarmă",
            "leziune posibilă dacă durerea persistă, se agravează sau apare limitare funcțională",
          ],
      recomandare: isEn
        ? "Intense finger pain can occur after local irritation, overuse or a minor blow. If pain persists, worsens, major swelling, deformity, numbness or inability to move the finger normally appears, medical consultation is recommended."
        : "Durerea intensă la un deget poate apărea după iritație locală, suprasolicitare sau o lovitură minoră. Dacă durerea persistă, se agravează, apare umflare mare, deformare, amorțeală sau nu poți mișca degetul normal, este recomandat consult medical.",
      explicatieNivel: isEn
        ? `Careful monitoring: pain is intense, but you have not entered deformity, inability to move, numbness or clear trauma. ${indicators}: ${findings.join(", ")}.`
        : `Monitorizare atentă: durerea este intensă, dar nu ai introdus deformare, imposibilitate de mișcare, amorțeală sau traumă clară. ${indicators}: ${findings.join(", ")}.`,
      redFlags: [],
    };
  }

  if (hasPersistenceOrWorsening || hasFunctionalLimitation || scores.mediu >= 4) {
    return {
      nivel: "mediu",
      title: isEn ? "Careful monitoring" : "Monitorizare atentă",
      cauze: isEn
        ? [
            "overuse or local irritation",
            "mild inflammation of a finger joint",
            "minor contusion if the area was lightly struck",
          ]
        : [
            "suprasolicitare sau iritație locală",
            "inflamație ușoară a articulației degetului",
            "contuzie minoră dacă zona a fost lovită ușor",
          ],
      recomandare: isEn
        ? "Monitor progress, reduce load on the finger and avoid movements that increase pain. Seek consultation if pain persists for several days, worsens or major swelling, deformity, numbness or clear restriction appears."
        : "Monitorizează evoluția, redu solicitarea degetului și evită mișcările care cresc durerea. Cere consult dacă durerea persistă câteva zile, se agravează sau apar umflare mare, deformare, amorțeală ori limitare clară.",
      explicatieNivel: isEn
        ? `Careful monitoring: no major red flag signs, but symptoms are worth watching. ${indicators}: ${findings.join(", ")}.`
        : `Monitorizare atentă: nu apar semne majore de alarmă, dar simptomele merită urmărite. ${indicators}: ${findings.join(", ")}.`,
      redFlags: [],
    };
  }

  if (tissueType === "os" && scores.usor >= scores.mediu) {
    return {
      nivel: "usor",
      title: isEn ? "General recommendations" : "Recomandări generale",
      cauze: isEn
        ? ["minor local discomfort", "pressure or mild overuse", "transient local irritation"]
        : ["disconfort local minor", "presiune sau suprasolicitare ușoară", "iritare locală trecătoare"],
      recomandare: isEn
        ? "You can monitor the area, reduce load and watch for new signs. Seek medical advice if pain increases, persists or major swelling, deformity, numbness or difficulty moving appears."
        : "Poți monitoriza zona, reduce solicitarea și urmări dacă apar semne noi. Cere sfat medical dacă durerea crește, persistă sau apare umflare mare, deformare, amorțeală ori dificultate de mișcare.",
      explicatieNivel: isEn
        ? `Minor: the described symptoms do not indicate red flag signs. ${indicators}: ${findings.join(", ")}.`
        : `Ușor: simptomele descrise nu indică semne de alarmă. ${indicators}: ${findings.join(", ")}.`,
      redFlags: [],
    };
  }

  return null;
}

function getZoneRisk({
  selectedName,
  segment,
  group,
  lang = "ro",
}: {
  selectedName: string;
  segment?: string;
  group?: string;
  lang?: "ro" | "en";
}): {
  level: "low" | "medium" | "high";
  mediumBoost: number;
  doctorBoost: number;
  finding?: string;
} {
  const text = [selectedName, segment, group]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  if (
    ["cap", "craniu", "fata", "ceafa", "gat", "cervical", "coloana", "vertebr", "piept", "torace", "toracel", "stern", "coaste", "intercostal", "pectoral"].some((term) =>
      text.includes(term),
    )
  ) {
    return {
      level: "high",
      mediumBoost: 1,
      doctorBoost: 2,
      finding: lang === "en" ? "sensitive area" : "zonă sensibilă",
    };
  }

  if (["abdomen", "bazin", "pelvis", "sold", "umar"].some((term) => text.includes(term))) {
    return {
      level: "medium",
      mediumBoost: 1,
      doctorBoost: 0,
      finding: lang === "en" ? "moderate-attention area" : "zonă cu atenție moderată",
    };
  }

  return { level: "low", mediumBoost: 0, doctorBoost: 0 };
}

type RiskCategory = "small_bone" | "large_bone" | "joint" | "muscle" | "spine" | "chest" | "unknown";

function getStructureRiskCategory({
  selectedName,
  segment,
  group,
  tissueType,
}: {
  selectedName: string;
  segment?: string;
  group?: string;
  tissueType: PainTissueType;
}): RiskCategory {
  if (tissueType === "muschi") return "muscle";
  if (tissueType === "organ") return "unknown";

  const text = [selectedName, segment, group]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  if (["coloana", "vertebr", "cervical", "toracic", "lombar"].some((term) => text.includes(term))) return "spine";
  if (["coaste", "stern", "torace", "piept"].some((term) => text.includes(term))) return "chest";
  if (["falanga", "phalange", "deget", "police", "inelar", "carp", "metacarp", "tars", "metatars", "mana", "picior", "laba piciorului"].some((term) => text.includes(term))) return "small_bone";
  if (["femur", "tibia", "humerus", "radius", "ulna", "fibula", "coxal"].some((term) => text.includes(term))) return "large_bone";
  if (["genunchi", "umar", "sold", "glezna", "cot"].some((term) => text.includes(term))) return "joint";

  return "unknown";
}

function pickLevel(scores: Record<PainLevel, number>): PainLevel {
  if (scores.consultare_doctor >= 5 || scores.consultare_doctor >= scores.mediu + 2) return "consultare_doctor";
  if (scores.mediu >= 4 || scores.mediu >= scores.usor) return "mediu";
  return "usor";
}

function buildRecommendation(level: PainLevel, lang: "ro" | "en" = "ro"): string {
  if (lang === "en") {
    if (level === "consultare_doctor") {
      return "Medical consultation is recommended, especially if pain is severe, appeared after trauma, there is deformity, numbness, weakness or you cannot use the area. Avoid loading the area until evaluated.";
    }
    if (level === "mediu") {
      return "Reduce effort, monitor progress and avoid movements that increase pain. If symptoms persist for a few days, worsen or limit activity, schedule a consultation.";
    }
    return "Try relative rest, hydration, gradual return to activity and monitor symptoms. If pain persists, increases or new signs appear, seek medical advice.";
  }

  if (level === "consultare_doctor") {
    return "Este recomandată consultarea unui medic, mai ales dacă durerea este severă, a apărut după traumă, există deformare, amorțeală, slăbiciune sau nu poți folosi zona. Evită solicitarea până la evaluare.";
  }
  if (level === "mediu") {
    return "Redu efortul, monitorizează evoluția și evită mișcările care cresc durerea. Dacă simptomele persistă câteva zile, se agravează sau limitează activitatea, programează o consultație.";
  }
  return "Poți încerca repaus relativ, hidratare, revenire treptată la efort și observarea simptomelor. Dacă durerea persistă, crește sau apar semne noi, cere sfat medical.";
}


const anatomyTerms = {
  mana: ["mână", "mana", "palmă", "palma", "deget", "degete", "încheietură", "incheietura", "pumn", "carp"],
  brat: ["braț", "brat", "cot", "umăr", "umar", "antebraț", "antebrat", "humerus", "radius"],
  picior: ["picior", "gleznă", "glezna", "genunchi", "coapsă", "coapsa", "gambă", "gamba", "talpă", "talpa", "femur", "tibie", "tibia", "tars"],
  trunchi: ["spate", "torace", "piept", "coaste", "abdomen", "coloană", "coloana", "pelvis", "bazin", "coxal"],
  cap: ["cap", "craniu", "mandibulă", "mandibula", "frunte", "față", "fata"],
  genital: ["penis", "testicul", "testicule", "scrot", "pula", "pulă", "vagin", "vulvă", "vulva", "genital", "genitale"],
} as const;

const regionBySelectionKeyword: Array<{ region: keyof typeof anatomyTerms; keywords: string[] }> = [
  { region: "mana", keywords: ["mână", "mana", "carp", "deget", "palm"] },
  { region: "brat", keywords: ["braț", "brat", "humerus", "radius", "scapula", "umăr", "umar"] },
  { region: "picior", keywords: ["picior", "femur", "tibia", "tibie", "tars", "gamb", "coaps", "genunchi"] },
  { region: "trunchi", keywords: ["coaste", "vertebr", "coloan", "coxal", "pelvis", "trunchi"] },
  { region: "cap", keywords: ["frontal", "mandib", "craniu", "cap"] },
];

export function validateSymptomRelevance({
  selectedName,
  symptoms,
}: {
  selectedName: string;
  symptoms: string;
}): SymptomValidation {
  const selected = selectedName.toLowerCase();
  const text = symptoms.toLowerCase();
  const selectedRegion = regionBySelectionKeyword.find((entry) =>
    entry.keywords.some((keyword) => selected.includes(keyword)),
  )?.region;
  const mentionedRegions = Object.entries(anatomyTerms)
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([region]) => region as keyof typeof anatomyTerms);

  if (mentionedRegions.includes("genital") && selectedRegion && selectedRegion !== "genital") {
    return {
      ok: false,
      message:
        "Simptomele descrise par să fie pentru zona genitală, dar ai selectat altă zonă anatomică. Selectează zona potrivită sau descrie durerea pentru structura selectată.",
    };
  }

  const incompatibleRegion = mentionedRegions.find(
    (region) => region !== selectedRegion && region !== "genital",
  );
  if (selectedRegion && incompatibleRegion) {
    return {
      ok: false,
      message:
        "Simptomele descrise par să indice altă zonă a corpului decât cea selectată. Reformulează simptomele pentru structura selectată sau alege zona corectă.",
    };
  }

  return { ok: true };
}
