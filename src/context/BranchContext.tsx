'use client';

import React, { createContext, useContext, useState } from 'react';

export type BranchId = 'Trichy' | 'Chennai' | 'Coimbatore' | 'Madurai';

export interface Branch {
  id: BranchId;
  name: string;
  location: string;
}

export const mockBranches: Branch[] = [
  { id: 'Trichy', name: 'Trichy', location: 'Srirangam' },
  { id: 'Chennai', name: 'Chennai', location: 'Anna Nagar' },
  { id: 'Coimbatore', name: 'Coimbatore', location: 'RS Puram' },
  { id: 'Madurai', name: 'Madurai', location: 'K.K. Nagar' },
];

interface BranchContextType {
  currentBranch: BranchId;
  setBranchId: (id: BranchId) => void;
  branches: Branch[];
  isAllBranches: boolean;
  setIsAllBranches: (val: boolean) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [currentBranch, setBranchId] = useState<BranchId>('Trichy');
  const [isAllBranches, setIsAllBranches] = useState(false);

  const value = {
    currentBranch,
    setBranchId,
    branches: mockBranches,
    isAllBranches,
    setIsAllBranches,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
