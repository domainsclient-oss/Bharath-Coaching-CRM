'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

/** Fixed Standard Batch fee per class, e.g. { "10": 15000 }. Set in Settings → Class Fees. */
export type ClassFees = Record<string, number>;

export const CLASS_FEES_DOC = ['settings', 'classFees'] as const;

export function useClassFees() {
  const [classFees, setClassFees] = useState<ClassFees>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, ...CLASS_FEES_DOC),
      (snap) => {
        setClassFees((snap.data()?.fees as ClassFees | undefined) ?? {});
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  return { classFees, loading };
}
