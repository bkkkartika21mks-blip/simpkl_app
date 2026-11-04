import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types/database';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { dataService } from '../services/dataService';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  supervisorId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isSupervisor: boolean;
  isHeadmaster: boolean;
  canEditOperations: boolean;
  canManageUsers: boolean;
  canEditMonitoring: boolean;
  login: (email: string, password?: string, simulatedRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
}

const DEFAULT_USERS_BY_ROLE: Record<UserRole, AuthUser> = {
  admin: {
    id: 'usr-admin-1',
    name: 'Administrator SIMPKL',
    email: 'admin@simpkl.id',
    role: 'admin',
  },
  operator: {
    id: 'usr-op-1',
    name: 'Budi Hartono (Operator PKL)',
    email: 'operator@simpkl.id',
    role: 'operator',
  },
  school_supervisor: {
    id: 'usr-sup-1',
    name: 'Ahmad Fauzi, S.Kom. (Pembimbing)',
    email: 'ahmad.fauzi@smkn1surabaya.sch.id',
    role: 'school_supervisor',
    supervisorId: 'sup-1',
  },
  headmaster: {
    id: 'usr-head-1',
    name: 'Dr. H. Bambang Sudarsono, M.Pd. (Kepala Sekolah)',
    email: 'kepsek@smkn1surabaya.sch.id',
    role: 'headmaster',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('simpkl_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_USERS_BY_ROLE.admin;
      }
    }
    return DEFAULT_USERS_BY_ROLE.admin; // Start logged in as Admin for easy evaluation
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('simpkl_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('simpkl_current_user');
    }
  }, [user]);

  const login = async (email: string, password?: string, simulatedRole?: UserRole) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim();
      const lower = cleanEmail.toLowerCase();

      if (isSupabaseConfigured && supabase && password) {
        // Authenticate with real Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;

        // Fetch role from user_roles
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        const role: UserRole = roleData?.role || 'operator';

        const authUser: AuthUser = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          email: data.user.email || cleanEmail,
          role,
        };
        setUser(authUser);
        return;
      }

      // Check registered users in dataService (local simulation storage)
      const allUsers = await dataService.getUsers();
      const matchedUser = allUsers.find(
        u =>
          u.profile.email.toLowerCase() === lower ||
          (lower === 'admin' && u.role.role === 'admin') ||
          (lower === 'operator' && u.role.role === 'operator')
      );

      if (matchedUser) {
        if (!matchedUser.profile.is_active) {
          throw new Error('Akun ini telah dinonaktifkan oleh Administrator.');
        }

        setUser({
          id: matchedUser.profile.id,
          name: matchedUser.profile.full_name,
          email: matchedUser.profile.email,
          role: matchedUser.role.role,
        });
        return;
      }

      // Local / Offline authentication mode with role selection fallback
      const targetRole: UserRole =
        simulatedRole ||
        (lower.includes('admin')
          ? 'admin'
          : lower.includes('operator')
          ? 'operator'
          : lower.includes('pembimbing') || lower.includes('fauzi')
          ? 'school_supervisor'
          : lower.includes('kepsek')
          ? 'headmaster'
          : 'admin');

      const template = DEFAULT_USERS_BY_ROLE[targetRole];
      setUser({
        ...template,
        email: cleanEmail || template.email,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    const template = DEFAULT_USERS_BY_ROLE[newRole];
    setUser(template);
  };

  const role: UserRole = user?.role || 'operator';
  const isAdmin = role === 'admin';
  const isOperator = role === 'operator';
  const isSupervisor = role === 'school_supervisor';
  const isHeadmaster = role === 'headmaster';

  const canEditOperations = isAdmin || isOperator;
  const canManageUsers = isAdmin;
  const canEditMonitoring = isAdmin || isOperator || isSupervisor;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: Boolean(user),
        isLoading,
        isAdmin,
        isOperator,
        isSupervisor,
        isHeadmaster,
        canEditOperations,
        canManageUsers,
        canEditMonitoring,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
