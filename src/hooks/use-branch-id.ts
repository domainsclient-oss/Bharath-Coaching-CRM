'use client';

import { useBranch } from "@/context/BranchContext";

/**
 * Simple hook to get the current branch ID.
 */
export function useBranchId() {
  const { currentBranch } = useBranch();
  return currentBranch;
}
