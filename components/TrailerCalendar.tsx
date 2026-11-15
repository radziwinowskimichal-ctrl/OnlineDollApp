"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context";
import { colorClassMap, badgeColorClassMap } from "@/lib/colors";
import { format, addDays, startOfToday, parseISO, isWithinInterval, isSameDay, isBefore } from "date-fns";
import { pl, enUS, de } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Check, ChevronsUpDown, Search, CheckCircle2, FileSignature, Phone, Calendar as CalendarIcon, Clock, Filter, ShieldCheck, Sparkles, LayoutGrid, AlertCircle, Database, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { translations } from "@/lib/translations";
import { ReleaseTrailerDialog } from "./ReleaseTrailerDialog";
import { ReturnTrailerDialog } from "./ReturnTrailerDialog";
import { BackupManager } from "./BackupManager";

export function TrailerCalendar() {
  const { trailers, reservations, clients, addReservation, addClient, language, currentUserId, profiles, updateReservation, deleteReservation, statusColors, checkTrailerAvailability, createBackupSnapshot, backups, canManage } = useApp();
  const router = useRouter();

  const t = translations[language as keyof typeof translations] || translations.pl;
  
  const dateLocale = language === 'pl' ? pl : language === 'de' ? de : enUS;

  const today = startOfToday();
  
  const [startDateOffset, setStartDateOffset] = useState(-1);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [trailerSearch, setTrailerSearch] = useState("");
  
  // Mobile-first calendar view state: 'day' (Agenda), 'timeline3' (3-day compact), or 'grid' (14-day desktop matrix)
  const [mobileView, setMobileView] = useState<'day' | 'timeline3' | 'grid'>('day');
  const [selectedMobileDate, setSelectedMobileDate] = useState<Date>(today);
  const [dayFilter, setDayFilter] = useState<'all' | 'free' | 'rented'>('all');

  const viewStartDate = addDays(today, startDateOffset);
  const days = Array.from({ length: 14 }).map((_, i) => addDays(viewStartDate, i));
  
  // 28-day horizontal touch ribbon for mobile thumb selection
  const mobileRibbonDays = Array.from({ length: 28 }).map((_, i) => addDays(today, i - 3));
  // 3 consecutive days for compact timeline view
  const timeline3Days = Array.from({ length: 3 }).map((_, i) => addDays(selectedMobileDate, i));

  const filteredTrailers = trailers.filter(trailer => {
    const matchesFilter = typeFilter === "all" || trailer.type === typeFilter;
    const searchLower = trailerSearch.toLowerCase();
    
    // Get translated type name
    const typeLabel = (t.trailerTypes as any)[trailer.type] || "";
    
    const matchesSearch = 
      (trailer.plate || "").toLowerCase().includes(searchLower) ||
      (trailer.model || "").toLowerCase().includes(searchLower) ||
      typeLabel.toLowerCase().includes(searchLower);
      
    return matchesFilter && matchesSearch;
  });

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditingReservation, setIsEditingReservation] = useState(false);
  const [viewingReservationId, setViewingReservationId] = useState<string | null>(null);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [selectedReleaseReservation, setSelectedReleaseReservation] = useState<any>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedReturnReservation, setSelectedReturnReservation] = useState<any>(null);
  const [selectedTrailerId, setSelectedTrailerId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Reservation Form state
  const [clientId, setClientId] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("08:00");
  const [returnTime, setReturnTime] = useState<string>("17:30");
  const [status, setStatus] = useState<"paid" | "invoiced" | "defect" | "completed" | "active" | "cancelled">("paid");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [defectNote, setDefectNote] = useState<string>("");
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);

  // New Client Form state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientType, setNewClientType] = useState<"private" | "company">("private");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientNip, setNewClientNip] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");

  const getReservationsForDay = (trailerId: string, date: Date) => {
    return reservations.filter(r => {
      if (r.trailerId !== trailerId) return false;
      if (r.status === "completed" || r.status === "cancelled") return false;
      const start = parseISO(r.startDate);
      const end = parseISO(r.endDate);
      return isWithinInterval(date, { start, end }) || isSameDay(date, start) || isSameDay(date, end);
    });
  };

  const getStatusColor = (status: string) => {
    const colorKey = statusColors[status as keyof typeof statusColors];
    if (!colorKey) return "bg-blue-500 hover:bg-blue-600 text-white";
    
    return colorClassMap[colorKey] || "bg-blue-500 hover:bg-blue-600 text-white";
  };

  const handleCellClick = (trailerId: string, date: Date) => {
    const currentToday = startOfToday();
    if (isBefore(date, currentToday)) {
      toast.error(t.pastDateError);
      return;
    }

    setSelectedTrailerId(trailerId);
    setSelectedDate(date);
    setEndDate(format(addDays(date, 1), "yyyy-MM-dd"));
    setPickupTime(isSameDay(date, new Date()) ? format(new Date(), "HH:mm") : "08:00");
    setReturnTime("17:30");
    setClientId("");
    setStatus("paid");
    setInvoiceNumber("");
    setDefectNote("");
    setIsCreatingClient(false);
    setIsDialogOpen(true);
  };

  const handleReservationClick = (e: React.MouseEvent, resId: string) => {
    e.stopPropagation();
    setViewingReservationId(resId);
    setIsEditingReservation(false);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = () => {
    const res = reservations.find(r => r.id === viewingReservationId);
    if (!res) return;
    
    setSelectedTrailerId(res.trailerId);
    setClientId(res.clientId);
    const start = parseISO(res.startDate);
    const end = parseISO(res.endDate);
    setSelectedDate(start);
    setEndDate(format(end, "yyyy-MM-dd"));
    setPickupTime(format(start, "HH:mm"));
    setReturnTime(format(end, "HH:mm"));
    setStatus(res.status);
    setInvoiceNumber(res.invoiceNumber || "");
    setDefectNote(res.defectNote || "");
    setIsEditingReservation(true);
  };

  const handleUpdateReservation = () => {
    if (!clientId || !endDate || !selectedDate || !selectedTrailerId || !viewingReservationId) {
      toast.error(t.fillAllFields);
      return;
    }

    const currentToday = startOfToday();
    const existingRes = reservations.find(r => r.id === viewingReservationId);
    const existingStart = existingRes ? parseISO(existingRes.startDate) : null;
    const isStartDateChanged = existingStart && !isSameDay(existingStart, selectedDate);

    if (isBefore(selectedDate, currentToday) && isStartDateChanged) {
      toast.error(t.pastDateError);
      return;
    }

    const startDateTime = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${pickupTime}:00`);
    const endDateTime = new Date(`${endDate}T${returnTime}:00`);
    
    if (endDateTime <= startDateTime) {
      toast.error(t.returnAfterPickupError);
      return;
    }

    // Check collision
    if (!checkTrailerAvailability(selectedTrailerId, startDateTime, endDateTime, viewingReservationId)) {
      toast.error(t.collisionError);
      return;
    }
    
    // Check if status changed or just general edit
    const isStatusChanged = existingRes?.status !== status;
    const actionType = isStatusChanged ? "status_changed" : "edited";

    updateReservation({
      id: viewingReservationId,
      trailerId: selectedTrailerId,
      clientId,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      status,
      invoiceNumber: invoiceNumber || undefined,
      defectNote: defectNote || undefined,
    }, actionType as any);

    toast.success(t.reservationUpdated);
    setIsEditingReservation(false);
  };

  const handleDeleteReservation = () => {
    if (!canManage("reservation.edit")) {
      toast.error(t.adminOnlyAction);
      return;
    }
    if (!viewingReservationId) return;
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteReservation = () => {
    if (!canManage("reservation.edit")) {
      toast.error(t.adminOnlyAction);
      return;
    }
    if (!viewingReservationId) return;
    const res = reservations.find(r => r.id === viewingReservationId);
    if (res) {
      updateReservation({
        ...res,
        status: "cancelled",
      }, "cancelled");
      toast.success(t.reservationDeleted);
    }
    setIsDeleteDialogOpen(false);
    setIsViewDialogOpen(false);
  };

  const handleSaveReservation = () => {
    if (!clientId || !endDate || !selectedDate || !selectedTrailerId) {
      toast.error(t.fillAllFields);
      return;
    }

    const currentToday = startOfToday();
    if (isBefore(selectedDate, currentToday)) {
      toast.error(t.pastDateError);
      return;
    }

    const startDateTime = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${pickupTime}:00`);
    const endDateTime = new Date(`${endDate}T${returnTime}:00`);

    if (endDateTime <= startDateTime) {
      toast.error(t.returnAfterPickupError);
      return;
    }

    // Check collision
    if (!checkTrailerAvailability(selectedTrailerId, startDateTime, endDateTime)) {
      toast.error(t.collisionError);
      return;
    }

    const selectedClient = clients.find(c => c.id === clientId);
    const isCompany = selectedClient?.type === "company";
    const initialDeposit = isCompany ? 1000 : 200;

    addReservation({
      id: Math.random().toString(36).substring(7),
      trailerId: selectedTrailerId,
      clientId,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      status,
      invoiceNumber: invoiceNumber || undefined,
      defectNote: defectNote || undefined,
      agreement: {
        deposits: {
          general: initialDeposit,
          total: initialDeposit,
        },
        paymentMethod: "BAR",
      }
    });

    toast.success(t.reservationAdded);
    setIsDialogOpen(false);
  };

  const handleSaveNewClient = () => {
    if (!newClientName) {
      toast.error(t.provideClientName);
      return;
    }

    const newClient = {
      id: Math.random().toString(36).substring(7),
      name: newClientName,
      balance: 0,
      notes: "",
      type: newClientType,
      phone: newClientPhone || undefined,
      email: newClientEmail || undefined,
      nip: newClientType === "company" ? (newClientNip || undefined) : undefined,
      address: newClientAddress || undefined,
    };

    addClient(newClient);
    setClientId(newClient.id);
    setIsCreatingClient(false);
    
    // Reset form
    setNewClientName("");
    setNewClientPhone("");
    setNewClientEmail("");
    setNewClientNip("");
    setNewClientAddress("");
    
    toast.success(t.clientAdded);
  };

  const calendarDaysRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = calendarDaysRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        if (e.deltaY > 0) {
          setStartDateOffset(prev => prev + 1);
        } else if (e.deltaY < 0) {
          setStartDateOffset(prev => prev - 1);
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Mobile calculations for selected date
  const getReservationsOnDate = (trailerId: string, date: Date) => {
    return reservations.filter(r => {
      if (r.trailerId !== trailerId) return false;
      if (r.status === "completed" || r.status === "cancelled") return false;
      const start = parseISO(r.startDate);
      const end = parseISO(r.endDate);
      return isWithinInterval(date, { start, end }) || isSameDay(date, start) || isSameDay(date, end);
    });
  };

  const freeTrailersCount = filteredTrailers.filter(tr => getReservationsOnDate(tr.id, selectedMobileDate).length === 0).length;
  const rentedTrailersCount = filteredTrailers.length - freeTrailersCount;

  const trailersForDayView = filteredTrailers.filter(tr => {
    const isBooked = getReservationsOnDate(tr.id, selectedMobileDate).length > 0;
    if (dayFilter === 'free') return !isBooked;
    if (dayFilter === 'rented') return isBooked;
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-3 sm:space-y-4">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2 sm:gap-4 bg-slate-50 p-2.5 sm:p-3 rounded-2xl border shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode segmented switcher */}
          <div className="flex p-1 bg-slate-200/80 rounded-xl gap-1 w-full sm:w-auto">
            <button
              onClick={() => setMobileView('day')}
              className={cn(
                "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                mobileView === 'day' 
                  ? "bg-white text-primary shadow-xs ring-1 ring-slate-900/5 font-extrabold" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{t.mobileDayView || "Plan dnia"}</span>
            </button>
            <button
              onClick={() => setMobileView('timeline3')}
              className={cn(
                "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                mobileView === 'timeline3' 
                  ? "bg-white text-primary shadow-xs ring-1 ring-slate-900/5 font-extrabold" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t.mobileTimelineView || "Kompakt 3 dni"}</span>
            </button>
            <button
              onClick={() => setMobileView('grid')}
              className={cn(
                "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                mobileView === 'grid' 
                  ? "bg-white text-primary shadow-xs ring-1 ring-slate-900/5 font-extrabold" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t.desktopGridView || "Pełna siatka"}</span>
            </button>
          </div>

          {/* Grid navigation controls (when in grid mode) */}
          {mobileView === 'grid' && (
            <div className="hidden sm:flex bg-white rounded-lg border shadow-sm p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => setStartDateOffset(prev => prev - 7)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500" onClick={() => setStartDateOffset(-1)}>
                {t.today}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => setStartDateOffset(prev => prev + 7)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "all")}>
            <SelectTrigger className="w-full sm:w-[170px] h-9 border-slate-200 bg-white text-[11px] font-bold uppercase tracking-tight">
              <SelectValue placeholder={t.allTypes} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-bold uppercase">{t.allTypes}</SelectItem>
              {Object.entries(t.trailerCategories || {}).map(([key, label]) => {
                const categoryTypeMap: Record<string, string[]> = {
                  tarpaulin: ["Planen_Tieflader", "Planen_Hochlader", "Planen_Drehschemel"],
                  box: ["Koffer_Flügeltüre", "Koffer_Rampe", "Koffer_Alu", "Koffer_Deckel", "Koffer_Wielkogabarytowy"],
                  open: ["Offen_Standard", "Offen_Laubgitter"],
                  fridge: ["fridge_unit"],
                  tipper: ["Kipper_Tylny", "Kipper_Trójstronny"],
                  carTransporter: ["Laweta_Uchylna", "Laweta_Platforma", "Maszynowa", "Laweta_Obrotnica"],
                  motorcycle: ["Motocyklowa_Szynowa", "Opuszczana"],
                  horse: ["horse_trailer"],
                  truck: ["LKW_Plane", "LKW_Kipper", "LKW_Tandem"]
                };
                const types = categoryTypeMap[key] || [];
                return (
                  <SelectGroup key={key}>
                    <SelectLabel className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">{label}</SelectLabel>
                    {types.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs font-medium">
                        {t.trailerTypes[type as keyof typeof t.trailerTypes]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
              <SelectGroup>
                <SelectLabel className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">{t.other || "Inne / Others"}</SelectLabel>
                {["winch", "cableTrailer", "auxWinch", "cablePusher", "compressor"].map((type) => (
                  <SelectItem key={type} value={type} className="text-xs font-medium">
                    {t.trailerTypes[type as keyof typeof t.trailerTypes] || type}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Quick search input */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="search"
              placeholder={t.searchTrailerPlaceholder || "Szukaj tablicy..."}
              className="pl-8 w-full sm:w-[170px] h-9 border-slate-200 bg-white text-xs font-bold"
              value={trailerSearch}
              onChange={(e) => setTrailerSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Date indication badge + Quick Backup / Save State Controls */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await createBackupSnapshot();
                toast.success(
                  language === "de"
                    ? "Reservierungsstand gesichert!"
                    : language === "en"
                    ? "Reservation state saved!"
                    : "Zapisano aktualny stan rezerwacji!"
                );
              }}
              className="h-8 px-2.5 text-xs font-bold border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 flex items-center gap-1.5"
              title={
                language === "de"
                  ? "Schnellsicherung des aktuellen Reservierungsstands"
                  : language === "en"
                  ? "Quickly save current reservation state"
                  : "Szybki zapis aktualnego stanu rezerwacji"
              }
            >
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {language === "de"
                  ? "Stand speichern"
                  : language === "en"
                  ? "Save State"
                  : "Zapisz stan"}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBackupDialogOpen(true)}
              className="h-8 px-2.5 text-xs font-bold border-blue-300 bg-blue-50/80 hover:bg-blue-100 text-blue-900 flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === "de"
                  ? "Backup / Export"
                  : language === "en"
                  ? "Backup / Export"
                  : "Backup / Eksport"}
              </span>
              {backups.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-black">
                  {backups.length}
                </span>
              )}
            </Button>
          </div>

          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {mobileView === 'day' 
              ? format(selectedMobileDate, "EEEE, d MMMM yyyy", { locale: dateLocale })
              : `${format(days[0], "d MMM", { locale: dateLocale })} - ${format(days[days.length - 1], "d MMM yyyy", { locale: dateLocale })}`
            }
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: Mobile Day View (Agenda) - Star Mobile Feature     */}
      {/* ========================================================= */}
      {mobileView === 'day' && (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          {/* Day Navigation Banner & Ribbon */}
          <div className="bg-white border rounded-2xl p-3 shadow-xs space-y-3">
            {/* Header controls: Prev day, Date name, Today jump, Next day */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMobileDate(prev => addDays(prev, -1))}
                className="h-9 px-2.5 rounded-xl border-slate-200"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" />
                <span className="text-xs font-bold hidden xs:inline">{t.previous || "Poprzedni"}</span>
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight capitalize">
                  {format(selectedMobileDate, "EEEE, d MMMM", { locale: dateLocale })}
                </span>
                {isSameDay(selectedMobileDate, today) && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                    {t.todayJump || "DZIŚ"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {!isSameDay(selectedMobileDate, today) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMobileDate(today)}
                    className="h-8 px-2 text-[10px] font-black text-blue-600 hover:bg-blue-50 uppercase"
                  >
                    {t.todayJump || "DZIŚ"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMobileDate(prev => addDays(prev, 1))}
                  className="h-9 px-2.5 rounded-xl border-slate-200"
                >
                  <span className="text-xs font-bold hidden xs:inline">{t.next || "Następny"}</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </Button>
              </div>
            </div>

            {/* Horizontal 28-day thumb-scrollable ribbon */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth">
              {mobileRibbonDays.map((d, idx) => {
                const isSelected = isSameDay(d, selectedMobileDate);
                const isCurrentToday = isSameDay(d, today);
                // Check if any reservation exists on this day
                const hasReservations = reservations.some(r => {
                  if (r.status === "completed" || r.status === "cancelled") return false;
                  const start = parseISO(r.startDate);
                  const end = parseISO(r.endDate);
                  return isWithinInterval(d, { start, end }) || isSameDay(d, start) || isSameDay(d, end);
                });

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedMobileDate(d)}
                    className={cn(
                      "shrink-0 flex flex-col items-center justify-center min-w-[50px] py-2 px-1.5 rounded-xl border transition-all active:scale-95",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 scale-105"
                        : isCurrentToday
                        ? "bg-blue-50/80 text-blue-900 border-blue-200 font-bold"
                        : "bg-slate-50/60 text-slate-700 border-slate-150 hover:bg-slate-100"
                    )}
                  >
                    <span className={cn(
                      "text-[9px] uppercase font-black tracking-tight",
                      isSelected ? "text-primary-foreground/90" : "text-slate-400"
                    )}>
                      {format(d, "EEE", { locale: dateLocale })}
                    </span>
                    <span className="text-sm font-black mt-0.5 leading-none">
                      {format(d, "d")}
                    </span>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5",
                      hasReservations 
                        ? (isSelected ? "bg-amber-300" : "bg-blue-500") 
                        : (isSelected ? "bg-emerald-300" : "bg-slate-200")
                    )} />
                  </button>
                );
              })}
            </div>

            {/* KPI Availability Banner & Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{freeTrailersCount} {t.trailersAvailableCount || "wolnych"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800">
                  <span>{rentedTrailersCount} {t.reservedTrailer || "wynajętych"}</span>
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  ({filteredTrailers.length} {t.allTrailersCount || "w flocie"})
                </span>
              </div>

              {/* Filter chips */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  onClick={() => setDayFilter('all')}
                  className={cn("px-2 py-1 rounded-md transition-all", dayFilter === 'all' ? "bg-white shadow-xs text-slate-900" : "text-slate-500")}
                >
                  {t.filterAll || "Wszystkie"} ({filteredTrailers.length})
                </button>
                <button
                  onClick={() => setDayFilter('free')}
                  className={cn("px-2 py-1 rounded-md transition-all", dayFilter === 'free' ? "bg-white shadow-xs text-emerald-700" : "text-slate-500")}
                >
                  {t.filterFreeOnly || "Wolne"} ({freeTrailersCount})
                </button>
                <button
                  onClick={() => setDayFilter('rented')}
                  className={cn("px-2 py-1 rounded-md transition-all", dayFilter === 'rented' ? "bg-white shadow-xs text-blue-700" : "text-slate-500")}
                >
                  {t.filterRentedOnly || "Zajęte"} ({rentedTrailersCount})
                </button>
              </div>
            </div>
          </div>

          {/* List of Trailers as Ergonomic Mobile Cards */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-8 custom-scrollbar">
            {trailersForDayView.length === 0 ? (
              <div className="bg-white border rounded-2xl p-8 text-center text-slate-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="font-bold text-sm">{t.noBookingsToday || "Brak przyczep spełniających wybrane kryteria"}</p>
              </div>
            ) : (
              trailersForDayView.map((trailer) => {
                const dayReservations = getReservationsOnDate(trailer.id, selectedMobileDate);
                const isRented = dayReservations.length > 0;

                return (
                  <div
                    key={trailer.id}
                    className={cn(
                      "bg-white border rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all hover:shadow-md",
                      isRented ? "border-blue-200/80 bg-blue-50/20" : "border-slate-200"
                    )}
                  >
                    {/* Trailer Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-1 rounded-lg border border-slate-300 bg-slate-900 text-white font-mono text-xs font-black tracking-tight uppercase shadow-xs">
                          {trailer.plate}
                        </span>
                        <div className="text-xs font-bold text-slate-800 truncate max-w-[180px] sm:max-w-xs">
                          {t.trailerTypes[trailer.type as keyof typeof t.trailerTypes] || trailer.model}
                        </div>
                      </div>

                      {/* Status badge */}
                      {isRented ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                          {t.rentedBadge || "ZAJĘTA"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {t.freeBadge || "WOLNA"}
                        </span>
                      )}
                    </div>

                    {/* Content Section */}
                    {isRented ? (
                      <div className="space-y-2.5 mt-2 pt-2 border-t border-slate-100">
                        {dayReservations.map((res) => {
                          const client = clients.find(c => c.id === res.clientId);
                          const isCompany = client?.type === "company";

                          return (
                            <div key={res.id} className="bg-white rounded-xl p-3 border border-blue-100 shadow-xs space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-bold text-sm text-slate-900 truncate">
                                  {client?.name || "Klient"}
                                </div>
                                {/* Deposit badge (Company 1000 € vs Private 200 €) */}
                                <span className={cn(
                                  "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0",
                                  isCompany 
                                    ? "bg-amber-100 text-amber-900 border border-amber-300" 
                                    : "bg-slate-100 text-slate-700"
                                )}>
                                  {isCompany ? (t.b2bDepositBadge || "Firma (Kaucja 1000 €)") : (t.privateDepositBadge || "Kaucja 200 €")}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{res.pickupTime || "08:00"} - {res.returnTime || "17:30"}</span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-600">
                                  {res.startDate} → {res.endDate}
                                </div>
                              </div>

                              {/* Mobile Quick Action Buttons for rented trailer */}
                              <div className="flex items-center gap-2 pt-1">
                                {client?.phone && (
                                  <a
                                    href={`tel:${client.phone}`}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-transform"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{t.callClient || "Zadzwoń"}</span>
                                  </a>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleReservationClick(e, res.id)}
                                  className="flex-1 min-h-[40px] rounded-xl font-bold text-xs border-slate-300 text-slate-700"
                                >
                                  {t.viewDetailsBtn || "Szczegóły"}
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReleaseReservation(res);
                                    setIsReleaseDialogOpen(true);
                                  }}
                                  className="min-h-[40px] rounded-xl font-bold text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3"
                                >
                                  {t.pickups || "Wydaj"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Free trailer: Large ergonomic thumb booking button */
                      <div className="pt-2">
                        <Button
                          onClick={() => {
                            setSelectedTrailerId(trailer.id);
                            setSelectedDate(selectedMobileDate);
                            setEndDate(format(addDays(selectedMobileDate, 1), "yyyy-MM-dd"));
                            setIsDialogOpen(true);
                          }}
                          className="w-full min-h-[44px] rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{t.quickBookBtn || "Rezerwuj tę przyczepę"} ({trailer.plate})</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: Mobile 3-Day Compact Timeline                      */}
      {/* ========================================================= */}
      {mobileView === 'timeline3' && (
        <div className="bg-white border rounded-2xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Day Navigation Banner */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMobileDate(prev => addDays(prev, -3))}
              className="h-8 px-2 text-xs font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              <span>-3 dni</span>
            </Button>
            <span className="text-xs font-black text-slate-800">
              {format(timeline3Days[0], "d MMM", { locale: dateLocale })} - {format(timeline3Days[2], "d MMM yyyy", { locale: dateLocale })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMobileDate(prev => addDays(prev, 3))}
              className="h-8 px-2 text-xs font-bold"
            >
              <span>+3 dni</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {/* Header row with 3 day columns */}
            <div className="grid grid-cols-[100px_repeat(3,1fr)] border-b bg-slate-100 text-[10px] font-black uppercase text-slate-500 sticky top-0 z-20">
              <div className="p-2 border-r">{t.trailer}</div>
              {timeline3Days.map((d, i) => (
                <div key={i} className="p-2 text-center border-r last:border-r-0">
                  <div>{format(d, "EEE", { locale: dateLocale })}</div>
                  <div className="text-xs text-slate-900 font-bold">{format(d, "d MMM")}</div>
                </div>
              ))}
            </div>

            {/* Trailers rows */}
            {filteredTrailers.map((trailer) => (
              <div key={trailer.id} className="grid grid-cols-[100px_repeat(3,1fr)] border-b hover:bg-slate-50/50 min-h-[64px]">
                <div className="p-2 border-r flex flex-col justify-center bg-white sticky left-0 z-10">
                  <span className="font-mono text-[10px] font-black text-slate-900 uppercase truncate">
                    {trailer.plate}
                  </span>
                  <span className="text-[9px] text-slate-400 truncate mt-0.5">
                    {trailer.model}
                  </span>
                </div>

                {timeline3Days.map((day, i) => {
                  const dayRes = getReservationsForDay(trailer.id, day);
                  const isBooked = dayRes.length > 0;

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (!isBooked) {
                          handleCellClick(trailer.id, day);
                        }
                      }}
                      className={cn(
                        "p-1 border-r last:border-r-0 flex flex-col justify-center relative cursor-pointer transition-colors",
                        isBooked ? "bg-blue-50/40" : "hover:bg-slate-100/60"
                      )}
                    >
                      {isBooked ? (
                        dayRes.map((res) => {
                          const client = clients.find(c => c.id === res.clientId);
                          return (
                            <div
                              key={res.id}
                              onClick={(e) => handleReservationClick(e, res.id)}
                              className={cn(
                                "rounded-lg p-1.5 text-[9px] font-bold text-white truncate shadow-xs",
                                getStatusColor(res.status)
                              )}
                            >
                              <div className="truncate">{client?.name || "Klient"}</div>
                              <div className="text-[7px] opacity-80">{res.pickupTime || "08:00"}</div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100">
                          <Plus className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: Full 14-Day Gantt Matrix (Desktop/Power User)      */}
      {/* ========================================================= */}
      {mobileView === 'grid' && (
      <div className="bg-white border rounded-xl shadow-sm ring-1 ring-slate-100 flex-1 flex flex-col min-h-0">
        <ScrollArea className="w-full h-full">
          <div className="flex w-max min-w-full relative">
            {/* Header Column (Trailers) */}
            <div className="w-56 flex-shrink-0 border-r bg-slate-50/50 sticky left-0 z-30">
              <div className="h-12 border-b flex items-center px-4 font-black text-[10px] uppercase tracking-wider text-slate-500 sticky top-0 bg-slate-100 z-40 shadow-sm">
                {t.trailer}
              </div>
              {filteredTrailers.map(trailer => (
                <div 
                  key={trailer.id} 
                  onDoubleClick={() => router.push(`/trailers/${trailer.id}`)}
                  className="h-16 border-b flex flex-col justify-center px-4 bg-white/95 group/trailer hover:bg-slate-50 transition-colors cursor-pointer"
                  title={language === "pl" ? "Kliknij dwukrotnie, aby otworzyć kartę przyczepy" : language === "de" ? "Doppelklicken, um die Anhängerkarte zu öffnen" : "Double-click to open trailer details"}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-900 font-mono text-[10px] font-black tracking-tight uppercase">
                      {trailer.plate}
                    </span>
                    {trailer.status === "service" && (
                      <span className="flex h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    )}
                  </div>
                  <div className="text-[12px] font-black text-slate-800 leading-tight truncate uppercase tracking-tighter">
                    {t.trailerTypes[trailer.type as keyof typeof t.trailerTypes]}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 truncate mt-0.5 uppercase tracking-wide">
                    {trailer.model || trailer.capacity || "-"}
                  </div>
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div className="flex" ref={calendarDaysRef}>
              {days.map(day => {
                const isPast = isBefore(day, today);
                return (
                  <div key={day.toISOString()} className={cn("w-24 flex-shrink-0 border-r last:border-r-0", isPast && "bg-slate-50/40")}>
                    <div className={cn(
                      "h-12 border-b flex flex-col items-center justify-center transition-colors sticky top-0 z-20 shadow-sm",
                      isSameDay(day, today) ? "bg-primary/5 border-b-primary/30" : isPast ? "bg-slate-100 text-slate-400" : "bg-white"
                    )}>
                      <div className={cn("text-[9px] font-black uppercase tracking-widest mb-0.5", isSameDay(day, today) ? "text-primary" : "text-slate-400")}>
                        {format(day, "EEE", { locale: dateLocale })}
                      </div>
                      <div className={cn("text-[11px] font-black", isSameDay(day, today) ? "text-primary" : isPast ? "text-slate-400" : "text-slate-800")}>
                        {format(day, "d MMM", { locale: dateLocale })}
                      </div>
                    </div>
                    
                    {filteredTrailers.map(trailer => {
                      const dayReservations = getReservationsForDay(trailer.id, day);
                      
                      return (
                        <div 
                          key={`${trailer.id}-${day.toISOString()}`} 
                          className={cn(
                            "h-16 border-b relative transition-colors group",
                            isPast ? "bg-slate-50/70 cursor-not-allowed opacity-80" : "cursor-pointer hover:bg-slate-50/50"
                          )}
                          onClick={() => handleCellClick(trailer.id, day)}
                        >
                          {!isPast && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                              <Plus className="h-4 w-4 text-slate-300" />
                            </div>
                          )}
                      
                      {dayReservations.map(res => {
                        const client = clients.find(c => c.id === res.clientId);
                        const start = parseISO(res.startDate);
                        const end = parseISO(res.endDate);
                        
                        let left = 0;
                        let right = 0;
                        let bufferLeft = 0;
                        let bufferRight = 0;

                        const bufferEnd = new Date(end.getTime() + 60 * 60 * 1000);

                        const getMinutesFrom8AM = (date: Date) => {
                          const hours = date.getHours();
                          const minutes = date.getMinutes();
                          return Math.max(0, Math.min((18 - 8) * 60, (hours - 8) * 60 + minutes));
                        };

                        if (isSameDay(start, day)) {
                          left = (getMinutesFrom8AM(start) / 600) * 100;
                        }
                        if (isSameDay(end, day)) {
                          right = 100 - ((getMinutesFrom8AM(end) / 600) * 100);
                          bufferLeft = (getMinutesFrom8AM(end) / 600) * 100;
                        } else if (end < day && bufferEnd > day) {
                          bufferLeft = 0;
                        } else {
                          bufferLeft = 100;
                        }

                        if (isSameDay(bufferEnd, day)) {
                          bufferRight = 100 - ((getMinutesFrom8AM(bufferEnd) / 600) * 100);
                        } else if (bufferEnd > day) {
                          bufferRight = 0;
                        } else {
                          bufferRight = 100;
                        }

                        const showBuffer = bufferLeft < 100;

                        return (
                          <React.Fragment key={res.id}>
                            {showBuffer && (
                              <div
                                className="absolute rounded bg-slate-100 z-0 opacity-40 border border-slate-200 border-dashed"
                                style={{ left: `calc(${bufferLeft}% + 4px)`, right: `calc(${bufferRight}% + 4px)`, top: '8px', bottom: '8px' }}
                              />
                            )}
                            <div 
                              className={cn(
                                "absolute rounded-md p-1.5 text-[9px] font-black leading-none text-white overflow-hidden z-10 shadow-sm transition-transform active:scale-95 border-b-2 border-black/10",
                                getStatusColor(res.status)
                              )}
                              style={{ left: `calc(${left}% + 4px)`, right: `calc(${right}% + 2px)`, top: '6px', bottom: '6px' }}
                              onClick={(e) => handleReservationClick(e, res.id)}
                            >
                              <div className="truncate uppercase tracking-tighter">{client?.name}</div>
                              <div className="truncate opacity-60 uppercase tracking-widest mt-0.5 text-[7px]">{res.status === 'defect' ? t.service : t.reserved}</div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      )}

      {/* Floating Action Button (FAB) on Mobile Screens for instant thumb booking */}
      <button
        onClick={() => {
          setSelectedDate(selectedMobileDate || today);
          if (filteredTrailers.length > 0) {
            setSelectedTrailerId(filteredTrailers[0].id);
          }
          setEndDate(format(addDays(selectedMobileDate || today, 1), "yyyy-MM-dd"));
          setIsDialogOpen(true);
        }}
        aria-label={t.newReservationFab || "Nowa rezerwacja"}
        className="md:hidden fixed bottom-20 right-4 z-30 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black py-3 px-4 rounded-full shadow-2xl shadow-primary/40 active:scale-90 transition-transform"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span className="text-xs tracking-tight">{t.newReservationFab || "Rezerwuj"}</span>
      </button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[96vw] sm:w-[94vw] sm:max-w-[94vw] max-h-[94dvh] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{isCreatingClient ? t.newClient : t.newReservation}</DialogTitle>
            <DialogDescription>
              {!isCreatingClient && selectedTrailerId && trailers.find(t => t.id === selectedTrailerId)?.plate + " - od " + (selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: dateLocale }) : "")}
            </DialogDescription>
          </DialogHeader>
          
          {isCreatingClient ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="clientType">{t.clientType}</Label>
                <Select value={newClientType} onValueChange={(v) => v && setNewClientType(v as "private" | "company")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">{t.privatePerson}</SelectItem>
                    <SelectItem value="company">{t.company}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clientName">{newClientType === "company" ? t.companyName : t.fullName}</Label>
                <Input 
                  id="clientName" 
                  value={newClientName} 
                  onChange={(e) => setNewClientName(e.target.value)} 
                />
              </div>
              {newClientType === "company" && (
                <div className="grid gap-2">
                  <Label htmlFor="clientNip">{t.nip}</Label>
                  <Input 
                    id="clientNip" 
                    value={newClientNip} 
                    onChange={(e) => setNewClientNip(e.target.value)} 
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="clientPhone">{t.phone}</Label>
                <Input 
                  id="clientPhone" 
                  value={newClientPhone} 
                  onChange={(e) => setNewClientPhone(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clientEmail">{t.email}</Label>
                <Input 
                  id="clientEmail" 
                  type="email"
                  value={newClientEmail} 
                  onChange={(e) => setNewClientEmail(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clientAddress">{language === "pl" ? "Adres (Ulica, Kod i Miasto)" : language === "de" ? "Adresse (Straße, PLZ, Ort)" : "Address (Street, Postal Code, City)"}</Label>
                <Input 
                  id="clientAddress" 
                  value={newClientAddress} 
                  onChange={(e) => setNewClientAddress(e.target.value)} 
                  placeholder={language === "pl" ? "np. Berliner Str. 12, 10115 Berlin" : language === "de" ? "z.B. Berliner Str. 12, 10115 Berlin" : "e.g. Berliner Str. 12, 10115 Berlin"}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2 flex flex-col">
                <Label htmlFor="client">{t.client}</Label>
                <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                  <PopoverTrigger 
                    className={cn(buttonVariants({ variant: "outline" }), "justify-between")}
                    role="combobox"
                    aria-expanded={clientComboboxOpen}
                  >
                    {clientId
                      ? clients.find((client) => client.id === clientId)?.name
                      : t.selectClient}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[380px] p-0">
                    <Command>
                      <CommandInput placeholder={t.searchClient} />
                      <CommandList>
                        <CommandEmpty>{t.clientNotFound}</CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.name}
                              onSelect={() => {
                                setClientId(client.id);
                                setClientComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  clientId === client.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {client.name}
                              {client.type === "company" && <span className="ml-2 text-xs text-muted-foreground">({t.company})</span>}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                      <div className="p-2 border-t">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-primary" 
                          onClick={() => {
                            setClientComboboxOpen(false);
                            setIsCreatingClient(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t.newClient}
                        </Button>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="create-startDate">{t.startDate}</Label>
                  <Input 
                    id="create-startDate" 
                    type="date" 
                    value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""} 
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const parsed = parseISO(e.target.value);
                      if (isBefore(parsed, startOfToday())) {
                        toast.error(t.pastDateError);
                        return;
                      }
                      setSelectedDate(parsed);
                    }} 
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">{t.returnDate}</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    min={selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t.pickupTime}</Label>
                  <Input 
                    type="time" 
                    value={pickupTime} 
                    onChange={(e) => setPickupTime(e.target.value)} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t.returnTime}</Label>
                  <Input 
                    type="time" 
                    value={returnTime} 
                    onChange={(e) => setReturnTime(e.target.value)} 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">{t.status}</Label>
                <Select value={status} onValueChange={(v) => v && setStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">{t.paid}</SelectItem>
                    <SelectItem value="invoiced">{t.invoiced}</SelectItem>
                    <SelectItem value="defect">{t.defect}</SelectItem>
                    <SelectItem value="completed">{t.completed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {isCreatingClient ? (
              <>
                <Button variant="outline" onClick={() => setIsCreatingClient(false)}>{t.back}</Button>
                <Button onClick={handleSaveNewClient}>{t.saveClient}</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button>
                <Button onClick={handleSaveReservation}>{t.saveReservation}</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Reservation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[96vw] sm:w-[94vw] sm:max-w-[94vw] max-h-[94dvh] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{isEditingReservation ? t.edit : t.reservationDetails}</DialogTitle>
          </DialogHeader>
          
          {(() => {
            const res = reservations.find(r => r.id === viewingReservationId);
            if (!res) return null;
            const client = clients.find(c => c.id === res.clientId);
            const trailer = trailers.find(t => t.id === res.trailerId);

            if (isEditingReservation) {
              return (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2 flex flex-col">
                    <Label htmlFor="edit-trailer">{t.trailer}</Label>
                    <Select value={selectedTrailerId} onValueChange={(v) => v && setSelectedTrailerId(v)}>
                      <SelectTrigger id="edit-trailer">
                        <SelectValue placeholder={t.trailer} />
                      </SelectTrigger>
                      <SelectContent>
                        {trailers.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.plate} ({t.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2 flex flex-col">
                    <Label htmlFor="edit-client">{t.client}</Label>
                    <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                      <PopoverTrigger 
                        className={cn(buttonVariants({ variant: "outline" }), "justify-between")}
                        role="combobox"
                        aria-expanded={clientComboboxOpen}
                      >
                        {clientId
                          ? clients.find((c) => c.id === clientId)?.name
                          : t.selectClient}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-[380px] p-0">
                        <Command>
                          <CommandInput placeholder={t.searchClient} />
                          <CommandList>
                            <CommandEmpty>{t.clientNotFound}</CommandEmpty>
                            <CommandGroup>
                              {clients.map((c) => (
                                <CommandItem
                                  key={c.id}
                                  value={c.name}
                                  onSelect={() => {
                                    setClientId(c.id);
                                    setClientComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      clientId === c.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {c.name}
                                  {c.type === "company" && <span className="ml-2 text-xs text-muted-foreground">({t.company})</span>}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-startDate">{t.startDate}</Label>
                      <Input 
                        id="edit-startDate" 
                        type="date" 
                        value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""} 
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const parsed = parseISO(e.target.value);
                          if (isBefore(parsed, startOfToday())) {
                            toast.error(t.pastDateError);
                            return;
                          }
                          setSelectedDate(parsed);
                        }} 
                        min={format(new Date(), "yyyy-MM-dd")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-endDate">{t.endDate}</Label>
                      <Input 
                        id="edit-endDate" 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        min={selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>{t.pickupTime}</Label>
                      <Input 
                        type="time" 
                        value={pickupTime} 
                        onChange={(e) => setPickupTime(e.target.value)} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t.returnTime}</Label>
                      <Input 
                        type="time" 
                        value={returnTime} 
                        onChange={(e) => setReturnTime(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">{t.status}</Label>
                    <Select value={status} onValueChange={(v) => v && setStatus(v as any)}>
                      <SelectTrigger id="edit-status">
                        <SelectValue placeholder={t.status} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">{t.paid}</SelectItem>
                        <SelectItem value="invoiced">{t.invoiced}</SelectItem>
                        <SelectItem value="defect">{t.defect}</SelectItem>
                        <SelectItem value="completed">{t.completed}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-invoice">{t.invoiceNumber}</Label>
                    <Input 
                      id="edit-invoice" 
                      value={invoiceNumber} 
                      onChange={(e) => setInvoiceNumber(e.target.value)} 
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-defect">{t.defectNote}</Label>
                    <Input 
                      id="edit-defect" 
                      value={defectNote} 
                      onChange={(e) => setDefectNote(e.target.value)} 
                    />
                  </div>
                </div>
              );
            }

            return (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-semibold">{t.trailer}:</span>
                  <span className="col-span-2">{trailer?.plate} ({trailer ? t.trailerTypes[trailer.type as keyof typeof t.trailerTypes] : ''})</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-semibold">{t.client}:</span>
                  <span className="col-span-2">{client?.name} {client?.type === 'company' ? `(${t.company})` : ''}</span>
                </div>
                {client?.phone && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <span className="font-semibold">{t.phone}:</span>
                    <span className="col-span-2">{client.phone}</span>
                  </div>
                )}
                {client?.email && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <span className="font-semibold">{t.email}:</span>
                    <span className="col-span-2">{client.email}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-semibold">{t.startDate}:</span>
                  <span className="col-span-2">{format(parseISO(res.startDate), "d MMMM yyyy, HH:mm", { locale: dateLocale })}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-semibold">{t.endDate}:</span>
                  <span className="col-span-2">{format(parseISO(res.endDate), "d MMMM yyyy, HH:mm", { locale: dateLocale })}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-semibold">{t.status}:</span>
                  <span className="col-span-2">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", badgeColorClassMap[statusColors[res.status as keyof typeof statusColors]])}>
                      {res.status === 'paid' && t.paid}
                      {res.status === 'invoiced' && t.invoiced}
                      {res.status === 'defect' && t.defect}
                      {res.status === 'completed' && t.completed}
                    </span>
                  </span>
                </div>
                {res.invoiceNumber && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <span className="font-semibold">{t.invoiceNumber}:</span>
                    <span className="col-span-2">{res.invoiceNumber}</span>
                  </div>
                )}
                {res.defectNote && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <span className="font-semibold">{t.defectNote}:</span>
                    <span className="col-span-2">{res.defectNote}</span>
                  </div>
                )}

                {res.agreement && (
                  <div className="grid grid-cols-3 items-center gap-4 bg-muted/40 p-3 rounded-lg border">
                    <span className="font-semibold text-xs">{t.billing}:</span>
                    <div className="col-span-2 text-xs space-y-1">
                      {res.agreement.prices?.total ? (
                        <p className="font-bold text-emerald-700">
                          {t.rentalCost}: {Number(res.agreement.prices.total).toFixed(2)} €
                          {res.agreement.prices.daily ? ` (${res.agreement.prices.daily} €/${t.day})` : ''}
                        </p>
                      ) : null}
                      {(res.agreement.deposits?.total || res.agreement.deposits?.general) ? (
                        <p className="text-muted-foreground font-medium">
                          {t.deposit}: {res.agreement.deposits.total || res.agreement.deposits.general} € ({res.agreement.paymentMethod || 'BAR'})
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}

                {res.history && res.history.length > 0 && (
                  <div className="mt-6">
                     <div className="p-3 bg-muted/50 rounded-lg space-y-2 border border-muted-foreground/10">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.history}</h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                           {res.history.map((entry, idx) => (
                              <div key={entry.id || idx} className="text-[11px] flex items-center gap-2">
                                 <span className="text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-muted-foreground/10 tabular-nums shrink-0">
                                    {format(parseISO(entry.timestamp), "dd.MM.yyyy HH:mm")}
                                 </span>
                                 <div className="flex-1 truncate">
                                    <span className="font-bold text-primary">
                                       {entry.profileName}
                                    </span>
                                    <span className="mx-1 text-muted-foreground">{t.by ? "" : ":"}</span>
                                    <span className="text-foreground">
                                       {typeof t[`action${entry.action}` as keyof typeof t] === 'string' 
                                         ? (t[`action${entry.action}` as keyof typeof t] as string) 
                                         : entry.action}
                                    </span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                )}
              </div>
            );
          })()}
          
          <DialogFooter className="flex sm:justify-between items-center w-full">
            {isEditingReservation ? (
              <>
                <Button variant="destructive" onClick={handleDeleteReservation}>{t.delete}</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditingReservation(false)}>{t.cancel}</Button>
                  <Button onClick={handleUpdateReservation}>{t.saveChanges}</Button>
                </div>
              </>
            ) : (
              <div className="flex sm:justify-between items-center w-full">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleEditClick}>{t.edit}</Button>
                  {(() => {
                    const currentRes = reservations.find(r => r.id === viewingReservationId);
                    if (!currentRes || currentRes.status === "completed" || currentRes.status === "cancelled") {
                      return null;
                    }
                    if (currentRes.status === "active") {
                      return (
                        <Button 
                          className="gap-1.5"
                          onClick={() => {
                            setSelectedReturnReservation(currentRes);
                            setIsViewDialogOpen(false);
                            setIsReturnDialogOpen(true);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {t.markAsCompleted}
                        </Button>
                      );
                    }
                    return (
                      <Button 
                        className="gap-1.5"
                        onClick={() => {
                          setSelectedReleaseReservation(currentRes);
                          setIsViewDialogOpen(false);
                          setIsReleaseDialogOpen(true);
                        }}
                      >
                        <FileSignature className="w-4 h-4" />
                        {t.releaseTrailer}
                      </Button>
                    );
                  })()}
                </div>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>{t.close}</Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent size="compact" className="w-[95vw] sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t.areYouSure}</DialogTitle>
            <DialogDescription>
              {language === 'pl' ? 'Czy na pewno chcesz usunąć tę rezerwację? Zostanie ona przeniesiona do archiwum w zakładce Anulowane.' : language === 'de' ? 'Sind Sie sicher, dass Sie diese Reservierung löschen möchten? Sie wird in das Archiv (Storniert) verschoben.' : 'Are you sure you want to delete this reservation? It will be moved to the archive (Cancelled).'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>{t.cancel}</Button>
            <Button variant="destructive" onClick={confirmDeleteReservation}>{t.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReleaseTrailerDialog 
        reservation={selectedReleaseReservation}
        isOpen={isReleaseDialogOpen}
        onClose={() => {
          setIsReleaseDialogOpen(false);
          setSelectedReleaseReservation(null);
        }}
      />
      <ReturnTrailerDialog 
        reservation={selectedReturnReservation}
        isOpen={isReturnDialogOpen}
        onClose={() => {
          setIsReturnDialogOpen(false);
          setSelectedReturnReservation(null);
        }}
      />

      {/* Database Backup & Restore Modal accessible directly from Calendar */}
      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent className="w-[96vw] sm:w-[94vw] sm:max-w-[94vw] max-h-[94dvh] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Backup System</DialogTitle>
          </DialogHeader>
          <BackupManager />
        </DialogContent>
      </Dialog>
    </div>
  );
}
