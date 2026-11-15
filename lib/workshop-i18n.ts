export type AppLanguage = "pl" | "de" | "en";

export interface WorkshopI18n {
  // Header & Modes
  mechanicMobileSubtitle: string;
  mechanicPreviewBtn: string;
  notificationsBtn: string;
  notificationsTitle: string;
  markAllRead: string;
  noNotifications: string;
  backToCalendar: string;
  backToOrdersList: string;
  officeLabel: string;
  gdprShort: string;

  // Mechanic Portal Tabs & Cards
  previewMechanicDbLabel: string;
  myActiveTab: string;
  allWorkshopTab: string;
  historyTab: string;
  emptyTabTitle: string;
  emptyTabDesc: string;
  equipmentFallback: string;
  noPlateFallback: string;
  trailerFallback: string;
  scopePrefix: string;
  openProtocolBtn: string;

  // Office Dispatcher KPIs, Active Board, Unassigned Tab, Mechanics Menu & Table
  kpiActiveOrders: string;
  kpiUnassignedOrders: string;
  kpiWaitingClient: string;
  kpiApprovedInWork: string;
  kpiCompletedProtocols: string;
  tabActiveBoard: string;
  tabUnassigned: string;
  tabAllTable: string;
  tabAll: string;
  tabInProgress: string;
  tabClientApproval: string;
  tabCompleted: string;
  colStageNew: string;
  colStageInProgress: string;
  colStageWaitingApproval: string;
  colStageApproved: string;
  emptyStageCol: string;
  emptyActiveBoardTitle: string;
  emptyActiveBoardDesc: string;
  emptyUnassignedTitle: string;
  emptyUnassignedDesc: string;
  assignNowBtn: string;
  selectMechanicsHint: string;
  takeOrderSelfBtn: string;
  orderClaimedToast: (orderNum: string) => string;
  saveAsUnassignedToggle: string;
  saveAsUnassignedDesc: string;
  createUnassignedBtn: string;
  orderSavedUnassignedToast: (orderNum: string) => string;
  moveToUnassignedBtn: string;
  movedToUnassignedToast: (orderNum: string) => string;
  orderAssignedToast: (orderNum: string, names: string) => string;
  unassignedStatusLabel: string;
  manageMechanicsBtn: string;
  mechanicsModalTitle: string;
  mechanicsModalDesc: string;
  addNewMechanicHeading: string;
  mechanicNameInputLabel: string;
  mechanicNamePlaceholder: string;
  mechanicSpecialtyLabel: string;
  mechanicSpecialtyPlaceholder: string;
  defaultUnitSelectLabel: string;
  addMechanicSubmitBtn: string;
  editMechanicBtn: string;
  saveChangesBtn: string;
  deleteMechanicBtn: string;
  activeWorkloadLabel: string;
  completedOrdersCountLabel: string;
  loggedHoursCountLabel: string;
  credentialsHint: (login: string) => string;
  mechanicUpdatedToast: (name: string) => string;
  noMechanicsYet: string;
  translatingLiveBadge: string;
  searchPlaceholder: string;
  colOrderAsset: string;
  colClientOfficeOnly: string;
  colScopeTeam: string;
  colTimeCost: string;
  colStatus: string;
  colActions: string;
  emptySearchOrders: string;
  teamPrefix: string;
  clientApprovalShortBtn: string;
  openWorkshopCardTitle: string;
  deleteOrderTitle: string;

  // AssetInfoCards (Trailer & Equipment)
  trailerCardHeader: string;
  rodoHiddenNotice: string;
  trailerTypeLabel: string;
  trailerSpecLabel: string;
  trailerVinLabel: string;
  equipmentCardHeader: string;
  machineNumberLabel: string;
  noMachineNumber: string;
  equipmentTechDescLabel: string;

  // WorkOrderScannerModal (Step 1: OCR & Assignment)
  ocrBannerTitle: string;
  ocrBannerDesc: string;
  loadDollSampleBtn: string;
  ocrExtractedToast: string;
  ocrErrorToast: string;
  dollSampleLoadedToast: string;
  dollSampleErrorToast: string;
  defaultInitialInstruction: string;
  errProvideClientName: string;
  errProvideTrailerPlate: string;
  errProvideEquipmentName: string;
  errAssignMechanic: string;
  orderCreatedToast: (orderNum: string) => string;
  section1ClientPiiTitle: string;
  selectFromCrmLabel: string;
  selectFromCrmPlaceholder: string;
  manualOrScanOption: string;
  clientNameLabel: string;
  clientNamePlaceholder: string;
  streetLabel: string;
  cityPostalLabel: string;
  phoneMobileLabel: string;
  estimatedCostLabel: string;
  clientEmailLabel: string;
  officeInternalNoteLabel: string;
  officeInternalNotePlaceholder: string;
  section2AssetRodoTitle: string;
  assetCatTrailerBtn: string;
  assetCatEquipmentBtn: string;
  selectFleetTrailerLabel: string;
  selectFleetTrailerPlaceholder: string;
  externalTrailerOption: string;
  plateRequiredLabel: string;
  vehicleTypeInputLabel: string;
  vehicleSpecInputLabel: string;
  vinOptionalLabel: string;
  equipmentNameRequiredLabel: string;
  equipmentNamePlaceholder: string;
  machineIdInputLabel: string;
  equipmentDescInputLabel: string;
  equipmentDescPlaceholder: string;
  section3ScopeTitle: string;
  techInstructionsLabel: string;
  addInstructionPlaceholder: string;
  addBtn: string;
  assignTeamLabel: string;
  createAndSendBtn: string;

  // MechanicTaskView (Steps 2, 3, 5)
  handoverUnitBtn: string;
  pdfProtocolShortBtn: string;
  unitPrefix: string;
  totalTeamTimeLabel: string;
  tasksTodoTitle: string;
  transferHistoryTitle: string;
  continuedWorkFallback: string;
  timerCardTitle: string;
  sumPrefix: string;
  stopBtn: string;
  startWorkBtn: string;
  workNotePlaceholder: string;
  addMinBtn: string;
  inProgressTimer: string;
  timerStartedToast: string;
  timerSavedToast: (mins: number) => string;
  manualTimeAddedToast: (mins: number) => string;
  defaultWorkNote: string;
  checklistCardTitle: string;
  checkBeweglicheTeile: string;
  checkLuftdruck: string;
  checkBremsen: string;
  checkElektrik: string;
  checkRaeder: string;
  partsCardTitle: string;
  partPresets: Array<{ name: string; code: string }>;
  partNamePlaceholder: string;
  partCodePlaceholder: string;
  pcsUnit: string;
  partAddedToast: (name: string) => string;
  mediaCardTitle: string;
  stageBefore: string;
  stageDefect: string;
  stageAfter: string;
  mediaCaptionPlaceholder: string;
  takePhotoUploadBtn: string;
  recordVideoBtn: string;
  mediaSavedToast: (count: number) => string;
  mediaUploadErrToast: string;
  defectReportCardTitle: string;
  defectReportCardDesc: string;
  clientApprovedBanner: string;
  detectedDefectsLabel: string;
  defectInputPlaceholder: string;
  requiredPartsOrderLabel: string;
  reqPartInputPlaceholder: string;
  estRepairHoursLabel: string;
  techNotesForOfficeLabel: string;
  techNotesPlaceholder: string;
  sendReportToOfficeBtn: string;
  errAddReportItem: string;
  noDefectsFoundFallback: string;
  reportSentToast: string;
  finalizeCardTitle: string;
  wheelTorqueLabel: string;
  finalSummaryLabel: string;
  defaultFinalSummary: string;
  usedPartsCountLabel: string;
  mediaFilesCountLabel: string;
  digitalSignatureLabel: string;
  clearSignatureBtn: string;
  orderCompletedBtnLabel: string;
  finishAndSaveProtocolBtn: string;
  protocolFinalizedToast: string;

  // ClientApprovalDialog (Step 4)
  clientContactOfficeOnlyBadge: string;
  contactTimestampPrefix: string;
  noClientNameFallback: string;
  openScannedAuftragLink: string;
  workshopDefectReportHeading: string;
  elapsedTimePrefix: string;
  reportedByMechanicPrefix: string;
  estCompletionTimePrefix: string;
  noFormalReportYetText: string;
  damageMediaHeading: string;
  totalClientCostEurLabel: string;
  markCostCommunicatedBtn: string;
  costCommunicatedToast: string;
  clientConversationNoteLabel: string;
  clientConversationNotePlaceholder: string;
  approvedDecisionToast: string;
  rejectedDecisionToast: string;

  // TransferOrderDialog (Scenario C)
  takeoverTeamLabel: string;
  transferReasonLabel: string;
  transferReasonPlaceholder: string;
  confirmTransferBtn: string;
  errSelectTakeoverMechanic: string;
  orderTransferredToast: (orderNum: string, unit: string) => string;

  // Defect Alert & Office Client Notification Actions
  waitingApprovalBannerTitle: string;
  waitingApprovalBannerDesc: string;
  waitingApprovalCardBadge: string;
  orderRejectedBannerTitle: string;
  orderRejectedBannerDesc: string;
  notifyCustomerUrgentBadge: string;
  notifyCustomerActionHint: string;
  passApprovalToMechanicBtn: string;
  passRejectionToMechanicBtn: string;
  callClientDetailsBtn: string;
  decisionSentApprovedLabel: string;
  decisionSentRejectedLabel: string;

  // PrintableWorkshopProtocol (PDF)
  printModalTitle: string;
  printSavePdfBtn: string;
  protocolDocTitle: string;
  datePrefix: string;
  assetDetailsBoxTitle: string;
  clientApprovalBoxOfficeTitle: string;
  clientApprovalBoxRodoTitle: string;
  agreedCostPrefix: string;
  clientDecisionPrefix: string;
  decisionApproved: string;
  decisionRejected: string;
  decisionPending: string;
  rodoPrintAnonymizedText: string;
  scopeChecklistBoxTitle: string;
  timeLogsBoxTitle: string;
  noTimeLogsRecorded: string;
  thMechanic: string;
  thStart: string;
  thDuration: string;
  thActivity: string;
  partsUsedBoxTitle: string;
  noPartsUsedText: string;
  thPartName: string;
  thPartCode: string;
  thQuantity: string;
  thAddedBy: string;
  photoDocBoxTitle: string;
  finalSummaryBoxTitle: string;
  mechanicSignatureBoxTitle: string;
  completedAtPrefix: string;
  orderInProgressLabel: string;
  closeBtn: string;
  printPdfBtn: string;
}

export const WORKSHOP_I18N: Record<AppLanguage, WorkshopI18n> = {
  pl: {
    mechanicMobileSubtitle:
      "Widok mobilny mechanika: zlecenia techniczne, stoper pracy, części, aparat i protokoły bez dostępu do danych osobowych klientów.",
    mechanicPreviewBtn: "Podgląd Mechanika (RODO)",
    notificationsBtn: "Powiadomienia",
    notificationsTitle: "Powiadomienia Warsztatu",
    markAllRead: "Oznacz wszystkie",
    noNotifications: "Brak powiadomień",
    backToCalendar: "Powrót do kalendarza",
    backToOrdersList: "Lista zleceń",
    officeLabel: "Biuro",
    gdprShort: "RODO",

    previewMechanicDbLabel: "Podgląd bazy zleceń mechanika:",
    myActiveTab: "Moje aktywne",
    allWorkshopTab: "Cały warsztat",
    historyTab: "Historia",
    emptyTabTitle: "Brak zleceń w wybranej zakładce",
    emptyTabDesc:
      "Gdy biuro przypisze nowe zlecenie (np. TÜV lub naprawę maszyny), pojawi się ono tutaj wraz z powiadomieniem.",
    equipmentFallback: "Maszyna budowlana",
    noPlateFallback: "Brak nr rej.",
    trailerFallback: "Przyczepa",
    scopePrefix: "Zakres:",
    openProtocolBtn: "Otwórz protokół",

    kpiActiveOrders: "Aktywne (przydzielone)",
    kpiUnassignedOrders: "Nieprzydzielone (kolejka)",
    kpiWaitingClient: "Raporty usterek — czekają na klienta",
    kpiApprovedInWork: "Zatwierdzone przez klienta (w toku)",
    kpiCompletedProtocols: "Ukończone z podpisanym protokołem",
    tabActiveBoard: "Tablica aktywnych",
    tabUnassigned: "Nieprzydzielone",
    tabAllTable: "Tabela wszystkich",
    tabAll: "Wszystkie",
    tabInProgress: "W toku",
    tabClientApproval: "Do zgody klienta",
    tabCompleted: "Zakończone",
    colStageNew: "Przydzielone / Nowe",
    colStageInProgress: "W realizacji",
    colStageWaitingApproval: "Raport / Zgoda klienta",
    colStageApproved: "Zatwierdzone — Finalizacja",
    emptyStageCol: "Brak zleceń na tym etapie",
    emptyActiveBoardTitle: "Brak aktywnych przydzielonych zleceń",
    emptyActiveBoardDesc:
      "Przydziel mechanika z zakładki 'Nieprzydzielone' lub utwórz nowe zlecenie ze skanu Arbeitsauftrag.",
    emptyUnassignedTitle: "Wszystkie zlecenia zostały przydzielone",
    emptyUnassignedDesc:
      "Nowe zlecenia bez wybranego mechanika trafią tutaj do kolejki oczekujących na wolne stanowisko.",
    assignNowBtn: "Przydziel do realizacji",
    selectMechanicsHint: "Wybierz stanowisko oraz 1 lub więcej mechaników:",
    takeOrderSelfBtn: "Przyjmij zlecenie",
    orderClaimedToast: (num) => `Przyjęto zlecenie ${num} do realizacji`,
    saveAsUnassignedToggle: "Zapisz jako nieprzydzielone (do kolejki oczekujących)",
    saveAsUnassignedDesc:
      "Zlecenie trafi do zakładki 'Nieprzydzielone' i będziesz mógł przypisać mechanika później.",
    createUnassignedBtn: "Zapisz w kolejce nieprzydzielonych",
    orderSavedUnassignedToast: (num) =>
      `Zapisano zlecenie ${num} w zakładce 'Nieprzydzielone'`,
    moveToUnassignedBtn: "Cofnij do nieprzydzielonych",
    movedToUnassignedToast: (num) =>
      `Przeniesiono zlecenie ${num} do zakładki 'Nieprzydzielone'`,
    orderAssignedToast: (num, names) =>
      `Przydzielono zlecenie ${num} do: ${names}`,
    unassignedStatusLabel: "Nieprzydzielone",
    manageMechanicsBtn: "Mechanicy",
    mechanicsModalTitle: "Zarządzanie Mechanikami Warsztatu",
    mechanicsModalDesc:
      "Dodawaj nowych mechaników, przypisuj domyślne hale/stanowiska i sprawdzaj aktualne obciążenie zleceniami. Hasło mechanika odpowiada jego imieniu/loginowi.",
    addNewMechanicHeading: "Dodaj nowego mechanika",
    mechanicNameInputLabel: "Imię / Login mechanika *",
    mechanicNamePlaceholder: "np. Tomek, Stefan, Lukas",
    mechanicSpecialtyLabel: "Specjalizacja (opcjonalnie)",
    mechanicSpecialtyPlaceholder: "np. TÜV, Hamulce, Hydraulika 24V",
    defaultUnitSelectLabel: "Domyślne stanowisko / hala",
    addMechanicSubmitBtn: "Dodaj mechanika",
    editMechanicBtn: "Edytuj",
    saveChangesBtn: "Zapisz",
    deleteMechanicBtn: "Usuń",
    activeWorkloadLabel: "Aktywne",
    completedOrdersCountLabel: "Ukończone",
    loggedHoursCountLabel: "Czas łącznie",
    credentialsHint: (login) => `Login: ${login} · Hasło: ${login}`,
    mechanicUpdatedToast: (name) => `Zaktualizowano profil mechanika: ${name}`,
    noMechanicsYet: "Brak zdefiniowanych mechaników. Dodaj pierwszego powyżej.",
    translatingLiveBadge: "Tłumaczenie opisów...",
    searchPlaceholder: "Szukaj nr rej., maszyny, klienta...",
    colOrderAsset: "Zlecenie / Sprzęt",
    colClientOfficeOnly: "Klient (Tylko Biuro — RODO)",
    colScopeTeam: "Zakres i Zespół",
    colTimeCost: "Czas / Koszt",
    colStatus: "Status",
    colActions: "Akcje",
    emptySearchOrders: "Brak zleceń spełniających kryteria wyszukiwania.",
    teamPrefix: "Zespół",
    clientApprovalShortBtn: "Zgoda klienta",
    openWorkshopCardTitle: "Otwórz kartę warsztatową",
    deleteOrderTitle: "Usuń zlecenie",

    trailerCardHeader: "Przyczepa / Naczepa",
    rodoHiddenNotice: "Tryb RODO: dane klienta ukryte",
    trailerTypeLabel: "Typ przyczepy",
    trailerSpecLabel: "Rodzaj / Specyfikacja",
    trailerVinLabel: "Nr VIN / Identyfikacja",
    equipmentCardHeader: "Maszyna budowlana / Sprzęt specjalistyczny",
    machineNumberLabel: "Nr maszyny / Identyfikator",
    noMachineNumber: "Brak numeru",
    equipmentTechDescLabel: "Opis techniczny sprzętu",

    ocrBannerTitle: "Automatyczne wczytywanie formularza Arbeitsauftrag (OCR)",
    ocrBannerDesc:
      "Wgraj zdjęcie lub skan karty zlecenia — system oddzieli dane klienta (tylko dla biura) od danych sprzętu dla mechanika.",
    loadDollSampleBtn: "Wczytaj wzór Doll Arbeitsauftrag",
    ocrExtractedToast:
      "Wyodrębniono dane klienta (Biuro) oraz zakres techniczny (Mechanik)",
    ocrErrorToast: "Błąd odczytu pliku Auftrag",
    dollSampleLoadedToast:
      "Wczytano wzór Doll Fahrzeugbau Arbeitsauftrag (Andy & Michal)",
    dollSampleErrorToast: "Nie udało się wczytać wzoru Arbeitsauftrag",
    defaultInitialInstruction: "Sprawdzenie stanu technicznego oraz oświetlenia",
    errProvideClientName: "Podaj nazwę klienta (widoczną tylko dla biura)",
    errProvideTrailerPlate: "Podaj nr rejestracyjny lub typ przyczepy dla mechanika",
    errProvideEquipmentName: "Podaj nazwę maszyny / sprzętu dla mechanika",
    errAssignMechanic: "Przypisz co najmniej jednego mechanika",
    orderCreatedToast: (num) =>
      `Utworzono zlecenie ${num} i powiadomiono mechaników`,
    section1ClientPiiTitle:
      "1. Dane Klienta (TYLKO BIURO — ukryte przed mechanikiem)",
    selectFromCrmLabel: "Wybierz z bazy CRM (opcjonalnie)",
    selectFromCrmPlaceholder: "Wpisz ręcznie lub wybierz z CRM...",
    manualOrScanOption: "— Wpis ręczny / ze skanu Auftrag —",
    clientNameLabel: "Imię i nazwisko / Firma (Auftraggeber) *",
    clientNamePlaceholder: "np. Tiefbau Schneider GmbH",
    streetLabel: "Ulica i nr (Straße)",
    cityPostalLabel: "Kod i miasto (PLZ / Ort)",
    phoneMobileLabel: "Telefon / Handy",
    estimatedCostLabel: "Koszt szacunkowy ca. (EUR)",
    clientEmailLabel: "E-Mail klienta",
    officeInternalNoteLabel: "Notatka wewnętrzna biura",
    officeInternalNotePlaceholder: "np. Dzwonić do prokurenta powyżej 300 EUR",
    section2AssetRodoTitle:
      "2. Sprzęt / Przyczepa (WIDOK MECHANIKA — zgodny z RODO)",
    assetCatTrailerBtn: "Przyczepa / Naczepa",
    assetCatEquipmentBtn: "Maszyna / Sprzęt budowlany",
    selectFleetTrailerLabel: "Wybierz przyczepę z floty (lub wpisz obcą)",
    selectFleetTrailerPlaceholder:
      "Przyczepa klienta zewnętrznego / wybierz z floty",
    externalTrailerOption: "— Przyczepa zewnętrzna / ręczny wpis —",
    plateRequiredLabel: "Nr rejestracyjny (Kennzeichen) *",
    vehicleTypeInputLabel: "Typ (np. Kipper, Laweta, Naczepa)",
    vehicleSpecInputLabel: "Rodzaj / Specyfikacja techniczna",
    vinOptionalLabel: "Numer VIN (opcjonalnie)",
    equipmentNameRequiredLabel: "Nazwa maszyny / urządzenia *",
    equipmentNamePlaceholder: "np. Wyciągarka budowlana na gąsienicach",
    machineIdInputLabel: "Nr maszyny / Identyfikacja",
    equipmentDescInputLabel: "Opis sprzętu (widoczny dla mechanika)",
    equipmentDescPlaceholder:
      "np. Gąsienice gumowe, napęd 24V, lina stalowa 12 mm",
    section3ScopeTitle:
      "3. Zakres prac (TÜV, Nachprüfung, Kundendienst, Koła, Elektryka...)",
    techInstructionsLabel:
      "Instrukcje techniczne dla mechanika (bez danych osobowych klienta!)",
    addInstructionPlaceholder: "Dodaj zadanie techniczne...",
    addBtn: "Dodaj",
    assignTeamLabel: "Przypisz mechanika lub zespół (1 lub 2+ mechaników)",
    createAndSendBtn: "Utwórz zlecenie i wyślij do warsztatu",

    handoverUnitBtn: "Przekaż jednostce",
    pdfProtocolShortBtn: "Protokół PDF",
    unitPrefix: "Jednostka",
    totalTeamTimeLabel: "Łączny czas zespołu:",
    tasksTodoTitle: "Lista zadań do wykonania:",
    transferHistoryTitle: "Historia przekazań między jednostkami:",
    continuedWorkFallback: "kontynuacja prac",
    timerCardTitle: "1. Rejestracja Czasu Pracy (Start / Stop)",
    sumPrefix: "Suma:",
    stopBtn: "STOP",
    startWorkBtn: "START PRACY",
    workNotePlaceholder:
      "Opis wykonanej czynności (np. regulacja szczęk, diagnostyka)...",
    addMinBtn: "Dodaj min",
    inProgressTimer: "W toku...",
    timerStartedToast: "Stoper czasu pracy uruchomiony",
    timerSavedToast: (m) => `Zapisano sesję pracy: ${m} min`,
    manualTimeAddedToast: (m) => `Dodano ${m} min do ewidencji zlecenia`,
    defaultWorkNote: "Praca warsztatowa",
    checklistCardTitle: "2. Lista Kontrolna Kundendienst / TÜV (Doll Standard)",
    checkBeweglicheTeile:
      "Bewegliche Teile abschmieren (Smarowanie części ruchomych)",
    checkLuftdruck: "Luftdruck kontrollieren (Kontrola ciśnienia w ogumieniu)",
    checkBremsen:
      "Bremsen prüfen ggf. einstellen (Sprawdzenie i regulacja hamulców)",
    checkElektrik:
      "Elektrik & Beleuchtung prüfen (Instalacja elektryczna / światła)",
    checkRaeder:
      "Räder festgezogen mit Drehmoment (Dokręcenie kół kluczem Nm)",
    partsCardTitle: "3. Użyte Części i Materiały (Material)",
    partPresets: [
      { name: "Bremsbacken kpl. (Szczęki hamulcowe)", code: "ALKO-BB" },
      { name: "Bremsseile (Linka hamulcowa)", code: "KNOTT-BS" },
      { name: "Batterie neu 12V (Akumulator)", code: "BAT-12V" },
      { name: "Keilriemen (Pasek klinowy)", code: "KR-STD" },
      { name: "Wtyczka 13-pin / Wiązka elektr.", code: "EL-13P" },
      { name: "Koło podporowe wzmocnione", code: "ST-RAD" },
    ],
    partNamePlaceholder: "Nazwa części...",
    partCodePlaceholder: "Kod",
    pcsUnit: "szt.",
    partAddedToast: (name) => `Dodano część: ${name}`,
    mediaCardTitle: "4. Dokumentacja Zdjęciowa i Wideo Uszkodzeń",
    stageBefore: "Przed pracą",
    stageDefect: "Usterka / Defekt",
    stageAfter: "Po naprawie",
    mediaCaptionPlaceholder:
      "Krótki podpis zdjęcia/wideo (np. pęknięty bęben hamulcowy)...",
    takePhotoUploadBtn: "Zrób zdjęcie / Wgraj",
    recordVideoBtn: "Nagraj wideo usterki",
    mediaSavedToast: (c) => `Zapisano pliki multimedialne (${c}) w protokole`,
    mediaUploadErrToast: "Nie udało się przesłać pliku multimedialnego",
    defectReportCardTitle:
      "5. Raport Usterek do Biura (Wycena i Zgoda Klienta)",
    defectReportCardDesc:
      "Po inspekcji wyślij raport z wykrytymi usterkami, potrzebnymi częściami i szacowanym czasem naprawy do zatwierdzenia przez klienta.",
    clientApprovedBanner:
      "✓ Klient zatwierdził naprawę — możesz finalizować zlecenie",
    detectedDefectsLabel: "Wykryte usterki / wynik badania",
    defectInputPlaceholder: "np. Pęknięta osłona najazdu lub 'Brak usterek'",
    requiredPartsOrderLabel: "Potrzebne części do zamówienia / naprawy",
    reqPartInputPlaceholder: "np. 2x linka hamulcowa AL-KO 1130mm",
    estRepairHoursLabel: "Przybliżony czas naprawy (godz.)",
    techNotesForOfficeLabel: "Uwagi techniczne dla biura",
    techNotesPlaceholder:
      "np. Przyczepa gotowa do odbioru po TÜV lub czeka na części...",
    sendReportToOfficeBtn: "Wyślij raport do Biura",
    errAddReportItem:
      "Dodaj przynajmniej jedną pozycję w raporcie (np. 'Brak usterek' lub opis defektu)",
    noDefectsFoundFallback: "Brak wykrytych usterek",
    reportSentToast:
      "Raport usterek wysłany do Biura — dyspozytor otrzymał powiadomienie",
    finalizeCardTitle:
      "6. Finalizacja Zlecenia i Cyfrowy Podpis Mechanika",
    wheelTorqueLabel: "Moment dokręcenia kół (Nm)",
    finalSummaryLabel: "Podsumowanie końcowe protokołu",
    defaultFinalSummary:
      "Wszystkie zlecone czynności serwisowe i kontrolne zostały wykonane prawidłowo.",
    usedPartsCountLabel: "Użyte części:",
    mediaFilesCountLabel: "Zdjęcia/wideo:",
    digitalSignatureLabel: "Podpis cyfrowy",
    clearSignatureBtn: "Wyczyść",
    orderCompletedBtnLabel: "Zlecenie zakończone w historii",
    finishAndSaveProtocolBtn: "Zakończ naprawę i zapisz protokół końcowy",
    protocolFinalizedToast:
      "Zlecenie sfinalizowane i zapisane w bazie ukończonych zleceń mechanika!",

    clientContactOfficeOnlyBadge:
      "Dane kontaktowe klienta (Widok wyłącznie dla Biura)",
    contactTimestampPrefix: "Kontakt:",
    noClientNameFallback: "Brak nazwy klienta",
    openScannedAuftragLink: "Otwórz zeskanowany arkusz Arbeitsauftrag",
    workshopDefectReportHeading: "Raport Usterek i Części z Warsztatu",
    elapsedTimePrefix: "Dotychczasowy czas:",
    reportedByMechanicPrefix: "Zgłosił mechanik:",
    estCompletionTimePrefix: "Szacowany czas dokończenia:",
    noFormalReportYetText:
      "Mechanik nie wysłał jeszcze formalnego raportu usterek — możesz jednak z góry wprowadzić uzgodniony z klientem budżet lub zatwierdzić zakres prac.",
    damageMediaHeading: "Dokumentacja fotograficzna / wideo uszkodzeń",
    totalClientCostEurLabel: "Całkowity koszt naprawy dla klienta (EUR)",
    markCostCommunicatedBtn: "Oznacz: Koszt przekazany klientowi",
    costCommunicatedToast:
      "Zapisano informację o kontakcie z klientem (Kosten Kunden mitgeteilt)",
    clientConversationNoteLabel:
      "Notatka z rozmowy z klientem / zakres zgody",
    clientConversationNotePlaceholder:
      "np. Klient telefonicznie zatwierdził wymianę linek Knott i akumulatora do 900 EUR",
    approvedDecisionToast:
      "Zlecenie naprawy ZATWIERDZONE — mechanicy otrzymali powiadomienie",
    rejectedDecisionToast:
      "Zlecenie naprawy ODRZUCONE — mechanicy otrzymali powiadomienie",

    takeoverTeamLabel:
      "Mechanik / Zespół przejmujący (dotychczasowy czas i części zostaną zachowane)",
    transferReasonLabel:
      "Powód przekazania / instrukcja dla kolejnej zmiany",
    transferReasonPlaceholder:
      "np. Koniec zmiany Mechanika A — do dokończenia montaż bębna i próba UVV",
    confirmTransferBtn: "Przekaż zlecenie",
    errSelectTakeoverMechanic:
      "Wybierz co najmniej jednego mechanika przejmującego zlecenie",
    orderTransferredToast: (num, unit) =>
      `Przekazano zlecenie ${num} do: ${unit}`,

    waitingApprovalBannerTitle:
      "UWAGA: ZLECENIE CZEKA NA AKCEPTACJĘ KLIENTA",
    waitingApprovalBannerDesc:
      "Raport usterek został wysłany do Biura. Wstrzymaj dalszą naprawę do momentu uzyskania zgody lub odmowy klienta.",
    waitingApprovalCardBadge: "CZEKA NA AKCEPTACJĘ KLIENTA",
    orderRejectedBannerTitle: "NAPRAWA ODRZUCONA PRZEZ KLIENTA",
    orderRejectedBannerDesc:
      "Klient nie wyraził zgody na dalszą naprawę. Zabezpiecz pojazd/sprzęt i zamknij protokół bez dodatkowych prac.",
    notifyCustomerUrgentBadge: "POINFORMUJ KLIENTA",
    notifyCustomerActionHint:
      "Poinformuj klienta o usterce i przekaż mechanikowi decyzję:",
    passApprovalToMechanicBtn: "Klient ZGADZA SIĘ → Mechanik",
    passRejectionToMechanicBtn: "Klient NIE ZGADZA SIĘ → Mechanik",
    callClientDetailsBtn: "Kontakt / Kosztorys",
    decisionSentApprovedLabel: "Przekazano mechanikowi: Klient ZGADZA SIĘ",
    decisionSentRejectedLabel: "Przekazano mechanikowi: Klient NIE ZGADZA SIĘ",

    printModalTitle: "Protokół Warsztatowy PDF",
    printSavePdfBtn: "Drukuj / Zapisz PDF",
    protocolDocTitle: "PROTOKÓŁ NAPRAWY / ARBEITSAUFTRAG",
    datePrefix: "Data",
    assetDetailsBoxTitle: "Dane Sprzętu / Przyczepy",
    clientApprovalBoxOfficeTitle: "Dane Klienta i Zatwierdzenie (Biuro)",
    clientApprovalBoxRodoTitle:
      "Status Zlecenia (Widok RODO — bez danych klienta)",
    agreedCostPrefix: "Uzgodniony koszt ca.:",
    clientDecisionPrefix: "Decyzja klienta:",
    decisionApproved: "ZATWIERDZONE",
    decisionRejected: "ODRZUCONE",
    decisionPending: "W TRAKCIE UZGODNIEŃ",
    rodoPrintAnonymizedText:
      "Dane osobowe klienta zostały zanonimizowane zgodnie z polityką RODO dla stanowisk warsztatowych.",
    scopeChecklistBoxTitle:
      "Zakres Prac i Lista Kontrolna (Kundendienst / TÜV / Naprawa)",
    timeLogsBoxTitle: "Ewidencja Czasu Pracy (Arbeitsaufwand)",
    noTimeLogsRecorded: "Brak zarejestrowanych sesji czasu pracy.",
    thMechanic: "Mechanik",
    thStart: "Start",
    thDuration: "Czas",
    thActivity: "Czynność",
    partsUsedBoxTitle: "Użyte Części i Materiały (Material)",
    noPartsUsedText: "Brak użytych części zamiennych.",
    thPartName: "Nazwa części",
    thPartCode: "Kod",
    thQuantity: "Ilość",
    thAddedBy: "Dodał",
    photoDocBoxTitle: "Dokumentacja Fotograficzna Przed / Usterki / Po",
    finalSummaryBoxTitle: "Podsumowanie Końcowe Protokołu",
    mechanicSignatureBoxTitle: "Podpis Mechanika",
    completedAtPrefix: "Zakończono:",
    orderInProgressLabel: "Zlecenie w toku",
    closeBtn: "Zamknij",
    printPdfBtn: "Drukuj PDF",
  },

  de: {
    mechanicMobileSubtitle:
      "Mobile Mechaniker-Ansicht: Technische Aufträge, Zeiterfassung, Ersatzteile, Kamera & Protokolle ohne Zugriff auf personenbezogene Kundendaten (DSGVO).",
    mechanicPreviewBtn: "Mechaniker-Vorschau (DSGVO)",
    notificationsBtn: "Mitteilungen",
    notificationsTitle: "Werkstatt-Mitteilungen",
    markAllRead: "Alle gelesen",
    noNotifications: "Keine Mitteilungen vorhanden",
    backToCalendar: "Zurück zum Kalender",
    backToOrdersList: "Auftragsliste",
    officeLabel: "Büro",
    gdprShort: "DSGVO",

    previewMechanicDbLabel: "Vorschau der Mechaniker-Datenbank:",
    myActiveTab: "Meine aktiven",
    allWorkshopTab: "Gesamte Werkstatt",
    historyTab: "Historie",
    emptyTabTitle: "Keine Aufträge in dieser Ansicht",
    emptyTabDesc:
      "Sobald das Büro einen neuen Auftrag (z. B. TÜV oder Maschinenreparatur) zuweist, erscheint dieser hier samt Benachrichtigung.",
    equipmentFallback: "Baumaschine",
    noPlateFallback: "Ohne Kennz.",
    trailerFallback: "Anhänger",
    scopePrefix: "Umfang:",
    openProtocolBtn: "Protokoll öffnen",

    kpiActiveOrders: "Aktiv (zugewiesen)",
    kpiUnassignedOrders: "Nicht zugewiesen (Warteschlange)",
    kpiWaitingClient: "Mängelberichte — Warten auf Kunden",
    kpiApprovedInWork: "Vom Kunden freigegeben (in Arbeit)",
    kpiCompletedProtocols: "Abgeschlossen mit Protokoll",
    tabActiveBoard: "Aktive Auftragstafel",
    tabUnassigned: "Nicht zugewiesen",
    tabAllTable: "Alle (Tabelle)",
    tabAll: "Alle",
    tabInProgress: "In Arbeit",
    tabClientApproval: "Kundenfreigabe",
    tabCompleted: "Abgeschlossen",
    colStageNew: "Zugewiesen / Neu",
    colStageInProgress: "In Bearbeitung",
    colStageWaitingApproval: "Bericht / Kundenfreigabe",
    colStageApproved: "Freigegeben — Abschluss",
    emptyStageCol: "Keine Aufträge in dieser Phase",
    emptyActiveBoardTitle: "Keine aktiven zugewiesenen Aufträge",
    emptyActiveBoardDesc:
      "Weisen Sie einen Auftrag aus dem Reiter 'Nicht zugewiesen' zu oder scannen Sie einen neuen Arbeitsauftrag.",
    emptyUnassignedTitle: "Alle Aufträge sind aktuell zugewiesen",
    emptyUnassignedDesc:
      "Neue Aufträge ohne direkten Mechaniker erscheinen hier in der Warteschlange zur späteren Einteilung.",
    assignNowBtn: "Jetzt zuweisen",
    selectMechanicsHint: "Einheit und 1 oder mehrere Mechaniker wählen:",
    takeOrderSelfBtn: "Auftrag übernehmen",
    orderClaimedToast: (num) => `Auftrag ${num} übernommen`,
    saveAsUnassignedToggle: "Als 'Nicht zugewiesen' in die Warteschlange legen",
    saveAsUnassignedDesc:
      "Der Auftrag landet im Reiter 'Nicht zugewiesen' und kann später einem freien Mechaniker zugeteilt werden.",
    createUnassignedBtn: "In Warteschlange speichern",
    orderSavedUnassignedToast: (num) =>
      `Auftrag ${num} unter 'Nicht zugewiesen' gespeichert`,
    moveToUnassignedBtn: "Zurück in Nicht zugewiesen",
    movedToUnassignedToast: (num) =>
      `Auftrag ${num} in 'Nicht zugewiesen' verschoben`,
    orderAssignedToast: (num, names) =>
      `Auftrag ${num} zugewiesen an: ${names}`,
    unassignedStatusLabel: "Nicht zugewiesen",
    manageMechanicsBtn: "Mechaniker",
    mechanicsModalTitle: "Werkstatt-Mechaniker verwalten",
    mechanicsModalDesc:
      "Neue Mechaniker anlegen, Stammhalle/Einheit zuordnen und aktuelle Auslastung prüfen. Login und Passwort entsprechen dem Namen des Mechanikers.",
    addNewMechanicHeading: "Neuen Mechaniker hinzufügen",
    mechanicNameInputLabel: "Name / Login des Mechanikers *",
    mechanicNamePlaceholder: "z. B. Tomek, Stefan, Lukas",
    mechanicSpecialtyLabel: "Spezialgebiet (optional)",
    mechanicSpecialtyPlaceholder: "z. B. TÜV, Bremsen, 24V-Hydraulik",
    defaultUnitSelectLabel: "Standard-Einheit / Halle",
    addMechanicSubmitBtn: "Mechaniker anlegen",
    editMechanicBtn: "Bearbeiten",
    saveChangesBtn: "Speichern",
    deleteMechanicBtn: "Löschen",
    activeWorkloadLabel: "Aktiv",
    completedOrdersCountLabel: "Erledigt",
    loggedHoursCountLabel: "Gesamtzeit",
    credentialsHint: (login) => `Login: ${login} · Passwort: ${login}`,
    mechanicUpdatedToast: (name) => `Mechanikerprofil aktualisiert: ${name}`,
    noMechanicsYet: "Noch keine Mechaniker angelegt.",
    translatingLiveBadge: "Beschreibungen werden übersetzt...",
    searchPlaceholder: "Kennzeichen, Maschine, Kunde suchen...",
    colOrderAsset: "Auftrag / Gerät",
    colClientOfficeOnly: "Kunde (Nur Büro — DSGVO)",
    colScopeTeam: "Umfang & Team",
    colTimeCost: "Zeit / Kosten",
    colStatus: "Status",
    colActions: "Aktionen",
    emptySearchOrders: "Keine passenden Arbeitsaufträge gefunden.",
    teamPrefix: "Team",
    clientApprovalShortBtn: "Kundenfreigabe",
    openWorkshopCardTitle: "Werkstattprotokoll öffnen",
    deleteOrderTitle: "Auftrag löschen",

    trailerCardHeader: "Anhänger / Auflieger",
    rodoHiddenNotice: "DSGVO-Modus: Kundendaten ausgeblendet",
    trailerTypeLabel: "Fahrzeugtyp",
    trailerSpecLabel: "Art / Spezifikation",
    trailerVinLabel: "FIN / Identifikation",
    equipmentCardHeader: "Baumaschine / Spezialgerät",
    machineNumberLabel: "Maschinen-Nr. / Kennung",
    noMachineNumber: "Keine Nummer",
    equipmentTechDescLabel: "Technische Gerätebeschreibung",

    ocrBannerTitle: "Automatisches Einlesen des Arbeitsauftrags (OCR-Scan)",
    ocrBannerDesc:
      "Foto oder PDF-Scan des Arbeitsauftrags hochladen — das System trennt Kundendaten (nur Büro) automatisch von den technischen Gerätedaten für Mechaniker.",
    loadDollSampleBtn: "Doll-Vorlage Arbeitsauftrag laden",
    ocrExtractedToast:
      "Kundendaten (Büro) und technischer Umfang (Mechaniker) erfolgreich extrahiert",
    ocrErrorToast: "Fehler beim Lesen des Arbeitsauftrags",
    dollSampleLoadedToast:
      "Doll Fahrzeugbau Arbeitsauftrag geladen (Andy & Michal)",
    dollSampleErrorToast: "Vorlage konnte nicht geladen werden",
    defaultInitialInstruction: "Technischen Zustand und Beleuchtung prüfen",
    errProvideClientName: "Bitte Kundennamen eingeben (nur für Büro sichtbar)",
    errProvideTrailerPlate:
      "Bitte Kennzeichen oder Fahrzeugtyp für den Mechaniker angeben",
    errProvideEquipmentName: "Bitte Maschinenbezeichnung angeben",
    errAssignMechanic: "Bitte mindestens einen Mechaniker zuweisen",
    orderCreatedToast: (num) =>
      `Auftrag ${num} erstellt und Mechaniker benachrichtigt`,
    section1ClientPiiTitle:
      "1. Kundendaten (NUR BÜRO — für Mechaniker ausgeblendet)",
    selectFromCrmLabel: "Aus CRM-Datenbank wählen (optional)",
    selectFromCrmPlaceholder: "Manuell eingeben oder aus CRM wählen...",
    manualOrScanOption: "— Manuelle Eingabe / aus Auftrag-Scan —",
    clientNameLabel: "Vor- und Nachname / Firma (Auftraggeber) *",
    clientNamePlaceholder: "z. B. Tiefbau Schneider GmbH",
    streetLabel: "Straße & Hausnr.",
    cityPostalLabel: "PLZ & Ort",
    phoneMobileLabel: "Telefon / Handy",
    estimatedCostLabel: "Kosten ca. (EUR)",
    clientEmailLabel: "Kunden-E-Mail",
    officeInternalNoteLabel: "Interne Büronotiz",
    officeInternalNotePlaceholder:
      "z. B. Rücksprache ab 300 EUR Reparaturkosten",
    section2AssetRodoTitle:
      "2. Anhänger / Gerät (MECHANIKER-ANSICHT — DSGVO-konform)",
    assetCatTrailerBtn: "Anhänger / Auflieger",
    assetCatEquipmentBtn: "Baumaschine / Baugerät",
    selectFleetTrailerLabel: "Aus eigener Flotte wählen (oder Fremdfahrzeug)",
    selectFleetTrailerPlaceholder:
      "Kundenfahrzeug / aus eigener Flotte wählen",
    externalTrailerOption: "— Kundenfahrzeug / manuelle Eingabe —",
    plateRequiredLabel: "Kennzeichen *",
    vehicleTypeInputLabel: "Typ (z. B. Kipper, Tieflader, Koffer)",
    vehicleSpecInputLabel: "Art / Technische Beschreibung",
    vinOptionalLabel: "Fahrgestellnummer / FIN (optional)",
    equipmentNameRequiredLabel: "Maschinen- / Gerätebezeichnung *",
    equipmentNamePlaceholder: "z. B. Raupen-Bauwinde",
    machineIdInputLabel: "Maschinen-Nr. / Seriennummer",
    equipmentDescInputLabel: "Gerätebeschreibung (für Mechaniker sichtbar)",
    equipmentDescPlaceholder:
      "z. B. Gummiraupen, 24V-Antrieb, Stahlseil 12 mm",
    section3ScopeTitle:
      "3. Arbeitsumfang (TÜV, Nachprüfung, Kundendienst, Räder, Elektrik...)",
    techInstructionsLabel:
      "Technische Arbeitsanweisungen für Mechaniker (ohne Kundendaten!)",
    addInstructionPlaceholder: "Technische Aufgabe hinzufügen...",
    addBtn: "Hinzufügen",
    assignTeamLabel: "Mechaniker oder Team zuweisen (1 oder 2+ Mechaniker)",
    createAndSendBtn: "Auftrag erstellen & an Werkstatt senden",

    handoverUnitBtn: "Einheit übergeben",
    pdfProtocolShortBtn: "PDF-Protokoll",
    unitPrefix: "Einheit",
    totalTeamTimeLabel: "Gesamtzeit Team:",
    tasksTodoTitle: "Auszuführende Arbeiten:",
    transferHistoryTitle: "Übergabeverlauf zwischen Einheiten:",
    continuedWorkFallback: "Weiterführung der Arbeiten",
    timerCardTitle: "1. Arbeitszeiterfassung (Start / Stopp)",
    sumPrefix: "Summe:",
    stopBtn: "STOPP",
    startWorkBtn: "ARBEIT STARTEN",
    workNotePlaceholder:
      "Tätigkeitsbeschreibung (z. B. Bremsen einstellen, Diagnose)...",
    addMinBtn: "+ Min",
    inProgressTimer: "Läuft...",
    timerStartedToast: "Arbeitszeit-Stoppuhr gestartet",
    timerSavedToast: (m) => `Arbeitssitzung gespeichert: ${m} Min.`,
    manualTimeAddedToast: (m) => `${m} Min. zum Auftrag hinzugefügt`,
    defaultWorkNote: "Werkstattarbeit",
    checklistCardTitle: "2. Checkliste Kundendienst / TÜV (Doll Standard)",
    checkBeweglicheTeile: "Bewegliche Teile abschmieren",
    checkLuftdruck: "Luftdruck kontrollieren",
    checkBremsen: "Bremsen prüfen ggf. einstellen",
    checkElektrik: "Elektrik & Beleuchtung prüfen",
    checkRaeder: "Räder festgezogen mit Drehmoment (Nm)",
    partsCardTitle: "3. Verwendete Ersatzteile & Material",
    partPresets: [
      { name: "Bremsbacken kpl.", code: "ALKO-BB" },
      { name: "Bremsseile", code: "KNOTT-BS" },
      { name: "Batterie neu 12V", code: "BAT-12V" },
      { name: "Keilriemen", code: "KR-STD" },
      { name: "13-pol. Stecker / Kabelsatz", code: "EL-13P" },
      { name: "Stützrad verstärkt", code: "ST-RAD" },
    ],
    partNamePlaceholder: "Ersatzteilbezeichnung...",
    partCodePlaceholder: "Art.-Nr.",
    pcsUnit: "Stk.",
    partAddedToast: (name) => `Ersatzteil hinzugefügt: ${name}`,
    mediaCardTitle: "4. Foto- & Videodokumentation der Schäden",
    stageBefore: "Vorher",
    stageDefect: "Mangel / Defekt",
    stageAfter: "Nach Reparatur",
    mediaCaptionPlaceholder:
      "Kurze Bild-/Videobeschreibung (z. B. Bremstrommel gerissen)...",
    takePhotoUploadBtn: "Foto aufnehmen / Upload",
    recordVideoBtn: "Schadensvideo aufnehmen",
    mediaSavedToast: (c) => `Mediendateien (${c}) im Protokoll gespeichert`,
    mediaUploadErrToast: "Mediendatei konnte nicht hochgeladen werden",
    defectReportCardTitle:
      "5. Mängelbericht ans Büro (Kostenvoranschlag & Kundenfreigabe)",
    defectReportCardDesc:
      "Nach der Prüfung Mängelbericht mit benötigten Ersatzteilen und geschätzter Reparaturdauer zur Kundenfreigabe ans Büro senden.",
    clientApprovedBanner:
      "✓ Kunde hat Reparatur freigegeben — Auftrag kann abgeschlossen werden",
    detectedDefectsLabel: "Festgestellte Mängel / Prüfergebnis",
    defectInputPlaceholder: "z. B. Auflaufmanschette defekt oder 'Ohne Mängel'",
    requiredPartsOrderLabel: "Benötigte Ersatzteile",
    reqPartInputPlaceholder: "z. B. 2x Bremsseil AL-KO 1130mm",
    estRepairHoursLabel: "Geschätzte Reparaturzeit (Std.)",
    techNotesForOfficeLabel: "Technische Hinweise fürs Büro",
    techNotesPlaceholder:
      "z. B. Anhänger abholbereit nach TÜV oder wartet auf Teile...",
    sendReportToOfficeBtn: "Bericht ans Büro senden",
    errAddReportItem:
      "Bitte mindestens einen Punkt im Bericht angeben (z. B. 'Ohne Mängel' oder Defektbeschreibung)",
    noDefectsFoundFallback: "Keine Mängel festgestellt",
    reportSentToast:
      "Mängelbericht ans Büro gesendet — Disposition wurde benachrichtigt",
    finalizeCardTitle:
      "6. Auftragsabschluss & Digitale Mechaniker-Unterschrift",
    wheelTorqueLabel: "Raddrehmoment (Nm)",
    finalSummaryLabel: "Abschlussvermerk des Protokolls",
    defaultFinalSummary:
      "Alle beauftragten Service- und Prüfarbeiten wurden fachgerecht durchgeführt.",
    usedPartsCountLabel: "Ersatzteile:",
    mediaFilesCountLabel: "Fotos/Videos:",
    digitalSignatureLabel: "Digitale Unterschrift",
    clearSignatureBtn: "Löschen",
    orderCompletedBtnLabel: "Auftrag in Historie abgeschlossen",
    finishAndSaveProtocolBtn:
      "Reparatur abschließen & Endprotokoll speichern",
    protocolFinalizedToast:
      "Auftrag abgeschlossen und in der Mechaniker-Historie gespeichert!",

    clientContactOfficeOnlyBadge:
      "Kundenkontaktdaten (Nur für Büro sichtbar)",
    contactTimestampPrefix: "Kontakt:",
    noClientNameFallback: "Kein Kundenname",
    openScannedAuftragLink: "Gescannten Arbeitsauftrag öffnen",
    workshopDefectReportHeading: "Mängel- & Ersatzteilbericht aus der Werkstatt",
    elapsedTimePrefix: "Bisherige Zeit:",
    reportedByMechanicPrefix: "Gemeldet von:",
    estCompletionTimePrefix: "Geschätzte Restzeit:",
    noFormalReportYetText:
      "Noch kein formeller Mängelbericht eingegangen — Sie können dennoch vorab das vereinbarte Kostenlimit eintragen oder die Arbeiten freigeben.",
    damageMediaHeading: "Foto- / Videodokumentation der Mängel",
    totalClientCostEurLabel: "Gesamtkosten für Kunden ca. (EUR)",
    markCostCommunicatedBtn: "Vermerk: Kosten Kunden mitgeteilt",
    costCommunicatedToast:
      "Kundenkontakt gespeichert (Kosten Kunden mitgeteilt)",
    clientConversationNoteLabel: "Gesprächsnotiz / Freigabeumfang",
    clientConversationNotePlaceholder:
      "z. B. Kunde hat telefonisch Bremsseile & Batterie bis 900 EUR freigegeben",
    approvedDecisionToast:
      "Reparaturauftrag FREIGEGEBEN — Mechaniker wurden benachrichtigt",
    rejectedDecisionToast:
      "Reparaturauftrag ABGELEHNT — Mechaniker wurden benachrichtigt",

    takeoverTeamLabel:
      "Übernehmender Mechaniker / Team (bisherige Zeit & Teile bleiben erhalten)",
    transferReasonLabel: "Übergabegrund / Hinweis für nächste Schicht",
    transferReasonPlaceholder:
      "z. B. Schichtende Mechaniker A — Trommelmontage & UVV-Test offen",
    confirmTransferBtn: "Auftrag übergeben",
    errSelectTakeoverMechanic:
      "Bitte mindestens einen übernehmenden Mechaniker auswählen",
    orderTransferredToast: (num, unit) =>
      `Auftrag ${num} übergeben an: ${unit}`,

    waitingApprovalBannerTitle:
      "ACHTUNG: AUFTRAG WARTET AUF KUNDENFREIGABE",
    waitingApprovalBannerDesc:
      "Mängelbericht wurde ans Büro gesendet. Weitere Reparaturarbeiten bis zur Zu- oder Absage des Kunden pausieren.",
    waitingApprovalCardBadge: "WARTET AUF KUNDENFREIGABE",
    orderRejectedBannerTitle: "REPARATUR VOM KUNDEN ABGELEHNT",
    orderRejectedBannerDesc:
      "Der Kunde hat der Reparatur nicht zugestimmt. Fahrzeug/Gerät sichern und Protokoll ohne weitere Arbeiten abschließen.",
    notifyCustomerUrgentBadge: "KUNDE INFORMIEREN",
    notifyCustomerActionHint:
      "Kunden über Mängel informieren und Entscheidung an Mechaniker senden:",
    passApprovalToMechanicBtn: "Kunde STIMMT ZU → Mechaniker",
    passRejectionToMechanicBtn: "Kunde LEHNT AB → Mechaniker",
    callClientDetailsBtn: "Kontakt / Kosten",
    decisionSentApprovedLabel: "An Mechaniker gemeldet: Kunde STIMMT ZU",
    decisionSentRejectedLabel: "An Mechaniker gemeldet: Kunde LEHNT AB",

    printModalTitle: "Werkstattprotokoll PDF",
    printSavePdfBtn: "Drucken / Als PDF speichern",
    protocolDocTitle: "WERKSTATTPROTOKOLL / ARBEITSAUFTRAG",
    datePrefix: "Datum",
    assetDetailsBoxTitle: "Fahrzeug- / Gerätedaten",
    clientApprovalBoxOfficeTitle: "Kundendaten & Freigabe (Büro)",
    clientApprovalBoxRodoTitle:
      "Auftragsstatus (DSGVO-Ansicht — ohne Kundendaten)",
    agreedCostPrefix: "Vereinbarte Kosten ca.:",
    clientDecisionPrefix: "Kundenentscheidung:",
    decisionApproved: "FREIGEGEBEN",
    decisionRejected: "ABGELEHNT",
    decisionPending: "AUSSTEHEND",
    rodoPrintAnonymizedText:
      "Personenbezogene Kundendaten wurden gemäß DSGVO-Richtlinie für Werkstattarbeitsplätze anonymisiert.",
    scopeChecklistBoxTitle:
      "Arbeitsumfang & Checkliste (Kundendienst / TÜV / Reparatur)",
    timeLogsBoxTitle: "Arbeitszeiterfassung (Arbeitsaufwand)",
    noTimeLogsRecorded: "Keine Arbeitssitzungen erfasst.",
    thMechanic: "Mechaniker",
    thStart: "Beginn",
    thDuration: "Dauer",
    thActivity: "Tätigkeit",
    partsUsedBoxTitle: "Verwendetes Material & Ersatzteile",
    noPartsUsedText: "Keine Ersatzteile verbaut.",
    thPartName: "Bezeichnung",
    thPartCode: "Art.-Nr.",
    thQuantity: "Menge",
    thAddedBy: "Erfasst von",
    photoDocBoxTitle: "Fotodokumentation Vorher / Mängel / Nachher",
    finalSummaryBoxTitle: "Abschlussbericht",
    mechanicSignatureBoxTitle: "Unterschrift Mechaniker",
    completedAtPrefix: "Abgeschlossen:",
    orderInProgressLabel: "Auftrag in Bearbeitung",
    closeBtn: "Schließen",
    printPdfBtn: "PDF drucken",
  },

  en: {
    mechanicMobileSubtitle:
      "Mobile Mechanic Portal: technical work orders, live timer, parts, camera & protocols with zero access to customer personal data (GDPR).",
    mechanicPreviewBtn: "Mechanic Preview (GDPR)",
    notificationsBtn: "Notifications",
    notificationsTitle: "Workshop Notifications",
    markAllRead: "Mark all read",
    noNotifications: "No notifications yet",
    backToCalendar: "Back to Calendar",
    backToOrdersList: "Work Orders",
    officeLabel: "Office",
    gdprShort: "GDPR",

    previewMechanicDbLabel: "Preview mechanic order database:",
    myActiveTab: "My Active",
    allWorkshopTab: "All Workshop",
    historyTab: "History",
    emptyTabTitle: "No work orders in this tab",
    emptyTabDesc:
      "When the office assigns a new order (e.g. TÜV inspection or machine repair), it will appear here with an instant notification.",
    equipmentFallback: "Construction Equipment",
    noPlateFallback: "No Plate",
    trailerFallback: "Trailer",
    scopePrefix: "Scope:",
    openProtocolBtn: "Open Protocol",

    kpiActiveOrders: "Active (Assigned)",
    kpiUnassignedOrders: "Unassigned (Queue)",
    kpiWaitingClient: "Defect Reports — Awaiting Client",
    kpiApprovedInWork: "Client Approved (In Work)",
    kpiCompletedProtocols: "Completed with Signed Protocol",
    tabActiveBoard: "Active Orders Board",
    tabUnassigned: "Unassigned",
    tabAllTable: "All Orders Table",
    tabAll: "All",
    tabInProgress: "Active",
    tabClientApproval: "Awaiting Client",
    tabCompleted: "Completed",
    colStageNew: "Assigned / New",
    colStageInProgress: "In Progress",
    colStageWaitingApproval: "Report / Client Approval",
    colStageApproved: "Approved — Finalizing",
    emptyStageCol: "No orders in this stage",
    emptyActiveBoardTitle: "No active assigned work orders",
    emptyActiveBoardDesc:
      "Assign a mechanic from the 'Unassigned' tab or scan a new Arbeitsauftrag form.",
    emptyUnassignedTitle: "All work orders are assigned",
    emptyUnassignedDesc:
      "New orders created without an assigned mechanic will wait here in the queue.",
    assignNowBtn: "Assign Now",
    selectMechanicsHint: "Select workshop bay and 1 or more mechanics:",
    takeOrderSelfBtn: "Claim Order",
    orderClaimedToast: (num) => `Claimed work order ${num}`,
    saveAsUnassignedToggle: "Save as unassigned (place in waiting queue)",
    saveAsUnassignedDesc:
      "This order will appear in the 'Unassigned' tab so a dispatcher can assign mechanics later.",
    createUnassignedBtn: "Save to Unassigned Queue",
    orderSavedUnassignedToast: (num) =>
      `Saved work order ${num} to the 'Unassigned' tab`,
    moveToUnassignedBtn: "Move to Unassigned",
    movedToUnassignedToast: (num) =>
      `Moved work order ${num} back to 'Unassigned'`,
    orderAssignedToast: (num, names) =>
      `Assigned work order ${num} to: ${names}`,
    unassignedStatusLabel: "Unassigned",
    manageMechanicsBtn: "Mechanics",
    mechanicsModalTitle: "Workshop Mechanics Management",
    mechanicsModalDesc:
      "Add new mechanics, set their default bay/unit, and monitor active workload. Each mechanic logs in with login = name and password = name.",
    addNewMechanicHeading: "Add New Mechanic",
    mechanicNameInputLabel: "Mechanic Name / Login *",
    mechanicNamePlaceholder: "e.g. Tomek, Stefan, Lukas",
    mechanicSpecialtyLabel: "Specialization (optional)",
    mechanicSpecialtyPlaceholder: "e.g. TÜV, Brakes, 24V Hydraulics",
    defaultUnitSelectLabel: "Default Bay / Unit",
    addMechanicSubmitBtn: "Add Mechanic",
    editMechanicBtn: "Edit",
    saveChangesBtn: "Save",
    deleteMechanicBtn: "Delete",
    activeWorkloadLabel: "Active",
    completedOrdersCountLabel: "Completed",
    loggedHoursCountLabel: "Logged Time",
    credentialsHint: (login) => `Login: ${login} · Password: ${login}`,
    mechanicUpdatedToast: (name) => `Updated mechanic profile: ${name}`,
    noMechanicsYet: "No mechanics configured yet. Add one above.",
    translatingLiveBadge: "Translating descriptions...",
    searchPlaceholder: "Search plate, machine ID, client...",
    colOrderAsset: "Order / Asset",
    colClientOfficeOnly: "Client (Office Only — GDPR)",
    colScopeTeam: "Scope & Team",
    colTimeCost: "Time / Cost",
    colStatus: "Status",
    colActions: "Actions",
    emptySearchOrders: "No work orders match your search criteria.",
    teamPrefix: "Team",
    clientApprovalShortBtn: "Client Approval",
    openWorkshopCardTitle: "Open workshop protocol card",
    deleteOrderTitle: "Delete work order",

    trailerCardHeader: "Trailer / Semi-Trailer",
    rodoHiddenNotice: "GDPR Mode: customer data hidden",
    trailerTypeLabel: "Vehicle Type",
    trailerSpecLabel: "Model / Specification",
    trailerVinLabel: "VIN / Identification",
    equipmentCardHeader: "Construction Machinery / Specialized Equipment",
    machineNumberLabel: "Machine No. / Asset ID",
    noMachineNumber: "No ID",
    equipmentTechDescLabel: "Technical Equipment Description",

    ocrBannerTitle: "Automated Arbeitsauftrag Form Scanner (OCR)",
    ocrBannerDesc:
      "Upload a photo or PDF scan of the work order — the system separates customer PII (Office only) from RODO-safe technical specs for mechanics.",
    loadDollSampleBtn: "Load Doll Arbeitsauftrag Sample",
    ocrExtractedToast:
      "Extracted customer details (Office) and technical scope (Mechanic)",
    ocrErrorToast: "Failed to read Auftrag document",
    dollSampleLoadedToast:
      "Loaded Doll Fahrzeugbau Arbeitsauftrag sample (Andy & Michal)",
    dollSampleErrorToast: "Could not load Arbeitsauftrag sample",
    defaultInitialInstruction: "Inspect technical condition and lighting system",
    errProvideClientName: "Please enter customer name (visible to Office only)",
    errProvideTrailerPlate:
      "Please enter license plate or trailer type for the mechanic",
    errProvideEquipmentName: "Please enter machine / equipment name",
    errAssignMechanic: "Please assign at least one mechanic",
    orderCreatedToast: (num) =>
      `Created work order ${num} and notified assigned mechanics`,
    section1ClientPiiTitle:
      "1. Customer Details (OFFICE ONLY — hidden from mechanics)",
    selectFromCrmLabel: "Select from CRM database (optional)",
    selectFromCrmPlaceholder: "Enter manually or pick from CRM...",
    manualOrScanOption: "— Manual entry / from Auftrag scan —",
    clientNameLabel: "Full Name / Company (Auftraggeber) *",
    clientNamePlaceholder: "e.g. Tiefbau Schneider GmbH",
    streetLabel: "Street & No.",
    cityPostalLabel: "Postal Code & City",
    phoneMobileLabel: "Phone / Mobile",
    estimatedCostLabel: "Estimated Cost approx. (EUR)",
    clientEmailLabel: "Customer Email",
    officeInternalNoteLabel: "Internal Office Note",
    officeInternalNotePlaceholder:
      "e.g. Call fleet manager if repair exceeds 300 EUR",
    section2AssetRodoTitle:
      "2. Trailer / Equipment (MECHANIC VIEW — GDPR compliant)",
    assetCatTrailerBtn: "Trailer / Semi-Trailer",
    assetCatEquipmentBtn: "Construction Machine / Equipment",
    selectFleetTrailerLabel: "Select fleet trailer (or external unit)",
    selectFleetTrailerPlaceholder:
      "External customer trailer / pick from fleet",
    externalTrailerOption: "— External trailer / manual entry —",
    plateRequiredLabel: "License Plate (Kennzeichen) *",
    vehicleTypeInputLabel: "Type (e.g. Tipper, Flatbed, Box)",
    vehicleSpecInputLabel: "Subtype / Technical Spec",
    vinOptionalLabel: "VIN Number (optional)",
    equipmentNameRequiredLabel: "Machine / Equipment Name *",
    equipmentNamePlaceholder: "e.g. Tracked Construction Winch",
    machineIdInputLabel: "Machine No. / Serial ID",
    equipmentDescInputLabel: "Equipment Description (visible to mechanic)",
    equipmentDescPlaceholder:
      "e.g. Rubber tracks, 24V drive, 12 mm steel cable",
    section3ScopeTitle:
      "3. Scope of Work (TÜV, Re-inspection, Service, Wheels, Electrics...)",
    techInstructionsLabel:
      "Technical Instructions for Mechanic (no customer personal data!)",
    addInstructionPlaceholder: "Add technical task...",
    addBtn: "Add",
    assignTeamLabel: "Assign Mechanic or Team (1 or 2+ mechanics)",
    createAndSendBtn: "Create Order & Dispatch to Workshop",

    handoverUnitBtn: "Handover Unit",
    pdfProtocolShortBtn: "PDF Protocol",
    unitPrefix: "Unit",
    totalTeamTimeLabel: "Total team time:",
    tasksTodoTitle: "Assigned Technical Tasks:",
    transferHistoryTitle: "Unit Handover History:",
    continuedWorkFallback: "work continuation",
    timerCardTitle: "1. Work Time Tracker (Start / Stop)",
    sumPrefix: "Total:",
    stopBtn: "STOP",
    startWorkBtn: "START WORK",
    workNotePlaceholder:
      "Describe performed task (e.g. brake adjustment, diagnostics)...",
    addMinBtn: "Add min",
    inProgressTimer: "Running...",
    timerStartedToast: "Work timer started",
    timerSavedToast: (m) => `Saved work session: ${m} min`,
    manualTimeAddedToast: (m) => `Added ${m} min to work log`,
    defaultWorkNote: "Workshop service",
    checklistCardTitle: "2. Kundendienst / TÜV Checklist (Doll Standard)",
    checkBeweglicheTeile: "Lubricate moving parts (Bewegliche Teile abschmieren)",
    checkLuftdruck: "Check tire pressure (Luftdruck kontrollieren)",
    checkBremsen: "Inspect & adjust brakes (Bremsen prüfen ggf. einstellen)",
    checkElektrik: "Inspect electrics & lighting (Elektrik prüfen)",
    checkRaeder: "Tighten wheel bolts to torque (Räder festgezogen Nm)",
    partsCardTitle: "3. Parts & Materials Used",
    partPresets: [
      { name: "Brake shoes set (Bremsbacken)", code: "ALKO-BB" },
      { name: "Brake cables (Bremsseile)", code: "KNOTT-BS" },
      { name: "New 12V Battery", code: "BAT-12V" },
      { name: "V-Belt (Keilriemen)", code: "KR-STD" },
      { name: "13-pin Plug / Wiring Harness", code: "EL-13P" },
      { name: "Heavy-duty Jockey Wheel", code: "ST-RAD" },
    ],
    partNamePlaceholder: "Part name...",
    partCodePlaceholder: "Code",
    pcsUnit: "pcs",
    partAddedToast: (name) => `Added part: ${name}`,
    mediaCardTitle: "4. Photo & Video Damage Documentation",
    stageBefore: "Before Work",
    stageDefect: "Defect / Damage",
    stageAfter: "After Repair",
    mediaCaptionPlaceholder:
      "Short photo/video caption (e.g. cracked brake drum)...",
    takePhotoUploadBtn: "Take Photo / Upload",
    recordVideoBtn: "Record Defect Video",
    mediaSavedToast: (c) => `Saved media files (${c}) to protocol`,
    mediaUploadErrToast: "Failed to upload media file",
    defectReportCardTitle:
      "5. Defect Report to Office (Quote & Client Approval)",
    defectReportCardDesc:
      "After inspection, send detected defects, required parts, and estimated repair hours to the office for client approval.",
    clientApprovedBanner:
      "✓ Client approved repair — you may complete and sign the protocol",
    detectedDefectsLabel: "Detected Defects / Inspection Result",
    defectInputPlaceholder: "e.g. Torn overrun boot or 'No defects found'",
    requiredPartsOrderLabel: "Required Parts for Repair",
    reqPartInputPlaceholder: "e.g. 2x AL-KO brake cable 1130mm",
    estRepairHoursLabel: "Estimated Repair Time (hrs)",
    techNotesForOfficeLabel: "Technical Notes for Office",
    techNotesPlaceholder:
      "e.g. Ready for pickup after TÜV or waiting for parts...",
    sendReportToOfficeBtn: "Send Report to Office",
    errAddReportItem:
      "Add at least one report item (e.g. 'No defects' or defect description)",
    noDefectsFoundFallback: "No defects detected",
    reportSentToast: "Defect report sent to Office — dispatcher notified",
    finalizeCardTitle:
      "6. Finalize Work Order & Digital Mechanic Signature",
    wheelTorqueLabel: "Wheel Bolt Torque (Nm)",
    finalSummaryLabel: "Final Protocol Summary",
    defaultFinalSummary:
      "All requested service and inspection tasks were completed properly.",
    usedPartsCountLabel: "Parts used:",
    mediaFilesCountLabel: "Photos/videos:",
    digitalSignatureLabel: "Digital Signature",
    clearSignatureBtn: "Clear",
    orderCompletedBtnLabel: "Order Completed in History",
    finishAndSaveProtocolBtn: "Complete Repair & Save Final Protocol",
    protocolFinalizedToast:
      "Work order finalized and saved to Mechanic History!",

    clientContactOfficeOnlyBadge:
      "Customer Contact Info (Office-Only View)",
    contactTimestampPrefix: "Contacted:",
    noClientNameFallback: "No client name",
    openScannedAuftragLink: "Open scanned Arbeitsauftrag sheet",
    workshopDefectReportHeading: "Workshop Defect & Parts Report",
    elapsedTimePrefix: "Logged time:",
    reportedByMechanicPrefix: "Reported by:",
    estCompletionTimePrefix: "Est. completion time:",
    noFormalReportYetText:
      "No formal defect report submitted yet — you can still enter an agreed budget or pre-approve the work scope.",
    damageMediaHeading: "Photo / Video Damage Documentation",
    totalClientCostEurLabel: "Total Repair Cost for Client (EUR)",
    markCostCommunicatedBtn: "Mark: Cost Communicated to Client",
    costCommunicatedToast:
      "Recorded client cost communication (Kosten Kunden mitgeteilt)",
    clientConversationNoteLabel: "Client Call Note / Approval Scope",
    clientConversationNotePlaceholder:
      "e.g. Client approved Knott cables & battery replacement up to 900 EUR by phone",
    approvedDecisionToast:
      "Repair order APPROVED — assigned mechanics notified",
    rejectedDecisionToast:
      "Repair order REJECTED — assigned mechanics notified",

    takeoverTeamLabel:
      "Receiving Mechanic / Team (logged time & parts are preserved)",
    transferReasonLabel: "Handover Reason / Next Shift Instructions",
    transferReasonPlaceholder:
      "e.g. End of shift Mechanic A — drum assembly & UVV test remaining",
    confirmTransferBtn: "Transfer Work Order",
    errSelectTakeoverMechanic:
      "Please select at least one receiving mechanic",
    orderTransferredToast: (num, unit) =>
      `Transferred order ${num} to: ${unit}`,

    waitingApprovalBannerTitle:
      "ATTENTION: ORDER WAITING FOR CLIENT APPROVAL",
    waitingApprovalBannerDesc:
      "Defect report has been sent to Office. Pause further repair work until the customer approves or declines.",
    waitingApprovalCardBadge: "WAITING FOR CLIENT APPROVAL",
    orderRejectedBannerTitle: "REPAIR REJECTED BY CUSTOMER",
    orderRejectedBannerDesc:
      "Customer declined the repair. Secure the vehicle/equipment and close the protocol without additional work.",
    notifyCustomerUrgentBadge: "NOTIFY CUSTOMER",
    notifyCustomerActionHint:
      "Inform customer about the defect and send their decision to the mechanic:",
    passApprovalToMechanicBtn: "Client AGREES → Mechanic",
    passRejectionToMechanicBtn: "Client DECLINES → Mechanic",
    callClientDetailsBtn: "Contact / Quote",
    decisionSentApprovedLabel: "Sent to mechanic: Client AGREES",
    decisionSentRejectedLabel: "Sent to mechanic: Client DECLINES",

    printModalTitle: "Workshop Protocol PDF",
    printSavePdfBtn: "Print / Save PDF",
    protocolDocTitle: "REPAIR PROTOCOL / ARBEITSAUFTRAG",
    datePrefix: "Date",
    assetDetailsBoxTitle: "Trailer / Equipment Details",
    clientApprovalBoxOfficeTitle: "Customer Details & Approval (Office)",
    clientApprovalBoxRodoTitle:
      "Order Status (GDPR View — customer data omitted)",
    agreedCostPrefix: "Agreed Cost approx.:",
    clientDecisionPrefix: "Client Decision:",
    decisionApproved: "APPROVED",
    decisionRejected: "REJECTED",
    decisionPending: "PENDING APPROVAL",
    rodoPrintAnonymizedText:
      "Customer personal data has been anonymized in compliance with GDPR workshop privacy rules.",
    scopeChecklistBoxTitle:
      "Scope of Work & Checklist (Service / TÜV / Repair)",
    timeLogsBoxTitle: "Work Time Log (Arbeitsaufwand)",
    noTimeLogsRecorded: "No work time sessions recorded.",
    thMechanic: "Mechanic",
    thStart: "Start",
    thDuration: "Duration",
    thActivity: "Activity",
    partsUsedBoxTitle: "Parts & Materials Used",
    noPartsUsedText: "No spare parts recorded.",
    thPartName: "Part Name",
    thPartCode: "Code",
    thQuantity: "Qty",
    thAddedBy: "Added By",
    photoDocBoxTitle: "Photo Documentation Before / Defects / After",
    finalSummaryBoxTitle: "Final Protocol Summary",
    mechanicSignatureBoxTitle: "Mechanic Signature",
    completedAtPrefix: "Completed:",
    orderInProgressLabel: "Work order in progress",
    closeBtn: "Close",
    printPdfBtn: "Print PDF",
  },
};

export function getWorkshopI18n(lang?: string): WorkshopI18n {
  if (lang === "de") return WORKSHOP_I18N.de;
  if (lang === "en") return WORKSHOP_I18N.en;
  return WORKSHOP_I18N.pl;
}
