import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Admin {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
}

interface AdminAuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  setMustChangePassword: (value: boolean) => void;
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

  const withTimeout = async <T,>(
    promise: Promise<T>,
    ms: number,
    timeoutMessage: string
  ): Promise<T> => {
    let timeoutId: number | undefined;

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, ms);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  const checkAdminRole = async (user: User): Promise<Admin | null> => {
    try {
      // Verificar se o usuário tem role de admin
      const roleRes = await withTimeout(
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle(),
        12000,
        'Tempo esgotado ao verificar permissão de administrador'
      );

      if (roleRes.error) {
        console.error('[admin-auth] Erro ao verificar role:', roleRes.error);
        return null;
      }

      if (!roleRes.data) {
        return null;
      }

      // Buscar dados do admin usando a view segura (exclui password_hash)
      let adminRes:
        | Awaited<ReturnType<typeof supabase.from<'admins_safe'>['maybeSingle']>>
        | null = null;

      try {
        adminRes = await withTimeout(
          supabase
            .from('admins_safe')
            .select('id, email, name, must_change_password')
            .eq('email', user.email)
            .maybeSingle(),
          12000,
          'Tempo esgotado ao buscar dados do administrador'
        );
      } catch (err) {
        console.warn('[admin-auth] Falha ao buscar admins_safe, usando fallback:', err);
      }

      if (adminRes?.error) {
        console.warn('[admin-auth] Erro ao buscar admins_safe, usando fallback:', adminRes.error);
      }

      if (adminRes?.data) {
        return {
          id: adminRes.data.id,
          email: adminRes.data.email,
          name: adminRes.data.name,
          mustChangePassword: adminRes.data.must_change_password ?? true,
        };
      }

      // Se não existe/retornou na view, usar dados do auth
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || 'Admin',
        mustChangePassword: true,
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
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        }),
        15000,
        'Tempo esgotado ao autenticar. Verifique sua conexão e tente novamente.'
      );

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

  return (
    <AdminAuthContext.Provider value={{ 
      admin, 
      isAuthenticated: !!admin, 
      login, 
      logout,
      isLoading,
      setMustChangePassword
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
