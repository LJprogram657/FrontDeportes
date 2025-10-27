'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import '..//..//styles/admin-dashboard.css';

interface Player {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
  photo: string;
}

interface TeamRegistration {
  id: number;
  teamName: string;
  teamLogo?: string;
  contactNumber: string;
  tournament: {
    id: number;
    name: string;
    code: string;
    logo: string;
  };
  players: Player[];
  registrationDate: string;
  status: 'pending' | 'approved' | 'rejected';
  contactPerson: string;
  notes?: string;
  // Fallback opcional si algunos registros guardaron solo el id
  tournamentId?: number;
}

const RegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<TeamRegistration[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<TeamRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // NUEVO: mantener metadata (notificaciones) separada
  const [registrationsMeta, setRegistrationsMeta] = useState<any[]>([]);

  // Cargar registros y metadatos desde localStorage al montar
  useEffect(() => {
    const stored = localStorage.getItem('team_registrations');
    setRegistrations(stored ? JSON.parse(stored) : []);

    const metaRaw = localStorage.getItem('team_registrations_meta');
    setRegistrationsMeta(metaRaw ? JSON.parse(metaRaw) : []);

    setIsLoading(false);
  }, []);

  // Sincronizar ante cambios en storage y al volver a la pestaña
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'team_registrations') {
        setRegistrations(e.newValue ? JSON.parse(e.newValue) : []);
      }
      if (e.key === 'team_registrations_meta') {
        setRegistrationsMeta(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', onStorage);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const stored = localStorage.getItem('team_registrations');
        setRegistrations(stored ? JSON.parse(stored) : []);

        const metaRaw = localStorage.getItem('team_registrations_meta');
        setRegistrationsMeta(metaRaw ? JSON.parse(metaRaw) : []);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Marcar notificación como dismiss sin borrar el registro aprobado
  const dismissNotification = (registrationId: string) => {
    const nextMeta = [...registrationsMeta];
    const idx = nextMeta.findIndex(m => m.id === registrationId);
    if (idx >= 0) {
      nextMeta[idx] = { ...nextMeta[idx], dismissed: true };
    } else {
      nextMeta.push({ id: registrationId, dismissed: true });
    }
    setRegistrationsMeta(nextMeta);
    localStorage.setItem('team_registrations_meta', JSON.stringify(nextMeta));
  };

  // Eliminar registro: si está aprobado, solo ocultar la notificación
  const handleDeleteRegistration = (reg: TeamRegistration) => {
    if (reg.status === 'approved') {
      dismissNotification(reg.id);
      return;
    }
    const updatedRegistrations = registrations.filter(r => r.id !== reg.id);
    setRegistrations(updatedRegistrations);
    localStorage.setItem('team_registrations', JSON.stringify(updatedRegistrations));

    const updatedMeta = registrationsMeta.filter(m => m.id !== reg.id);
    setRegistrationsMeta(updatedMeta);
    localStorage.setItem('team_registrations_meta', JSON.stringify(updatedMeta));
  };

  // Filtrar y ocultar notificaciones "dismissed"
  const filteredRegistrations = registrations.filter(r => {
    if (selectedTournament !== 'all' && r.tournament !== selectedTournament) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    const meta = registrationsMeta.find(m => m.id === r.id);
    if (meta?.dismissed) return false;
    return true;
  });
  // ... existing code ...
}