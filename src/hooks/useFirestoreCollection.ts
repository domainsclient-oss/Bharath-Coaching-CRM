"use client";

/**
 * useFirestoreCollection
 *
 * A reusable React hook that opens a real-time Firestore onSnapshot listener
 * for any collection, filtered by branchId and optional extra conditions.
 *
 * Usage:
 *   const { data, loading, error } = useFirestoreCollection<Student>('students', currentBranch);
 *
 * The subscription is torn down automatically when the component unmounts or
 * when branchId / extraConditions change.
 */

import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  QueryConstraint,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase";

export interface QueryCondition {
  field: string;
  operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "array-contains";
  value: unknown;
}

export interface UseFirestoreCollectionOptions {
  /** Additional filter conditions beyond branchId */
  conditions?: QueryCondition[];
  /** Field to order by (default: createdAt desc) */
  orderByField?: string;
  orderByDir?: "asc" | "desc";
  /** Set to false to skip branchId filter (e.g., super_admin global views) */
  filterByBranch?: boolean;
}

export interface UseFirestoreCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useFirestoreCollection<T extends DocumentData & { id?: string }>(
  collectionName: string,
  branchId: string | null | undefined,
  options: UseFirestoreCollectionOptions = {}
): UseFirestoreCollectionResult<T> {
  const {
    conditions = [],
    orderByField = "createdAt",
    orderByDir = "desc",
    filterByBranch = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable reference for conditions array to avoid infinite re-renders
  const conditionsRef = useRef(conditions);
  conditionsRef.current = conditions;

  useEffect(() => {
    if (!branchId && filterByBranch) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const constraints: QueryConstraint[] = [];

    // Branch filter
    if (filterByBranch && branchId) {
      constraints.push(where("branchId", "==", branchId));
    }

    // Extra conditions
    conditionsRef.current.forEach(c => {
      constraints.push(where(c.field, c.operator, c.value));
    });

    // Try with orderBy first; fall back silently if index is missing
    const buildQuery = (withOrder: boolean) =>
      query(
        collection(db, collectionName),
        ...constraints,
        ...(withOrder ? [orderBy(orderByField, orderByDir)] : [])
      );

    // Track active unsubscribe so we can swap cleanly on fallback
    let activeUnsub: (() => void) | null = null;

    const startFallback = () => {
      console.warn(
        `[useFirestoreCollection] Missing Firestore index for '${collectionName}' ordered by '${orderByField}'. ` +
        "Falling back to unordered query."
      );
      // Clean up the failed ordered listener first
      if (activeUnsub) { activeUnsub(); activeUnsub = null; }

      activeUnsub = onSnapshot(
        buildQuery(false),
        (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T));
          setData(docs);
          setLoading(false);
        },
        (fallbackErr) => {
          console.error(`[useFirestoreCollection] Fatal error on '${collectionName}':`, fallbackErr);
          setError("Failed to load data. Please try again.");
          setLoading(false);
        }
      );
    };

    activeUnsub = onSnapshot(
      buildQuery(true),
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        if (err.code === "failed-precondition") {
          startFallback();
        } else {
          console.error(`[useFirestoreCollection] Error on '${collectionName}':`, err);
          setError("Failed to load data. Please try again.");
          setLoading(false);
        }
      }
    );

    return () => { if (activeUnsub) activeUnsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, branchId, filterByBranch, orderByField, orderByDir]);

  return { data, loading, error };
}
