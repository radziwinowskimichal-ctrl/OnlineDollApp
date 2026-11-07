"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translations } from "@/lib/translations";
import { DynamicText } from "@/components/DynamicText";
import {
  Plus,
  Edit,
  Search,
  Building2,
  User as UserIcon,
  AlertCircle,
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Crown,
  Ban,
  ShieldCheck,
  Percent,
  CheckCircle2,
  DollarSign,
  Calendar,
  Truck,
  ArrowUpDown
} from "lucide-react";
import { Client, Reservation } from "@/lib/store";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export function ClientList() {
  const { clients, reservations, trailers, addClient, updateClient, deleteClient, updateClientBalance, language } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "private" | "company" | "active" | "vip" | "debt" | "blocked">("all");
  const [sortBy, setSortBy] = useState<"name" | "balance_asc" | "balance_desc" | "reservations">("name");

  // Create / Edit Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<"basic" | "address" | "documents" | "finances">("basic");

  // Form inputs
  const [name, setName] = useState("");
  const [type, setType] = useState<"private" | "company">("private");
  const [nip, setNip] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"active" | "vip" | "blocked">("active");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  // Address
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Polska");
  const [manualAddress, setManualAddress] = useState("");

  // Documents & License
  const [driverLicenseClass, setDriverLicenseClass] = useState("B, B+E");
  const [driverLicenseNumber, setDriverLicenseNumber] = useState("");
  const [driverLicenseIssueDate, setDriverLicenseIssueDate] = useState("");
  const [driverLicenseIssuePlace, setDriverLicenseIssuePlace] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [idCardExpiry, setIdCardExpiry] = useState("");
  const [idCardIssuePlace, setIdCardIssuePlace] = useState("");

  // Finances & Notes
  const [balance, setBalance] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Details Modal state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);

  // Quick Balance Modal state
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [clientForBalance, setClientForBalance] = useState<Client | null>(null);
  const [balanceAdjustmentAmount, setBalanceAdjustmentAmount] = useState<string>("");
  const [balanceAdjustmentType, setBalanceAdjustmentType] = useState<"add" | "subtract">("add");

  // Delete Dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Filter clients
  const filteredClients = clients.filter(c => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(search) ||
      (c.email && c.email.toLowerCase().includes(search)) ||
      (c.phone && c.phone.includes(search)) ||
      (c.phone2 && c.phone2.includes(search)) ||
      (c.nip && c.nip.toLowerCase().includes(search)) ||
      (c.city && c.city.toLowerCase().includes(search)) ||
      (c.address && c.address.toLowerCase().includes(search)) ||
      (c.notes && c.notes.toLowerCase().includes(search));

    if (!matchesSearch) return false;

    if (filterType === "private") return c.type === "private";
    if (filterType === "company") return c.type === "company";
    if (filterType === "vip") return c.status === "vip";
    if (filterType === "blocked") return c.status === "blocked";
    if (filterType === "debt") return c.balance < 0;
    if (filterType === "active") {
      return reservations.some(r => r.clientId === c.id && (r.status === "active" || r.status === "paid" || r.status === "invoiced"));
    }

    return true;
  });

  // Sort clients
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name, "pl");
    }
    if (sortBy === "balance_asc") {
      return a.balance - b.balance;
    }
    if (sortBy === "balance_desc") {
      return b.balance - a.balance;
    }
    if (sortBy === "reservations") {
      const countA = reservations.filter(r => r.clientId === a.id).length;
      const countB = reservations.filter(r => r.clientId === b.id).length;
      return countB - countA;
    }
    return 0;
  });

  // Summary statistics
  const totalClients = clients.length;
  const companyClients = clients.filter(c => c.type === "company").length;
  const privateClients = clients.filter(c => c.type !== "company").length;
  const vipClients = clients.filter(c => c.status === "vip").length;
  const debtors = clients.filter(c => c.balance < 0);
  const totalDebt = debtors.reduce((acc, c) => acc + Math.abs(c.balance), 0);
  const activeRentalsCount = reservations.filter(r => r.status === "active").length;

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setName(client.name || "");
      setType(client.type || "private");
      setNip(client.nip || "");
      setContactPerson(client.contactPerson || "");
      setPhone(client.phone || "");
      setPhone2(client.phone2 || "");
      setEmail(client.email || "");
      setStatus(client.status || "active");
      setDiscountPercent(client.discountPercent || 0);

      setStreet(client.street || "");
      setPostalCode(client.postalCode || "");
      setCity(client.city || "");
      setCountry(client.country || "Polska");
      setManualAddress(client.address || "");

      setDriverLicenseClass(client.driverLicenseClass || "B, B+E");
      setDriverLicenseNumber(client.driverLicenseIssuePlace ? "" : "");
      setDriverLicenseIssueDate(client.driverLicenseIssueDate || "");
      setDriverLicenseIssuePlace(client.driverLicenseIssuePlace || "");
      setIdCardNumber(client.idCardNumber || "");
      setIdCardExpiry(client.idCardExpiry || "");
      setIdCardIssuePlace(client.idCardIssuePlace || "");

      setBalance(client.balance || 0);
      setNotes(client.notes || "");
    } else {
      setEditingClient(null);
      setName("");
      setType("private");
      setNip("");
      setContactPerson("");
      setPhone("");
      setPhone2("");
      setEmail("");
      setStatus("active");
      setDiscountPercent(0);

      setStreet("");
      setPostalCode("");
      setCity("");
      setCountry("Polska");
      setManualAddress("");

      setDriverLicenseClass("B, B+E");
      setDriverLicenseNumber("");
      setDriverLicenseIssueDate("");
      setDriverLicenseIssuePlace("");
      setIdCardNumber("");
      setIdCardExpiry("");
      setIdCardIssuePlace("");

      setBalance(0);
      setNotes("");
    }
    setActiveFormTab("basic");
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t.provideClientName);
      return;
    }

    if (type === "company" && nip && nip.replace(/[^0-9]/g, "").length < 9) {
      toast.warning(language === "pl" ? "Wpisany NIP wydaje się za krótki" : "Die USt-IdNr. scheint zu kurz zu sein");
    }

    // Compose formatted address if street or city provided
    let combinedAddress = manualAddress.trim();
    if (!combinedAddress && (street || city)) {
      const parts = [];
      if (street) parts.push(street.trim());
      if (postalCode || city) parts.push(`${postalCode.trim()} ${city.trim()}`.trim());
      if (country && country !== "Polska") parts.push(country.trim());
      combinedAddress = parts.join(", ");
    }

    const clientData: Client = {
      id: editingClient ? editingClient.id : Math.random().toString(36).substring(7),
      name: name.trim(),
      type,
      nip: type === "company" ? nip.trim() : undefined,
      contactPerson: type === "company" ? contactPerson.trim() : undefined,
      phone: phone.trim() || undefined,
      phone2: phone2.trim() || undefined,
      email: email.trim() || undefined,
      status,
      discountPercent: Number(discountPercent) || 0,

      address: combinedAddress || undefined,
      street: street.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      city: city.trim() || undefined,
      country: country.trim() || undefined,

      driverLicenseClass: driverLicenseClass.trim() || undefined,
      driverLicenseIssueDate: driverLicenseIssueDate || undefined,
      driverLicenseIssuePlace: driverLicenseIssuePlace.trim() || undefined,
      idCardNumber: idCardNumber.trim() || undefined,
      idCardExpiry: idCardExpiry || undefined,
      idCardIssuePlace: idCardIssuePlace.trim() || undefined,

      balance: editingClient ? editingClient.balance : Number(balance) || 0,
      notes: notes.trim(),
      createdAt: editingClient?.createdAt || new Date().toISOString(),
    };

    if (editingClient) {
      updateClient(clientData);
      toast.success(language === "pl" ? "Zaktualizowano dane klienta" : t.clientUpdated);
    } else {
      addClient(clientData);
      toast.success(
        language === "pl" 
          ? `Dodano klienta: ${clientData.name} ${type === "company" ? "(kaucja domyślna: 1000 €)" : "(kaucja domyślna: 200 €)"}`
          : t.clientAdded
      );
    }
    setIsDialogOpen(false);
  };

  const handleOpenDetails = (client: Client) => {
    setSelectedClientForDetails(client);
    setIsDetailsOpen(true);
  };

  const handleOpenBalanceDialog = (client: Client) => {
    setClientForBalance(client);
    setBalanceAdjustmentAmount("");
    setBalanceAdjustmentType("add");
    setIsBalanceDialogOpen(true);
  };

  const handleSaveBalanceAdjustment = () => {
    if (!clientForBalance) return;
    const amt = parseFloat(balanceAdjustmentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error(language === "pl" ? "Wpisz poprawną kwotę" : "Bitte gültigen Betrag eingeben");
      return;
    }

    const delta = balanceAdjustmentType === "add" ? amt : -amt;
    updateClientBalance(clientForBalance.id, delta);
    
    toast.success(
      language === "pl"
        ? `${balanceAdjustmentType === "add" ? "Zarejestrowano wpłatę" : "Zarejestrowano obciążenie"}: ${amt} €`
        : `Saldo aktualisiert: ${delta > 0 ? "+" : ""}${delta} €`
    );
    setIsBalanceDialogOpen(false);

    // Update opened details if open
    if (selectedClientForDetails && selectedClientForDetails.id === clientForBalance.id) {
      setSelectedClientForDetails({
        ...selectedClientForDetails,
        balance: selectedClientForDetails.balance + delta
      });
    }
  };

  const handleRequestDelete = (client: Client) => {
    const hasActiveReservations = reservations.some(
      r => r.clientId === client.id && r.status !== "completed" && r.status !== "cancelled"
    );
    if (hasActiveReservations) {
      toast.error(
        language === "pl"
          ? "Nie można usunąć klienta, który posiada aktywne lub zaplanowane rezerwacje!"
          : "Kunde kann nicht gelöscht werden, da aktive Reservierungen vorhanden sind!"
      );
      return;
    }
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!clientToDelete) return;
    deleteClient(clientToDelete.id);
    toast.success(
      language === "pl"
        ? `Usunięto klienta: ${clientToDelete.name}`
        : "Kunde erfolgreich gelöscht"
    );
    setIsDeleteDialogOpen(false);
    if (isDetailsOpen && selectedClientForDetails?.id === clientToDelete.id) {
      setIsDetailsOpen(false);
    }
    setClientToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">{language === "pl" ? "Wszyscy klienci" : "Kunden gesamt"}</span>
            <UserIcon className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">{totalClients}</span>
            <span className="text-[11px] font-medium text-slate-500">bazie</span>
          </div>
        </div>

        <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">{language === "pl" ? "Firmy (B2B)" : "Firmen (B2B)"}</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-blue-950">{companyClients}</span>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-[10px] px-1.5 py-0">
              Kaucja 1000 €
            </Badge>
          </div>
        </div>

        <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">{language === "pl" ? "Osoby prywatne" : "Privatkunden"}</span>
            <UserIcon className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-amber-950">{privateClients}</span>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px] px-1.5 py-0">
              Kaucja 200 €
            </Badge>
          </div>
        </div>

        <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Klienci VIP</span>
            <Crown className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-purple-950">{vipClients}</span>
            <span className="text-[11px] font-medium text-purple-700">ze zniżką</span>
          </div>
        </div>

        <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">{language === "pl" ? "W trasie teraz" : "Aktuell unterwegs"}</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-emerald-950">{activeRentalsCount}</span>
            <span className="text-[11px] font-medium text-emerald-700">{language === "pl" ? "aktywne" : "aktiv"}</span>
          </div>
        </div>

        <div className={cn(
          "p-3.5 rounded-xl border shadow-xs flex flex-col justify-between",
          debtors.length > 0 ? "bg-rose-50/70 border-rose-200" : "bg-slate-50 border-slate-200"
        )}>
          <div className="flex items-center justify-between text-rose-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">{language === "pl" ? "Zaległości" : "Rückstände"}</span>
            <AlertCircle className={cn("w-4 h-4", debtors.length > 0 ? "text-rose-600" : "text-slate-400")} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={cn("text-xl font-black tracking-tight", debtors.length > 0 ? "text-rose-700" : "text-slate-700")}>
              {debtors.length > 0 ? `-${totalDebt.toFixed(0)} €` : "0 €"}
            </span>
            {debtors.length > 0 && (
              <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-[10px] px-1.5 py-0">
                {debtors.length} {language === "pl" ? "dłużników" : "Schuldner"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder={language === "pl" ? "Szukaj po nazwisku, firmie, NIP, telefonie, mieście..." : t.searchClients}
              className="pl-9 h-10 bg-white border-slate-200 shadow-xs text-sm font-medium focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 ml-2 text-slate-400" />
            <Select value={sortBy} onValueChange={(v) => v && setSortBy(v as any)}>
              <SelectTrigger className="h-8 border-none shadow-none text-xs font-semibold focus:ring-0">
                <SelectValue placeholder="Sortuj" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{language === "pl" ? "Nazwa (A-Z)" : "Name (A-Z)"}</SelectItem>
                <SelectItem value="balance_desc">{language === "pl" ? "Saldo: najwyższe" : "Saldo: absteigend"}</SelectItem>
                <SelectItem value="balance_asc">{language === "pl" ? "Saldo: najniższe (długi)" : "Saldo: aufsteigend"}</SelectItem>
                <SelectItem value="reservations">{language === "pl" ? "Najwięcej rezerwacji" : "Meiste Reservierungen"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Button 
            onClick={() => handleOpenDialog()} 
            className="rounded-lg h-10 font-black uppercase tracking-tight px-5 shadow-sm shrink-0 bg-primary hover:bg-primary/95 text-white"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t.newClient || "Nowy klient"}
          </Button>
        </div>
      </div>

      {/* Filter Tabs / Quick Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={filterType === "all" ? "default" : "outline"}
          className="h-7 text-xs font-semibold rounded-full px-3"
          onClick={() => setFilterType("all")}
        >
          {language === "pl" ? "Wszyscy" : "Alle"} ({clients.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filterType === "company" ? "default" : "outline"}
          className={cn(
            "h-7 text-xs font-semibold rounded-full px-3",
            filterType === "company" ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-blue-900 border-blue-200 hover:bg-blue-50"
          )}
          onClick={() => setFilterType("company")}
        >
          <Building2 className="w-3.5 h-3.5 mr-1 text-blue-500" />
          {language === "pl" ? "Firmy B2B (kaucja 1000 €)" : "Firmen B2B (1000 € Kaution)"} ({companyClients})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filterType === "private" ? "default" : "outline"}
          className={cn(
            "h-7 text-xs font-semibold rounded-full px-3",
            filterType === "private" ? "bg-amber-600 hover:bg-amber-700 text-white" : "text-amber-900 border-amber-200 hover:bg-amber-50"
          )}
          onClick={() => setFilterType("private")}
        >
          <UserIcon className="w-3.5 h-3.5 mr-1 text-amber-500" />
          {language === "pl" ? "Osoby prywatne (kaucja 200 €)" : "Privat (200 €)"} ({privateClients})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filterType === "active" ? "default" : "outline"}
          className="h-7 text-xs font-semibold rounded-full px-3"
          onClick={() => setFilterType("active")}
        >
          <Truck className="w-3.5 h-3.5 mr-1" />
          {language === "pl" ? "Aktywne wynajmy" : "Aktive Mieten"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filterType === "vip" ? "default" : "outline"}
          className={cn(
            "h-7 text-xs font-semibold rounded-full px-3",
            filterType === "vip" ? "bg-purple-600 hover:bg-purple-700 text-white" : "text-purple-900 border-purple-200 hover:bg-purple-50"
          )}
          onClick={() => setFilterType("vip")}
        >
          <Crown className="w-3.5 h-3.5 mr-1 text-amber-400" />
          VIP ({vipClients})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filterType === "debt" ? "default" : "outline"}
          className={cn(
            "h-7 text-xs font-semibold rounded-full px-3",
            filterType === "debt" ? "bg-rose-600 hover:bg-rose-700 text-white" : "text-rose-900 border-rose-200 hover:bg-rose-50"
          )}
          onClick={() => setFilterType("debt")}
        >
          <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />
          {language === "pl" ? "Zaległości" : "Rückstände"} ({debtors.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filterType === "blocked" ? "default" : "outline"}
          className="h-7 text-xs font-semibold rounded-full px-3"
          onClick={() => setFilterType("blocked")}
        >
          <Ban className="w-3.5 h-3.5 mr-1 text-red-500" />
          {language === "pl" ? "Zablokowani" : "Gesperrt"}
        </Button>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/75">
            <TableRow className="border-b border-slate-200">
              <TableHead className="text-[10px] font-black uppercase tracking-wider h-11 text-slate-500 pl-4">{t.client}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider h-11 text-slate-500">{t.phone} / {t.email} / Adres</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider h-11 text-slate-500">Uprawnienia & Dokumenty</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider h-11 text-slate-500">Saldo & Kaucja</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider h-11 text-slate-500">Historia wynajmów</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider h-11 text-slate-500 text-center">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider h-11 text-slate-500 text-right pr-4">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedClients.map((client) => {
              const clientReservations = reservations.filter(r => r.clientId === client.id);
              const hasActiveRental = clientReservations.some(r => r.status === "active");
              const hasBE = client.driverLicenseClass?.toLowerCase().includes("be") || 
                            client.driverLicenseClass?.toLowerCase().includes("b+e") || 
                            client.driverLicenseClass?.toLowerCase().includes("ce");
              const hasIdCard = !!client.idCardNumber;

              return (
                <TableRow 
                  key={client.id} 
                  className={cn(
                    "group transition-colors border-b border-slate-100 hover:bg-slate-50/70 cursor-pointer",
                    client.status === "blocked" && "bg-rose-50/30",
                    client.status === "vip" && "bg-amber-50/20"
                  )}
                  onClick={() => handleOpenDetails(client)}
                >
                  {/* Client Name & Type */}
                  <TableCell className="py-3.5 pl-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border relative",
                        client.type === "company" 
                          ? "bg-blue-50 border-blue-200 text-blue-700" 
                          : "bg-amber-50 border-amber-200 text-amber-700",
                        client.status === "blocked" && "bg-rose-100 border-rose-300 text-rose-700"
                      )}>
                        {client.type === "company" ? (
                          <Building2 className="w-5 h-5" />
                        ) : (
                          <UserIcon className="w-5 h-5" />
                        )}
                        {client.status === "vip" && (
                          <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 p-0.5 rounded-full ring-2 ring-white">
                            <Crown className="w-2.5 h-2.5" />
                          </span>
                        )}
                        {client.status === "blocked" && (
                          <span className="absolute -top-1 -right-1 bg-rose-600 text-white p-0.5 rounded-full ring-2 ring-white">
                            <Ban className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors">
                            {client.name}
                          </span>
                          {client.status === "vip" && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[9px] px-1 py-0 h-4">
                              VIP
                            </Badge>
                          )}
                          {client.discountPercent && client.discountPercent > 0 ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-[9px] px-1 py-0 h-4">
                              -{client.discountPercent}%
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-semibold text-slate-600">
                            {client.type === "company" ? (t.company || "Firma B2B") : (t.privatePerson || "Osoba prywatna")}
                          </span>
                          {client.nip && (
                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-slate-700">
                              NIP: {client.nip}
                            </span>
                          )}
                          {client.contactPerson && (
                            <span className="text-slate-500 text-[10px] italic">
                              ({client.contactPerson})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-0.5 text-xs">
                      {client.phone ? (
                        <a 
                          href={`tel:${client.phone}`} 
                          className="font-medium text-slate-800 hover:text-primary flex items-center gap-1 w-fit"
                          title="Zadzwoń"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{client.phone}</span>
                          {client.phone2 && <span className="text-[10px] text-slate-400">/ {client.phone2}</span>}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                      {client.email && (
                        <a 
                          href={`mailto:${client.email}`} 
                          className="text-slate-500 hover:text-primary flex items-center gap-1 text-[11px] w-fit truncate max-w-[200px]"
                        >
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{client.email}</span>
                        </a>
                      )}
                      {(client.city || client.address) && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{client.city || client.address}</span>
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Documents & Driver License */}
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-1">
                        {hasBE ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-[10px] px-1.5 py-0 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Kat. B+E (Laweta OK)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] px-1.5 py-0">
                            Kat. {client.driverLicenseClass || "B"}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        <span>{hasIdCard ? `Dowód: ${client.idCardNumber}` : (language === "pl" ? "Brak dowodu w bazie" : "Kein Ausweis")}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Balance & Deposit Rule */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-black font-mono",
                          client.balance < 0 ? "text-rose-600" : (client.balance > 0 ? "text-emerald-600" : "text-slate-700")
                        )}>
                          {client.balance > 0 ? `+${client.balance}` : client.balance} €
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px] text-slate-500 hover:text-slate-900 border border-slate-200 bg-slate-50"
                          onClick={() => handleOpenBalanceDialog(client)}
                          title="Zmień saldo / rozlicz"
                        >
                          +/-
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        {client.type === "company" ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[9px] font-bold px-1 py-0">
                            Kaucja B2B: 1000 €
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[9px] font-bold px-1 py-0">
                            Kaucja: 200 € BAR
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Rental History */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">
                          {clientReservations.length} {language === "pl" ? "wynajmów" : "Mieten"}
                        </span>
                        {hasActiveRental && (
                          <Badge className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0 h-4 animate-pulse">
                            W trasie
                          </Badge>
                        )}
                      </div>
                      {clientReservations.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {clientReservations.slice(-2).map(res => (
                            <span key={res.id} className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">
                              {res.invoiceNumber || "Wypożyczenie"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-tight border-none shadow-none",
                      client.status === "blocked"
                        ? "bg-rose-100 text-rose-800"
                        : client.status === "vip"
                        ? "bg-amber-100 text-amber-800"
                        : hasActiveRental
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    )}>
                      {client.status === "blocked"
                        ? (language === "pl" ? "Zablokowany" : "Gesperrt")
                        : client.status === "vip"
                        ? "Klient VIP"
                        : hasActiveRental
                        ? (language === "pl" ? "Wypożycza" : "Aktiv")
                        : (language === "pl" ? "Aktywny" : "Aktiv")}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1 items-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg hover:bg-slate-200/60"
                        onClick={() => handleOpenDetails(client)}
                        title="Podgląd dossier"
                      >
                        <Eye className="h-4 w-4 text-slate-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg hover:bg-slate-200/60" 
                        onClick={() => handleOpenDialog(client)}
                        title="Edytuj klienta"
                      >
                        <Edit className="h-4 w-4 text-slate-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" 
                        onClick={() => handleRequestDelete(client)}
                        title="Usuń klienta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {sortedClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserIcon className="w-8 h-8 text-slate-300 stroke-1" />
                    <span>{t.clientNotFound || "Nie znaleziono klientów"}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenDialog()}
                      className="mt-2 text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Dodaj pierwszego klienta
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* CREATE / EDIT CLIENT MODAL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <span>{editingClient ? (language === "pl" ? "Edycja danych klienta" : t.editClient) : (language === "pl" ? "Nowy klient w bazie" : t.newClient)}</span>
              {type === "company" ? (
                <Badge className="bg-blue-100 text-blue-900 border-blue-300 font-bold">
                  B2B • Automatyczna kaucja 1000 €
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
                  Prywatny • Kaucja 200 € BAR
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Form Tabs */}
          <div className="flex border-b border-slate-200 mt-2">
            <button
              type="button"
              className={cn(
                "px-3.5 py-2 text-xs font-bold border-b-2 transition-colors",
                activeFormTab === "basic" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
              onClick={() => setActiveFormTab("basic")}
            >
              1. Podstawowe & Kontakt
            </button>
            <button
              type="button"
              className={cn(
                "px-3.5 py-2 text-xs font-bold border-b-2 transition-colors",
                activeFormTab === "address" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
              onClick={() => setActiveFormTab("address")}
            >
              2. Adres rejestracyjny
            </button>
            <button
              type="button"
              className={cn(
                "px-3.5 py-2 text-xs font-bold border-b-2 transition-colors",
                activeFormTab === "documents" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
              onClick={() => setActiveFormTab("documents")}
            >
              3. Prawo jazdy & Dowód
            </button>
            <button
              type="button"
              className={cn(
                "px-3.5 py-2 text-xs font-bold border-b-2 transition-colors",
                activeFormTab === "finances" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
              onClick={() => setActiveFormTab("finances")}
            >
              4. Finanse & Notatki
            </button>
          </div>

          <div className="py-3">
            {/* TAB 1: BASIC & CONTACT */}
            {activeFormTab === "basic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t.clientType}</Label>
                    <Select value={type} onValueChange={(v) => v && setType(v as "private" | "company")}>
                      <SelectTrigger className="font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">{t.privatePerson || "Osoba prywatna (kaucja 200 €)"}</SelectItem>
                        <SelectItem value="company">{t.company || "Firma B2B (kaucja 1000 €)"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Status klienta</Label>
                    <Select value={status} onValueChange={(v) => v && setStatus(v as any)}>
                      <SelectTrigger className="font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktywny (Standard)</SelectItem>
                        <SelectItem value="vip">Klient VIP (Stały klient)</SelectItem>
                        <SelectItem value="blocked">Zablokowany (Blokada wynajmu)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="clientName" className="text-xs font-semibold">
                    {type === "company" ? (t.companyName || "Pełna nazwa firmy") : (t.fullName || "Imię i nazwisko")} *
                  </Label>
                  <Input 
                    id="clientName" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder={type === "company" ? "np. Trans-Pol Sp. z o.o." : "np. Jan Kowalski"}
                    className="font-medium"
                  />
                </div>

                {type === "company" && (
                  <div className="grid grid-cols-2 gap-4 bg-blue-50/60 p-3 rounded-lg border border-blue-200">
                    <div className="space-y-1.5">
                      <Label htmlFor="nip" className="text-xs font-semibold text-blue-950">
                        {t.nip || "NIP / USt-IdNr."}
                      </Label>
                      <Input 
                        id="nip" 
                        value={nip} 
                        onChange={(e) => setNip(e.target.value)} 
                        placeholder="np. PL1234567890 lub DE123456789" 
                        className="bg-white font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contactPerson" className="text-xs font-semibold text-blue-950">
                        Osoba do kontaktu / Przedstawiciel
                      </Label>
                      <Input 
                        id="contactPerson" 
                        value={contactPerson} 
                        onChange={(e) => setContactPerson(e.target.value)} 
                        placeholder="np. Marek Nowak (Kierownik floty)" 
                        className="bg-white"
                      />
                    </div>
                    <div className="col-span-2 text-[11px] text-blue-800 font-medium flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Dla rezerwacji firmowych automatyczna kaucja wynosi <strong>1000 €</strong>.</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold">{t.phone} (Główny)</Label>
                    <Input 
                      id="phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+49 ... lub +48 ..." 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone2" className="text-xs font-semibold">Telefon dodatkowy</Label>
                    <Input 
                      id="phone2" 
                      value={phone2} 
                      onChange={(e) => setPhone2(e.target.value)} 
                      placeholder="Kierowca / Biuro" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">{t.email}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="biuro@firma.pl" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="discount" className="text-xs font-semibold">Rabat stałego klienta (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="discount" 
                        type="number" 
                        min="0"
                        max="100"
                        value={discountPercent || ""} 
                        onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} 
                        placeholder="0"
                        className="font-bold w-24"
                      />
                      <span className="text-sm font-bold text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ADDRESS */}
            {activeFormTab === "address" && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border text-xs text-muted-foreground">
                  Adres klienta drukowany jest bezpośrednio na umowie wynajmu (Mietvertrag) oraz na protokole zdawczo-odbiorczym.
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="street" className="text-xs font-semibold">Ulica i numer lokalu</Label>
                  <Input 
                    id="street" 
                    value={street} 
                    onChange={(e) => setStreet(e.target.value)} 
                    placeholder="np. Hauptstraße 45 lub ul. Główna 12/4" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode" className="text-xs font-semibold">Kod pocztowy</Label>
                    <Input 
                      id="postalCode" 
                      value={postalCode} 
                      onChange={(e) => setPostalCode(e.target.value)} 
                      placeholder="np. 10115 lub 00-001" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="city" className="text-xs font-semibold">Miejscowość</Label>
                    <Input 
                      id="city" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                      placeholder="np. Berlin lub Poznań" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-xs font-semibold">Kraj</Label>
                  <Input 
                    id="country" 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)} 
                    placeholder="Polska / Deutschland" 
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t">
                  <Label htmlFor="manualAddress" className="text-xs font-semibold text-slate-600">
                    Lub pełny ciągły adres (jeśli preferujesz ręczny zapis)
                  </Label>
                  <Input 
                    id="manualAddress" 
                    value={manualAddress} 
                    onChange={(e) => setManualAddress(e.target.value)} 
                    placeholder="np. ul. Marszałkowska 10, 00-001 Warszawa, Polska" 
                  />
                </div>
              </div>
            )}

            {/* TAB 3: DOCUMENTS & LICENSE */}
            {activeFormTab === "documents" && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Wymogi prawne dla lawet i ciężkich przyczep:</strong>
                    <p className="mt-0.5 text-amber-800">
                      Wydanie autolawety lub przyczepy o DMC powyżej 750 kg wymaga uprawnień <strong>B+E</strong> lub <strong>C+E</strong>. Zapisanie tych danych tutaj ułatwia automatyczną weryfikację podczas wydawania.
                    </p>
                  </div>
                </div>

                {/* Driver License */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Prawo jazdy (Führerschein)</h4>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Kategorie prawa jazdy</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {["B", "B+E", "BE", "C", "C+E", "T"].map((cat) => (
                        <Button
                          key={cat}
                          type="button"
                          size="sm"
                          variant={driverLicenseClass.includes(cat) ? "default" : "outline"}
                          className="h-7 text-xs font-bold px-2.5"
                          onClick={() => {
                            if (driverLicenseClass.includes(cat)) {
                              setDriverLicenseClass(prev => prev.replace(cat, "").replace(", ,", ",").trim());
                            } else {
                              setDriverLicenseClass(prev => prev ? `${prev}, ${cat}` : cat);
                            }
                          }}
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                    <Input 
                      value={driverLicenseClass} 
                      onChange={(e) => setDriverLicenseClass(e.target.value)} 
                      placeholder="np. B, B+E, C"
                      className="mt-1" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Data wydania prawa jazdy</Label>
                      <Input 
                        type="date" 
                        value={driverLicenseIssueDate} 
                        onChange={(e) => setDriverLicenseIssueDate(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Organ / Miasto wydania</Label>
                      <Input 
                        value={driverLicenseIssuePlace} 
                        onChange={(e) => setDriverLicenseIssuePlace(e.target.value)} 
                        placeholder="np. Starosta Poznański" 
                      />
                    </div>
                  </div>
                </div>

                {/* ID Card */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Dowód tożsamości / Paszport (Ausweis / Pass)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5 col-span-1">
                      <Label className="text-xs font-semibold">Seria i numer dowodu</Label>
                      <Input 
                        value={idCardNumber} 
                        onChange={(e) => setIdCardNumber(e.target.value)} 
                        placeholder="np. ABA 123456" 
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <Label className="text-xs font-semibold">Ważny do</Label>
                      <Input 
                        type="date" 
                        value={idCardExpiry} 
                        onChange={(e) => setIdCardExpiry(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <Label className="text-xs font-semibold">Wydany przez</Label>
                      <Input 
                        value={idCardIssuePlace} 
                        onChange={(e) => setIdCardIssuePlace(e.target.value)} 
                        placeholder="np. Prezydent Miasta" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FINANCES & NOTES */}
            {activeFormTab === "finances" && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    Zasada kaucji w programie:
                  </div>
                  <p>
                    • Dla firm (B2B): automatyczna kaucja <strong>1000 €</strong> przy każdej rezerwacji i wydaniu.<br />
                    • Dla osób prywatnych: automatyczna kaucja <strong>200 €</strong> w gotówce (BAR).
                  </p>
                </div>

                {!editingClient && (
                  <div className="space-y-1.5">
                    <Label htmlFor="initialBalance" className="text-xs font-semibold">Początkowe saldo konta klienta (€)</Label>
                    <Input 
                      id="initialBalance" 
                      type="number" 
                      step="any"
                      value={balance} 
                      onChange={(e) => setBalance(parseFloat(e.target.value) || 0)} 
                      placeholder="0.00" 
                      className="font-bold w-40"
                    />
                    <span className="text-[10px] text-muted-foreground block">
                      Wartość ujemna oznacza zaległość, wartość dodatnia to przedpłata/nadpłata.
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-semibold">{t.notes} wewnętrzne</Label>
                  <Textarea 
                    id="notes" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Wpisz uwagi o kliencie, preferowane przyczepy, ustalone warunki płatności..."
                    className="resize-none h-28"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-3 flex justify-between items-center sm:justify-between">
            <div className="flex gap-1">
              {activeFormTab !== "basic" && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    if (activeFormTab === "finances") setActiveFormTab("documents");
                    else if (activeFormTab === "documents") setActiveFormTab("address");
                    else if (activeFormTab === "address") setActiveFormTab("basic");
                  }}
                >
                  Poprzednia zakładka
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/95 text-white font-bold">
                {editingClient ? t.saveChanges : t.saveClient}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CLIENT DETAILS / DOSSIER DIALOG */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedClientForDetails && (() => {
            const client = selectedClientForDetails;
            const clientRes = reservations.filter(r => r.clientId === client.id);
            const activeRes = clientRes.filter(r => r.status === "active");
            const hasBE = client.driverLicenseClass?.toLowerCase().includes("be") || 
                          client.driverLicenseClass?.toLowerCase().includes("b+e") || 
                          client.driverLicenseClass?.toLowerCase().includes("ce");

            return (
              <div className="space-y-5">
                <DialogHeader className="border-b pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                        client.type === "company" ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-amber-100 text-amber-800 border-amber-300"
                      )}>
                        {client.type === "company" ? <Building2 className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                          {client.name}
                          {client.status === "vip" && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px] px-1.5 py-0">
                              VIP
                            </Badge>
                          )}
                          {client.status === "blocked" && (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-[10px] px-1.5 py-0">
                              Zablokowany
                            </Badge>
                          )}
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {client.type === "company" ? "Klient firmowy (B2B)" : "Klient indywidualny"} 
                          {client.nip && ` • NIP: ${client.nip}`}
                          {client.contactPerson && ` • Kontakt: ${client.contactPerson}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                {/* Key Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Contact Card */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kontakt</h4>
                    <div className="space-y-1 text-xs">
                      {client.phone ? (
                        <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 font-bold text-slate-800 hover:text-primary">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.phone}</span>
                        </a>
                      ) : <span className="text-slate-400">Brak telefonu</span>}
                      {client.phone2 && (
                        <div className="text-[11px] text-slate-500 ml-5">
                          Dodatkowy: {client.phone2}
                        </div>
                      )}
                      {client.email && (
                        <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-slate-600 hover:text-primary truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </a>
                      )}
                      {client.address && (
                        <div className="flex items-start gap-1.5 text-slate-600 pt-1 border-t text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{client.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents & Uprawnienia Card */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Uprawnienia kierowcy</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-600">Prawo jazdy:</span>
                        {hasBE ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px] px-1.5 py-0">
                            B+E ✓ Laweta OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {client.driverLicenseClass || "B"}
                          </Badge>
                        )}
                      </div>
                      {client.driverLicenseIssueDate && (
                        <div className="text-[11px] text-slate-500">
                          Wydane: {client.driverLicenseIssueDate} {client.driverLicenseIssuePlace && `(${client.driverLicenseIssuePlace})`}
                        </div>
                      )}
                      <div className="pt-1 border-t text-[11px] text-slate-700">
                        <span className="font-semibold">Dowód osobisty:</span>{" "}
                        {client.idCardNumber ? (
                          <span className="font-mono">{client.idCardNumber}</span>
                        ) : (
                          <span className="text-slate-400 italic">brak w bazie</span>
                        )}
                        {client.idCardExpiry && (
                          <span className="text-slate-400 block text-[10px]">Ważny do: {client.idCardExpiry}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financials & Deposit Rule Card */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Finanse & Kaucja</h4>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-xs text-slate-600">Saldo:</span>
                        <span className={cn(
                          "text-lg font-black font-mono",
                          client.balance < 0 ? "text-rose-600" : (client.balance > 0 ? "text-emerald-600" : "text-slate-900")
                        )}>
                          {client.balance > 0 ? `+${client.balance}` : client.balance} €
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] font-medium text-slate-600">
                        {client.type === "company" ? (
                          <Badge className="bg-blue-100 text-blue-900 border-blue-200 text-[10px] font-bold">
                            Kaucja firmowa: 1000 €
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] font-bold">
                            Kaucja gotówkowa: 200 €
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs font-bold h-7 mt-2"
                      onClick={() => handleOpenBalanceDialog(client)}
                    >
                      <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Zmień saldo / rozlicz
                    </Button>
                  </div>
                </div>

                {/* Notes */}
                {client.notes && (
                  <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200/70 text-xs">
                    <span className="font-bold text-amber-950 block mb-0.5">Notatka wewnętrzna:</span>
                    <p className="text-slate-700 leading-relaxed"><DynamicText text={client.notes} /></p>
                  </div>
                )}

                {/* Reservation History Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      Historia rezerwacji i wynajmów ({clientRes.length})
                    </h3>
                    {activeRes.length > 0 && (
                      <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                        {activeRes.length} w trakcie wynajmu
                      </Badge>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    {clientRes.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 font-medium">
                        Ten klient nie ma jeszcze żadnych rezerwacji.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow className="border-b">
                            <TableHead className="text-[10px] h-8">Przyczepa</TableHead>
                            <TableHead className="text-[10px] h-8">Termin</TableHead>
                            <TableHead className="text-[10px] h-8">Faktura</TableHead>
                            <TableHead className="text-[10px] h-8 text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientRes.map(r => {
                            const tr = trailers.find(t => t.id === r.trailerId);
                            return (
                              <TableRow key={r.id} className="text-xs border-b">
                                <TableCell className="py-2 font-medium">
                                  {tr?.plate || "Przyczepa"} <span className="text-[10px] text-muted-foreground">({tr?.type})</span>
                                </TableCell>
                                <TableCell className="py-2 text-[11px]">
                                  {format(parseISO(r.startDate), "dd.MM.yyyy")} — {format(parseISO(r.endDate), "dd.MM.yyyy")}
                                </TableCell>
                                <TableCell className="py-2 font-mono text-[11px]">
                                  {r.invoiceNumber || "-"}
                                </TableCell>
                                <TableCell className="py-2 text-center">
                                  <Badge variant="outline" className="text-[9px] font-bold">
                                    {r.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>

                <DialogFooter className="border-t pt-3 flex justify-between items-center sm:justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleRequestDelete(client)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Usuń klienta
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>{t.close}</Button>
                    <Button 
                      onClick={() => {
                        setIsDetailsOpen(false);
                        handleOpenDialog(client);
                      }}
                      className="bg-primary hover:bg-primary/95 text-white font-bold"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" />
                      Edytuj dane klienta
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* QUICK BALANCE ADJUSTMENT DIALOG */}
      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rozliczenie klienta / Zmiana salda</DialogTitle>
          </DialogHeader>
          {clientForBalance && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-slate-50 rounded-lg border text-xs">
                <span className="font-bold text-slate-800">{clientForBalance.name}</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-slate-500">Aktualne saldo:</span>
                  <span className={cn(
                    "font-bold font-mono text-sm",
                    clientForBalance.balance < 0 ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {clientForBalance.balance} €
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={balanceAdjustmentType === "add" ? "default" : "outline"}
                  className={cn(
                    "text-xs font-bold",
                    balanceAdjustmentType === "add" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                  onClick={() => setBalanceAdjustmentType("add")}
                >
                  + Wpłata klienta
                </Button>
                <Button
                  type="button"
                  variant={balanceAdjustmentType === "subtract" ? "default" : "outline"}
                  className={cn(
                    "text-xs font-bold",
                    balanceAdjustmentType === "subtract" && "bg-rose-600 hover:bg-rose-700 text-white"
                  )}
                  onClick={() => setBalanceAdjustmentType("subtract")}
                >
                  - Obciążenie klienta
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adjAmount" className="text-xs font-semibold">
                  Kwota operacji (€)
                </Label>
                <Input 
                  id="adjAmount"
                  type="number"
                  step="any"
                  placeholder="np. 50.00"
                  value={balanceAdjustmentAmount}
                  onChange={(e) => setBalanceAdjustmentAmount(e.target.value)}
                  className="text-lg font-bold"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                {[50, 100, 200, 500, 1000].map(val => (
                  <Button
                    key={val}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-[11px] font-mono font-bold"
                    onClick={() => setBalanceAdjustmentAmount(val.toString())}
                  >
                    {val}€
                  </Button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBalanceDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleSaveBalanceAdjustment} className="font-bold">
              Zatwierdź rozliczenie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE CLIENT DIALOG */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Usuń klienta z bazy
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-slate-600">
            Czy na pewno chcesz bezpowrotnie usunąć klienta{" "}
            <strong className="text-slate-900">{clientToDelete?.name}</strong>?
            {clientToDelete && clientToDelete.balance !== 0 && (
              <p className="mt-2 text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                Uwaga: Klient posiada nierozliczone saldo w wysokości {clientToDelete.balance} €!
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>{t.cancel}</Button>
            <Button variant="destructive" onClick={confirmDelete} className="font-bold">
              Potwierdź usunięcie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
