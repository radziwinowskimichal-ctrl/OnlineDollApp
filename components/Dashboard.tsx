"use client";
 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/context";
import { isToday, isBefore, addDays, parseISO, compareAsc, format } from "date-fns";
import { AlertTriangle, CalendarCheck, CalendarX, Wrench, ArrowDownLeft, ArrowUpRight, Ban, Truck } from "lucide-react";
import { translations } from "@/lib/translations";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DashboardProps {
  onActionClick?: (action: string) => void;
}

export function Dashboard({ onActionClick }: DashboardProps) {
  const { trailers, reservations, language, updateTrailer } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;
  
  const [isTuvDialogOpen, setIsTuvDialogOpen] = useState(false);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [editingTrailer, setEditingTrailer] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() + 2);

  const handleQuickEdit = (trailer: any) => {
    setEditingTrailer(trailer);
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear() + 2);
    setIsQuickEditOpen(true);
  };

  const handleSaveTuv = () => {
    if (!editingTrailer) return;
    const newTuvDate = new Date(selectedYear, selectedMonth, 1, 12, 0, 0);
    const updated = {
      ...editingTrailer,
      tuvExpiry: newTuvDate.toISOString(),
    };
    updateTrailer(updated);
    setIsQuickEditOpen(false);
    toast.success(t.tuvUpdated);
  };

  const today = new Date();
  
  const todayPickups = reservations.filter(r => isToday(parseISO(r.startDate)) && r.status !== "completed" && r.status !== "cancelled");
  const todayReturns = reservations.filter(r => isToday(parseISO(r.endDate)) && r.status !== "completed" && r.status !== "cancelled");
  const inService = trailers.filter(t => t.status === "service");
  
  const upcomingTuv = trailers.filter(t => {
    if (!t.tuvExpiry) return false;
    const tuvDate = parseISO(t.tuvExpiry);
    return isBefore(tuvDate, addDays(today, 30));
  });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 px-4 overflow-visible">
      {/* Pickups Card */}
      <Card 
        className="group relative cursor-pointer transition-all hover:scale-[1.02] border-none bg-white shadow-xl shadow-blue-900/5 h-36" 
        onClick={() => onActionClick?.("daily")}
      >
        <div className="absolute inset-0 bg-blue-50/50 rounded-xl" />
        <CardContent className="relative h-full p-6 flex items-center justify-between overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-900">{t.pickups}</span>
            <div className="text-4xl font-black text-blue-950">{todayPickups.length}</div>
            <p className="text-[8px] font-bold uppercase tracking-tighter text-blue-800/60">
              {t.pickupsToday}
            </p>
          </div>
          <div className="relative">
             <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full" />
             <div className="relative flex items-end gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
                <Truck className="w-12 h-12 text-blue-600" />
                <ArrowDownLeft className="w-8 h-8 text-blue-600 -ml-4 mb-2" />
             </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Returns Card */}
      <Card 
        className="group relative cursor-pointer transition-all hover:scale-[1.02] border-none bg-white shadow-xl shadow-emerald-900/5 h-36"
        onClick={() => onActionClick?.("daily")}
      >
        <div className="absolute inset-0 bg-emerald-50/50 rounded-xl" />
        <CardContent className="relative h-full p-6 flex items-center justify-between overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900">{t.returns}</span>
            <div className="text-4xl font-black text-emerald-950">{todayReturns.length}</div>
            <p className="text-[8px] font-bold uppercase tracking-tighter text-emerald-800/60">
              {t.returnsToday}
            </p>
          </div>
          <div className="relative flex items-end gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
            <Truck className="w-12 h-12 text-emerald-600" />
            <ArrowUpRight className="w-8 h-8 text-emerald-600 -ml-4 mb-2" />
          </div>
        </CardContent>
      </Card>

      {/* In Service Card */}
      <Card 
        className="group relative cursor-pointer transition-all hover:scale-[1.02] border-none bg-white shadow-xl shadow-sky-900/5 h-36"
        onClick={() => onActionClick?.("trailers")}
      >
        <div className="absolute inset-0 bg-sky-50/50 rounded-xl" />
        <CardContent className="relative h-full p-6 flex items-center justify-between overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-900">{t.service}</span>
            <div className="text-4xl font-black text-sky-950">{inService.length}</div>
            <p className="text-[8px] font-bold tracking-tighter text-sky-800/60 uppercase">
              {inService.map(t => t.plate || t.model || t.type).join(", ").slice(0, 20) || t.none}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-30 group-hover:opacity-50 transition-opacity rotate-[-10deg]">
            <Wrench className="w-10 h-10 text-sky-600" />
            <Truck className="w-12 h-12 text-sky-600 -ml-2" />
          </div>
        </CardContent>
      </Card>

      {/* TÜV Card */}
      <Card 
        className="group relative cursor-pointer transition-all hover:scale-[1.05] border-none bg-white shadow-[0_15px_60px_-15px_rgba(239,68,68,0.4)] h-36 border-2 border-rose-500/20"
        onClick={() => setIsTuvDialogOpen(true)}
      >
        <div className="absolute inset-0 bg-rose-50 rounded-xl" />
        <CardContent className="relative h-full p-6 flex items-center justify-between overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-900">{t.tuvWarning}</span>
            <div className="text-4xl font-black text-rose-600 drop-shadow-sm">{upcomingTuv.length}</div>
            <p className="text-[8px] font-bold uppercase tracking-tighter text-rose-800/60">
              {t.within30Days}
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full animate-pulse" />
            <div className="relative">
              <AlertTriangle className="w-12 h-12 text-rose-600" />
              <Ban className="w-6 h-6 text-rose-700 absolute -bottom-1 -right-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isTuvDialogOpen} onOpenChange={setIsTuvDialogOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t.tuvExpiring}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-x-auto mt-4 max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.plate}</TableHead>
                  <TableHead>{t.model}</TableHead>
                  <TableHead>{t.type}</TableHead>
                  <TableHead>{t.vin}</TableHead>
                  <TableHead>{t.tuvExpiry}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.notes}</TableHead>
                  <TableHead className="text-right">{t.actionLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...trailers]
                  .filter(t => t.tuvExpiry)
                  .sort((a, b) => compareAsc(parseISO(a.tuvExpiry!), parseISO(b.tuvExpiry!)))
                  .map((trailer) => {
                   const isExpired = isBefore(parseISO(trailer.tuvExpiry!), today);
                   const isExpiringSoon = isBefore(parseISO(trailer.tuvExpiry!), addDays(today, 30));
                   return (
                     <TableRow key={trailer.id}>
                       <TableCell className="font-medium whitespace-nowrap">
                         {trailer.plate || <span className="italic text-muted-foreground">{t.noPlate}</span>}
                       </TableCell>
                       <TableCell className="max-w-[150px] truncate" title={trailer.model}>{trailer.model || "-"}</TableCell>
                       <TableCell className="max-w-[200px] truncate" title={t.trailerTypes[trailer.type as keyof typeof t.trailerTypes] || trailer.type}>
                        {t.trailerTypes[trailer.type as keyof typeof t.trailerTypes] || trailer.type}
                       </TableCell>
                       <TableCell className="font-mono text-xs">{trailer.vin || "-"}</TableCell>
                       <TableCell className={`whitespace-nowrap ${isExpired ? "text-destructive font-bold" : isExpiringSoon ? "text-amber-500 font-medium" : ""}`}>
                         {format(parseISO(trailer.tuvExpiry!), "dd.MM.yyyy")}
                       </TableCell>
                       <TableCell>
                         <Badge variant={trailer.status === "available" ? "default" : "destructive"}>
                           {trailer.status === "available" ? t.available : t.service}
                         </Badge>
                       </TableCell>
                       <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                        {trailer.notes || "-"}
                       </TableCell>
                       <TableCell className="text-right whitespace-nowrap">
                         <Button
                           variant="outline"
                           size="sm"
                           className="h-7 px-2 font-black text-[10px] uppercase tracking-wider text-primary border-primary/20 hover:bg-primary/5 transition-colors gap-1"
                           onClick={() => handleQuickEdit(trailer)}
                         >
                           <Wrench className="w-3 h-3" />
                           {t.quickEdit}
                         </Button>
                       </TableCell>
                     </TableRow>
                   );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* TUV Quick Edit Circular Calendar Dialog */}
      <Dialog open={isQuickEditOpen} onOpenChange={setIsQuickEditOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {t.tuvQuickEditTitle}
            </DialogTitle>
            <div className="text-sm text-slate-500 mt-1">
              {editingTrailer?.plate} - {editingTrailer?.model || t.trailer}
            </div>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-64 h-64 rounded-full bg-slate-50/50 border border-slate-200 shadow-inner flex items-center justify-center select-none">
              {/* Year & Month Selection Center */}
              <div className="absolute flex flex-col items-center justify-center z-20 bg-white border border-slate-200 shadow-md rounded-full w-28 h-28 text-center">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  {t.year}
                </span>
                <div className="flex items-center gap-2 my-1">
                  <button 
                    type="button" 
                    onClick={() => setSelectedYear(prev => prev - 1)} 
                    className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600 font-bold text-sm"
                  >
                    &larr;
                  </button>
                  <span className="font-black text-base text-slate-800">{selectedYear}</span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedYear(prev => prev + 1)} 
                    className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600 font-bold text-sm"
                  >
                    &rarr;
                  </button>
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                  {language === "pl" 
                    ? ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"][selectedMonth] 
                    : language === "de"
                    ? ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"][selectedMonth]
                    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][selectedMonth]
                  }
                </span>
              </div>

              {/* 12 Months layout in a circle */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const x = Math.round(Math.cos(angle) * 88);
                const y = Math.round(Math.sin(angle) * 88);
                const isSelected = selectedMonth === i;
                const monthNamesPl = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrze", "Paź", "Lis", "Gru"];
                const monthNamesDe = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
                const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const monthLabel = language === "pl" ? monthNamesPl[i] : language === "de" ? monthNamesDe[i] : monthNamesEn[i];

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedMonth(i)}
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      left: "50%",
                      top: "50%",
                    }}
                    className={`absolute rounded-full w-10 h-10 flex items-center justify-center text-[11px] font-black tracking-tighter uppercase transition-all duration-200 border ${
                      isSelected
                        ? "bg-primary text-white border-primary scale-110 shadow-lg shadow-primary/20 z-10"
                        : "bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50 hover:scale-105"
                    }`}
                  >
                    {monthLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsQuickEditOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSaveTuv}>
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
