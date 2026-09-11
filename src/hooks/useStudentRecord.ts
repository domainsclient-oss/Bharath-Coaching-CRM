"use client";

/**
 * useStudentRecord
 *
 * Resolves the signed-in student to the records the rest of the CRM is keyed by.
 *
 * A student login carries a `studentId` written when the portal account was
 * created. Every student page needs the same three things from it:
 *
 *   studentId  — the `students` document id, used by fees, attendance, homework
 *                submissions and test attempts
 *   student    — the record itself, for name, photo, class and branch
 *   classId    — the matching `classes` document id, used by the timetable
 *
 * The class link needs translating. A student record stores `class` as a bare
 * number ("10"), while `classes` documents are named "Class 10". This mirrors
 * the normalisation the admin attendance screen already does, so both sides
 * agree on which students belong to a class.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { studentService, classService } from '@/services/firestoreService';

/**
 * Reduce a class label to the key both sides of the CRM can agree on.
 *
 * A student record stores a bare number ("9"), while `classes` documents are
 * named by hand and have arrived as "Class 9", "9th", "Class 9 A" and
 * "Std 9 CBSE". The number is the only part every spelling shares, so that is
 * the key. A class whose name carries no number keeps its cleaned-up text.
 */
export const normalizeClassName = (value?: string): string => {
  const text = (value ?? '').replace(/\b(?:class|std|standard|grade)\b\.?/gi, ' ').trim();
  const number = /\b(\d{1,2})(?:st|nd|rd|th)?\b/i.exec(text);
  return number ? number[1] : text.replace(/\s+/g, ' ');
};

export interface StudentRecord {
  /** The `students` document id, or null when the login has no record behind it. */
  studentId: string | null;
  student: any | null;
  /** Bare class number, e.g. "10". */
  className: string;
  /** The `classes` document id for that class, when one exists. */
  classId: string | null;
  branchId: string;
  loading: boolean;
  /** Set when the login resolves to no student record at all. */
  unlinked: boolean;
}

export function useStudentRecord(): StudentRecord {
  const { user } = useAuth();
  const [state, setState] = useState<StudentRecord>({
    studentId: null, student: null, className: '', classId: null,
    branchId: '', loading: true, unlinked: false,
  });

  const studentId = (user as any)?.studentId ?? user?.uid ?? null;

  useEffect(() => {
    let cancelled = false;

    if (!studentId) {
      setState(s => ({ ...s, loading: false, unlinked: true }));
      return;
    }

    const load = async () => {
      try {
        const student = await studentService.getById(studentId);
        if (cancelled) return;

        if (!student) {
          setState({
            studentId, student: null, className: '', classId: null,
            branchId: '', loading: false, unlinked: true,
          });
          return;
        }

        const className = normalizeClassName((student as any).class);
        const branchId = (student as any).branchId ?? '';

        // Match the class by name. The same class number exists once per board
        // and once per branch — a Class 9 CBSE and a Class 9 State both sit in
        // the collection — so narrow by branch and then by board before
        // settling for the first name match. A missing `classes` document is
        // not fatal: only the timetable needs the id, and it degrades to
        // "not published".
        let classId: string | null = null;
        if (className) {
          const classes = await classService.getAll().catch(() => []);
          const board = String((student as any).board ?? '').trim().toLowerCase();

          const sameName = classes.filter(
            (c: any) => normalizeClassName(c.name) === className
          );
          const inBranch = branchId
            ? sameName.filter((c: any) => !(c as any).branchId || (c as any).branchId === branchId)
            : sameName;
          const pool = inBranch.length > 0 ? inBranch : sameName;
          const match =
            (board
              ? pool.find((c: any) => String(c.board ?? '').trim().toLowerCase() === board)
              : undefined) ?? pool[0];

          classId = match ? (match as any).id : null;
        }

        if (cancelled) return;
        setState({ studentId, student, className, classId, branchId, loading: false, unlinked: false });
      } catch (err) {
        console.error('Could not load student record:', err);
        if (!cancelled) {
          setState({
            studentId, student: null, className: '', classId: null,
            branchId: '', loading: false, unlinked: true,
          });
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [studentId]);

  return state;
}
