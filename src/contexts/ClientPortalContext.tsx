import React, { createContext, useContext, ReactNode } from 'react';

interface ClientPortalContextType {
  /** The effective user ID for data queries — the viewed client's ID when admin is previewing, otherwise the logged-in user's ID */
  effectiveUserId: string;
  /** Whether the current session is an admin preview */
  isAdminPreview: boolean;
}

const ClientPortalContext = createContext<ClientPortalContextType | undefined>(undefined);

export function ClientPortalProvider({
  effectiveUserId,
  isAdminPreview,
  children,
}: ClientPortalContextType & { children: ReactNode }) {
  return (
    <ClientPortalContext.Provider value={{ effectiveUserId, isAdminPreview }}>
      {children}
    </ClientPortalContext.Provider>
  );
}

/**
 * Returns the effective user ID for client portal data queries.
 * When an admin previews a client's portal, this returns the client's ID, not the admin's.
 */
export function useClientPortalIdentity() {
  const ctx = useContext(ClientPortalContext);
  if (!ctx) {
    throw new Error('useClientPortalIdentity must be used within a ClientPortalProvider');
  }
  return ctx;
}
