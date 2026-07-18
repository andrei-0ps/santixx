import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LatLngExpression, LayerGroup, LeafletMouseEvent, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  Hospital,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Pill,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getMedicalCareCardCategoryLabel,
  getMedicalCareCardMissingMessage,
  getMedicalCareNotFoundLabel,
  getMedicalCareSafetyNote,
  getMedicalCareSourceBadgeLabel,
  getMedicalCareStatusBadgeLabels,
  MEDICAL_CARE_CARD_CATEGORIES,
} from "@/lib/carduriAjutorAproape";
import {
  getMedicalCareMapFitPoints,
  getMedicalCareMapPins,
} from "@/lib/pinuriHartaAjutorAproape";
import {
  getLocationAccuracyLabel,
  getVeryWeakLocationAccuracyMessage,
  getWeakLocationAccuracyMessage,
  isVeryWeakLocationAccuracy,
  isWeakLocationAccuracy,
  sanitizeLocationAccuracy,
} from "@/lib/locatieUtilizatorAjutorAproape";
import {
  getMedicalCareModeLabel,
  MEDICAL_CARE_VIEW_MODES,
  modeCategoryFor,
  type MedicalCareViewMode,
} from "@/lib/moduriAjutorAproape";
import {
  getMedicalCareDecisionTimeLabel,
  getNightPriorityMessage,
  isEveningOrNightInTimeZone,
} from "@/lib/oraAjutorAproape";
import { cn } from "@/lib/utils";
import {
  findNearbyMedicalCareDecision,
  geocodeMedicalCareArea,
  type MedicalCareGeocodeResult,
} from "@/lib/medical-care.functions";
import type { Coordinates } from "@/lib/medical-care.types";
import type {
  MedicalCareAuditCandidate,
  MedicalCareDecisionContext,
} from "@/lib/contextAjutorAproape";
import type {
  MedicalCareCategory,
  MedicalCareFoundResult,
  MedicalCareResult,
} from "@/lib/medical-care.logic";

type Language = "ro" | "en";
type LeafletModule = typeof import("leaflet");
type CarePhase = "idle" | "requesting_location" | "loading_results" | "fallback" | "ready" | "error";
type CenterSource = "browser" | "manual_search" | "manual_map";
type ManualCenterContext = {
  searchText?: string | null;
  geocodedLabel?: string | null;
  geocodedAddress?: string | null;
};

const DEFAULT_CENTER: Coordinates = { lat: 44.4268, lng: 26.1025 };
const labels = {
  ro: {
    title: "Ajutor aproape",
    description: "Locații medicale filtrate pentru nevoie imediată, pe baza poziției tale.",
    requestLocation: "Folosește locația",
    retryLocation: "Reîncearcă locația",
    locationPrompt: "Se cere permisiunea de locație...",
    loadingLocation: "Preiau locația ta...",
    loadingResults: "Caut cele mai apropiate 3 opțiuni...",
    locationDenied: "Locația a fost refuzată. Poți introduce rapid orașul sau zona.",
    locationUnavailable: "Locația nu este disponibilă. Introdu orașul sau zona.",
    areaPlaceholder: "Oraș sau zonă, ex. București, Tineretului",
    areaSubmit: "Caută",
    areaLabel: "Caută după zonă",
    changeArea: "Schimbă zona",
    areaChangePrompt: "Introdu noua zonă pentru recalculare.",
    manualArea: "Zonă introdusă manual",
    mapArea: "Poziție setată pe hartă",
    selectionDetails: "Cum a ales Santix?",
    hideSelectionDetails: "Ascunde explicația",
    auditGeneral: "Audit general",
    auditForTab: "Audit tab",
    geocodingArea: "Verific zona introdusă...",
    geocodeError: "Nu am găsit zona introdusă. Încearcă o denumire mai clară.",
    geocodeMultipleFound:
      "Am găsit mai multe rezultate posibile. Alege locația corectă sau seteaz-o pe hartă.",
    geocodeOptionsTitle: "Rezultate posibile",
    chooseGeocodeResult: "Alege această locație",
    geocodeCoordinates: "Coordonate",
    setPositionOnMap: "Setează poziția pe hartă",
    mapPickPrompt: "Click pe hartă pentru a seta poziția folosită de Ajutor aproape.",
    resultsReady: "Am găsit cele 3 opțiuni utile.",
    resultsPartial: (count: number) =>
      count === 0
        ? "Nu am putut confirma opțiuni utile în datele disponibile."
        : `Am confirmat ${count} din 3 opțiuni utile.`,
    osmTimeoutFallback:
      "Datele externe nu au răspuns la timp. Afișăm doar rezultate verificate Santix, care pot fi mai departe.",
    osmErrorFallback:
      "Datele externe nu sunt disponibile momentan. Afișăm rezultatele verificate Santix disponibile.",
    osmNoResultsFallback:
      "Nu am găsit rezultate externe utilizabile în zona aleasă. Afișăm rezultatele verificate Santix disponibile.",
    farVerifiedResult: "Rezultat verificat, dar mai îndepărtat",
    backendError: "Nu am putut încărca rezultatele medicale. Încearcă din nou.",
    source: "Hartă OSM",
    userLocation: "Poziția ta",
    navigate: "Navighează",
    call: "Sună",
    openingHours: "Program",
    selectionSummary: (analyzed: number, selected: number) =>
      `Am analizat ${analyzed} locații apropiate. Am selectat cele mai utile ${selected} opțiuni.`,
    pharmacySummary: (pharmacies: number, scheduled: number, openNow: number) =>
      `${pharmacies} farmacii găsite · ${scheduled} cu program disponibil · ${openNow} deschise acum`,
    rejectedSummary: (duplicates: number, noisy: number) =>
      `${duplicates} duplicate eliminate · ${noisy} rezultate online/veterinare/irelevante eliminate`,
    auditEmpty: "Nu există detalii de selecție pentru această căutare.",
    auditAccepted: "Selectată",
    auditRejected: "Analizată",
    auditSource: "Sursă",
    auditType: "Tip",
    auditStatus: "Status",
    auditAddress: "Adresă",
    auditPhone: "Telefon",
    auditTechnicalDetails: "Vezi detalii tehnice",
    auditRawHours: "Program brut",
    auditInterpreted: "Program interpretat",
    auditOpenNow: "Deschis acum",
    auditNonstop: "Non-Stop",
    auditConfidence: "Încredere",
    auditScoreRank: "Scor / rank",
    auditActiveCenter: "Coordonate active",
    auditCenterSource: "Sursă coordonate",
    auditSearchText: "Text căutat",
    auditChosenGeocode: "Rezultat geocodat ales",
    auditCalculatedAt: "Ora folosită",
    auditOsmFallback: "Fallback date externe",
    sourceBrowser: "browser",
    sourceManual: "manual_search",
    sourceManualMap: "manual_map",
    sourceDemo: "demo",
    yes: "da",
    no: "nu",
    unknown: "necunoscut",
    openStatus: "deschis",
    closedStatus: "închis",
    pharmacyType: "farmacie",
    hospitalType: "spital",
  },
  en: {
    title: "Nearby care",
    description: "Medical locations filtered for immediate need, based on your position.",
    requestLocation: "Use location",
    retryLocation: "Retry location",
    locationPrompt: "Requesting location permission...",
    loadingLocation: "Getting your location...",
    loadingResults: "Finding the 3 nearest useful options...",
    locationDenied: "Location was denied. You can quickly enter a city or area.",
    locationUnavailable: "Location is unavailable. Enter a city or area.",
    areaPlaceholder: "City or area, e.g. Bucharest, Tineretului",
    areaSubmit: "Search",
    areaLabel: "Search by area",
    changeArea: "Change area",
    areaChangePrompt: "Enter the new area to recalculate.",
    manualArea: "Manually entered area",
    mapArea: "Position set on map",
    selectionDetails: "How did Santix choose?",
    hideSelectionDetails: "Hide explanation",
    auditGeneral: "General audit",
    auditForTab: "Tab audit",
    geocodingArea: "Checking the entered area...",
    geocodeError: "Could not find that area. Try a clearer name.",
    geocodeMultipleFound:
      "Found multiple possible results. Choose the correct location or set it on the map.",
    geocodeOptionsTitle: "Possible results",
    chooseGeocodeResult: "Choose this location",
    geocodeCoordinates: "Coordinates",
    setPositionOnMap: "Set position on map",
    mapPickPrompt: "Click the map to set the position used by Nearby care.",
    resultsReady: "Found the 3 useful options.",
    resultsPartial: (count: number) =>
      count === 0
        ? "Could not confirm useful options in the available data."
        : `Confirmed ${count} of 3 useful options.`,
    osmTimeoutFallback:
      "External data did not respond in time. Showing Santix verified results only; they may be farther away.",
    osmErrorFallback:
      "External data is temporarily unavailable. Showing available Santix verified results.",
    osmNoResultsFallback:
      "No usable external results were found for this area. Showing available Santix verified results.",
    farVerifiedResult: "Verified result, but farther away",
    backendError: "Could not load medical results. Try again.",
    source: "OSM map",
    userLocation: "Your position",
    navigate: "Navigate",
    call: "Call",
    openingHours: "Hours",
    selectionSummary: (analyzed: number, selected: number) =>
      `Analyzed ${analyzed} nearby locations. Selected the most useful ${selected} options.`,
    pharmacySummary: (pharmacies: number, scheduled: number, openNow: number) =>
      `${pharmacies} pharmacies found · ${scheduled} with hours · ${openNow} open now`,
    rejectedSummary: (duplicates: number, noisy: number) =>
      `${duplicates} duplicates removed · ${noisy} online/veterinary/irrelevant results removed`,
    auditEmpty: "There are no selection details for this search.",
    auditAccepted: "Selected",
    auditRejected: "Analyzed",
    auditSource: "Source",
    auditType: "Type",
    auditStatus: "Status",
    auditAddress: "Address",
    auditPhone: "Phone",
    auditTechnicalDetails: "See technical details",
    auditRawHours: "Raw hours",
    auditInterpreted: "Interpreted hours",
    auditOpenNow: "Open now",
    auditNonstop: "24/7",
    auditConfidence: "Confidence",
    auditScoreRank: "Score / rank",
    auditActiveCenter: "Active coordinates",
    auditCenterSource: "Coordinate source",
    auditSearchText: "Search text",
    auditChosenGeocode: "Chosen geocoded result",
    auditCalculatedAt: "Calculated at",
    auditOsmFallback: "External data fallback",
    sourceBrowser: "browser",
    sourceManual: "manual_search",
    sourceManualMap: "manual_map",
    sourceDemo: "demo",
    yes: "yes",
    no: "no",
    unknown: "unknown",
    openStatus: "open",
    closedStatus: "closed",
    pharmacyType: "pharmacy",
    hospitalType: "hospital",
  },
} as const;

function createUserIcon(leaflet: LeafletModule) {
  return leaflet.divIcon({
    className: "santix-care-marker-shell",
    html: '<span class="santix-care-user-marker"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createResultIcon(leaflet: LeafletModule, index: number, category: MedicalCareCategory) {
  return leaflet.divIcon({
    className: "santix-care-marker-shell",
    html: `<span class="santix-care-result-marker santix-care-result-marker-${category}">${index}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function formatDistance(meters: number, lang: Language) {
  if (meters < 1000) {
    const rounded = Math.max(10, Math.round(meters / 10) * 10);
    return `${rounded} m`;
  }

  const kilometers = meters / 1000;
  return `${kilometers.toFixed(kilometers < 10 ? 1 : 0)} ${lang === "ro" ? "km" : "km"}`;
}

function navigationUrl(result: MedicalCareFoundResult) {
  return `https://www.google.com/maps/dir/?api=1&destination=${result.lat},${result.lng}&travelmode=driving`;
}

function telUrl(phone: string | null) {
  const clean = phone?.replace(/[^\d+]/g, "");
  return clean ? `tel:${clean}` : null;
}

function categoryIcon(category: MedicalCareCategory) {
  return category === "emergency_hospital" ? Hospital : Pill;
}

export function MedicalCareMapModal({
  open,
  onOpenChange,
  lang,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Language;
}) {
  const l = labels[lang];
  const [mapContainerElement, setMapContainerElement] = useState<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const requestedForOpenRef = useRef(false);
  const activeRequestRef = useRef(0);
  const [leafletReady, setLeafletReady] = useState(false);
  const [phase, setPhase] = useState<CarePhase>("idle");
  const [statusMessage, setStatusMessage] = useState<string>(l.locationPrompt);
  const [center, setCenter] = useState<Coordinates | null>(null);
  const [centerLabel, setCenterLabel] = useState<string | null>(null);
  const [centerSource, setCenterSource] = useState<CenterSource | null>(null);
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<number | null>(null);
  const [decisionContext, setDecisionContext] = useState<MedicalCareDecisionContext | null>(null);
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const [areaQuery, setAreaQuery] = useState("");
  const [geocodeQuery, setGeocodeQuery] = useState("");
  const [geocodeCandidates, setGeocodeCandidates] = useState<MedicalCareGeocodeResult[]>([]);
  const [manualMapPicking, setManualMapPicking] = useState(false);
  const [activeMode, setActiveMode] = useState<MedicalCareViewMode>("recommended");
  const [auditVisible, setAuditVisible] = useState(false);

  const careResults = decisionContext?.selectedSlots ?? null;
  const visibleCardResults = decisionContext?.visibleItemsByMode[activeMode] ?? null;
  const auditCandidates = decisionContext?.auditCandidatesByMode[activeMode] ?? [];
  const mapPins = useMemo(
    () =>
      visibleCardResults
        ? getMedicalCareMapPins(visibleCardResults, {
            limit: activeMode === "recommended" ? 3 : 5,
            preserveOrder: activeMode !== "recommended",
          })
        : [],
    [activeMode, visibleCardResults],
  );
  const locationAccuracyLabel =
    centerSource === "browser" && locationAccuracyMeters !== null
      ? getLocationAccuracyLabel(locationAccuracyMeters, lang)
      : null;
  const weakLocationAccuracy =
    centerSource === "browser" && isWeakLocationAccuracy(locationAccuracyMeters);
  const veryWeakLocationAccuracy =
    centerSource === "browser" && isVeryWeakLocationAccuracy(locationAccuracyMeters);
  const timeLabel = decisionContext
    ? getMedicalCareDecisionTimeLabel(
        decisionContext.calculatedAtIso,
        decisionContext.timeZone,
        lang,
      )
    : null;
  const nightPriority = decisionContext
    ? isEveningOrNightInTimeZone(decisionContext.calculatedAtIso, decisionContext.timeZone)
    : false;

  const busy = phase === "requesting_location" || phase === "loading_results";

  const loadCareResults = useCallback(
    async (
      nextCenter: Coordinates,
      label: string | null = null,
      accuracyMeters: number | null = null,
      source: CenterSource = "browser",
      manualContext: ManualCenterContext = {},
    ) => {
      setCenter(nextCenter);
      setCenterLabel(label);
      setCenterSource(source);
      setLocationAccuracyMeters(source === "browser" ? accuracyMeters : null);
      setDecisionContext(null);
      setGeocodeCandidates([]);
      setManualMapPicking(false);
      setFallbackVisible(false);
      setActiveMode("recommended");
      setAuditVisible(false);
      setPhase("loading_results");
      setStatusMessage(l.loadingResults);
      const requestId = activeRequestRef.current + 1;
      activeRequestRef.current = requestId;

      try {
        const decision = await findNearbyMedicalCareDecision({
          data: { ...nextCenter, source, ...manualContext },
        });
        if (requestId !== activeRequestRef.current) return;
        const foundCount = decision.selectedSlots.filter((result) => result.available).length;
        setDecisionContext(decision);
        setPhase("ready");
        setStatusMessage(
          getOsmFallbackMessage(decision, lang) ??
            (foundCount === 3 ? l.resultsReady : l.resultsPartial(foundCount)),
        );
      } catch (error) {
        if (requestId !== activeRequestRef.current) return;
        setDecisionContext(null);
        setPhase("error");
        setStatusMessage(l.backendError);
        if (import.meta.env.DEV) console.error("[Santix care map] results error", error);
      }
    },
    [l],
  );

  const requestCurrentLocation = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setFallbackVisible(true);
      setPhase("fallback");
      setStatusMessage(l.locationUnavailable);
      return;
    }

    setDecisionContext(null);
    activeRequestRef.current += 1;
    setGeocodeCandidates([]);
    setGeocodeQuery("");
    setManualMapPicking(false);
    setFallbackVisible(false);
    setCenter(null);
    setCenterLabel(null);
    setCenterSource(null);
    setLocationAccuracyMeters(null);
    setPhase("requesting_location");
    setStatusMessage(l.locationPrompt);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const accuracyMeters = sanitizeLocationAccuracy(position.coords.accuracy);
        void loadCareResults(nextCenter, null, accuracyMeters, "browser");
      },
      (error) => {
        setFallbackVisible(true);
        setPhase("fallback");
        setStatusMessage(error.code === 1 ? l.locationDenied : l.locationUnavailable);
        if (import.meta.env.DEV) console.warn("[Santix care map] geolocation error", error);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }, [l.locationDenied, l.locationPrompt, l.locationUnavailable, loadCareResults]);

  const handleAreaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const area = areaQuery.trim();
    if (!area || busy) return;

    activeRequestRef.current += 1;
    setDecisionContext(null);
    setGeocodeCandidates([]);
    setGeocodeQuery(area);
    setManualMapPicking(false);
    setCenter(null);
    setCenterLabel(null);
    setCenterSource(null);
    setLocationAccuracyMeters(null);
    setActiveMode("recommended");
    setAuditVisible(false);
    setFallbackVisible(false);
    setPhase("loading_results");
    setStatusMessage(l.geocodingArea);

    try {
      const geocoded = await geocodeMedicalCareArea({ data: { area } });
      const [firstCandidate] = geocoded.results;

      if (geocoded.results.length === 1 && firstCandidate) {
        await loadCareResults(
          { lat: firstCandidate.lat, lng: firstCandidate.lng },
          firstCandidate.fullAddress,
          null,
          "manual_search",
          {
            searchText: area,
            geocodedLabel: firstCandidate.label,
            geocodedAddress: firstCandidate.fullAddress,
          },
        );
        return;
      }

      setGeocodeCandidates(geocoded.results);
      setFallbackVisible(true);
      setPhase("fallback");
      setStatusMessage(l.geocodeMultipleFound);
    } catch (error) {
      setFallbackVisible(true);
      setPhase("fallback");
      setStatusMessage(l.geocodeError);
      if (import.meta.env.DEV) console.error("[Santix care map] geocode error", error);
    }
  };

  const handleChangeArea = () => {
    activeRequestRef.current += 1;
    setFallbackVisible(true);
    setAreaQuery("");
    setGeocodeQuery("");
    setGeocodeCandidates([]);
    setManualMapPicking(false);
    setDecisionContext(null);
    setCenter(null);
    setCenterLabel(null);
    setCenterSource(null);
    setLocationAccuracyMeters(null);
    setActiveMode("recommended");
    setAuditVisible(false);
    setPhase("fallback");
    setStatusMessage(l.areaChangePrompt);
  };

  const handleChooseGeocodeCandidate = async (candidate: MedicalCareGeocodeResult) => {
    if (busy) return;

    const query = geocodeQuery || areaQuery.trim();
    await loadCareResults(
      { lat: candidate.lat, lng: candidate.lng },
      candidate.fullAddress,
      null,
      "manual_search",
      {
        searchText: query || null,
        geocodedLabel: candidate.label,
        geocodedAddress: candidate.fullAddress,
      },
    );
  };

  const handleStartMapPicking = () => {
    activeRequestRef.current += 1;
    setFallbackVisible(true);
    setDecisionContext(null);
    setCenter(null);
    setCenterLabel(null);
    setCenterSource(null);
    setLocationAccuracyMeters(null);
    setGeocodeCandidates([]);
    setManualMapPicking(true);
    setActiveMode("recommended");
    setAuditVisible(false);
    setPhase("fallback");
    setStatusMessage(l.mapPickPrompt);
    window.requestAnimationFrame(() => mapRef.current?.invalidateSize());
  };

  useEffect(() => {
    if (!open) {
      requestedForOpenRef.current = false;
      return;
    }

    if (requestedForOpenRef.current) return;
    requestedForOpenRef.current = true;
    setAreaQuery("");
    setGeocodeQuery("");
    setGeocodeCandidates([]);
    setManualMapPicking(false);
    void requestCurrentLocation();
  }, [open, requestCurrentLocation]);

  useEffect(() => {
    if (!open || !mapContainerElement || mapRef.current) return;
    let cancelled = false;

    void (async () => {
      const leaflet = leafletRef.current ?? (await import("leaflet"));
      if (cancelled || mapRef.current) return;

      leafletRef.current = leaflet;
      const initialCenter: LatLngExpression = [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
      const map = leaflet
        .map(mapContainerElement, {
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: true,
        })
        .setView(initialCenter, 12);

      leaflet.control.zoom({ position: "bottomright" }).addTo(map);
      leaflet.control
        .attribution({ prefix: false, position: "bottomleft" })
        .addAttribution("&copy; OpenStreetMap")
        .addTo(map);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        })
        .addTo(map);

      markerLayerRef.current = leaflet.layerGroup().addTo(map);
      mapRef.current = map;
      setLeafletReady(true);
      window.requestAnimationFrame(() => map.invalidateSize());
      window.setTimeout(() => map.invalidateSize(), 120);
      window.setTimeout(() => map.invalidateSize(), 360);
    })();

    return () => {
      cancelled = true;
    };
  }, [mapContainerElement, open]);

  useEffect(() => {
    if (open) return;

    mapRef.current?.remove();
    mapRef.current = null;
    markerLayerRef.current = null;
    setLeafletReady(false);
    setPhase("idle");
    setDecisionContext(null);
    setCenter(null);
    setCenterLabel(null);
    setCenterSource(null);
    setLocationAccuracyMeters(null);
    setFallbackVisible(false);
    setGeocodeCandidates([]);
    setGeocodeQuery("");
    setManualMapPicking(false);
    setActiveMode("recommended");
    setAuditVisible(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => mapRef.current?.invalidateSize());
    const shortTimer = window.setTimeout(() => mapRef.current?.invalidateSize(), 160);
    const modalTimer = window.setTimeout(() => mapRef.current?.invalidateSize(), 420);

    return () => {
      window.clearTimeout(shortTimer);
      window.clearTimeout(modalTimer);
    };
  }, [leafletReady, open]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !manualMapPicking) return;

    const handleMapClick = (event: LeafletMouseEvent) => {
      const nextCenter = {
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      };
      void loadCareResults(nextCenter, l.mapArea, null, "manual_map");
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [l.mapArea, leafletReady, loadCareResults, manualMapPicking]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    const leaflet = leafletRef.current;
    if (!map || !layer || !leaflet) return;

    layer.clearLayers();
    const points: LatLngExpression[] = getMedicalCareMapFitPoints(center, mapPins);

    if (center) {
      leaflet
        .marker([center.lat, center.lng], {
          icon: createUserIcon(leaflet),
          zIndexOffset: 900,
        })
        .addTo(layer);
    }

    mapPins.forEach((pin, index) => {
      const result = pin.result;
      const markerNumber = activeMode === "recommended" ? pin.cardIndex + 1 : index + 1;
      leaflet
        .marker([pin.lat, pin.lng], {
          icon: createResultIcon(leaflet, markerNumber, result.category),
          zIndexOffset: 600 - pin.cardIndex,
        })
        .addTo(layer);
    });

    if (points.length > 1) {
      map.fitBounds(leaflet.latLngBounds(points), {
        padding: [32, 32],
        maxZoom: 15,
        animate: false,
      });
    } else if (points.length === 1 && center) {
      map.setView([center.lat, center.lng], 14, { animate: false });
    }
  }, [activeMode, center, leafletReady, mapPins]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(760px,92vh)] max-w-[900px] overflow-hidden border-primary/20 bg-background/96 p-0 text-foreground shadow-[0_30px_90px_-32px_rgba(0,242,254,0.42)] backdrop-blur-xl sm:rounded-3xl">
        <div className="grid h-full min-h-0 grid-rows-[auto_1fr]">
          <DialogHeader className="border-b border-primary/15 px-5 pb-4 pt-5 text-left sm:px-6">
            <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <DialogTitle className="flex items-center gap-2 text-xl tracking-tight">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <MapPin className="size-4.5" />
                  </span>
                  {l.title}
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                  {l.description}
                </DialogDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => void requestCurrentLocation()}
                disabled={busy}
                className="w-fit rounded-xl"
              >
                {phase === "requesting_location" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="size-3.5" />
                )}
                {phase === "fallback" || phase === "error" ? l.retryLocation : l.requestLocation}
              </Button>
            </div>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto px-4 pb-4 pt-4 sm:px-5">
            <section className="relative h-[260px] overflow-hidden rounded-2xl border border-primary/15 bg-muted/20">
              <div ref={setMapContainerElement} className="h-full w-full" />
              <div className="pointer-events-none absolute left-3 top-3 z-[500] flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2">
                <Badge className="rounded-xl bg-background/88 text-foreground shadow backdrop-blur-md">
                  {l.source}
                </Badge>
                {center && (
                  <Badge
                    variant="outline"
                    className="rounded-xl border-primary/30 bg-background/82 text-foreground backdrop-blur-md"
                  >
                    <MapPin className="mr-1 size-3 text-primary" />
                    {getCenterBadgeLabel(centerSource, centerLabel, lang)}
                  </Badge>
                )}
                {locationAccuracyLabel && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-xl bg-background/82 text-foreground backdrop-blur-md",
                      weakLocationAccuracy
                        ? "border-amber-300/40 text-amber-100"
                        : "border-primary/25",
                    )}
                  >
                    {locationAccuracyLabel}
                  </Badge>
                )}
              </div>
              {busy && (
                <div className="absolute inset-0 z-[520] flex items-center justify-center bg-background/35 backdrop-blur-[2px]">
                  <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-background/92 px-4 py-3 text-sm font-semibold text-foreground shadow">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    {phase === "requesting_location" ? l.loadingLocation : statusMessage}
                  </div>
                </div>
              )}
              {manualMapPicking && !busy && (
                <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[520] rounded-2xl border border-primary/25 bg-background/92 px-3 py-2 text-xs font-semibold text-foreground shadow backdrop-blur-md">
                  {l.mapPickPrompt}
                </div>
              )}
            </section>

            <div className="mt-3 rounded-2xl border border-primary/12 bg-background/55 p-3 text-xs leading-relaxed text-muted-foreground">
              <p>{statusMessage}</p>
              {weakLocationAccuracy && (
                <p className="mt-1 text-amber-100/90">
                  {veryWeakLocationAccuracy
                    ? getVeryWeakLocationAccuracyMessage(lang)
                    : getWeakLocationAccuracyMessage(lang)}
                </p>
              )}
              {timeLabel && <p className="mt-1">{timeLabel}</p>}
              {nightPriority && (
                <p className="mt-1 text-primary/90">{getNightPriorityMessage(lang)}</p>
              )}
            </div>

            {center && !fallbackVisible && (
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleChangeArea}
                  disabled={busy}
                  className="rounded-xl border-primary/20 bg-background/50"
                >
                  <Search className="size-3.5" />
                  {l.changeArea}
                </Button>
              </div>
            )}

            {fallbackVisible && (
              <section className="mt-3 grid gap-3 rounded-2xl border border-primary/12 bg-background/50 p-3">
                <form
                  onSubmit={handleAreaSubmit}
                  className="grid gap-2 sm:grid-cols-[1fr_auto]"
                  aria-label={l.areaLabel}
                >
                  <Input
                    value={areaQuery}
                    onChange={(event) => setAreaQuery(event.target.value)}
                    placeholder={l.areaPlaceholder}
                    disabled={busy}
                    className="h-10 rounded-xl border-primary/20 bg-background/70 text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={busy || !areaQuery.trim()}
                    className="h-10 rounded-xl"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                    {l.areaSubmit}
                  </Button>
                </form>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleStartMapPicking}
                  disabled={busy}
                  className={cn(
                    "w-fit rounded-xl border-primary/20 bg-background/35 text-xs",
                    manualMapPicking && "border-primary/45 bg-primary/10 text-primary",
                  )}
                >
                  <MapPin className="size-3.5" />
                  {l.setPositionOnMap}
                </Button>
                {geocodeCandidates.length > 0 && (
                  <div className="grid gap-2">
                    <p className="text-xs font-bold text-foreground">{l.geocodeOptionsTitle}</p>
                    {geocodeCandidates.map((candidate) => (
                      <article
                        key={candidate.id}
                        className="rounded-xl border border-primary/10 bg-background/55 p-3 text-xs leading-relaxed text-muted-foreground"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-bold text-foreground">{candidate.label}</p>
                            <p className="mt-1">{candidate.fullAddress}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {candidate.cityOrCounty && (
                                <Badge variant="outline" className="rounded-lg px-2 py-0 text-[11px]">
                                  {candidate.cityOrCounty}
                                </Badge>
                              )}
                              {candidate.resultType && (
                                <Badge variant="outline" className="rounded-lg px-2 py-0 text-[11px]">
                                  {candidate.resultType}
                                </Badge>
                              )}
                              <Badge variant="outline" className="rounded-lg px-2 py-0 text-[11px]">
                                {l.geocodeCoordinates}: {formatCoordinates(candidate)}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleChooseGeocodeCandidate(candidate)}
                            disabled={busy}
                            className="shrink-0 rounded-xl"
                          >
                            {l.chooseGeocodeResult}
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {decisionContext && (
              <section className="mt-3 rounded-2xl border border-primary/12 bg-background/50 p-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  {l.selectionSummary(
                    decisionContext.summary.analyzedLocations,
                    decisionContext.summary.selectedResults,
                  )}
                </p>
                <p className="mt-1">
                  {l.pharmacySummary(
                    decisionContext.summary.pharmaciesFound,
                    decisionContext.summary.pharmaciesWithSchedule,
                    decisionContext.summary.pharmaciesOpenNow,
                  )}
                </p>
                <p className="mt-1">
                  {l.rejectedSummary(
                    decisionContext.summary.rejectedDuplicates,
                    decisionContext.summary.rejectedIrrelevant +
                      decisionContext.summary.rejectedOnlineOrVeterinary,
                  )}
                </p>
              </section>
            )}

            {decisionContext && (
              <div className="mt-3 flex flex-wrap gap-2">
                {MEDICAL_CARE_VIEW_MODES.map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={activeMode === mode ? "default" : "outline"}
                    onClick={() => setActiveMode(mode)}
                    className="rounded-xl"
                  >
                    {getMedicalCareModeLabel(mode, lang)}
                  </Button>
                ))}
              </div>
            )}

            <div className="mt-4 grid gap-3">
              {busy && !careResults
                ? MEDICAL_CARE_CARD_CATEGORIES.map((category) => (
                    <CareCardSkeleton key={category} category={category} lang={lang} />
                  ))
                : visibleCardResults?.map((result, index) => (
                    <CareResultCard
                      key={`${result.category}-${result.available ? result.id : result.reason}`}
                      result={result}
                      index={index}
                      decisionContext={decisionContext}
                      lang={lang}
                    />
                  ))}
            </div>

            {decisionContext && (
              <div className="mt-4">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAuditVisible((value) => !value)}
                  className="rounded-xl border-primary/20 bg-background/50"
                >
                  {auditVisible ? l.hideSelectionDetails : l.selectionDetails}
                </Button>

                {auditVisible && (
                  <SelectionAuditPanel
                    activeMode={activeMode}
                    candidates={auditCandidates}
                    decisionContext={decisionContext}
                    lang={lang}
                  />
                )}
              </div>
            )}

            <div className="mt-4 flex gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-3 text-[11px] leading-relaxed text-amber-100/85">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-300" />
              <span>{getMedicalCareSafetyNote(lang)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CareCardSkeleton({
  category,
  lang,
}: {
  category: MedicalCareCategory;
  lang: Language;
}) {
  const Icon = categoryIcon(category);

  return (
    <article className="rounded-2xl border border-primary/10 bg-background/40 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
            {getMedicalCareCardCategoryLabel(category, lang)}
          </p>
          <div className="mt-2 h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-3 flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </article>
  );
}

function SelectionAuditPanel({
  activeMode,
  candidates,
  decisionContext,
  lang,
}: {
  activeMode: MedicalCareViewMode;
  candidates: MedicalCareAuditCandidate[];
  decisionContext: MedicalCareDecisionContext;
  lang: Language;
}) {
  const l = labels[lang];
  const auditTitle =
    activeMode === "recommended"
      ? l.auditGeneral
      : `${l.auditForTab}: ${getMedicalCareModeLabel(activeMode, lang)}`;
  const activeCenter = decisionContext.activeCenter;
  const activeCenterSource = activeCenter.source;
  const decisionTime = getMedicalCareDecisionTimeLabel(
    decisionContext.calculatedAtIso,
    decisionContext.timeZone,
    lang,
  );

  if (!candidates.length) {
    return (
      <div className="mt-3 rounded-2xl border border-primary/12 bg-background/45 p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-semibold text-foreground">{auditTitle}</p>
        <AuditContextHeader
          activeCenter={activeCenter}
          centerSourceLabel={getCenterSourceLabel(activeCenterSource, lang)}
          decisionTime={decisionTime}
          fallbackReason={decisionContext.osmFallback.fallbackReason}
          lang={lang}
        />
        {l.auditEmpty}
      </div>
    );
  }

  return (
    <section className="mt-3 max-h-[360px] overflow-y-auto rounded-2xl border border-primary/12 bg-background/45 p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">{auditTitle}</p>
      <AuditContextHeader
        activeCenter={activeCenter}
        centerSourceLabel={getCenterSourceLabel(activeCenterSource, lang)}
        decisionTime={decisionTime}
        fallbackReason={decisionContext.osmFallback.fallbackReason}
        lang={lang}
      />
      <div className="grid gap-2">
        {candidates.map((candidate) => (
          <article
            key={candidate.id}
            className="rounded-xl border border-primary/10 bg-background/45 p-3 text-xs leading-relaxed text-muted-foreground"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-foreground">{candidate.name}</p>
                <p className="mt-0.5">
                  {l.auditType}: {formatAuditPlaceType(candidate, lang)}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-lg px-2 py-0 text-[11px]",
                  candidate.accepted
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-muted-foreground/20 text-muted-foreground",
                )}
              >
                {candidate.accepted ? l.auditAccepted : l.auditRejected}
              </Badge>
            </div>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              <p>{formatAuditDistance(candidate.distanceMeters, lang)}</p>
              <p>{l.auditSource}: {candidate.sourceLabel}</p>
              <p>{l.auditStatus}: {formatAuditStatus(candidate.openNow, lang)}</p>
            </div>
            <p className="mt-2 text-foreground/85">{candidate.reason}</p>
            <details className="group mt-3 rounded-xl border border-primary/10 bg-background/35 px-3 py-2">
              <summary className="cursor-pointer select-none text-[11px] font-bold text-primary transition-colors hover:text-primary/85">
                {l.auditTechnicalDetails}
              </summary>
              <div className="mt-2 grid gap-1 border-t border-primary/10 pt-2 sm:grid-cols-2">
                <p>{l.auditAddress}: {candidate.address ?? "-"}</p>
                <p>{l.auditPhone}: {candidate.phone ?? "-"}</p>
                <p>{l.auditRawHours}: {candidate.openingHours ?? "-"}</p>
                <p>{l.auditInterpreted}: {candidate.interpretedSchedule}</p>
                <p>{l.auditOpenNow}: {formatAuditBoolean(candidate.openNow, lang)}</p>
                <p>{l.auditNonstop}: {candidate.isNonStop ? l.yes : l.no}</p>
                <p>{l.auditConfidence}: {candidate.confidence}</p>
                <p>{l.auditScoreRank}: {formatAuditScore(candidate, activeMode)}</p>
                <p className="sm:col-span-2">{candidate.reason}</p>
              </div>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

function AuditContextHeader({
  activeCenter,
  centerSourceLabel,
  decisionTime,
  fallbackReason,
  lang,
}: {
  activeCenter: MedicalCareDecisionContext["activeCenter"];
  centerSourceLabel: string;
  decisionTime: string;
  fallbackReason: MedicalCareDecisionContext["osmFallback"]["fallbackReason"];
  lang: Language;
}) {
  const l = labels[lang];

  return (
    <div className="mb-3 grid gap-1 rounded-xl border border-primary/10 bg-background/35 p-2 text-xs text-muted-foreground sm:grid-cols-2">
      <p>
        {l.auditActiveCenter}: {formatCoordinates(activeCenter.coordinates)}
      </p>
      <p>
        {l.auditCenterSource}: {centerSourceLabel}
      </p>
      {activeCenter.searchText && (
        <p className="sm:col-span-2">
          {l.auditSearchText}: {activeCenter.searchText}
        </p>
      )}
      {(activeCenter.geocodedLabel || activeCenter.geocodedAddress) && (
        <p className="sm:col-span-2">
          {l.auditChosenGeocode}:{" "}
          {[activeCenter.geocodedLabel, activeCenter.geocodedAddress]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      <p className="sm:col-span-2">
        {l.auditCalculatedAt}: {decisionTime}
      </p>
      {fallbackReason && (
        <p className="sm:col-span-2">
          {l.auditOsmFallback}: {fallbackReason}
        </p>
      )}
    </div>
  );
}

function CareResultCard({
  result,
  index,
  decisionContext,
  lang,
}: {
  result: MedicalCareResult;
  index: number;
  decisionContext: MedicalCareDecisionContext | null;
  lang: Language;
}) {
  const l = labels[lang];
  const Icon = categoryIcon(result.category);

  if (!result.available) {
    return (
      <article className="rounded-2xl border border-primary/10 bg-background/40 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              {getMedicalCareCardCategoryLabel(result.category, lang, result)}
            </p>
            <h3 className="mt-1 text-base font-bold text-foreground">
              {getMedicalCareNotFoundLabel(lang)}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {getMedicalCareCardMissingMessage(result.reason, lang)}
            </p>
          </div>
        </div>
      </article>
    );
  }

  const phoneHref = telUrl(result.phone);
  const hasCoordinates = Number.isFinite(result.lat) && Number.isFinite(result.lng);
  const sourceBadge = getMedicalCareSourceBadgeLabel(result, lang);
  const statusBadges = getMedicalCareStatusBadgeLabels(result, lang);
  const farVerifiedResult = isFarVerifiedResultAfterOsmTimeout(result, decisionContext);

  return (
    <article className="rounded-2xl border border-primary/14 bg-background/55 p-4 shadow-[0_14px_34px_-28px_rgba(0,242,254,0.75)]">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-2xl text-white shadow",
            result.category === "emergency_hospital"
              ? "bg-rose-700"
              : result.category === "nonstop_pharmacy"
                ? "bg-rose-600"
                : "bg-rose-500",
          )}
        >
          <Icon className="size-4" />
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border border-background bg-background text-[10px] font-black text-foreground">
            {index + 1}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
            {getMedicalCareCardCategoryLabel(result.category, lang, result)}
          </p>
          <h3 className="mt-1 truncate text-base font-bold text-foreground">{result.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge className="rounded-lg bg-primary/15 px-2 py-0 text-[11px] text-primary">
              {formatDistance(result.distanceMeters, lang)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "rounded-lg px-2 py-0 text-[11px]",
                result.source === "manual_verified"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-amber-300/30 bg-amber-300/10 text-amber-100",
              )}
            >
              {sourceBadge}
            </Badge>
            {statusBadges.map((statusBadge, badgeIndex) => (
              <Badge
                key={`${result.category}-${statusBadge}`}
                className={cn(
                  "rounded-lg px-2 py-0 text-[11px] text-white",
                  result.category === "open_pharmacy" && badgeIndex === 0
                    ? "bg-emerald-600"
                    : "bg-rose-600",
                )}
              >
                {statusBadge}
              </Badge>
            ))}
            {farVerifiedResult && (
              <Badge
                variant="outline"
                className="rounded-lg border-amber-300/30 bg-amber-300/10 px-2 py-0 text-[11px] text-amber-100"
              >
                {l.farVerifiedResult}
              </Badge>
            )}
          </div>
          {result.address && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {result.address}
            </p>
          )}
          {result.openingHours && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {l.openingHours}: {result.openingHours}
            </p>
          )}
          {result.selectionReason && (
            <p className="mt-2 text-xs leading-relaxed text-foreground/85">
              {result.selectionReason}
            </p>
          )}
          <div
            className={cn(
              "mt-3 grid gap-2",
              hasCoordinates && phoneHref ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {hasCoordinates && (
              <Button asChild size="sm" className="rounded-xl">
                <a href={navigationUrl(result)} target="_blank" rel="noreferrer">
                  <Navigation className="size-3.5" />
                  {l.navigate}
                </a>
              </Button>
            )}
            {phoneHref ? (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-xl border-primary/20 bg-background/50"
              >
                <a href={phoneHref}>
                  <Phone className="size-3.5" />
                  {l.call}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function formatAuditDistance(distanceMeters: number | null, lang: Language) {
  if (distanceMeters === null) return lang === "ro" ? "Distanță: -" : "Distance: -";
  return `${lang === "ro" ? "Distanță" : "Distance"}: ${formatDistance(distanceMeters, lang)}`;
}

function formatAuditBoolean(value: boolean | null, lang: Language) {
  const l = labels[lang];
  if (value === null) return l.unknown;
  return value ? l.yes : l.no;
}

function formatAuditStatus(openNow: boolean | null, lang: Language) {
  const l = labels[lang];
  if (openNow === null) return l.unknown;
  return openNow ? l.openStatus : l.closedStatus;
}

function formatAuditPlaceType(candidate: MedicalCareAuditCandidate, lang: Language) {
  const l = labels[lang];
  return candidate.placeType === "pharmacy" ? l.pharmacyType : l.hospitalType;
}

function formatAuditScore(candidate: MedicalCareAuditCandidate, activeMode: MedicalCareViewMode) {
  const category = modeCategoryFor(activeMode);
  const score = category ? candidate.scores[category] : null;
  const effectiveScore = score ?? {
    score: candidate.score,
    rank: candidate.rank,
  };

  if (effectiveScore.score === null || effectiveScore.rank === null) {
    return "-";
  }

  return `#${effectiveScore.rank} / ${effectiveScore.score}`;
}

function formatCoordinates(coordinates: Coordinates) {
  return `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;
}

function getCenterSourceLabel(
  source: MedicalCareDecisionContext["activeCenter"]["source"],
  lang: Language,
) {
  const l = labels[lang];
  if (source === "manual_map") return l.sourceManualMap;
  if (source === "manual_search") return l.sourceManual;
  if (source === "manual") return l.sourceManual;
  if (source === "demo") return l.sourceDemo;
  return l.sourceBrowser;
}

function getCenterBadgeLabel(source: CenterSource | null, label: string | null, lang: Language) {
  const l = labels[lang];
  if (source === "manual_map") return label ?? l.mapArea;
  if (source === "manual_search") return `${l.manualArea}${label ? `: ${label}` : ""}`;
  return label ?? l.userLocation;
}

function getOsmFallbackMessage(decisionContext: MedicalCareDecisionContext, lang: Language) {
  const l = labels[lang];

  switch (decisionContext.osmFallback.fallbackReason) {
    case "osm_timeout":
      return l.osmTimeoutFallback;
    case "osm_error":
      return l.osmErrorFallback;
    case "osm_no_results":
      return l.osmNoResultsFallback;
    default:
      return null;
  }
}

function isFarVerifiedResultAfterOsmTimeout(
  result: MedicalCareResult,
  decisionContext: MedicalCareDecisionContext | null,
) {
  return (
    result.available &&
    result.source === "manual_verified" &&
    result.distanceMeters >= 3000 &&
    decisionContext?.osmFallback.fallbackReason === "osm_timeout"
  );
}
