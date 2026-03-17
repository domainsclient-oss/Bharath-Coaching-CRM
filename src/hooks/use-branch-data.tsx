'use client';

import { useBranch } from "@/context/BranchContext";
import { useMemo, useState } from "react";

/**
 * Hook to filter a list of data items based on the current branch selection.
 * Supports "All Branches" mode for super admins.
 */
export function useBranchData<T extends { branchId?: string }>(initialData: T[]) {
  const { currentBranch, isAllBranches } = useBranch();
  const [data, setData] = useState<T[]>(initialData);

  const filteredData = useMemo(() => {
    if (isAllBranches) return data;
    return data.filter((item) => item.branchId === currentBranch);
  }, [data, currentBranch, isAllBranches]);

  return { 
    data: filteredData, 
    setData, 
    allData: data,
    currentBranch 
  };
}
