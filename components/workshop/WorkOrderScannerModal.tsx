"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScanLine,
  Upload,
  FileImage,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { useApp } from "@/lib/context";
import { translations } from "@/lib/translations";
import {
  WorkshopOrder,
  WorkshopOrderClientDetails,
  WorkshopAssetCategory,
  WorkshopScopeType,
  WORKSHOP_UNITS,
  UNASSIGNED_UNIT,
  DEFAULT_WORKSHOP_CHECKLIST,
} from "@/lib/workshop-types";
import { getWorkshopI18n } from "@/lib/workshop-i18n";
import {
  localizeUnitName,
  localizeVehicleType,
} from "@/lib/workshop-text-localizer";
import { getScopeLabel } from "./AssetInfoCards";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ALL_SCOPES: WorkshopScopeType[] = [
  "TUV",
  "Nachprufung",
  "Gasprufung",
  "Kundendienst",
  "UVV",
  "wheels",
  "electrics",
  "brakes",
  "other",
];

interface WorkOrderScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkOrderScannerModal({
  open,
  onOpenChange,
}: WorkOrderScannerModalProps) {
  const {
    trailers,
    clients,
    profiles,
    workshopOrders,
    createWorkshopOrder,
    currentUser,
    language,
    trText,
  } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;
  const w = getWorkshopI18n(language);

  const mechanics = profiles.filter((p) => p.role === "mechanic");

  // OCR Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string>("");

  // Office-Only Customer PII state
  const [selectedClientId, setSelectedClientId] = useState<string>("manual");
  const [clientName, setClientName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [estimatedCostEur, setEstimatedCostEur] = useState("");
  const [officeNotes, setOfficeNotes] = useState("");

  // Mechanic-Safe Technical Asset state
  const [assetCategory, setAssetCategory] = useState<WorkshopAssetCategory>("trailer");
  const [selectedTrailerId, setSelectedTrailerId] = useState<string>("manual");
  const [plate, setPlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleSubtype, setVehicleSubtype] = useState("");
  const [vin, setVin] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [machineNumber, setMachineNumber] = useState("");
  const [equipmentDescription, setEquipmentDescription] = useState("");

  // Scope & Team state
  const [scopeTypes, setScopeTypes] = useState<WorkshopScopeType[]>(["TUV"]);
  const [taskInstructions, setTaskInstructions] = useState<string[]>([
    w.defaultInitialInstruction,
  ]);
  const [newInstruction, setNewInstruction] = useState("");
  const [wheelTorqueNm, setWheelTorqueNm] = useState("");
  const [unitName, setUnitName] = useState<string>(WORKSHOP_UNITS[0]);
  const [saveAsUnassigned, setSaveAsUnassigned] = useState<boolean>(false);
  const [assignedMechanicIds, setAssignedMechanicIds] = useState<string[]>(
    mechanics[0] ? [mechanics[0].id] : ["m_andy"]
  );
  const [initialMaterials, setInitialMaterials] = useState<string[]>([]);

  const applyExtractedData = (ext: any, uploadedUrl?: string) => {
    if (ext.clientName) setClientName(ext.clientName);
    if (ext.street) setStreet(ext.street);
    if (ext.city) setCity(ext.city);
    if (ext.phone) setPhone(ext.phone);
    if (ext.mobile) setMobile(ext.mobile);
    if (ext.email) setEmail(ext.email);
    if (ext.estimatedCostEur !== undefined && ext.estimatedCostEur > 0) {
      setEstimatedCostEur(String(ext.estimatedCostEur));
    }

    const cat: WorkshopAssetCategory =
      ext.assetCategory === "equipment" ? "equipment" : "trailer";
    setAssetCategory(cat);
    if (ext.plate) setPlate(ext.plate);
    if (ext.vehicleType) setVehicleType(ext.vehicleType);
    if (ext.vehicleSubtype) setVehicleSubtype(ext.vehicleSubtype);
    if (ext.equipmentName) setEquipmentName(ext.equipmentName);
    if (ext.machineNumber) setMachineNumber(ext.machineNumber);
    if (ext.equipmentDescription) setEquipmentDescription(ext.equipmentDescription);

    if (Array.isArray(ext.scopeTypes) && ext.scopeTypes.length > 0) {
      const validScopes = ext.scopeTypes.filter((s: any) =>
        ALL_SCOPES.includes(s)
      ) as WorkshopScopeType[];
      if (validScopes.length > 0) setScopeTypes(validScopes);
    }

    if (Array.isArray(ext.taskInstructions) && ext.taskInstructions.length > 0) {
      setTaskInstructions(ext.taskInstructions);
    }

    if (ext.wheelTorqueNm) setWheelTorqueNm(String(ext.wheelTorqueNm));

    if (Array.isArray(ext.suggestedMechanics) && ext.suggestedMechanics.length > 0) {
      const matchedIds = mechanics
        .filter((m) =>
          ext.suggestedMechanics.some(
            (sm: string) => sm.toLowerCase() === m.name.toLowerCase()
          )
        )
        .map((m) => m.id);
      if (matchedIds.length > 0) setAssignedMechanicIds(matchedIds);
    }

    if (Array.isArray(ext.initialMaterials)) {
      setInitialMaterials(ext.initialMaterials.filter(Boolean));
    }

    if (uploadedUrl) setScanPreviewUrl(uploadedUrl);
  };

  const handleUploadAuftragFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);

    try {
      const mediaForm = new FormData();
      mediaForm.append("file", file);
      let uploadedUrl = "";
      try {
        const upRes = await fetch("/api/workshop/media", {
          method: "POST",
          body: mediaForm,
        });
        if (upRes.ok) {
          const upJson = await upRes.json();
          uploadedUrl = upJson.url || "";
        }
      } catch {}

      const ocrForm = new FormData();
      ocrForm.append("file", file);
      ocrForm.append("lang", language);
      const res = await fetch("/api/workshop/ocr", {
        method: "POST",
        body: ocrForm,
      });
      const json = await res.json();
      if (json?.extracted) {
        applyExtractedData(json.extracted, uploadedUrl);
        toast.success(w.ocrExtractedToast);
      }
    } catch {
      toast.error(w.ocrErrorToast);
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  const handleScanAttachedDollSample = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/workshop/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useSampleDollScan: true, lang: language }),
      });
      const json = await res.json();
      if (json?.extracted) {
        applyExtractedData(json.extracted);
        toast.success(w.dollSampleLoadedToast);
      }
    } catch {
      toast.error(w.dollSampleErrorToast);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectExistingClient = (cid: string | null) => {
    if (!cid) return;
    setSelectedClientId(cid);
    if (cid === "manual") return;
    const found = clients.find((c) => c.id === cid);
    if (found) {
      setClientName(found.name);
      setStreet(found.street || found.address || "");
      setCity([found.postalCode, found.city].filter(Boolean).join(" "));
      setPhone(found.phone || "");
      setMobile(found.phone2 || "");
      setEmail(found.email || "");
    }
  };

  const handleSelectExistingTrailer = (tid: string | null) => {
    if (!tid) return;
    setSelectedTrailerId(tid);
    if (tid === "manual") return;
    const found = trailers.find((tr) => tr.id === tid);
    if (found) {
      setPlate(found.plate || "");
      setVehicleType(found.type);
      setVehicleSubtype(
        [found.model, found.capacity, found.dimensions].filter(Boolean).join(" · ")
      );
      setVin(found.vin || "");
    }
  };

  const toggleScope = (scope: WorkshopScopeType) => {
    setScopeTypes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const toggleMechanic = (id: string) => {
    setAssignedMechanicIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const addInstruction = () => {
    const trimmed = newInstruction.trim();
    if (!trimmed) return;
    setTaskInstructions((prev) => [...prev, trimmed]);
    setNewInstruction("");
  };

  const resetForm = () => {
    setScanPreviewUrl("");
    setSelectedClientId("manual");
    setClientName("");
    setStreet("");
    setCity("");
    setPhone("");
    setMobile("");
    setEmail("");
    setEstimatedCostEur("");
    setOfficeNotes("");
    setSelectedTrailerId("manual");
    setPlate("");
    setVehicleType("");
    setVehicleSubtype("");
    setVin("");
    setEquipmentName("");
    setMachineNumber("");
    setEquipmentDescription("");
    setScopeTypes(["TUV"]);
    setTaskInstructions([w.defaultInitialInstruction]);
    setWheelTorqueNm("");
    setSaveAsUnassigned(false);
    setInitialMaterials([]);
  };

  const willSaveUnassigned = saveAsUnassigned || assignedMechanicIds.length === 0;

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      toast.error(w.errProvideClientName);
      return;
    }
    if (assetCategory === "trailer" && !plate.trim() && !vehicleType.trim()) {
      toast.error(w.errProvideTrailerPlate);
      return;
    }
    if (assetCategory === "equipment" && !equipmentName.trim()) {
      toast.error(w.errProvideEquipmentName);
      return;
    }

    const nowIso = new Date().toISOString();
    const orderId = `wo_${Date.now().toString(36)}`;
    const nextNumber = `WA-${new Date().getFullYear()}/${String(
      workshopOrders.length + 41
    ).padStart(3, "0")}`;

    const newOrder: WorkshopOrder = {
      id: orderId,
      orderNumber: nextNumber,
      createdAt: nowIso,
      updatedAt: nowIso,
      status: willSaveUnassigned ? "unassigned" : "new",
      assetCategory,
      trailerId:
        assetCategory === "trailer" && selectedTrailerId !== "manual"
          ? selectedTrailerId
          : undefined,
      plate: assetCategory === "trailer" ? plate.trim() : undefined,
      vehicleType: assetCategory === "trailer" ? vehicleType.trim() : undefined,
      vehicleSubtype: assetCategory === "trailer" ? vehicleSubtype.trim() : undefined,
      vin: assetCategory === "trailer" ? vin.trim() : undefined,
      equipmentName: assetCategory === "equipment" ? equipmentName.trim() : undefined,
      machineNumber: assetCategory === "equipment" ? machineNumber.trim() : undefined,
      equipmentDescription:
        assetCategory === "equipment" ? equipmentDescription.trim() : undefined,
      scopeTypes: scopeTypes.length > 0 ? scopeTypes : ["other"],
      taskInstructions: taskInstructions.filter((i) => i.trim().length > 0),
      wheelTorqueNm: wheelTorqueNm.trim() || undefined,
      unitName: willSaveUnassigned ? UNASSIGNED_UNIT : unitName,
      assignedMechanicIds: willSaveUnassigned ? [] : assignedMechanicIds,
      checklist: { ...DEFAULT_WORKSHOP_CHECKLIST },
      timeLogs: [],
      partsUsed: initialMaterials.map((mat, idx) => ({
        id: `pt_init_${idx}_${Date.now()}`,
        name: mat,
        quantity: 1,
        unit: w.pcsUnit,
        addedByMechanicId: currentUser?.id || "office",
        addedByMechanicName: currentUser?.name || w.officeLabel,
        addedAt: nowIso,
      })),
      mediaItems: [],
      transferHistory: [],
    };

    const clientDetails: WorkshopOrderClientDetails = {
      orderId,
      clientId: selectedClientId !== "manual" ? selectedClientId : undefined,
      clientName: clientName.trim(),
      street: street.trim() || undefined,
      city: city.trim() || undefined,
      phone: phone.trim() || undefined,
      mobile: mobile.trim() || undefined,
      email: email.trim() || undefined,
      auftragScanUrl: scanPreviewUrl || undefined,
      estimatedCostEur: estimatedCostEur ? Number(estimatedCostEur) : undefined,
      clientDecision: "pending",
      officeInternalNotes: officeNotes.trim() || undefined,
    };

    createWorkshopOrder(newOrder, clientDetails);
    toast.success(
      willSaveUnassigned
        ? w.orderSavedUnassignedToast(nextNumber)
        : w.orderCreatedToast(nextNumber)
    );
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:w-[95vw] sm:max-w-[96vw] max-h-[94dvh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {t.newWorkOrderBtn}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateOrder} className="space-y-6 py-2">
          {/* Step 1A: OCR Scanner Bar */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-primary" />
                  <span>{w.ocrBannerTitle}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{w.ocrBannerDesc}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors">
                  {isScanning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{isScanning ? t.scanningAuftrag : t.scanAuftragBtn}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={isScanning}
                    onChange={handleUploadAuftragFile}
                  />
                </label>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isScanning}
                  onClick={handleScanAttachedDollSample}
                  className="text-xs gap-1.5"
                >
                  <FileImage className="w-3.5 h-3.5" />
                  <span>{w.loadDollSampleBtn}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Split RODO Two-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* LEFT COLUMN: OFFICE-ONLY CUSTOMER PII */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/70 bg-amber-50/30 dark:bg-amber-950/15 p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-200/70 dark:border-amber-900/60">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{w.section1ClientPiiTitle}</span>
                </div>
              </div>

              {clients.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">{w.selectFromCrmLabel}</Label>
                  <Select value={selectedClientId} onValueChange={handleSelectExistingClient}>
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 w-full">
                      <SelectValue placeholder={w.selectFromCrmPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">{w.manualOrScanOption}</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">{w.clientNameLabel}</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={w.clientNamePlaceholder}
                  className="bg-white dark:bg-slate-900 h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">{w.streetLabel}</Label>
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Sigmundstr. 110"
                    className="bg-white dark:bg-slate-900 h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{w.cityPostalLabel}</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="90431 Nürnberg"
                    className="bg-white dark:bg-slate-900 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">{w.phoneMobileLabel}</Label>
                  <Input
                    value={mobile || phone}
                    onChange={(e) => {
                      setMobile(e.target.value);
                      setPhone(e.target.value);
                    }}
                    placeholder="+49 171 ..."
                    className="bg-white dark:bg-slate-900 h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{w.estimatedCostLabel}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={estimatedCostEur}
                    onChange={(e) => setEstimatedCostEur(e.target.value)}
                    placeholder="450"
                    className="bg-white dark:bg-slate-900 h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{w.clientEmailLabel}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kontakt@firma.de"
                  className="bg-white dark:bg-slate-900 h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{w.officeInternalNoteLabel}</Label>
                <Input
                  value={officeNotes}
                  onChange={(e) => setOfficeNotes(e.target.value)}
                  placeholder={w.officeInternalNotePlaceholder}
                  className="bg-white dark:bg-slate-900 h-9 text-xs"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: MECHANIC-VISIBLE TECHNICAL ASSET */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/20 dark:bg-emerald-950/10 p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-200/70 dark:border-emerald-900/60">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{w.section2AssetRodoTitle}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAssetCategory("trailer")}
                  className={cn(
                    "py-1.5 rounded-md text-xs font-semibold transition-colors",
                    assetCategory === "trailer"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  )}
                >
                  {w.assetCatTrailerBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setAssetCategory("equipment")}
                  className={cn(
                    "py-1.5 rounded-md text-xs font-semibold transition-colors",
                    assetCategory === "equipment"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  )}
                >
                  {w.assetCatEquipmentBtn}
                </button>
              </div>

              {assetCategory === "trailer" ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">{w.selectFleetTrailerLabel}</Label>
                    <Select value={selectedTrailerId} onValueChange={handleSelectExistingTrailer}>
                      <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 w-full">
                        <SelectValue placeholder={w.selectFleetTrailerPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">{w.externalTrailerOption}</SelectItem>
                        {trailers.map((tr) => (
                          <SelectItem key={tr.id} value={tr.id}>
                            {tr.plate || w.noPlateFallback} ·{" "}
                            {localizeVehicleType(tr.type, language)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-xs">{w.plateRequiredLabel}</Label>
                      <Input
                        value={plate}
                        onChange={(e) => setPlate(e.target.value)}
                        placeholder="N-DC 210"
                        className="bg-white dark:bg-slate-900 h-9 text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{w.vehicleTypeInputLabel}</Label>
                      <Input
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        placeholder="Kipper_Trójstronny"
                        className="bg-white dark:bg-slate-900 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">{w.vehicleSpecInputLabel}</Label>
                    <Input
                      value={vehicleSubtype}
                      onChange={(e) => setVehicleSubtype(e.target.value)}
                      placeholder="Dreiseitenkipper 3500 kg, AL-KO"
                      className="bg-white dark:bg-slate-900 h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">{w.vinOptionalLabel}</Label>
                    <Input
                      value={vin}
                      onChange={(e) => setVin(e.target.value)}
                      placeholder="W09000..."
                      className="bg-white dark:bg-slate-900 h-9 text-xs font-mono"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">{w.equipmentNameRequiredLabel}</Label>
                    <Input
                      value={equipmentName}
                      onChange={(e) => setEquipmentName(e.target.value)}
                      placeholder={w.equipmentNamePlaceholder}
                      className="bg-white dark:bg-slate-900 h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">{w.machineIdInputLabel}</Label>
                    <Input
                      value={machineNumber}
                      onChange={(e) => setMachineNumber(e.target.value)}
                      placeholder="WB-99 / SN-44820"
                      className="bg-white dark:bg-slate-900 h-9 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">{w.equipmentDescInputLabel}</Label>
                    <Input
                      value={equipmentDescription}
                      onChange={(e) => setEquipmentDescription(e.target.value)}
                      placeholder={w.equipmentDescPlaceholder}
                      className="bg-white dark:bg-slate-900 h-9 text-xs"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scope of Work & Instructions */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">{w.section3ScopeTitle}</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_SCOPES.map((sc) => {
                  const active = scopeTypes.includes(sc);
                  return (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => toggleScope(sc)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors",
                        active
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {getScopeLabel(sc, language)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">{w.techInstructionsLabel}</Label>
              <div className="flex gap-2">
                <Input
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInstruction();
                    }
                  }}
                  placeholder={w.addInstructionPlaceholder}
                  className="h-9 text-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
                  <Plus className="w-4 h-4 mr-1" />
                  {w.addBtn}
                </Button>
              </div>
              <div className="space-y-1.5">
                {taskInstructions.map((inst, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-xs"
                  >
                    <span>• {trText(inst)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTaskInstructions((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 1B: Assign Unit & Mechanic Team OR Save to Unassigned Queue */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAsUnassigned}
                  onChange={(e) => setSaveAsUnassigned(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {w.saveAsUnassignedToggle}
                  </div>
                  <div className="text-[11px] text-slate-500">{w.saveAsUnassignedDesc}</div>
                </div>
              </label>
            </div>

            {!saveAsUnassigned && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{t.executingUnitLabel}</Label>
                  <Select value={unitName} onValueChange={(v) => v && setUnitName(v)}>
                    <SelectTrigger className="h-10 text-xs w-full">
                      <SelectValue>{localizeUnitName(unitName, language)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {WORKSHOP_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {localizeUnitName(unit, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{w.assignTeamLabel}</Label>
                  <div className="flex flex-wrap gap-2">
                    {mechanics.map((m) => {
                      const selected = assignedMechanicIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMechanic(m.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold min-h-[40px] transition-colors whitespace-nowrap",
                            selected
                              ? "bg-emerald-700 text-white border-emerald-700"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                          )}
                        >
                          {selected && <Check className="w-3.5 h-3.5" />}
                          <span>{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="whitespace-nowrap"
            >
              {t.cancel}
            </Button>
            <Button type="submit" className="font-semibold whitespace-nowrap">
              {willSaveUnassigned ? w.createUnassignedBtn : w.createAndSendBtn}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
