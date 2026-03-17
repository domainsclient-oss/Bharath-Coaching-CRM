
'use client';

import { useAuth } from '../lib/auth-context';
import { ReactNode } from 'react';

type RoleBasedAccessProps = {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode; // Optional fallback component or message
};

export default function RoleBasedAccess({ allowedRoles, children, fallback = null }: RoleBasedAccessProps) {
  const { user } = useAuth();

  if (!user || !user.role) {
    return fallback; // User is not logged in or has no role
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback; // User's role is not in the allowed list
  }

  return <>{children}</>;
}

/**
 * A more specific component for showing a standardized "Access Denied" message.
 */
export const AccessDenied = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-yellow-100 border-2 border-yellow-300 rounded-lg">
            <h2 className="text-xl font-bold text-yellow-800">Access Denied</h2>
            <p className="text-yellow-700 mt-2">You do not have the required permissions to view this content.</p>
        </div>
    );
}


