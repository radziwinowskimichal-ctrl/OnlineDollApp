"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Trailer, Client, Reservation, ReservationHistoryEntry, UserProfile, initialTrailers, initialClients, initialReservations, initialProfiles } from "./store";
import { ColorOption } from "./colors";
import { toast } from "sonner";

import { translations } from "./translations";

export type StatusColors = Record<Reservation["status"], ColorOption>;

const defaultStatusColors: StatusColors = {
  paid: "green",
  invoiced: "amber",
  defect: "red",
  completed: "slate",
  active: "blue",
  cancelled: "red"
};

interface AppState {
  trailers: Trailer[];
  clients: Client[];
  reservations: Reservation[];
  profiles: UserProfile[];
  currentUserId: string | null;
  language: string;
  statusColors: StatusColors;
  addReservation: (res: Reservation) => void;
  updateReservation: (res: Reservation, action?: ReservationHistoryEntry["action"]) => void;
  deleteReservation: (id: string) => void;
  updateTrailerStatus: (id: string, status: Trailer["status"]) => void;
  addTrailer: (trailer: Trailer) => void;
  updateTrailer: (trailer: Trailer) => void;
  deleteTrailer: (id: string) => void;
  resetTrailers: () => void;
  updateClientBalance: (id: string, amount: number) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  setLanguage: (lang: string) => void;
  updateStatusColor: (status: Reservation["status"], color: ColorOption) => void;
  loginUser: (id: string) => void;
  logoutUser: () => void;
  checkTrailerAvailability: (trailerId: string, start: Date, end: Date, excludeReservationId?: string) => boolean;
  logReservationAction: (reservationId: string, action: ReservationHistoryEntry["action"]) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [trailers, setTrailers] = useState<Trailer[]>(initialTrailers);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("de");
  const [statusColors, setStatusColors] = useState<StatusColors>(defaultStatusColors);
  const [isLoaded, setIsLoaded] = useState(false);

// Load local settings & initial remote data on mount
  useEffect(() => {
    const savedCurrentUserId = localStorage.getItem("currentUserId");
    const savedLanguage = localStorage.getItem("language");
    const savedStatusColors = localStorage.getItem("statusColors");

    if (savedCurrentUserId) setCurrentUserId(savedCurrentUserId);
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedStatusColors) setStatusColors(JSON.parse(savedStatusColors));

    fetchData().then(() => setIsLoaded(true));

    // Poll the API every 2 seconds to keep everyone synced
    const interval = setInterval(() => {
        fetchData();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setTrailers(data.trailers);
        setClients(data.clients);
        setReservations(data.reservations);
        setProfiles(data.profiles);
      }
    } catch (e) {
      console.error("Failed to sync data", e);
    }
  };

  const dispatchAction = async (action: string, payload: any) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      fetchData(); // Immediately refresh after mutation
    } catch (e) {
      console.error("Failed to sync mutation", action, e);
    }
  };

  // Save local config settings when they change
  useEffect(() => {
    if (isLoaded) {
      if (currentUserId) {
        localStorage.setItem("currentUserId", currentUserId);
      } else {
        localStorage.removeItem("currentUserId");
      }
      localStorage.setItem("language", language);
      localStorage.setItem("statusColors", JSON.stringify(statusColors));
    }
  }, [currentUserId, language, statusColors, isLoaded]);

  const loginUser = (id: string) => {
    setCurrentUserId(id);
    const updatedProfiles = profiles.map(p => p.id === id ? { ...p, isOnline: true } : p);
    setProfiles(updatedProfiles);
    dispatchAction('UPDATE_PROFILE', { id, isOnline: true, name: profiles.find(p=>p.id===id)?.name });
  };

  const logoutUser = () => {
    if (currentUserId) {
      setProfiles(prev => prev.map(p => p.id === currentUserId ? { ...p, isOnline: false } : p));
      dispatchAction('UPDATE_PROFILE', { id: currentUserId, isOnline: false, name: profiles.find(p=>p.id===currentUserId)?.name });
    }
    setCurrentUserId(null);
  };

  const getHistoryEntry = (action: ReservationHistoryEntry["action"]): ReservationHistoryEntry => {
    const currentUser = profiles.find(p => p.id === currentUserId);
    return {
      id: Math.random().toString(36).substring(7),
      action,
      timestamp: new Date().toISOString(),
      profileId: currentUser?.id,
      profileName: currentUser?.name || "System"
    };
  };

  const addReservation = (res: Reservation) => {
    const historyEntry = getHistoryEntry("created");
    const newRes = { ...res, history: [historyEntry] };
    setReservations((prev) => [...prev, newRes]);
    dispatchAction('ADD_RESERVATION', newRes);
  };

  const updateReservation = (res: Reservation, action?: ReservationHistoryEntry["action"]) => {
    let finalRes = { ...res };
    if (action) {
       const existing = reservations.find(r => r.id === res.id);
       const historyEntry = getHistoryEntry(action);
       finalRes.history = [...(existing?.history || []), historyEntry];
    }
    setReservations((prev) => prev.map((r) => r.id === finalRes.id ? finalRes : r));
    dispatchAction('UPDATE_RESERVATION', finalRes);
  };

  const logReservationAction = (reservationId: string, action: ReservationHistoryEntry["action"]) => {
    const existing = reservations.find(r => r.id === reservationId);
    if (existing) {
       const historyEntry = getHistoryEntry(action);
       const updated = { ...existing, history: [...(existing.history || []), historyEntry] };
       setReservations((prev) => prev.map((r) => r.id === reservationId ? updated : r));
       dispatchAction('UPDATE_RESERVATION', updated);
    }
  };

  const deleteReservation = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
    dispatchAction('DELETE_RESERVATION', { id });
  };

  const updateTrailerStatus = (id: string, status: Trailer["status"]) => {
    const existing = trailers.find(t => t.id === id);
    if (existing) {
       const updated = { ...existing, status };
       setTrailers((prev) => prev.map((t) => (t.id === id ? updated : t)));
       dispatchAction('UPDATE_TRAILER', updated);
    }
  };

  const addTrailer = (trailer: Trailer) => {
    setTrailers((prev) => [...prev, trailer]);
    dispatchAction('ADD_TRAILER', trailer);
  };

  const updateTrailer = (trailer: Trailer) => {
    setTrailers((prev) => prev.map((t) => (t.id === trailer.id ? trailer : t)));
    dispatchAction('UPDATE_TRAILER', trailer);
  };

  const deleteTrailer = (id: string) => {
    setTrailers((prev) => prev.filter((t) => t.id !== id));
    dispatchAction('DELETE_TRAILER', { id });
  };

  const resetTrailers = () => {
    setTrailers([...initialTrailers]);
    dispatchAction('RESET_TRAILERS', {});
    const t = translations[language as keyof typeof translations];
    toast.success(t.trailersSynced);
  };

  const updateClientBalance = (id: string, amount: number) => {
    const existing = clients.find(c => c.id === id);
    if (existing) {
       const updated = { ...existing, balance: existing.balance + amount };
       setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
       dispatchAction('UPDATE_CLIENT', updated);
    }
  };

  const addClient = (client: Client) => {
    setClients((prev) => [...prev, client]);
    dispatchAction('ADD_CLIENT', client);
  };

  const updateClient = (client: Client) => {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
    dispatchAction('UPDATE_CLIENT', client);
  };

  const updateStatusColor = (status: Reservation["status"], color: ColorOption) => {
    setStatusColors((prev) => ({ ...prev, [status]: color }));
  };

  const checkTrailerAvailability = (trailerId: string, start: Date, end: Date, excludeReservationId?: string) => {
    return !reservations.some(res => {
      if (res.status === "cancelled") return false;
      if (res.trailerId !== trailerId) return false;
      if (excludeReservationId && res.id === excludeReservationId) return false;

      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      
      const resEndWithBuffer = new Date(resEnd.getTime() + 60 * 60 * 1000); 

      return start < resEndWithBuffer && end > resStart;
    });
  };

  return (
    <AppContext.Provider value={{ 
      trailers, 
      clients, 
      reservations, 
      profiles,
      currentUserId,
      language, 
      statusColors,
      addReservation, 
      updateReservation,
      deleteReservation,
      updateTrailerStatus, 
      addTrailer,
      updateTrailer,
      deleteTrailer,
      resetTrailers,
      updateClientBalance, 
      addClient, 
      updateClient,
      setLanguage,
      updateStatusColor,
      loginUser,
      logoutUser,
      checkTrailerAvailability,
      logReservationAction
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
