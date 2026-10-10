// Context for User Role in FertiLens Nexus Demo
import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole =
  | 'Clinic Administrator'
  | 'Fertility Specialist'
  | 'Embryologist'
  | 'Nurse / Clinical Coordinator'
  | 'Records Officer';

export interface RolePermissions {
  canViewOverview: boolean;
  canViewPatients: boolean;
  canViewEmbryologyOnly: boolean;
  canManageDocuments: boolean;
  canUploadDocuments: boolean;
  canSearchEvidence: boolean;
  canReviewDiscrepancies: boolean;
  canViewAuditLog: boolean;
  canAccessSettings: boolean;
  description: string;
}

export const ROLE_DEFINITIONS: Record<UserRole, RolePermissions> = {
  'Clinic Administrator': {
    canViewOverview: true,
    canViewPatients: true,
    canViewEmbryologyOnly: false,
    canManageDocuments: true,
    canUploadDocuments: true,
    canSearchEvidence: true,
    canReviewDiscrepancies: true,
    canViewAuditLog: true,
    canAccessSettings: true,
    description: 'Full clinical administration access: overview, document management, reviews, and audit trails.',
  },
  'Fertility Specialist': {
    canViewOverview: true,
    canViewPatients: true,
    canViewEmbryologyOnly: false,
    canManageDocuments: true,
    canUploadDocuments: false,
    canSearchEvidence: true,
    canReviewDiscrepancies: true,
    canViewAuditLog: false,
    canAccessSettings: true,
    description: 'Patient history, clinical timelines, evidence search, and medical discrepancy reconciliation.',
  },
  'Embryologist': {
    canViewOverview: true,
    canViewPatients: true,
    canViewEmbryologyOnly: true,
    canManageDocuments: true,
    canUploadDocuments: false,
    canSearchEvidence: true,
    canReviewDiscrepancies: false,
    canViewAuditLog: false,
    canAccessSettings: true,
    description: 'Laboratory focus: embryology records, fertilization reports, and procedure timeline history.',
  },
  'Nurse / Clinical Coordinator': {
    canViewOverview: true,
    canViewPatients: true,
    canViewEmbryologyOnly: false,
    canManageDocuments: true,
    canUploadDocuments: false,
    canSearchEvidence: true,
    canReviewDiscrepancies: false,
    canViewAuditLog: false,
    canAccessSettings: true,
    description: 'Visit prep, clinical appointment timelines, and outstanding record follow-ups.',
  },
  'Records Officer': {
    canViewOverview: true,
    canViewPatients: true,
    canViewEmbryologyOnly: false,
    canManageDocuments: true,
    canUploadDocuments: true,
    canSearchEvidence: true,
    canReviewDiscrepancies: true,
    canViewAuditLog: true,
    canAccessSettings: true,
    description: 'Document intake, duplicate identification, and patient identity confirmation review.',
  },
};

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  permissions: RolePermissions;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const STORAGE_KEY = 'fertilens_demo_role';

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UserRole | null;
    return saved && ROLE_DEFINITIONS[saved] ? saved : 'Clinic Administrator';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(STORAGE_KEY, newRole);
  };

  const permissions = ROLE_DEFINITIONS[role];

  return (
    <RoleContext.Provider value={{ role, setRole, permissions }}>
      {children}
    </RoleContext.Provider>
  );
};

export function useRole(): RoleContextType {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return ctx;
}
