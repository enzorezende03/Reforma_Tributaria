import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface Client {
  id: string;
  cnpj: string;
  company_name: string;
  email?: string | null;
  mustSetPassword: boolean;
}

// Clientes ficam conectados por no máximo 7 dias desde a entrada
export const CLIENT_SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000;

interface AuthContextType {
  client: Client | null;
  isAuthenticated: boolean;
  requestCode: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  markPasswordSet: () => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasSession: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const isSessionTooOld = (lastSignInAt: string | undefined, now = Date.now()) =>
  !!lastSignInAt && now - new Date(lastSignInAt).getTime() > CLIENT_SESSION_MAX_MS;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadClient = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setClient(null);
      setHasSession(false);
      setIsLoading(false);
      return;
    }
    if (isSessionTooOld(session.user.last_sign_in_at)) {
      await supabase.auth.signOut();
      return;
    }
    setHasSession(true);
    const { data } = await supabase
      .from('clients_safe')
      .select('id, cnpj, company_name, email, is_active, must_set_password')
      .eq('user_id', session.user.id)
      .maybeSingle();
    setClient(data && data.is_active ? { id: data.id!, cnpj: data.cnpj!, company_name: data.company_name!, email: data.email, mustSetPassword: data.must_set_password ?? true } : null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void loadClient(session), 0);
    });
    supabase.auth.getSession().then(({ data: { session } }) => loadClient(session));
    return () => subscription.unsubscribe();
  }, [loadClient]);

  const requestCode = async (email: string) => {
    const { data, error } = await supabase.functions.invoke('request-login-code', {
      body: { email: email.trim().toLowerCase() },
    });
    if (error) return { success: false, error: 'Não foi possível enviar o código. Tente novamente.' };
    return { success: true, message: (data as { message?: string })?.message };
  };

  const verifyCode = async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });
    if (error) return { success: false, error: 'Código inválido ou expirado' };
    return { success: true };
  };

  const loginWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return { success: false, error: 'Email ou senha incorretos' };
    return { success: true };
  };

  const markPasswordSet = () => setClient((c) => (c ? { ...c, mustSetPassword: false } : c));

  const logout = async () => {
    await supabase.auth.signOut();
    setClient(null);
  };

  return (
    <AuthContext.Provider value={{ client, isAuthenticated: !!client, requestCode, verifyCode, loginWithPassword, markPasswordSet, logout, isLoading, hasSession }}>
      {children}
    </AuthContext.Provider>
  );
};
