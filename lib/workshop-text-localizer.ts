import { AppLanguage } from "./workshop-i18n";

interface TrEntry {
  pl: string;
  de: string;
  en: string;
}

const UNIT_TRANSLATIONS: TrEntry[] = [
  {
    pl: "Hala 1 – Serwis Przyczep & TÜV",
    de: "Halle 1 – Anhängerservice & TÜV",
    en: "Bay 1 – Trailer Service & TÜV",
  },
  {
    pl: "Hala 2 – Maszyny Budowlane & Hydraulika",
    de: "Halle 2 – Baumaschinen & Hydraulik",
    en: "Bay 2 – Construction Machinery & Hydraulics",
  },
  {
    pl: "Stanowisko 3 – Elektryka & Hamulce",
    de: "Platz 3 – Elektrik & Bremsendienst",
    en: "Station 3 – Electrics & Brake Service",
  },
  {
    pl: "Mobilny Serwis Terenowy",
    de: "Mobiler Außendienst-Service",
    en: "Mobile Field Service Unit",
  },
  {
    pl: "Kolejka – Nieprzydzielone",
    de: "Warteschlange – Nicht zugewiesen",
    en: "Queue – Unassigned",
  },
];

const VEHICLE_TYPE_TRANSLATIONS: Record<string, TrEntry> = {
  Planen_Tieflader: {
    pl: "Przyczepa plandeka (Tieflader)",
    de: "Planen-Tieflader",
    en: "Tarpaulin Low-Loader",
  },
  Planen_Hochlader: {
    pl: "Przyczepa plandeka (Hochlader)",
    de: "Planen-Hochlader",
    en: "Tarpaulin High-Loader",
  },
  Planen_Drehschemel: {
    pl: "Przyczepa plandeka z obrotnicą",
    de: "Planen-Drehschemelanhänger",
    en: "Turntable Tarpaulin Trailer",
  },
  "Koffer_Flügeltüre": {
    pl: "Furgon drzwi skrzydełkowe",
    de: "Kofferanhänger Flügeltüren",
    en: "Box Trailer Double Doors",
  },
  Koffer_Rampe: {
    pl: "Furgon z rampą najazdową",
    de: "Kofferanhänger mit Auffahrrampe",
    en: "Box Trailer with Ramp",
  },
  Koffer_Alu: {
    pl: "Kontener aluminiowy",
    de: "Alu-Kofferanhänger",
    en: "Aluminum Box Trailer",
  },
  Koffer_Deckel: {
    pl: "Przyczepa z pokrywą",
    de: "Deckelanhänger",
    en: "Lid Box Trailer",
  },
  Koffer_Wielkogabarytowy: {
    pl: "Kontener wielkogabarytowy",
    de: "Großraum-Kofferanhänger",
    en: "Large-Volume Box Trailer",
  },
  Offen_Standard: {
    pl: "Przyczepa otwarta skrzyniowa",
    de: "Offener Kastenanhänger",
    en: "Open Utility Trailer",
  },
  Offen_Laubgitter: {
    pl: "Przyczepa z nadstawką siatkową",
    de: "Kastenanhänger mit Laubgitter",
    en: "Mesh-Sided Utility Trailer",
  },
  Chłodnia: {
    pl: "Przyczepa chłodnicza",
    de: "Kühlanhänger",
    en: "Refrigerated Trailer",
  },
  Kipper_Tylny: {
    pl: "Wywrotka tylnozsypowa",
    de: "Rückwärtskipper",
    en: "Rear Tipper Trailer",
  },
  Kipper_Trójstronny: {
    pl: "Wywrotka trójstronna",
    de: "Dreiseitenkipper",
    en: "Three-Way Tipper Trailer",
  },
  Laweta_Uchylna: {
    pl: "Autolaweta uchylna",
    de: "Kippbarer Autotransporter",
    en: "Tilt-Bed Car Transporter",
  },
  Laweta_Platforma: {
    pl: "Laweta platformowa",
    de: "Plattform-Autotransporter",
    en: "Flatbed Car Transporter",
  },
  Maszynowa: {
    pl: "Przyczepa pod maszyny budowlane",
    de: "Baumaschinentransporter",
    en: "Machinery Plant Trailer",
  },
  Laweta_Obrotnica: {
    pl: "Laweta z obrotnicą",
    de: "Drehschemel-Autotransporter",
    en: "Turntable Car Transporter",
  },
  Motocyklowa_Szynowa: {
    pl: "Przyczepa motocyklowa szynowa",
    de: "Motorradanhänger",
    en: "Motorcycle Rail Trailer",
  },
  Opuszczana: {
    pl: "Przyczepa opuszczana hydraulicznie",
    de: "Absenkanhänger",
    en: "Hydraulic Drop-Deck Trailer",
  },
  Konie: {
    pl: "Przyczepa do przewozu koni",
    de: "Pferdeanhänger",
    en: "Horse Trailer",
  },
  LKW_Plane: {
    pl: "Przyczepa ciężarowa LKW Plandeka",
    de: "LKW-Planenanhänger",
    en: "HGV Curtain-Side Trailer",
  },
  LKW_Kipper: {
    pl: "Wywrotka ciężarowa LKW",
    de: "LKW-Kipperanhänger",
    en: "HGV Tipper Trailer",
  },
  LKW_Tandem: {
    pl: "Przyczepa ciężarowa LKW Tandem",
    de: "LKW-Tandemanhänger",
    en: "HGV Tandem Trailer",
  },
};

const PART_UNIT_TRANSLATIONS: TrEntry[] = [
  { pl: "szt.", de: "Stk.", en: "pcs" },
  { pl: "kpl.", de: "Satz", en: "set" },
  { pl: "m", de: "m", en: "m" },
  { pl: "l", de: "l", en: "L" },
];

/**
 * Bidirectional static phrase dictionary covering all pre-seeded & template Workshop texts
 * so any existing order saved in PL, DE, or EN switches instantaneously (0 ms).
 */
const PHRASE_DICTIONARY: TrEntry[] = [
  ...UNIT_TRANSLATIONS,
  ...PART_UNIT_TRANSLATIONS,
  // Mechanic specializations
  {
    pl: "TÜV, Kundendienst & Układy hamulcowe",
    de: "TÜV, Kundendienst & Bremsanlagen",
    en: "TÜV Inspections, Service & Brake Systems",
  },
  {
    pl: "Maszyny budowlane, Hydraulika & Elektryka 24V",
    de: "Baumaschinen, Hydraulik & 24V-Elektrik",
    en: "Construction Machinery, Hydraulics & 24V Electrics",
  },
  // Order 1 (wo_doll_01 - Crawler Winch #WB-99)
  {
    pl: "Wyciągarka budowlana na gąsienicach",
    de: "Raupen-Bauwinde (Kabelziehwinde)",
    en: "Tracked Construction Cable Winch",
  },
  {
    pl: "Podwozie gąsienicowe gumowe, napęd elektrohydrauliczny 24V, bęben linowy 12 mm",
    de: "Gummiraupenfahrwerk, elektrohydraulischer 24V-Antrieb, Seiltrommel 12 mm",
    en: "Rubber crawler undercarriage, 24V electro-hydraulic drive, 12 mm cable drum",
  },
  {
    pl: "Diagnostyka wiązki zasilającej 24V i sterowania pilotem",
    de: "Diagnose des 24V-Hauptkabelbaums und der Fernbedienung",
    en: "Diagnostics of 24V power wiring harness and remote control",
  },
  {
    pl: "Kontrola szczęk i linki hamulca bezpieczeństwa bębna",
    de: "Prüfung der Bremsbacken und Sicherheitsbremsseile der Seiltrommel",
    en: "Inspection of brake shoes and drum safety brake cables",
  },
  {
    pl: "Przegląd okresowy UVV oraz smarowanie punktów ruchomych",
    de: "UVV-Sicherheitsprüfung sowie Abschmieren aller beweglichen Teile",
    en: "Periodic UVV safety inspection and lubrication of moving parts",
  },
  {
    pl: "Demontaż osłony, test instalacji elektrycznej i szczęk",
    de: "Schutzabdeckung demontiert, Elektrik und Bremsbacken geprüft",
    en: "Removed housing cover, tested electrical wiring and brake shoes",
  },
  {
    pl: "Pomiary akumulatora rozruchowego i weryfikacja linek",
    de: "Starterbatterie durchgemessen und Bremsseile überprüft",
    en: "Load-tested starter battery and inspected brake cables",
  },
  {
    pl: "Bremsbacken kpl. (Szczęki hamulcowe)",
    de: "Bremsbacken kpl.",
    en: "Brake shoes complete set (Bremsbacken)",
  },
  {
    pl: "Bremsseile (Linki hamulcowe nierdzewne)",
    de: "Bremsseile Edelstahl",
    en: "Stainless steel brake cables (Bremsseile)",
  },
  {
    pl: "Bremsseile (Linka hamulcowa)",
    de: "Bremsseile",
    en: "Brake cables (Bremsseile)",
  },
  {
    pl: "Batterie neu 12V (Akumulator)",
    de: "Batterie neu 12V",
    en: "New 12V Battery",
  },
  {
    pl: "Keilriemen (Pasek klinowy)",
    de: "Keilriemen",
    en: "V-Belt (Keilriemen)",
  },
  {
    pl: "Wtyczka 13-pin / Wiązka elektr.",
    de: "13-pol. Stecker / Kabelsatz",
    en: "13-pin Plug / Wiring Harness",
  },
  {
    pl: "Koło podporowe wzmocnione",
    de: "Stützrad verstärkt",
    en: "Heavy-duty Jockey Wheel",
  },
  {
    pl: "Przetarty przewód sterowniczy 7-żyłowy przy wejściu do skrzynki rozdzielczej",
    de: "Durchgescheuertes 7-adriges Steuerkabel am Eingang zum Schaltkasten",
    en: "Chafed 7-core control cable at the junction box entry",
  },
  {
    pl: "Zużyte szczęki hamulcowe oraz zapieczone 2 linki hamulcowe (Bremsseile)",
    de: "Verschlissene Bremsbacken sowie 2 festgerostete Bremsseile",
    en: "Worn brake shoes and 2 seized brake cables (Bremsseile)",
  },
  {
    pl: "Spadek pojemności akumulatora 12V/74Ah poniżej 40% — wymagana wymiana (Batterie neu)",
    de: "Batteriekapazität 12V/74Ah unter 40% — Austausch erforderlich (Batterie neu)",
    en: "12V/74Ah battery capacity dropped below 40% — replacement required",
  },
  {
    pl: "Batterie 12V 74Ah Heavy Duty (1 szt.)",
    de: "Batterie 12V 74Ah Heavy Duty (1 Stk.)",
    en: "12V 74Ah Heavy Duty Battery (1 pc)",
  },
  {
    pl: "Przewód olejoodporny 7x1.5 mm² (4 m) + dławik PG16",
    de: "Ölbeständiges Steuerkabel 7x1,5 mm² (4 m) + Kabelverschraubung PG16",
    en: "Oil-resistant cable 7x1.5 mm² (4 m) + PG16 cable gland",
  },
  {
    pl: "Szczęki hamulcowe kpl. + 2x linka hamulcowa",
    de: "Bremsbacken-Satz kpl. + 2x Bremsseil",
    en: "Complete brake shoe kit + 2x brake cable",
  },
  {
    pl: "Maszyna zabezpieczona na stanowisku nr 2. Po zatwierdzeniu kosztów przez klienta dokończymy montaż w zespole 2-osobowym.",
    de: "Maschine auf Platz 2 gesichert. Nach Kostenfreigabe durch den Kunden schließen wir die Montage im 2er-Team ab.",
    en: "Machine secured at bay #2. Once client approves the quote, our 2-mechanic team will complete assembly.",
  },
  // Order 2 (wo_doll_02 - Trailer N-DC 210)
  {
    pl: "Hochlader 3500 kg (517 x 200 x 220 cm)",
    de: "Hochlader 3500 kg (517 x 200 x 220 cm)",
    en: "High-Loader 3500 kg (517 x 200 x 220 cm)",
  },
  {
    pl: "Przygotowanie przyczepy do badania głównego TÜV",
    de: "Vorbereitung des Anhängers zur TÜV-Hauptuntersuchung",
    en: "Prepare trailer for main TÜV roadworthiness inspection",
  },
  {
    pl: "Smarowanie najazdu i kontrola ciśnienia w ogumieniu",
    de: "Auflaufeinrichtung abschmieren und Reifendruck kontrollieren",
    en: "Lubricate overrun coupling and check tire pressures",
  },
  {
    pl: "Dokręcenie kół kluczem dynamometrycznym z wpisem Nm do protokołu",
    de: "Räder mit Drehmomentschlüssel nachziehen und Nm-Wert im Protokoll vermerken",
    en: "Torque wheel bolts with calibrated wrench and record Nm in protocol",
  },
  // Order 3 (wo_doll_03 - Unassigned Trailer N-SD 523)
  {
    pl: "Hochlader 2000 kg — diagnostyka osi i hamulców przed TÜV",
    de: "Hochlader 2000 kg — Achs- und Bremsendiagnose vor TÜV",
    en: "High-Loader 2000 kg — axle and brake diagnostics prior to TÜV",
  },
  {
    pl: "Weryfikacja luzów łożysk osi oraz stanu bębnów hamulcowych",
    de: "Prüfung des Radlagerspiels sowie Zustand der Bremstrommeln",
    en: "Inspect axle wheel bearing play and brake drum condition",
  },
  {
    pl: "Sprawdzenie geometrii zaczepu kulowego i amortyzatora najazdu",
    de: "Kugelkupplung und Auflaufdämpfer auf Verschleiß prüfen",
    en: "Check ball coupling wear and overrun damper",
  },
  {
    pl: "Pełny test oświetlenia 13-pin i przygotowanie kosztorysu dla biura",
    de: "Kompletter 13-pol. Beleuchtungstest und Kostenvoranschlag fürs Büro erstellen",
    en: "Full 13-pin lighting test and prepare repair estimate for office",
  },
  // Default / Common Workshop Strings
  {
    pl: "Sprawdzenie stanu technicznego oraz oświetlenia",
    de: "Technischen Zustand und Beleuchtung prüfen",
    en: "Inspect technical condition and lighting system",
  },
  {
    pl: "Praca warsztatowa",
    de: "Werkstattarbeit",
    en: "Workshop service",
  },
  {
    pl: "Brak wykrytych usterek",
    de: "Keine Mängel festgestellt",
    en: "No defects detected",
  },
  {
    pl: "Wszystkie zlecone czynności serwisowe i kontrolne zostały wykonane prawidłowo.",
    de: "Alle beauftragten Service- und Prüfarbeiten wurden fachgerecht durchgeführt.",
    en: "All requested service and inspection tasks were completed properly.",
  },
  // Office internal notes & client decision notes (seeded)
  {
    pl: "Stały klient B2B — prosi o telefon przed wymianą akumulatora powyżej 500 EUR netto.",
    de: "B2B-Stammkunde — bittet um Rückruf vor Batterietausch über 500 EUR netto.",
    en: "Regular B2B client — requests a phone call before battery replacement exceeding 500 EUR net.",
  },
  {
    pl: "Klient zaakceptował standardowy koszt przeglądu TÜV + Kundendienst przy oddaniu przyczepy.",
    de: "Kunde hat die Standardkosten für TÜV + Kundendienst bei Fahrzeugabgabe freigegeben.",
    en: "Customer approved standard TÜV + service fee upon trailer drop-off.",
  },
  {
    pl: "Przyczepa przyjęta na plac — oczekuje na przydzielenie wolnego mechanika.",
    de: "Anhänger auf dem Hof angenommen — wartet auf Zuweisung eines freien Mechanikers.",
    en: "Trailer checked into yard — waiting in queue for mechanic assignment.",
  },
  // Seeded Notifications
  {
    pl: "Nowy raport usterek od mechanika (Andy)",
    de: "Neuer Mängelbericht vom Mechaniker (Andy)",
    en: "New defect report from mechanic (Andy)",
  },
  {
    pl: "Wykryto 3 usterki (wiązka 24V, szczęki/linki, akumulator). Szacowany czas: 3.5h. Wymagany kontakt z klientem.",
    de: "3 Mängel erkannt (24V-Kabelbaum, Bremsbacken/-seile, Batterie). Geschätzte Zeit: 3.5h. Kundenkontakt erforderlich.",
    en: "3 defects detected (24V harness, brake shoes/cables, battery). Est. time: 3.5h. Client approval required.",
  },
  {
    pl: "Nowe zlecenie serwisowe: TÜV + Kundendienst",
    de: "Neuer Serviceauftrag: TÜV + Kundendienst",
    en: "New service order: TÜV + Service Check",
  },
  {
    pl: "Przypisano przyczepę N-DC 210 (Hala 1 – Serwis Przyczep & TÜV).",
    de: "Anhänger N-DC 210 zugewiesen (Halle 1 – Anhängerservice & TÜV).",
    en: "Assigned trailer N-DC 210 (Bay 1 – Trailer Service & TÜV).",
  },
  {
    pl: "Wyciągarka budowlana na gąsienicach · #WB-99",
    de: "Raupen-Bauwinde (Kabelziehwinde) · #WB-99",
    en: "Tracked Construction Cable Winch · #WB-99",
  },
  // Trailer model notes from fleet
  {
    pl: "Tieflader (koła na zewnątrz)",
    de: "Tieflader (außenliegende Räder)",
    en: "Low-Loader (external wheels)",
  },
  {
    pl: "Hochlader (koła pod spodem)",
    de: "Hochlader (Räder unter der Ladefläche)",
    en: "High-Loader (wheels underneath)",
  },
  {
    pl: "Drehschemel (Obrotnica)",
    de: "Drehschemelanhänger",
    en: "Turntable Trailer",
  },
  {
    pl: "Drzwi / Rampa (Tempo 100 km/h)",
    de: "Türen / Auffahrrampe (Tempo 100 km/h)",
    en: "Doors / Loading Ramp (100 km/h)",
  },
  {
    pl: "Drzwi skrzydełkowe (Flügeltüre)",
    de: "Flügeltüren",
    en: "Double Wing Doors",
  },
  {
    pl: "Aluminiowa",
    de: "Aluminium-Aufbau",
    en: "Aluminum Body",
  },
  {
    pl: "Otwarte burty",
    de: "Offene Bordwände",
    en: "Open Drop Sides",
  },
];

// Fast O(1) lookup map across all 3 languages -> TrEntry
const NORMALIZED_MAP = new Map<string, TrEntry>();
for (const entry of PHRASE_DICTIONARY) {
  NORMALIZED_MAP.set(entry.pl.trim().toLowerCase(), entry);
  NORMALIZED_MAP.set(entry.de.trim().toLowerCase(), entry);
  NORMALIZED_MAP.set(entry.en.trim().toLowerCase(), entry);
}

export function toAppLang(lang?: string): AppLanguage {
  if (lang === "de") return "de";
  if (lang === "en") return "en";
  return "pl";
}

export function localizeUnitName(unitName?: string, lang?: string): string {
  if (!unitName) return "";
  const target = toAppLang(lang);
  const found = NORMALIZED_MAP.get(unitName.trim().toLowerCase());
  if (found) return found[target];
  return unitName;
}

export function localizeVehicleType(vehicleType?: string, lang?: string): string {
  if (!vehicleType) return "";
  const target = toAppLang(lang);
  const exact = VEHICLE_TYPE_TRANSLATIONS[vehicleType.trim()];
  if (exact) return exact[target];
  const found = NORMALIZED_MAP.get(vehicleType.trim().toLowerCase());
  if (found) return found[target];
  return vehicleType.replace(/_/g, " ");
}

export function localizePartUnit(unit?: string, lang?: string): string {
  const target = toAppLang(lang);
  if (!unit) {
    return target === "de" ? "Stk." : target === "en" ? "pcs" : "szt.";
  }
  const found = NORMALIZED_MAP.get(unit.trim().toLowerCase());
  return found ? found[target] : unit;
}

/**
 * Pattern-based instant translator for dynamically generated Workshop notification titles/messages
 * that were stored earlier in another language.
 */
function translateDynamicPatterns(text: string, target: AppLanguage): string | null {
  const trimmed = text.trim();

  // Pattern 1: "Nowe zlecenie WA-..." / "Neuer Auftrag WA-..." / "New Work Order WA-..."
  const mNewOrder = trimmed.match(
    /^(?:Nowe zlecenie|Neuer Auftrag|New Work Order)\s+(WA-[\w/-]+)$/i
  );
  if (mNewOrder) {
    const num = mNewOrder[1];
    if (target === "de") return `Neuer Auftrag ${num}`;
    if (target === "en") return `New Work Order ${num}`;
    return `Nowe zlecenie ${num}`;
  }

  // Pattern 2: "Przypisano zakres: X (Unit)." / "Zugewiesener Umfang: X (Unit)." / "Assigned scope: X (Unit)."
  const mAssignedScope = trimmed.match(
    /^(?:Przypisano zakres|Zugewiesener Umfang|Assigned scope):\s*(.+?)\s*\((.+)\)\.?$/i
  );
  if (mAssignedScope) {
    const scopes = mAssignedScope[1];
    const unit = localizeUnitName(mAssignedScope[2], target);
    if (target === "de") return `Zugewiesener Umfang: ${scopes} (${unit}).`;
    if (target === "en") return `Assigned scope: ${scopes} (${unit}).`;
    return `Przypisano zakres: ${scopes} (${unit}).`;
  }

  // Pattern 3: Defect report title
  const mRepTitle = trimmed.match(
    /^(?:PILNE:\s*Poinformuj klienta\s*[—–-]\s*Raport usterek|DRINGEND:\s*Kunde informieren\s*[—–-]\s*Mängelbericht|URGENT:\s*Notify customer\s*[—–-]\s*Defect report|Raport usterek z warsztatu|Mängelbericht aus der Werkstatt|Workshop Defect Report|Nowy raport usterek od mechanika)\s*\((.+)\)$/i
  );
  if (mRepTitle) {
    const who = mRepTitle[1];
    if (target === "de")
      return `DRINGEND: Kunde informieren — Mängelbericht (${who})`;
    if (target === "en")
      return `URGENT: Notify customer — Defect report (${who})`;
    return `PILNE: Poinformuj klienta — Raport usterek (${who})`;
  }

  // Pattern 4: Defect report message
  const mRepMsg = trimmed.match(
    /^(?:Wykryto usterek|Erkannte Mängel|Detected defects):\s*(\d+),\s*(?:szacowany czas|geschätzte Zeit|est\. time):\s*([\d.]+)h\./i
  );
  if (mRepMsg) {
    const cnt = mRepMsg[1];
    const hrs = mRepMsg[2];
    if (target === "de")
      return `Erkannte Mängel: ${cnt}, geschätzte Zeit: ${hrs}h. Bitte Kunden informieren und Entscheidung (Freigabe / Ablehnung) an Mechaniker melden.`;
    if (target === "en")
      return `Detected defects: ${cnt}, est. time: ${hrs}h. Inform customer and send approval/rejection decision back to mechanic.`;
    return `Wykryto usterek: ${cnt}, szacowany czas: ${hrs}h. Poinformuj klienta i przekaż mechanikowi zgodę lub odmowę naprawy.`;
  }

  // Pattern 5: Client approved / rejected title
  const mApproved = trimmed.match(
    /^(?:Klient ZATWIERDZIŁ naprawę|Kunde hat Reparatur FREIGEGEBEN|Customer APPROVED repair)\s*\((.+)\)$/i
  );
  if (mApproved) {
    const num = mApproved[1];
    if (target === "de") return `Kunde hat Reparatur FREIGEGEBEN (${num})`;
    if (target === "en") return `Customer APPROVED repair (${num})`;
    return `Klient ZATWIERDZIŁ naprawę (${num})`;
  }

  const mRejected = trimmed.match(
    /^(?:Klient ODRZUCIŁ naprawę|Kunde hat Reparatur ABGELEHNT|Customer REJECTED repair)\s*\((.+)\)$/i
  );
  if (mRejected) {
    const num = mRejected[1];
    if (target === "de") return `Kunde hat Reparatur ABGELEHNT (${num})`;
    if (target === "en") return `Customer REJECTED repair (${num})`;
    return `Klient ODRZUCIŁ naprawę (${num})`;
  }

  // Pattern 6: Client approved / rejected message
  if (
    /^(Można kontynuować naprawę|Reparatur kann fortgesetzt|You may proceed with the repair)/i.test(
      trimmed
    )
  ) {
    if (target === "de")
      return "Reparatur kann fortgesetzt und Endprotokoll abgeschlossen werden.";
    if (target === "en")
      return "You may proceed with the repair and finalize the protocol.";
    return "Można kontynuować naprawę i finalizować protokół końcowy.";
  }

  if (
    /^(Wstrzymano naprawę na życzenie|Reparatur auf Wunsch des Kunden|Repair stopped at customer)/i.test(
      trimmed
    )
  ) {
    if (target === "de") return "Reparatur auf Wunsch des Kunden gestoppt.";
    if (target === "en") return "Repair stopped at customer's request.";
    return "Wstrzymano naprawę na życzenie klienta.";
  }

  // Pattern 7: Order completed
  const mCompleted = trimmed.match(
    /^(?:Zlecenie|Auftrag|Order)\s+(WA-[\w/-]+)\s+(?:UKOŃCZONE|ABGESCHLOSSEN|COMPLETED)$/i
  );
  if (mCompleted) {
    const num = mCompleted[1];
    if (target === "de") return `Auftrag ${num} ABGESCHLOSSEN`;
    if (target === "en") return `Order ${num} COMPLETED`;
    return `Zlecenie ${num} UKOŃCZONE`;
  }

  const mCompletedMsg = trimmed.match(
    /^(?:Protokół podpisany przez|Protokoll unterschrieben von|Protocol signed by):\s*(.+?)\.\s*(?:Łączny czas|Gesamtzeit|Total time):\s*([\d.]+)h\.$/i
  );
  if (mCompletedMsg) {
    const who = mCompletedMsg[1];
    const hrs = mCompletedMsg[2];
    if (target === "de") return `Protokoll unterschrieben von: ${who}. Gesamtzeit: ${hrs}h.`;
    if (target === "en") return `Protocol signed by: ${who}. Total time: ${hrs}h.`;
    return `Protokół podpisany przez: ${who}. Łączny czas: ${hrs}h.`;
  }

  // Pattern 8: Order transferred
  const mTransferred = trimmed.match(
    /^(?:Przekazano zlecenie|Auftrag|Order)\s+(WA-[\w/-]+)\s+(?:do|an|transferred to)\s+(.+?)(?:\s+übergeben)?$/i
  );
  if (mTransferred) {
    const num = mTransferred[1];
    const unit = localizeUnitName(mTransferred[2], target);
    if (target === "de") return `Auftrag ${num} an ${unit} übergeben`;
    if (target === "en") return `Order ${num} transferred to ${unit}`;
    return `Przekazano zlecenie ${num} do ${unit}`;
  }

  const mTransferredMsg = trimmed.match(
    /^(?:Przeniesiono z|Übergeben von|Transferred from)\s+(.+?)\s+(?:z zachowaniem|unter Beibehaltung|preserving)/i
  );
  if (mTransferredMsg) {
    const fromUnit = localizeUnitName(mTransferredMsg[1], target);
    if (target === "de")
      return `Übergeben von ${fromUnit} unter Beibehaltung des Fortschritts.`;
    if (target === "en")
      return `Transferred from ${fromUnit} preserving existing progress.`;
    return `Przeniesiono z ${fromUnit} z zachowaniem dotychczasowego postępu.`;
  }

  return null;
}

/**
 * Synchronous deterministic lookup (returns string if statically known/matched, or null if custom user text).
 */
export function translateWorkshopStatic(text?: string, lang?: string): string | null {
  if (!text) return "";
  const trimmed = text.trim();
  if (!trimmed) return "";
  const target = toAppLang(lang);

  const exact = NORMALIZED_MAP.get(trimmed.toLowerCase());
  if (exact) return exact[target];

  if (VEHICLE_TYPE_TRANSLATIONS[trimmed]) {
    return VEHICLE_TYPE_TRANSLATIONS[trimmed][target];
  }

  const pat = translateDynamicPatterns(trimmed, target);
  if (pat) return pat;

  // Composite subtype strings like "Tieflader (koła na zewnątrz) · 750 kg / 580 kg · 210 x 130 x 155 cm"
  if (trimmed.includes(" · ")) {
    const parts = trimmed.split(" · ");
    let anyTranslated = false;
    const mapped = parts.map((seg) => {
      const hit = NORMALIZED_MAP.get(seg.trim().toLowerCase());
      if (hit) {
        anyTranslated = true;
        return hit[target];
      }
      if (VEHICLE_TYPE_TRANSLATIONS[seg.trim()]) {
        anyTranslated = true;
        return VEHICLE_TYPE_TRANSLATIONS[seg.trim()][target];
      }
      return seg;
    });
    if (anyTranslated) return mapped.join(" · ");
  }

  return null;
}
