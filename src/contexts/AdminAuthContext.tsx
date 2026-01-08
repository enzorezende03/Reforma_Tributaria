import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Admin {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  permissions: string[];
}

interface AdminAuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  setMustChangePassword: (value: boolean) => void;
  hasPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setMustChangePassword = (value: boolean) => {
    if (admin) {
      setAdmin({ ...admin, mustChangePassword: value });
    }
  };

  const checkAdminRole = async (user: User): Promise<Admin | null> => {
    try {
      // Verificar se o usuário tem role de admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        console.error('[admin-auth] Erro ao verificar role:', roleError);
        return null;
      }

      if (!roleData) {
        return null;
      }

      // Buscar dados do admin usando a view segura (exclui password_hash)
      const { data: adminData, error: adminError } = await supabase
        .from('admins_safe')
        .select('id, email, name, must_change_password, permissions')
        .eq('email', user.email)
        .maybeSingle();

      if (adminError) {
        console.warn('[admin-auth] Erro ao buscar admins_safe, usando fallback:', adminError);
      }

      if (adminData) {
        return {
          id: adminData.id,
          email: adminData.email,
          name: adminData.name,
          mustChangePassword: adminData.must_change_password ?? true,
          permissions: adminData.permissions || [],
        };
      }

      // Se não existe/retornou na view, usar dados do auth com permissões completas
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || 'Admin',
        mustChangePassword: true,
        permissions: ['view_clients', 'manage_clients', 'view_news', 'manage_news', 'manage_team'],
      };
    } catch (err) {
      console.error('[admin-auth] checkAdminRole erro:', err);
      return null;
    }
  };

  useEffect(() => {
    const handleSessionUser = (user: User) => {
      // IMPORTANTE: não travar o fluxo de login aguardando consultas no callback do auth
      setIsLoading(true);
      void checkAdminRole(user)
        .then((adminData) => {
          setAdmin(adminData);
        })
        .catch((err) => {
          console.error('[admin-auth] Erro ao carregar admin após login:', err);
          setAdmin(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        handleSessionUser(session.user);
        return;
      }

      setAdmin(null);
      setIsLoading(false);
    });

    // Then check initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          handleSessionUser(session.user);
          return;
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[admin-auth] Erro ao recuperar sessão:', err);
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email ou senha incorretos' };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Erro ao fazer login' };
      }

      // Verificar se tem role de admin
      const adminData = await checkAdminRole(data.user);

      if (!adminData) {
        await supabase.auth.signOut();
        return { success: false, error: 'Você não tem permissão de administrador' };
      }

      setAdmin(adminData);
      return { success: true };
    } catch (err) {
      console.error('Admin login error:', err);
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!admin) return false;
    return admin.permissions.includes(permission);
  };

  return (
    <AdminAuthContext.Provider value={{ 
      admin, 
      isAuthenticated: !!admin, 
      login, 
      logout,
      isLoading,
      setMustChangePassword,
      hasPermission
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
