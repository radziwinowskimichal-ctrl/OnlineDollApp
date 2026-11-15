"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/context";
import { Reservation, Client, RentalAgreement } from "@/lib/store";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Printer, Calculator } from "lucide-react";
import { PrintableAgreement } from "./PrintableAgreement";
import { printDocument } from "@/lib/print";

import { translations } from "@/lib/translations";

interface ReleaseTrailerDialogProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReleaseTrailerDialog({ reservation, isOpen, onClose }: ReleaseTrailerDialogProps) {
  const { clients, trailers, updateClient, updateReservation, language } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;
  const [client, setClient] = useState<Client | null>(null);
  const [agreement, setAgreement] = useState<RentalAgreement>({
    pickupTime: format(new Date(), "HH:mm"),
    returnTime: "12:00",
    prices: { daily: 0, weekend: 0, weekly: 0, total: 0 },
    deposits: { lock: false, straps: false, adapter: false, registration: false, general: 0, total: 0 },
    paymentMethod: "BAR"
  });
  const [pickupPhotos, setPickupPhotos] = useState<string[]>([]);

  // Key tracking so background data polling (fetchData every 2s) DOES NOT wipe user inputs
  const initializedKeyRef = useRef<string | null>(null);

  // Compute rental duration in days
  const rentalDays = (() => {
    if (!reservation?.startDate || !reservation?.endDate) return 1;
    try {
      const start = parseISO(reservation.startDate);
      const end = parseISO(reservation.endDate);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
    } catch {
      return 1;
    }
  })();

  const isPrivate = client ? client.type !== "company" : true;

  useEffect(() => {
    if (isOpen && reservation) {
      const currentKey = `${reservation.id}-${isOpen}`;
      // Only re-initialize if the dialog was closed or reservation ID changed
      if (initializedKeyRef.current !== currentKey) {
        initializedKeyRef.current = currentKey;

        setTimeout(() => {
          const c = clients.find(cl => cl.id === reservation.clientId);
          if (c) {
            setClient({ ...c });
          } else {
            setClient({ id: reservation.clientId, name: "", balance: 0, notes: "", type: "private" });
          }

          const clientIsPrivate = c ? c.type !== "company" : true;
          const defaultGeneralDeposit = clientIsPrivate ? 200 : 1000;
          const defaultPaymentMethod = "BAR";

          let days = 1;
          try {
            const s = parseISO(reservation.startDate);
            const e = parseISO(reservation.endDate);
            days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
          } catch {
            days = 1;
          }

          if (reservation.agreement) {
            const ag = reservation.agreement;
            const daily = ag.prices?.daily;
            const existingTotal = ag.prices?.total;
            const calculatedTotal = (existingTotal !== undefined && existingTotal !== null && existingTotal > 0)
              ? existingTotal
              : (daily && daily > 0 ? Math.round(daily * days * 100) / 100 : 0);

            const generalDeposit = ag.deposits?.general !== undefined && ag.deposits?.general !== null && (clientIsPrivate || ag.deposits.general > 0)
              ? ag.deposits.general
              : defaultGeneralDeposit;

            setAgreement({
              pickupTime: ag.pickupTime || format(new Date(), "HH:mm"),
              returnTime: ag.returnTime || "12:00",
              prices: {
                daily: daily ?? 0,
                weekend: ag.prices?.weekend ?? 0,
                weekly: ag.prices?.weekly ?? 0,
                total: calculatedTotal
              },
              deposits: {
                lock: !!ag.deposits?.lock,
                straps: !!ag.deposits?.straps,
                adapter: !!ag.deposits?.adapter,
                registration: !!ag.deposits?.registration,
                general: generalDeposit,
                total: ag.deposits?.total ?? generalDeposit
              },
              paymentMethod: ag.paymentMethod || defaultPaymentMethod
            });
          } else {
            setAgreement({
              pickupTime: format(new Date(), "HH:mm"),
              returnTime: "12:00",
              prices: { daily: 0, weekend: 0, weekly: 0, total: 0 },
              deposits: {
                lock: false,
                straps: false,
                adapter: false,
                registration: false,
                general: defaultGeneralDeposit,
                total: defaultGeneralDeposit
              },
              paymentMethod: defaultPaymentMethod
            });
          }

          if (reservation.pickupPhotos) {
            setPickupPhotos([...reservation.pickupPhotos]);
          } else {
            setPickupPhotos([]);
          }
        }, 0);
      }
    } else if (!isOpen) {
      initializedKeyRef.current = null;
    }
  }, [isOpen, reservation, clients]);

  if (!reservation || !client) return null;

  const trailer = trailers.find(t => t.id === reservation.trailerId);

  const handleDailyPriceChange = (valStr: string) => {
    const dailyVal = valStr === "" ? 0 : parseFloat(valStr) || 0;
    const computedTotal = dailyVal > 0 ? Math.round(dailyVal * rentalDays * 100) / 100 : 0;
    setAgreement(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        daily: valStr === "" ? undefined : dailyVal,
        total: computedTotal
      }
    }));
  };

  const handleWeekendPriceChange = (valStr: string) => {
    const val = valStr === "" ? 0 : parseFloat(valStr) || 0;
    setAgreement(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        weekend: valStr === "" ? undefined : val,
        total: val > 0 ? val : prev.prices?.total
      }
    }));
  };

  const handleWeeklyPriceChange = (valStr: string) => {
    const val = valStr === "" ? 0 : parseFloat(valStr) || 0;
    setAgreement(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        weekly: valStr === "" ? undefined : val,
        total: val > 0 ? val : prev.prices?.total
      }
    }));
  };

  const handleTotalPriceChange = (valStr: string) => {
    const val = valStr === "" ? 0 : parseFloat(valStr) || 0;
    setAgreement(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        total: valStr === "" ? undefined : val
      }
    }));
  };

  const recalculateTotal = () => {
    const daily = agreement.prices?.daily || 0;
    if (daily > 0) {
      const computedTotal = Math.round(daily * rentalDays * 100) / 100;
      setAgreement(prev => ({
        ...prev,
        prices: {
          ...prev.prices,
          total: computedTotal
        }
      }));
      toast.info(
        language === "pl" 
          ? `Przeliczono kwotę: ${computedTotal} € (${rentalDays} ${rentalDays === 1 ? "dzień" : "dni"})` 
          : language === "de"
          ? `Neu berechnet: ${computedTotal} € (${rentalDays} ${rentalDays === 1 ? "Tag" : "Tage"})`
          : `Recalculated amount: ${computedTotal} € (${rentalDays} ${rentalDays === 1 ? "day" : "days"})`
      );
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPickupPhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPickupPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotalDeposit = () => {
    const gen = agreement.deposits?.general !== undefined && agreement.deposits?.general !== null
      ? Number(agreement.deposits.general)
      : (isPrivate ? 200 : 0);
    let total = gen;
    if (agreement.deposits?.lock) total += 35;
    if (agreement.deposits?.straps) total += 60;
    if (agreement.deposits?.adapter) total += 17;
    if (agreement.deposits?.registration) total += 200;
    return total;
  };

  const handleSave = () => {
    // Update client with new details
    if (client) {
      updateClient(client);
    }
    
    const computedTotalDeposit = calculateTotalDeposit();
    const effectiveGeneralDeposit = agreement.deposits?.general !== undefined && agreement.deposits?.general !== null
      ? Number(agreement.deposits.general)
      : (isPrivate ? 200 : 1000);

    const effectiveTotal = agreement.prices?.total !== undefined && agreement.prices?.total !== null && agreement.prices.total > 0
      ? agreement.prices.total
      : (agreement.prices?.daily ? Math.round(agreement.prices.daily * rentalDays * 100) / 100 : 0);

    const finalAgreement: RentalAgreement = {
      ...agreement,
      prices: {
        daily: agreement.prices?.daily || 0,
        weekend: agreement.prices?.weekend || 0,
        weekly: agreement.prices?.weekly || 0,
        total: effectiveTotal,
      },
      deposits: {
        ...agreement.deposits,
        general: effectiveGeneralDeposit,
        total: computedTotalDeposit,
      },
      paymentMethod: agreement.paymentMethod || "BAR",
    };

    // Update reservation with agreement and set status to active
    updateReservation({
      ...reservation,
      status: "active",
      agreement: finalAgreement,
      pickupPhotos,
    }, "released");

    toast.success(t.trailerReleased);
    onClose();
  };

  const handlePrint = () => {
    const success = printDocument('print-area', t.printAgreementTitle || 'Umowa_Wydanie');
    if (!success) {
      toast.error(t.printDocumentNotFound || t.popupBlockedError);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[96vw] sm:w-[94vw] sm:max-w-[94vw] max-h-[94dvh]">
          <DialogHeader>
            <DialogTitle>{t.releaseTrailerTitle}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Client Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-lg">{t.tenantDetails}</h3>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={isPrivate ? "default" : "outline"}
                  className="h-7 text-xs px-2.5 font-medium"
                  onClick={() => {
                    setClient({ ...client, type: "private" });
                    setAgreement(prev => ({
                      ...prev,
                      deposits: {
                        ...prev.deposits,
                        general: prev.deposits?.general && prev.deposits.general > 0 ? prev.deposits.general : 200
                      },
                      paymentMethod: "BAR"
                    }));
                    toast.info(
                      language === "pl" 
                        ? "Ustawiono klienta prywatnego: automatyczna kaucja 200 € gotówką" 
                        : language === "de"
                        ? "Privatkunde gewählt: automatische Kaution 200 € in bar"
                        : "Private client selected: automatic deposit 200 € cash"
                    );
                  }}
                >
                  {t.privatePerson}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!isPrivate ? "default" : "outline"}
                  className="h-7 text-xs px-2.5 font-medium"
                  onClick={() => {
                    setClient({ ...client, type: "company" });
                    setAgreement(prev => ({
                      ...prev,
                      deposits: {
                        ...prev.deposits,
                        general: 1000
                      }
                    }));
                    toast.info(
                      language === "pl" 
                        ? "Ustawiono klienta firmowego: automatyczna kaucja 1000 €" 
                        : language === "de"
                        ? "Firmenkunde gewählt: automatische Kaution 1000 €"
                        : "Corporate client selected: automatic deposit 1000 €"
                    );
                  }}
                >
                  {t.company}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>{t.fullName} / {t.companyName}</Label>
                <Input value={client.name} onChange={e => setClient({...client, name: e.target.value})} />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label>{t.streetAndNumber}</Label>
                <Input value={client.address || ''} onChange={e => setClient({...client, address: e.target.value})} placeholder={t.exampleAddress} />
              </div>

              <div className="space-y-2">
                <Label>{t.phone}</Label>
                <Input value={client.phone || ''} onChange={e => setClient({...client, phone: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>{t.email}</Label>
                <Input value={client.email || ''} onChange={e => setClient({...client, email: e.target.value})} />
              </div>
            </div>

            <h4 className="font-medium mt-4">{t.drivingLicense}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.category}</Label>
                <Input value={client.driverLicenseClass || ''} onChange={e => setClient({...client, driverLicenseClass: e.target.value})} placeholder={t.exampleLicense} />
              </div>
              <div className="space-y-2">
                <Label>{t.issueDate}</Label>
                <Input type="date" value={client.driverLicenseIssueDate || ''} onChange={e => setClient({...client, driverLicenseIssueDate: e.target.value})} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{t.issuePlace}</Label>
                <Input value={client.driverLicenseIssuePlace || ''} onChange={e => setClient({...client, driverLicenseIssuePlace: e.target.value})} />
              </div>
            </div>

            <h4 className="font-medium mt-4">{t.idCard}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.documentNumber}</Label>
                <Input value={client.idCardNumber || ''} onChange={e => setClient({...client, idCardNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t.validUntil}</Label>
                <Input type="date" value={client.idCardExpiry || ''} onChange={e => setClient({...client, idCardExpiry: e.target.value})} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{t.issuePlace}</Label>
                <Input value={client.idCardIssuePlace || ''} onChange={e => setClient({...client, idCardIssuePlace: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Rental Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">{t.reservationDetails}</h3>
            
            <div className="bg-muted p-3 rounded-md mb-4">
              <p className="font-medium">{t.trailer}: {trailer?.plate}</p>
              <p className="text-sm text-muted-foreground">
                {(t.trailerTypes as any)[trailer?.type || ""] || trailer?.type} | {trailer?.capacity} | {trailer?.dimensions}
              </p>
              {trailer && (() => {
                const typeStr = trailer.type.toString();
                const isLaweta = typeStr.includes("Laweta") || typeStr.includes("carTransporter");
                const capStr = trailer.capacity?.toLowerCase() || "0";
                const num = parseFloat(capStr.replace(/[^0-9.]/g, "") || "0");
                const isTon = capStr.includes("t");
                const weightInKg = isTon ? num * 1000 : num;
                const requiresBE = isLaweta || weightInKg > 750;

                if (!requiresBE) return null;

                const clientHasBE = client.driverLicenseClass?.toLowerCase().includes("be") || client.driverLicenseClass?.toLowerCase().includes("b+e") || client.driverLicenseClass?.toLowerCase().includes("ce");

                return (
                  <div className={`mt-2 p-2 rounded-sm border text-sm font-semibold ${clientHasBE ? 'text-green-700 bg-green-50 border-green-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                    {clientHasBE 
                      ? t.licenseHasBE
                      : t.licenseRequiresBE}
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.pickupDateTime}</Label>
                <div className="flex gap-2">
                  <Input type="date" value={reservation.startDate.split('T')[0]} disabled />
                  <Input type="time" value={agreement.pickupTime} onChange={e => setAgreement({...agreement, pickupTime: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.returnDateTime}</Label>
                <div className="flex gap-2">
                  <Input type="date" value={reservation.endDate.split('T')[0]} disabled />
                  <Input type="time" value={agreement.returnTime} onChange={e => setAgreement({...agreement, returnTime: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 mb-2">
              <h4 className="font-medium">{t.fees}</h4>
              <Badge variant="secondary" className="font-mono text-xs font-semibold px-2">
                {language === "pl" 
                  ? `Czas trwania: ${rentalDays} ${rentalDays === 1 ? "dzień" : "dni"}` 
                  : language === "de"
                  ? `Mietdauer: ${rentalDays} ${rentalDays === 1 ? "Tag" : "Tage"}`
                  : `Duration: ${rentalDays} ${rentalDays === 1 ? "day" : "days"}`}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{t.pricePerDay}</Label>
                <Input 
                  type="number" 
                  step="any"
                  placeholder="0.00"
                  value={agreement.prices?.daily !== undefined && agreement.prices?.daily !== null && agreement.prices?.daily !== 0 ? agreement.prices.daily : (agreement.prices?.daily === 0 ? '' : '')} 
                  onChange={e => handleDailyPriceChange(e.target.value)} 
                />
                <p className="text-[10px] text-muted-foreground">
                  {agreement.prices?.daily 
                    ? `${agreement.prices.daily} € × ${rentalDays} ${language === 'pl' ? (rentalDays === 1 ? 'dzień' : 'dni') : language === 'de' ? (rentalDays === 1 ? 'Tag' : 'Tage') : (rentalDays === 1 ? 'day' : 'days')} = ${(agreement.prices.daily * rentalDays).toFixed(2)} €` 
                    : (language === 'pl' ? 'Wpisz stawkę dzienną do automatycznego obliczenia' : language === 'de' ? 'Tagespreis eingeben zur automatischen Berechnung' : 'Enter daily rate for automatic calculation')}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t.pricePerWeekend}</Label>
                <Input 
                  type="number" 
                  step="any"
                  placeholder="0.00"
                  value={agreement.prices?.weekend !== undefined && agreement.prices?.weekend !== null && agreement.prices?.weekend !== 0 ? agreement.prices.weekend : ''} 
                  onChange={e => handleWeekendPriceChange(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t.pricePerWeek}</Label>
                <Input 
                  type="number" 
                  step="any"
                  placeholder="0.00"
                  value={agreement.prices?.weekly !== undefined && agreement.prices?.weekly !== null && agreement.prices?.weekly !== 0 ? agreement.prices.weekly : ''} 
                  onChange={e => handleWeeklyPriceChange(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                <div className="flex justify-between items-center">
                  <Label className="font-bold text-emerald-800 text-xs">{t.totalGrossPrice}</Label>
                  {agreement.prices?.daily ? (
                    <button
                      type="button"
                      onClick={recalculateTotal}
                      className="text-[10px] text-emerald-700 underline font-semibold hover:text-emerald-900 inline-flex items-center gap-0.5"
                    >
                      <Calculator className="w-2.5 h-2.5" />
                      {language === 'pl' ? 'Przelicz z dni' : language === 'de' ? 'Aus Tagen berechnen' : 'Calculate from days'}
                    </button>
                  ) : null}
                </div>
                <Input 
                  type="number" 
                  step="any"
                  placeholder="0.00"
                  className="font-bold text-base bg-white border-emerald-300 text-emerald-950 focus-visible:ring-emerald-500" 
                  value={agreement.prices?.total !== undefined && agreement.prices?.total !== null && agreement.prices?.total !== 0 ? agreement.prices.total : ''} 
                  onChange={e => handleTotalPriceChange(e.target.value)} 
                />
                <p className="text-[10px] text-emerald-700 font-medium">
                  {agreement.prices?.total 
                    ? `${Number(agreement.prices.total).toFixed(2)} € brutto` 
                    : (language === 'pl' ? 'Obliczana automatycznie lub wpisz ręcznie' : language === 'de' ? 'Automatisch berechnet oder manuell eingeben' : 'Calculated automatically or enter manually')}
                </p>
              </div>
            </div>

            <h4 className="font-medium mt-4">{t.depositAndAddons}</h4>
            <div className="space-y-3 bg-muted/50 p-4 rounded-md">
              {isPrivate ? (
                <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      {t.privateDepositBanner}
                    </span>
                    <p className="text-[11px] text-amber-700 font-medium">
                      {language === "pl" ? "Kaucja płatna w gotówce (BAR)" : language === "de" ? "Kaution in bar zu hinterlegen (BAR)" : "Deposit payable in cash (BAR)"}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-bold px-2 py-0.5">
                    200 € BAR
                  </Badge>
                </div>
              ) : (
                <div className="p-2.5 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                      {t.b2bDepositBanner}
                    </span>
                    <p className="text-[11px] text-blue-700 font-medium">
                      {language === "pl" ? "Domyślna kaucja zabezpieczająca dla firm: 1000 €" : language === "de" ? "Standardmäßige Kaution für Firmen: 1000 €" : "Standard security deposit for companies: 1000 €"}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-900 border-blue-300 font-bold px-2 py-0.5">
                    1000 €
                  </Badge>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox id="lock" checked={agreement.deposits?.lock} onCheckedChange={(c) => setAgreement({...agreement, deposits: {...agreement.deposits, lock: !!c}})} />
                <Label htmlFor="lock" className="flex-1 cursor-pointer">{t.antiTheftLock}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="straps" checked={agreement.deposits?.straps} onCheckedChange={(c) => setAgreement({...agreement, deposits: {...agreement.deposits, straps: !!c}})} />
                <Label htmlFor="straps" className="flex-1 cursor-pointer">{t.transportStraps}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="adapter" checked={agreement.deposits?.adapter} onCheckedChange={(c) => setAgreement({...agreement, deposits: {...agreement.deposits, adapter: !!c}})} />
                <Label htmlFor="adapter" className="flex-1 cursor-pointer">{t.adapter}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="registration" checked={agreement.deposits?.registration} onCheckedChange={(c) => setAgreement({...agreement, deposits: {...agreement.deposits, registration: !!c}})} />
                <Label htmlFor="registration" className="flex-1 cursor-pointer">{t.registrationDocument}</Label>
              </div>

              <div className="space-y-1.5 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t.otherDeposit} / Kaution</Label>
                    <span className="block text-[10px] text-muted-foreground font-medium">
                      {isPrivate ? t.defaultCashDeposit : t.defaultCompanyDeposit}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input 
                      type="number" 
                      step="any"
                      value={agreement.deposits?.general !== undefined && agreement.deposits?.general !== null ? agreement.deposits.general : (isPrivate ? 200 : 1000)} 
                      onChange={e => {
                        const val = e.target.value;
                        const num = val === '' ? 0 : parseFloat(val) || 0;
                        setAgreement(prev => ({
                          ...prev, 
                          deposits: { 
                            ...prev.deposits, 
                            general: num 
                          }
                        }));
                      }} 
                      className="w-32 font-bold text-right" 
                    />
                    <span className="text-sm font-bold">€</span>
                  </div>
                </div>
                <div className="flex gap-1 justify-end pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setAgreement(prev => ({ ...prev, deposits: { ...prev.deposits, general: isPrivate ? 200 : 1000 } }))}
                  >
                    {isPrivate ? "Auto: 200 €" : "Auto B2B: 1000 €"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setAgreement(prev => ({ ...prev, deposits: { ...prev.deposits, general: 0 } }))}
                  >
                    0 €
                  </Button>
                </div>
              </div>

              <div className="flex justify-between font-bold pt-2 border-t text-sm">
                <span>{t.totalDeposit}</span>
                <span className="text-primary font-mono text-base">{calculateTotalDeposit()} €</span>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <Label>{t.paymentMethod}</Label>
                {isPrivate && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {language === "pl" ? "Klient prywatny: Gotówka (BAR)" : language === "de" ? "Privatkunde: Barzahlung (BAR)" : "Private client: Cash (BAR)"}
                  </span>
                )}
              </div>
              <Select value={agreement.paymentMethod || "BAR"} onValueChange={(v: any) => setAgreement({...agreement, paymentMethod: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAR">{t.cash}</SelectItem>
                  <SelectItem value="EC-Karte">{t.debitCard}</SelectItem>
                  <SelectItem value="Kreditkarte">{t.creditCard}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <h4 className="font-medium mt-6 border-b pb-2">{t.visualDocumentationPickup}</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer">
                  {t.addPhoto}
                  <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotoUpload} />
                </label>
                <span className="text-sm text-muted-foreground">{pickupPhotos.length} {t.photosCount}</span>
              </div>
              
              {pickupPhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {pickupPhotos.map((photo, i) => (
                    <div key={i} className="relative aspect-square rounded overflow-hidden border">
                      <Image src={photo} alt={`Pickup photo ${i+1}`} width={200} height={200} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-between sm:justify-between w-full">
          <Button variant="secondary" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            {t.printAgreement}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
            <Button onClick={handleSave}>{t.saveAndRelease}</Button>
          </div>
        </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {trailer && isOpen && (
        <PrintableAgreement 
          reservation={reservation}
          client={client}
          trailer={trailer}
          agreement={agreement}
        />
      )}
    </>
  );
}
