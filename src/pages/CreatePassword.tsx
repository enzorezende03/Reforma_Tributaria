import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateClientPassword } from '@/lib/passwordRule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import logo2m from '@/assets/logo-2m.png';

const CreatePassword = () => {
  const { client, isLoading, markPasswordSet, logout } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (isLoading) return null;
  if (!client) return <Navigate to="/login" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const rule = validateClientPassword(pw);
    if (rule) return setError(rule);
    if (pw !== pw2) return setError('As senhas não conferem');
    setSaving(true);
    const { error: upErr } = await supabase.auth.updateUser({ password: pw });
    if (upErr) {
      setSaving(false);
      return setError(upErr.message.includes('different') ? 'Escolha uma senha diferente da anterior' : 'Não foi possível salvar a senha. Tente outra.');
    }
    await supabase.rpc('mark_password_set');
    markPasswordSet();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95">
        <CardHeader className="text-center space-y-4">
          <img src={logo2m} alt="2M Contabilidade" className="h-20 w-auto mx-auto" />
          <CardTitle className="text-2xl font-bold text-gray-800">Crie sua senha</CardTitle>
          <CardDescription>Mínimo de 8 caracteres, com letras e números. Você vai usá-la nos próximos acessos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="pw">Nova senha</Label>
              <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Confirme a senha</Label>
              <Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="h-12" />
            </div>
            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar senha e entrar'}
            </Button>
            <button type="button" className="text-sm text-gray-500 hover:underline w-full" onClick={async () => { await logout(); navigate('/login'); }}>
              Sair
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePassword;
