"use client";

import React, { useState, useRef } from "react";
import { useApp } from "@/lib/context";
import { BackupSnapshot, Reservation, Client, Trailer } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  Save,
  Trash2,
  ShieldCheck,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  CalendarDays,
  Users,
  Truck,
  Sparkles,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl, de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { translations as globalTranslations } from "@/lib/translations";

const backupTranslations = {
  pl: {
    title: "System Kopii Zapasowych i Przywracania Danych",
    subtitle: "Zabezpiecz stan rezerwacji, bazę klientów oraz flotę przyczep w chmurze i lokalnie.",
    currentDbState: "Aktualny stan bazy danych",
    reservationsLabel: "Rezerwacje",
    clientsLabel: "Klienci",
    trailersLabel: "Przyczepy",
    createSnapshotTitle: "1. Zapisz stan rezerwacji (Punkt przywracania)",
    createSnapshotDesc: "Tworzy natychmiastową migawkę w bazie chmurowej Firestore oraz lokalnej bazie SQLite.",
    snapshotNamePlaceholder: "Nazwa zapisu (np. Przed weekendem, Stan poranny)...",
    saveStateBtn: "Zapisz stan teraz",
    savingState: "Zapisywanie...",
    exportTitle: "2. Eksportuj bazę danych do pliku",
    exportDesc: "Pobierz kopię zapasową na telefon lub komputer, aby mieć fizyczne zabezpieczenie danych.",
    exportFullJson: "Pełny Backup Bazy (.JSON)",
    exportReservationsJson: "Same Rezerwacje (.JSON)",
    exportReservationsCsv: "Arkusz Rezerwacji (.CSV / Excel)",
    importTitle: "3. Wczytaj i przywróć z pliku",
    importDesc: "Wybierz wcześniej pobrany plik .JSON, aby przywrócić rezerwacje i klientów.",
    selectFileBtn: "Wybierz plik kopii (.JSON)",
    savedSnapshotsTitle: "Zapisane punkty przywracania (Historia migawek)",
    noSnapshots: "Brak zapisanych punktów przywracania. Kliknij „Zapisz stan teraz”, aby utworzyć pierwszy punkt.",
    restoreBtn: "Przywróć",
    downloadBtn: "Pobierz",
    deleteBtn: "Usuń",
    typeManual: "Zapis ręczny",
    typeAuto: "Auto-zapis ochronny",
    typeImported: "Z pliku",
    restoreModalTitle: "Potwierdzenie przywracania danych",
    restoreModalDesc: "Wybierz zakres danych oraz tryb przywracania z wybranej kopii zapasowej.",
    restoreModeLabel: "Tryb przywracania",
    modeOverwrite: "Pełne przywrócenie (Zastąp obecny stan wybranym zapisem)",
    modeOverwriteHint: "Przywraca dokładny stan z momentu utworzenia kopii. Nowsze wpisy zostaną zastąpione.",
    modeMerge: "Bezpieczne scalenie (Dodaj i zaktualizuj bez usuwania nowych)",
    modeMergeHint: "Zachowuje obecne rezerwacje i dogrywa brakujące pozycje z kopii zapasowej.",
    restoreScopeLabel: "Zakres przywracanych danych",
    scopeReservations: "Stan rezerwacji, umowy i protokoły",
    scopeClients: "Baza klientów (CRM) i salda",
    scopeTrailers: "Flota przyczep i statusy serwisowe",
    autoSafetyLabel: "Utwórz automatyczny zapis bezpieczeństwa obecnego stanu przed przywróceniem",
    confirmRestoreBtn: "Przywróć wybrane dane",
    restoringBtn: "Przywracanie...",
    cancelBtn: "Anuluj",
    snapshotCreatedToast: "Zapisano stan rezerwacji i bazy danych!",
    snapshotDeletedToast: "Usunięto punkt przywracania",
    exportSuccessToast: "Pobrano plik kopii zapasowej",
    restoreSuccessToast: "Pomyślnie przywrócono stan bazy danych!",
    invalidFileToast: "Nieprawidłowy format pliku kopii zapasowej (.JSON)",
    createdByLabel: "Utworzył",
  },
  de: {
    title: "Datenbank-Backup & Wiederherstellungssystem",
    subtitle: "Sichern Sie Reservierungsstand, Kundendatenbank und Anhängerflotte in der Cloud und lokal.",
    currentDbState: "Aktueller Datenbankstatus",
    reservationsLabel: "Reservierungen",
    clientsLabel: "Kunden",
    trailersLabel: "Anhänger",
    createSnapshotTitle: "1. Reservierungsstand speichern (Wiederherstellungspunkt)",
    createSnapshotDesc: "Erstellt sofort einen Snapshot in der Cloud-Datenbank (Firestore) und lokal (SQLite).",
    snapshotNamePlaceholder: "Name der Sicherung (z.B. Vor dem Wochenende)...",
    saveStateBtn: "Stand jetzt speichern",
    savingState: "Wird gespeichert...",
    exportTitle: "2. Datenbank in Datei exportieren",
    exportDesc: "Laden Sie eine Sicherungsdatei auf Ihr Smartphone oder Ihren PC herunter.",
    exportFullJson: "Vollständiges Backup (.JSON)",
    exportReservationsJson: "Nur Reservierungen (.JSON)",
    exportReservationsCsv: "Reservierungstabelle (.CSV / Excel)",
    importTitle: "3. Aus Datei laden & wiederherstellen",
    importDesc: "Wählen Sie eine zuvor gespeicherte .JSON-Datei zur Wiederherstellung.",
    selectFileBtn: "Backup-Datei wählen (.JSON)",
    savedSnapshotsTitle: "Gespeicherte Wiederherstellungspunkte (Historie)",
    noSnapshots: "Noch keine Wiederherstellungspunkte vorhanden. Klicken Sie oben auf „Stand jetzt speichern“.",
    restoreBtn: "Wiederherstellen",
    downloadBtn: "Download",
    deleteBtn: "Löschen",
    typeManual: "Manuell",
    typeAuto: "Auto-Schutz",
    typeImported: "Aus Datei",
    restoreModalTitle: "Datenwiederherstellung bestätigen",
    restoreModalDesc: "Wählen Sie den Umfang und den Modus für die Wiederherstellung.",
    restoreModeLabel: "Wiederherstellungsmodus",
    modeOverwrite: "Vollständige Wiederherstellung (Aktuellen Stand ersetzen)",
    modeOverwriteHint: "Stellt exakt den Zustand zum Zeitpunkt des Backups wieder her.",
    modeMerge: "Sicheres Zusammenführen (Fehlende ergänzen ohne neue zu löschen)",
    modeMergeHint: "Behält bestehende Buchungen bei und ergänzt Einträge aus dem Backup.",
    restoreScopeLabel: "Umfang der Wiederherstellung",
    scopeReservations: "Reservierungsstand, Mietverträge & Protokolle",
    scopeClients: "Kundendatenbank (CRM) & Salden",
    scopeTrailers: "Anhängerflotte & Servicestatus",
    autoSafetyLabel: "Vor der Wiederherstellung automatisch eine Sicherheitskopie des aktuellen Stands anlegen",
    confirmRestoreBtn: "Daten jetzt wiederherstellen",
    restoringBtn: "Wird wiederhergestellt...",
    cancelBtn: "Abbrechen",
    snapshotCreatedToast: "Reservierungs- und Datenbankstand erfolgreich gespeichert!",
    snapshotDeletedToast: "Wiederherstellungspunkt gelöscht",
    exportSuccessToast: "Backup-Datei wurde heruntergeladen",
    restoreSuccessToast: "Datenbankstand erfolgreich wiederhergestellt!",
    invalidFileToast: "Ungültiges Backup-Dateiformat (.JSON)",
    createdByLabel: "Erstellt von",
  },
  en: {
    title: "Database Backup & Restore System",
    subtitle: "Secure your reservations state, client CRM, and trailer fleet in the cloud and locally.",
    currentDbState: "Current Database Status",
    reservationsLabel: "Reservations",
    clientsLabel: "Clients",
    trailersLabel: "Trailers",
    createSnapshotTitle: "1. Save Reservation State (Restore Point)",
    createSnapshotDesc: "Creates an instant snapshot in Cloud Firestore and local SQLite database.",
    snapshotNamePlaceholder: "Backup label (e.g. Before weekend, Morning state)...",
    saveStateBtn: "Save State Now",
    savingState: "Saving...",
    exportTitle: "2. Export Database to File",
    exportDesc: "Download a backup file to your phone or computer for offline protection.",
    exportFullJson: "Full Database Backup (.JSON)",
    exportReservationsJson: "Reservations Only (.JSON)",
    exportReservationsCsv: "Reservations Spreadsheet (.CSV / Excel)",
    importTitle: "3. Import & Restore from File",
    importDesc: "Select a previously downloaded .JSON backup file to restore records.",
    selectFileBtn: "Choose Backup File (.JSON)",
    savedSnapshotsTitle: "Saved Restore Points (Snapshot History)",
    noSnapshots: "No restore points saved yet. Click 'Save State Now' above to create your first checkpoint.",
    restoreBtn: "Restore",
    downloadBtn: "Download",
    deleteBtn: "Delete",
    typeManual: "Manual",
    typeAuto: "Auto-Safety",
    typeImported: "Imported",
    restoreModalTitle: "Confirm Data Restoration",
    restoreModalDesc: "Select which collections to restore and how to apply the backup.",
    restoreModeLabel: "Restore Mode",
    modeOverwrite: "Full Restore (Replace current state with backup)",
    modeOverwriteHint: "Restores the exact state from the snapshot. Newer entries will be replaced.",
    modeMerge: "Safe Merge (Add & update without deleting newer records)",
    modeMergeHint: "Keeps current bookings and merges records from the backup.",
    restoreScopeLabel: "Data Scope to Restore",
    scopeReservations: "Reservations state, agreements & protocols",
    scopeClients: "Clients CRM & balances",
    scopeTrailers: "Trailer fleet & service statuses",
    autoSafetyLabel: "Automatically create a safety backup of current state before restoring",
    confirmRestoreBtn: "Restore Selected Data",
    restoringBtn: "Restoring...",
    cancelBtn: "Cancel",
    snapshotCreatedToast: "Reservation and database state saved!",
    snapshotDeletedToast: "Restore point deleted",
    exportSuccessToast: "Backup file downloaded",
    restoreSuccessToast: "Database state restored successfully!",
    invalidFileToast: "Invalid backup file format (.JSON)",
    createdByLabel: "Created by",
  },
};

export function BackupManager() {
  const {
    reservations,
    clients,
    trailers,
    profiles,
    statusColors,
    language,
    backups,
    createBackupSnapshot,
    deleteBackupSnapshot,
    restoreFromBackup,
    canManage,
  } = useApp();

  const bt = backupTranslations[language as keyof typeof backupTranslations] || backupTranslations.pl;
  const globalT = globalTranslations[language as keyof typeof globalTranslations] || globalTranslations.pl;
  const dateLocale = language === "pl" ? pl : language === "de" ? de : enUS;

  const [snapshotName, setSnapshotName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Restore confirmation modal state
  const [pendingRestore, setPendingRestore] = useState<{
    name: string;
    createdAt?: string;
    reservations?: Reservation[];
    clients?: Client[];
    trailers?: Trailer[];
  } | null>(null);
  const [restoreMode, setRestoreMode] = useState<"overwrite" | "merge">("overwrite");
  const [includeReservations, setIncludeReservations] = useState(true);
  const [includeClients, setIncludeClients] = useState(true);
  const [includeTrailers, setIncludeTrailers] = useState(true);
  const [createSafetyBackup, setCreateSafetyBackup] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateSnapshot = async () => {
    setIsSaving(true);
    try {
      await createBackupSnapshot(snapshotName);
      setSnapshotName("");
      toast.success(bt.snapshotCreatedToast);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(bt.exportSuccessToast);
  };

  const handleExportFullJson = () => {
    const stamp = format(new Date(), "yyyy-MM-dd-HHmm");
    const payload = {
      app: "Smart Trailer Rental Hub",
      version: "2.0",
      exportedAt: new Date().toISOString(),
      reservationsCount: reservations.length,
      clientsCount: clients.length,
      trailersCount: trailers.length,
      reservations,
      clients,
      trailers,
      profiles,
      statusColors,
    };
    triggerDownload(
      JSON.stringify(payload, null, 2),
      `smart-trailer-backup-${stamp}.json`,
      "application/json;charset=utf-8"
    );
  };

  const handleExportReservationsOnlyJson = () => {
    const stamp = format(new Date(), "yyyy-MM-dd-HHmm");
    const payload = {
      app: "Smart Trailer Rental Hub - Reservations Backup",
      version: "2.0",
      exportedAt: new Date().toISOString(),
      reservationsCount: reservations.length,
      reservations,
    };
    triggerDownload(
      JSON.stringify(payload, null, 2),
      `rezerwacje-backup-${stamp}.json`,
      "application/json;charset=utf-8"
    );
  };

  const handleExportSnapshotJson = (snap: BackupSnapshot) => {
    const stamp = format(new Date(snap.createdAt), "yyyy-MM-dd-HHmm");
    triggerDownload(
      JSON.stringify(snap, null, 2),
      `snapshot-${snap.name.replace(/[^a-zA-Z0-9_-]/g, "_")}-${stamp}.json`,
      "application/json;charset=utf-8"
    );
  };

  const handleExportCsv = () => {
    const stamp = format(new Date(), "yyyy-MM-dd-HHmm");
    const headers = [
      "ID",
      "Przyczepa (Tablica)",
      "Model Przyczepy",
      "Klient",
      "Typ Klienta",
      "Telefon",
      "Data Od",
      "Godz. Wydania",
      "Data Do",
      "Godz. Zwrotu",
      "Status",
      "Faktura",
      "Kaucja (EUR)",
      "Kwota Wynajmu (EUR)",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = reservations.map((r) => {
      const tr = trailers.find((t) => t.id === r.trailerId);
      const cl = clients.find((c) => c.id === r.clientId);
      const deposit =
        r.agreement?.deposits?.total ?? (cl?.type === "company" ? 1000 : 200);
      const total = r.agreement?.prices?.total ?? "";

      return [
        escapeCsv(r.id),
        escapeCsv(tr?.plate || r.trailerId),
        escapeCsv(tr?.model || ""),
        escapeCsv(cl?.name || r.clientId),
        escapeCsv(cl?.type === "company" ? "Firma" : "Prywatny"),
        escapeCsv(cl?.phone || ""),
        escapeCsv(r.startDate),
        escapeCsv(r.agreement?.pickupTime || "08:00"),
        escapeCsv(r.endDate),
        escapeCsv(r.agreement?.returnTime || "17:30"),
        escapeCsv(r.status),
        escapeCsv(r.invoiceNumber || ""),
        escapeCsv(deposit),
        escapeCsv(total),
      ].join(";");
    });

    // Add UTF-8 BOM for proper Polish/German characters in Excel
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    triggerDownload(
      csvContent,
      `rezerwacje-export-${stamp}.csv`,
      "text/csv;charset=utf-8"
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || "{}"));
        // Support both full backup object and direct array of reservations
        const resArray: Reservation[] | undefined = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.reservations)
          ? parsed.reservations
          : undefined;

        const cliArray: Client[] | undefined = Array.isArray(parsed.clients)
          ? parsed.clients
          : undefined;

        const trArray: Trailer[] | undefined = Array.isArray(parsed.trailers)
          ? parsed.trailers
          : undefined;

        if (!resArray && !cliArray && !trArray) {
          toast.error(bt.invalidFileToast);
          return;
        }

        setIncludeReservations(Array.isArray(resArray) && resArray.length > 0);
        setIncludeClients(Array.isArray(cliArray) && cliArray.length > 0);
        setIncludeTrailers(Array.isArray(trArray) && trArray.length > 0);
        setPendingRestore({
          name: parsed.name || file.name,
          createdAt: parsed.createdAt || parsed.exportedAt,
          reservations: resArray,
          clients: cliArray,
          trailers: trArray,
        });
      } catch (err) {
        toast.error(bt.invalidFileToast);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const openSnapshotRestoreModal = (snap: BackupSnapshot) => {
    setIncludeReservations(Array.isArray(snap.reservations));
    setIncludeClients(Array.isArray(snap.clients) && snap.clients.length > 0);
    setIncludeTrailers(Array.isArray(snap.trailers) && snap.trailers.length > 0);
    setPendingRestore({
      name: snap.name,
      createdAt: snap.createdAt,
      reservations: snap.reservations,
      clients: snap.clients,
      trailers: snap.trailers,
    });
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setIsRestoring(true);
    try {
      await restoreFromBackup(
        {
          reservations: pendingRestore.reservations,
          clients: pendingRestore.clients,
          trailers: pendingRestore.trailers,
        },
        {
          mode: restoreMode,
          includeReservations,
          includeClients,
          includeTrailers,
          createSafetyBackup,
        }
      );
      toast.success(bt.restoreSuccessToast);
      setPendingRestore(null);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">{bt.title}</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">{bt.subtitle}</p>
          </div>

          {/* Current Database Live Counters */}
          <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-2.5 sm:p-3 shrink-0">
            <div className="flex items-center gap-1.5 px-2 border-r border-white/15">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-sm sm:text-base font-black leading-none">{reservations.length}</div>
                <div className="text-[10px] text-slate-300 uppercase font-bold">{bt.reservationsLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 border-r border-white/15">
              <Users className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-sm sm:text-base font-black leading-none">{clients.length}</div>
                <div className="text-[10px] text-slate-300 uppercase font-bold">{bt.clientsLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-sm sm:text-base font-black leading-none">{trailers.length}</div>
                <div className="text-[10px] text-slate-300 uppercase font-bold">{bt.trailersLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {canManage("data.restore") && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>{globalT.officeModeNotice}</div>
        </div>
      )}
      {!canManage("data.restore") && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>{globalT.adminOnlyAction}</div>
        </div>
      )}

      {/* 3 Action Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Create Snapshot */}
        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-black text-sm">
              <Save className="w-4 h-4" />
              <span>{bt.createSnapshotTitle}</span>
            </div>
            <p className="text-xs text-muted-foreground">{bt.createSnapshotDesc}</p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Input
              placeholder={bt.snapshotNamePlaceholder}
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="h-10 text-xs font-medium"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSnapshot();
              }}
            />
            <Button
              onClick={handleCreateSnapshot}
              disabled={isSaving}
              className="w-full h-10 font-bold text-xs sm:text-sm bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? bt.savingState : bt.saveStateBtn}</span>
            </Button>
          </div>
        </div>

        {/* Card 2: Export to File (Admin Only) */}
        <div className={cn("bg-card border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4 relative", !canManage("data.restore") && "opacity-75")}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm">
                <Download className="w-4 h-4" />
                <span>{bt.exportTitle}</span>
              </div>
              {!canManage("data.restore") && <Lock className="w-4 h-4 text-amber-600 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground">{bt.exportDesc}</p>
          </div>

          <div className="space-y-2 pt-1">
            <Button
              onClick={handleExportFullJson}
              disabled={!canManage("data.restore")}
              variant="outline"
              className="w-full h-9 justify-start text-xs font-bold border-emerald-200 hover:bg-emerald-50 text-emerald-900"
            >
              <FileJson className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
              <span className="truncate">{bt.exportFullJson}</span>
            </Button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={handleExportReservationsOnlyJson}
                disabled={!canManage("data.restore")}
                variant="outline"
                className="h-9 justify-start text-[11px] font-bold px-2.5"
              >
                <FileJson className="w-3.5 h-3.5 mr-1.5 text-blue-600 shrink-0" />
                <span className="truncate">{bt.exportReservationsJson}</span>
              </Button>
              <Button
                onClick={handleExportCsv}
                disabled={!canManage("data.restore")}
                variant="outline"
                className="h-9 justify-start text-[11px] font-bold px-2.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" />
                <span className="truncate">{bt.exportReservationsCsv}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Card 3: Import & Restore from File (Admin Only) */}
        <div className={cn("bg-card border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4 relative", !canManage("data.restore") && "opacity-75")}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm">
                <Upload className="w-4 h-4" />
                <span>{bt.importTitle}</span>
              </div>
              {!canManage("data.restore") && <Lock className="w-4 h-4 text-amber-600 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground">{bt.importDesc}</p>
          </div>

          <div className="pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => canManage("data.restore") ? fileInputRef.current?.click() : toast.error(globalT.adminOnlyAction)}
              disabled={!canManage("data.restore")}
              variant="outline"
              className="w-full h-20 border-2 border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-50 text-amber-900 font-bold text-xs flex flex-col items-center justify-center gap-1.5 rounded-xl transition-colors"
            >
              {canManage("data.restore") ? <Upload className="w-5 h-5 text-amber-600" /> : <Lock className="w-5 h-5 text-amber-600" />}
              <span>{canManage("data.restore") ? bt.selectFileBtn : globalT.adminOnlyAction}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Saved Snapshots History List */}
      <div className="bg-card border rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-black text-sm sm:text-base">{bt.savedSnapshotsTitle}</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
            {backups.length}
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground space-y-2">
            <Database className="w-10 h-10 mx-auto opacity-25" />
            <p className="text-xs sm:text-sm font-medium">{bt.noSnapshots}</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {backups.map((snap) => (
              <div
                key={snap.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-sm text-slate-900 truncate">
                      {snap.name}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        snap.type === "auto"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      )}
                    >
                      {snap.type === "auto"
                        ? bt.typeAuto
                        : snap.type === "imported"
                        ? bt.typeImported
                        : bt.typeManual}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {format(new Date(snap.createdAt), "d MMM yyyy, HH:mm:ss", {
                        locale: dateLocale,
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {bt.createdByLabel}: <strong className="text-slate-700">{snap.createdBy}</strong>
                    </span>
                    <span className="font-semibold text-slate-700">
                      {bt.reservationsLabel}: {snap.reservationsCount ?? snap.reservations?.length ?? 0} |{" "}
                      {bt.clientsLabel}: {snap.clientsCount ?? snap.clients?.length ?? 0} |{" "}
                      {bt.trailersLabel}: {snap.trailersCount ?? snap.trailers?.length ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canManage("data.restore") ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => openSnapshotRestoreModal(snap)}
                        className="h-9 px-3 bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{bt.restoreBtn}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportSnapshotJson(snap)}
                        className="h-9 px-2.5 text-xs font-bold"
                        title={bt.downloadBtn}
                      >
                        <Download className="w-3.5 h-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">{bt.downloadBtn}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          deleteBackupSnapshot(snap.id);
                          toast.info(bt.snapshotDeletedToast);
                        }}
                        className="h-9 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        title={bt.deleteBtn}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-bold">
                      <Lock className="w-3 h-3" />
                      {globalT.roleAdmin}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore Confirmation & Scope Dialog */}
      <Dialog open={!!pendingRestore} onOpenChange={(open) => !open && setPendingRestore(null)}>
        <DialogContent className="w-[95vw] sm:w-[760px] sm:max-w-[92vw] max-h-[92dvh] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-black">
              <RotateCcw className="w-5 h-5 text-primary" />
              <span>{bt.restoreModalTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {bt.restoreModalDesc}
            </DialogDescription>
          </DialogHeader>

          {pendingRestore && (
            <div className="space-y-4 py-2">
              {/* Selected backup summary */}
              <div className="bg-slate-100 rounded-xl p-3 border text-xs space-y-1">
                <div className="font-black text-slate-900 text-sm">{pendingRestore.name}</div>
                {pendingRestore.createdAt && (
                  <div className="text-slate-500">
                    {format(new Date(pendingRestore.createdAt), "d MMMM yyyy, HH:mm", {
                      locale: dateLocale,
                    })}
                  </div>
                )}
                <div className="flex flex-wrap gap-3 pt-1 font-bold text-slate-700">
                  <span>
                    {bt.reservationsLabel}: {pendingRestore.reservations?.length ?? 0}
                  </span>
                  <span>
                    {bt.clientsLabel}: {pendingRestore.clients?.length ?? 0}
                  </span>
                  <span>
                    {bt.trailersLabel}: {pendingRestore.trailers?.length ?? 0}
                  </span>
                </div>
              </div>

              {/* Restore Mode */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-600">
                  {bt.restoreModeLabel}
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setRestoreMode("overwrite")}
                    className={cn(
                      "text-left p-3 rounded-xl border transition-all",
                      restoreMode === "overwrite"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      {bt.modeOverwrite}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {bt.modeOverwriteHint}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestoreMode("merge")}
                    className={cn(
                      "text-left p-3 rounded-xl border transition-all",
                      restoreMode === "merge"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      {bt.modeMerge}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {bt.modeMergeHint}
                    </div>
                  </button>
                </div>
              </div>

              {/* Scope Checkboxes */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-600">
                  {bt.restoreScopeLabel}
                </Label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border">
                  {Array.isArray(pendingRestore.reservations) && (
                    <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeReservations}
                        onChange={(e) => setIncludeReservations(e.target.checked)}
                        className="rounded border-slate-300 w-4 h-4 accent-blue-600"
                      />
                      <span>
                        {bt.scopeReservations} ({pendingRestore.reservations.length})
                      </span>
                    </label>
                  )}
                  {Array.isArray(pendingRestore.clients) && pendingRestore.clients.length > 0 && (
                    <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeClients}
                        onChange={(e) => setIncludeClients(e.target.checked)}
                        className="rounded border-slate-300 w-4 h-4 accent-blue-600"
                      />
                      <span>
                        {bt.scopeClients} ({pendingRestore.clients.length})
                      </span>
                    </label>
                  )}
                  {Array.isArray(pendingRestore.trailers) && pendingRestore.trailers.length > 0 && (
                    <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeTrailers}
                        onChange={(e) => setIncludeTrailers(e.target.checked)}
                        className="rounded border-slate-300 w-4 h-4 accent-blue-600"
                      />
                      <span>
                        {bt.scopeTrailers} ({pendingRestore.trailers.length})
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Automatic Safety Backup Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs font-bold text-emerald-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createSafetyBackup}
                  onChange={(e) => setCreateSafetyBackup(e.target.checked)}
                  className="rounded border-emerald-400 w-4 h-4 mt-0.5 accent-emerald-600"
                />
                <span>{bt.autoSafetyLabel}</span>
              </label>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPendingRestore(null)}
              disabled={isRestoring}
            >
              {bt.cancelBtn}
            </Button>
            <Button
              onClick={handleConfirmRestore}
              disabled={
                isRestoring ||
                (!includeReservations && !includeClients && !includeTrailers)
              }
              className="bg-primary hover:bg-primary/90 font-bold"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              {isRestoring ? bt.restoringBtn : bt.confirmRestoreBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
