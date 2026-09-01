'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type BranchId = string;

export interface Branch {
  id: string;
  name: string;
  city?: string;
  location?: string;
  address?: string;
  phone?: string;
  headmaster?: string;
  status?: string;
}

const FALLBACK_BRANCHES: Branch[] = [
  { id: 'Trichy',     name: 'Trichy',     city: 'Trichy' },
  { id: 'Chennai',    name: 'Chennai',    city: 'Chennai' },
  { id: 'Coimbatore', name: 'Coimbatore', city: 'Coimbatore' },
  { id: 'Madurai',    name: 'Madurai',    city: 'Madurai' },
];

function isTrichy(b: Branch) {
  return b.id.toLowerCase().includes('trichy') || b.name.toLowerCase().includes('trichy');
}

function sortBranches(list: Branch[]): Branch[] {
  const trichy = list.filter(isTrichy);
  const others = list.filter(b => !isTrichy(b)).sort((a, b) => a.name.localeCompare(b.name));
  return [...trichy, ...others];
}

interface BranchContextType {
  currentBranch: BranchId;
  setBranchId: (id: BranchId) => void;
  branches: Branch[];
  isAllBranches: boolean;
  setIsAllBranches: (val: boolean) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [currentBranch, setBranchId]     = useState<BranchId>('Trichy');
  const [branches,      setBranches]     = useState<Branch[]>(FALLBACK_BRANCHES);
  const [isAllBranches, setIsAllBranches]= useState(false);
  const [initialised,   setInitialised]  = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'branches'),
      (snap) => {
        if (!snap.empty) {
          const loaded: Branch[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Branch));
          const active   = loaded.filter(b => !b.status || b.status === 'active');
          const source   = active.length > 0 ? active : loaded;
          const sorted   = sortBranches(source);
          setBranches(sorted);

          if (!initialised) {
            // On first load, default to Trichy (first in sorted list)
            setBranchId(sorted[0].id);
            setInitialised(true);
          } else {
            // On subsequent updates, only switch if current branch was removed
            setBranchId(prev => sorted.find(b => b.id === prev) ? prev : sorted[0].id);
          }
        } else {
          setBranches(FALLBACK_BRANCHES);
          if (!initialised) {
            setBranchId('Trichy');
            setInitialised(true);
          }
        }
      },
      () => {
        setBranches(FALLBACK_BRANCHES);
        if (!initialised) {
          setBranchId('Trichy');
          setInitialised(true);
        }
      }
    );
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BranchContext.Provider value={{ currentBranch, setBranchId, branches, isAllBranches, setIsAllBranches }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) throw new Error('useBranch must be used within a BranchProvider');
  return context;
}

export function useBranchData() {
  const { currentBranch } = useBranch();
  return { branchId: currentBranch, currentBranch };
}

export const mockBranches = FALLBACK_BRANCHES;
