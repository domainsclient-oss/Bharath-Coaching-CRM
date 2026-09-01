'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import centerConfig from '@/config/centerConfig';

export interface AppSettings {
  appName: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  address: string;
}

const defaults: AppSettings = {
  appName:      centerConfig.centerName,
  contactEmail: centerConfig.email,
  contactPhone: centerConfig.phone,
  currency:     'INR',
  address:      centerConfig.address,
};

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({ settings: defaults, loading: true });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'general'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<AppSettings>;
          setSettings({
            appName:      data.appName      || defaults.appName,
            contactEmail: data.contactEmail || defaults.contactEmail,
            contactPhone: data.contactPhone || defaults.contactPhone,
            currency:     data.currency     || defaults.currency,
            address:      data.address      || defaults.address,
          });
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
