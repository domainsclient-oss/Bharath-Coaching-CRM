/**
 * Where a session belongs.
 *
 * The app has two front doors — /login for staff and /student-login for
 * students — and two homes behind them. Keeping the rule in one pure function
 * means the provider, the route guards and any future entry point all agree,
 * and the rule can be exercised without a Firebase session.
 */

export const STAFF_LOGIN = '/login';
export const STUDENT_LOGIN = '/student-login';
export const STAFF_HOME = '/admin/dashboard';
export const STUDENT_HOME = '/student/dashboard';

/** The students' front door. */
export const isStudentDoor = (pathname: string): boolean => pathname === STUDENT_LOGIN;

/** The staff front door, plus the first-run wizard that only staff complete. */
export const isStaffDoor = (pathname: string): boolean =>
  pathname === STAFF_LOGIN ||
  pathname === '/register' ||
  pathname === '/setup' ||
  pathname.startsWith('/setup/');

export const isAuthRoute = (pathname: string): boolean =>
  isStudentDoor(pathname) || isStaffDoor(pathname);

/** Where the home page sends a session that has already signed in. */
export const homeFor = (role?: string | null): string =>
  role === 'student' ? STUDENT_HOME : STAFF_HOME;

/**
 * The path this session should be moved to, or null to leave it where it is.
 *
 * A signed-in user skips a login screen only at their *own* door. Bouncing
 * everyone to the home their role implies made /student-login unreachable
 * while a staff session was open — it jumped straight to the CRM, so a student
 * could not be signed in without logging the admin out first. Signing in
 * replaces the session anyway, so at the other door we simply show the form.
 */
export function resolveAuthRedirect(
  pathname: string,
  // The session itself, not its role: a signed-in account whose document has
  // lost its role field is still signed in, and must not be read as a visitor.
  session: { role?: string | null } | null | undefined,
): string | null {
  const isStudent = session?.role === 'student';

  if (!session) {
    // Everything outside the two doors is behind a login.
    if (isAuthRoute(pathname)) return null;
    return pathname.startsWith('/student') ? STUDENT_LOGIN : STAFF_LOGIN;
  }

  if (isStudentDoor(pathname)) return isStudent ? STUDENT_HOME : null;
  if (isStaffDoor(pathname)) return isStudent ? null : STAFF_HOME;

  // The CRM is staff-only. Students who type an /admin URL, follow a stale link
  // or restore a tab go back to their own portal. Firestore rules deny the
  // underlying reads and writes regardless.
  if (isStudent && pathname.startsWith('/admin')) return STUDENT_HOME;

  return null;
}
