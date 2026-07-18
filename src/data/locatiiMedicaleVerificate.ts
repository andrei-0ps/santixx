import type { Coordinates, MedicalCarePlaceType } from "@/lib/medical-care.types";

export type VerifiedMedicalRegionId = "bucharest" | "vrancea";
export type VerifiedMedicalSource = "manual_verified" | "official_registry" | "dsp" | "osm_fallback";
export type VerifiedMedicalConfidence = "high" | "medium" | "low";
export type VerifiedEmergencyCapability =
  | "upu_verified"
  | "cpu_verified"
  | "emergency_hospital_verified"
  | "probable_emergency"
  | "none";
export type VerifiedMedicalCapability =
  | "open_pharmacy_candidate"
  | "nonstop_pharmacy"
  | "hospital"
  | "emergency_care_verified"
  | "emergency_care_probable";

export type VerifiedMedicalEvidence = {
  source: VerifiedMedicalSource;
  label: string;
  url: string;
  checkedAt: string;
};

export type VerifiedMedicalLocation = {
  id: string;
  regionId: VerifiedMedicalRegionId;
  city: string;
  county: string;
  type: MedicalCarePlaceType;
  name: string;
  address: string;
  coordinates: Coordinates;
  phone: string | null;
  openingHours: string | null;
  isNonStop: boolean;
  emergencyCapability: VerifiedEmergencyCapability;
  capabilities: VerifiedMedicalCapability[];
  confidence: VerifiedMedicalConfidence;
  source: VerifiedMedicalSource;
  sourceLabel: string;
  sourceUrl: string;
  evidence: VerifiedMedicalEvidence[];
  lastCheckedAt: string;
  notes?: string;
};

type VerifiedMedicalLocationInput = Omit<VerifiedMedicalLocation, "evidence"> & {
  evidence?: VerifiedMedicalEvidence[];
};

export type VerifiedMedicalRegion = {
  id: VerifiedMedicalRegionId;
  label: string;
  center: Coordinates;
  aliases: string[];
};

const CFB_NONSTOP_SOURCE = {
  source: "manual_verified",
  label: "Colegiul Farmacistilor Bucuresti - lista farmacii non-stop",
  url: "https://www.cfbucuresti.ro/wp-content/uploads/2024/03/LISTA-FARMACII-NON-STOP-BUCURESTI.pdf",
  checkedAt: "2026-06-28",
} as const;

const ROPHARMA_FOCSANI_SOURCE = {
  source: "manual_verified",
  label: "Ropharma - Farmacia Ropharma nr. 17 Focsani",
  url: "https://www.ropharma.ro/farmacii/farmacia-ropharma-nr-17-focsani/",
  checkedAt: "2026-06-28",
} as const;

const MS_UNITATI_SOURCE = {
  source: "official_registry",
  label: "Ministerul Sanatatii - unitati sanitare",
  url: "https://ms.ro/unitati-sanitare/",
  checkedAt: "2026-06-28",
} as const;

const MANUAL_BUCHAREST_HOSPITAL_SOURCE = {
  source: "manual_verified",
  label: "Verificare manuala Santix pe site-uri de spitale si MS",
  url: "https://ms.ro/unitati-sanitare/",
  checkedAt: "2026-06-28",
} as const;

function withEvidence(location: VerifiedMedicalLocationInput): VerifiedMedicalLocation {
  return {
    ...location,
    evidence:
      location.evidence ??
      [
        {
          source: location.source,
          label: location.sourceLabel,
          url: location.sourceUrl,
          checkedAt: location.lastCheckedAt,
        },
      ],
  };
}

export const verifiedMedicalRegions = [
  {
    id: "bucharest",
    label: "Bucuresti",
    center: { lat: 44.4268, lng: 26.1025 },
    aliases: ["bucuresti", "bucurești", "capitala", "sector 1", "sector 2", "sector 3"],
  },
  {
    id: "vrancea",
    label: "Focsani / Vrancea",
    center: { lat: 45.699, lng: 27.186 },
    aliases: ["focsani", "focșani", "vrancea"],
  },
] satisfies readonly VerifiedMedicalRegion[];

const verifiedMedicalLocationsBucharestRaw = [
  {
    id: "bucharest-pharmacy-help-net-15-ion-mihalache",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "pharmacy",
    name: "Help Net 15",
    address: "Bd. Ion Mihalache nr. 92, Sector 1",
    coordinates: { lat: 44.4602457, lng: 26.0754771 },
    phone: "+40746123815",
    openingHours: "24/7",
    isNonStop: true,
    emergencyCapability: "none",
    capabilities: ["open_pharmacy_candidate", "nonstop_pharmacy"],
    confidence: "high",
    source: CFB_NONSTOP_SOURCE.source,
    sourceLabel: CFB_NONSTOP_SOURCE.label,
    sourceUrl: CFB_NONSTOP_SOURCE.url,
    lastCheckedAt: CFB_NONSTOP_SOURCE.checkedAt,
  },
  {
    id: "bucharest-pharmacy-help-net-53-radu-beller",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "pharmacy",
    name: "Help Net 53",
    address: "Str. Lt. Av. Radu Beller nr. 3-7, Sector 1",
    coordinates: { lat: 44.4611097, lng: 26.0944388 },
    phone: "+40746333863",
    openingHours: "24/7",
    isNonStop: true,
    emergencyCapability: "none",
    capabilities: ["open_pharmacy_candidate", "nonstop_pharmacy"],
    confidence: "high",
    source: CFB_NONSTOP_SOURCE.source,
    sourceLabel: CFB_NONSTOP_SOURCE.label,
    sourceUrl: CFB_NONSTOP_SOURCE.url,
    lastCheckedAt: CFB_NONSTOP_SOURCE.checkedAt,
  },
  {
    id: "bucharest-pharmacy-farmacia-m-piatra-morii",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "pharmacy",
    name: "Farmacia M",
    address: "Str. Piatra Morii nr. 17, Sector 1",
    coordinates: { lat: 44.488436, lng: 26.0501115 },
    phone: "+40216677615",
    openingHours: "24/7",
    isNonStop: true,
    emergencyCapability: "none",
    capabilities: ["open_pharmacy_candidate", "nonstop_pharmacy"],
    confidence: "high",
    source: CFB_NONSTOP_SOURCE.source,
    sourceLabel: CFB_NONSTOP_SOURCE.label,
    sourceUrl: CFB_NONSTOP_SOURCE.url,
    lastCheckedAt: CFB_NONSTOP_SOURCE.checkedAt,
  },
  {
    id: "bucharest-pharmacy-santia-victoriei",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "pharmacy",
    name: "Farmacia Santia Victoriei",
    address: "Bd. Iancu de Hunedoara nr. 30-32, Sector 1",
    coordinates: { lat: 44.4522312, lng: 26.0908804 },
    phone: "+40731354678",
    openingHours: "24/7",
    isNonStop: true,
    emergencyCapability: "none",
    capabilities: ["open_pharmacy_candidate", "nonstop_pharmacy"],
    confidence: "high",
    source: CFB_NONSTOP_SOURCE.source,
    sourceLabel: CFB_NONSTOP_SOURCE.label,
    sourceUrl: CFB_NONSTOP_SOURCE.url,
    lastCheckedAt: CFB_NONSTOP_SOURCE.checkedAt,
  },
  {
    id: "bucharest-pharmacy-catena-ion-mihalache",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "pharmacy",
    name: "Catena",
    address: "Bd. Ion Mihalache nr. 70-82, Sector 1",
    coordinates: { lat: 44.4598972, lng: 26.0759182 },
    phone: "+40743004070",
    openingHours: "24/7",
    isNonStop: true,
    emergencyCapability: "none",
    capabilities: ["open_pharmacy_candidate", "nonstop_pharmacy"],
    confidence: "high",
    source: CFB_NONSTOP_SOURCE.source,
    sourceLabel: CFB_NONSTOP_SOURCE.label,
    sourceUrl: CFB_NONSTOP_SOURCE.url,
    lastCheckedAt: CFB_NONSTOP_SOURCE.checkedAt,
  },
  {
    id: "bucharest-pharmacy-help-net-4-mihai-bravu",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "pharmacy",
    name: "Help Net 4",
    address: "Sos. Mihai Bravu nr. 128, Sector 2",
    coordinates: { lat: 44.4404189, lng: 26.1339879 },
    phone: "+40746123804",
    openingHours: "24/7",
    isNonStop: true,
    emergencyCapability: "none",
    capabilities: ["open_pharmacy_candidate", "nonstop_pharmacy"],
    confidence: "high",
    source: CFB_NONSTOP_SOURCE.source,
    sourceLabel: CFB_NONSTOP_SOURCE.label,
    sourceUrl: CFB_NONSTOP_SOURCE.url,
    lastCheckedAt: CFB_NONSTOP_SOURCE.checkedAt,
  },
  {
    id: "bucharest-pharmacy-pharma-care-stefan-cel-mare",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "pharmacy",
    name: "Farmacia Pharma Care",
    address: "Sos. Stefan cel Mare nr. 8, Sector 2",
    coordinates: { lat: 44.4528104, lng: 26.1013566 },
    phone: "+40738763126",
    openingHours: "24/7",
    isNonStop: true,
    emergencyCapability: "none",
    capabilities: ["open_pharmacy_candidate", "nonstop_pharmacy"],
    confidence: "high",
    source: CFB_NONSTOP_SOURCE.source,
    sourceLabel: CFB_NONSTOP_SOURCE.label,
    sourceUrl: CFB_NONSTOP_SOURCE.url,
    lastCheckedAt: CFB_NONSTOP_SOURCE.checkedAt,
  },
  {
    id: "bucharest-hospital-suub",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "hospital",
    name: "Spitalul Universitar de Urgenta Bucuresti",
    address: "Splaiul Independentei nr. 169, Sector 5",
    coordinates: { lat: 44.4361319, lng: 26.0720102 },
    phone: null,
    openingHours: null,
    isNonStop: false,
    emergencyCapability: "upu_verified",
    capabilities: ["hospital", "emergency_care_verified"],
    confidence: "high",
    source: MANUAL_BUCHAREST_HOSPITAL_SOURCE.source,
    sourceLabel: MANUAL_BUCHAREST_HOSPITAL_SOURCE.label,
    sourceUrl: "https://www.suub.ro/",
    lastCheckedAt: MANUAL_BUCHAREST_HOSPITAL_SOURCE.checkedAt,
  },
  {
    id: "bucharest-hospital-floreasca",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "hospital",
    name: "Spitalul Clinic de Urgenta Bucuresti Floreasca",
    address: "Calea Floreasca nr. 8, Sector 1",
    coordinates: { lat: 44.4538752, lng: 26.1014911 },
    phone: null,
    openingHours: null,
    isNonStop: false,
    emergencyCapability: "upu_verified",
    capabilities: ["hospital", "emergency_care_verified"],
    confidence: "high",
    source: MANUAL_BUCHAREST_HOSPITAL_SOURCE.source,
    sourceLabel: MANUAL_BUCHAREST_HOSPITAL_SOURCE.label,
    sourceUrl: "https://portal-web.urgentafloreasca.ro/",
    lastCheckedAt: MANUAL_BUCHAREST_HOSPITAL_SOURCE.checkedAt,
  },
  {
    id: "bucharest-hospital-bagdasar-arseni",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "hospital",
    name: "Spitalul Clinic de Urgenta Bagdasar-Arseni",
    address: "Sos. Berceni nr. 12, Sector 4",
    coordinates: { lat: 44.3852986, lng: 26.1279261 },
    phone: null,
    openingHours: null,
    isNonStop: false,
    emergencyCapability: "upu_verified",
    capabilities: ["hospital", "emergency_care_verified"],
    confidence: "high",
    source: MANUAL_BUCHAREST_HOSPITAL_SOURCE.source,
    sourceLabel: MANUAL_BUCHAREST_HOSPITAL_SOURCE.label,
    sourceUrl: "https://www.bagdasar-arseni.ro/",
    lastCheckedAt: MANUAL_BUCHAREST_HOSPITAL_SOURCE.checkedAt,
  },
  {
    id: "bucharest-hospital-sf-pantelimon",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "hospital",
    name: "Spitalul Clinic de Urgenta Sfantul Pantelimon",
    address: "Sos. Pantelimon nr. 340-342, Sector 2",
    coordinates: { lat: 44.4410948, lng: 26.1729478 },
    phone: null,
    openingHours: null,
    isNonStop: false,
    emergencyCapability: "upu_verified",
    capabilities: ["hospital", "emergency_care_verified"],
    confidence: "high",
    source: MANUAL_BUCHAREST_HOSPITAL_SOURCE.source,
    sourceLabel: MANUAL_BUCHAREST_HOSPITAL_SOURCE.label,
    sourceUrl: "https://www.spitalul-sfantulpantelimon.ro/",
    lastCheckedAt: MANUAL_BUCHAREST_HOSPITAL_SOURCE.checkedAt,
  },
  {
    id: "bucharest-hospital-grigore-alexandrescu",
    regionId: "bucharest",
    city: "Bucuresti",
    county: "Bucuresti",
    type: "hospital",
    name: "Spitalul Clinic de Urgenta pentru Copii Grigore Alexandrescu",
    address: "Bd. Iancu de Hunedoara nr. 30-32, Sector 1",
    coordinates: { lat: 44.4519409, lng: 26.0918593 },
    phone: null,
    openingHours: null,
    isNonStop: false,
    emergencyCapability: "upu_verified",
    capabilities: ["hospital", "emergency_care_verified"],
    confidence: "high",
    source: MANUAL_BUCHAREST_HOSPITAL_SOURCE.source,
    sourceLabel: MANUAL_BUCHAREST_HOSPITAL_SOURCE.label,
    sourceUrl: "https://spitalulgrigorealexandrescu.ro/",
    lastCheckedAt: MANUAL_BUCHAREST_HOSPITAL_SOURCE.checkedAt,
    notes: "Spital pediatric; regulile de selectie pot tine cont ulterior de publicul tinta.",
  },
] satisfies readonly VerifiedMedicalLocationInput[];

export const verifiedMedicalLocationsBucharest = verifiedMedicalLocationsBucharestRaw.map(
  withEvidence,
) satisfies readonly VerifiedMedicalLocation[];

const verifiedMedicalLocationsVranceaRaw = [
  {
    id: "vrancea-pharmacy-ropharma-17-focsani",
    regionId: "vrancea",
    city: "Focsani",
    county: "Vrancea",
    type: "pharmacy",
    name: "Farmacia Ropharma nr. 17",
    address: "Bd. Unirii nr. 65, Focsani",
    coordinates: { lat: 45.6979792, lng: 27.1826228 },
    phone: null,
    openingHours: "24/7",
    isNonStop: true,
    emergencyCapability: "none",
    capabilities: ["open_pharmacy_candidate", "nonstop_pharmacy"],
    confidence: "medium",
    source: ROPHARMA_FOCSANI_SOURCE.source,
    sourceLabel: ROPHARMA_FOCSANI_SOURCE.label,
    sourceUrl: ROPHARMA_FOCSANI_SOURCE.url,
    lastCheckedAt: ROPHARMA_FOCSANI_SOURCE.checkedAt,
    notes: "Telefonul trebuie confirmat inainte de afisarea butonului Suna.",
  },
  {
    id: "vrancea-hospital-sju-sf-pantelimon-focsani",
    regionId: "vrancea",
    city: "Focsani",
    county: "Vrancea",
    type: "hospital",
    name: "Spitalul Judetean de Urgenta Sfantul Pantelimon Focsani",
    address: "Str. Cuza Voda nr. 50-52, Focsani",
    coordinates: { lat: 45.698529, lng: 27.1893084 },
    phone: null,
    openingHours: null,
    isNonStop: false,
    emergencyCapability: "upu_verified",
    capabilities: ["hospital", "emergency_care_verified"],
    confidence: "high",
    source: "manual_verified",
    sourceLabel: "Verificare manuala Santix - Spitalul Judetean de Urgenta Focsani",
    sourceUrl: "https://spitalvn.ro/",
    lastCheckedAt: MS_UNITATI_SOURCE.checkedAt,
    evidence: [
      {
        source: "manual_verified",
        label: "Site Spitalul Judetean de Urgenta Sfantul Pantelimon Focsani",
        url: "https://spitalvn.ro/",
        checkedAt: MS_UNITATI_SOURCE.checkedAt,
      },
      MS_UNITATI_SOURCE,
    ],
  },
  {
    id: "vrancea-hospital-militar-focsani",
    regionId: "vrancea",
    city: "Focsani",
    county: "Vrancea",
    type: "hospital",
    name: "Spitalul Militar de Urgenta Dr. Alexandru Popescu",
    address: "Str. Cezar Bolliac nr. 3-5, Focsani",
    coordinates: { lat: 45.6967848, lng: 27.1905814 },
    phone: null,
    openingHours: null,
    isNonStop: false,
    emergencyCapability: "probable_emergency",
    capabilities: ["hospital", "emergency_care_probable"],
    confidence: "medium",
    source: "manual_verified",
    sourceLabel: "Verificare manuala Santix - Spitalul Militar de Urgenta Focsani",
    sourceUrl: "https://smufocsani.ro/",
    lastCheckedAt: MS_UNITATI_SOURCE.checkedAt,
    evidence: [
      {
        source: "manual_verified",
        label: "Site Spitalul Militar de Urgenta Dr. Alexandru Popescu",
        url: "https://smufocsani.ro/",
        checkedAt: MS_UNITATI_SOURCE.checkedAt,
      },
      MS_UNITATI_SOURCE,
    ],
    notes: "Nu se afiseaza ca UPU verificat fara sursa explicita.",
  },
] satisfies readonly VerifiedMedicalLocationInput[];

export const verifiedMedicalLocationsVrancea = verifiedMedicalLocationsVranceaRaw.map(
  withEvidence,
) satisfies readonly VerifiedMedicalLocation[];

export const verifiedMedicalLocations = [
  ...verifiedMedicalLocationsBucharest,
  ...verifiedMedicalLocationsVrancea,
] satisfies readonly VerifiedMedicalLocation[];
