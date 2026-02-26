import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  LogOut, 
  Plus, 
  Pencil, 
  Trash2, 
  Building2, 
  Users, 
  Shield,
  Search,
  AlertCircle,
  CheckCircle,
  UserPlus,
  KeyRound,
  Newspaper,
  Users2,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import AdminInviteModal from '@/components/AdminInviteModal';
import ClientResetPasswordModal from '@/components/ClientResetPasswordModal';
import { NewsManagement } from '@/components/NewsManagement';
import { TeamManagement } from '@/components/TeamManagement';
import { ClientImportModal } from '@/components/ClientImportModal';

interface Client {
  id: string;
  cnpj: string;
  company_name: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const { admin, logout, setMustChangePassword, hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const defaultTab = hasPermission('view_clients') || hasPermission('manage_clients') ? 'clients' : 'news';
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('admin-active-tab') || defaultTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('admin-active-tab', value);
  };
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Form states
  const [formCnpj, setFormCnpj] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('clients_safe')
      .select('*')
      .order('company_name');
    
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os clientes',
        variant: 'destructive',
      });
    } else {
      setClients(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  const resetForm = () => {
    setFormCnpj('');
    setFormCompanyName('');
    setFormPassword('');
    setFormError('');
  };

  const handleAddClient = async () => {
    setFormError('');
    
    const cnpjNumbers = formCnpj.replace(/\D/g, '');
    if (cnpjNumbers.length !== 14) {
      setFormError('CNPJ deve ter 14 dígitos');
      return;
    }
    
    if (!formCompanyName.trim()) {
      setFormError('Digite o nome da empresa');
      return;
    }
    
    if (!formPassword.trim()) {
      setFormError('Digite uma senha');
      return;
    }

    setIsSubmitting(true);

    // Hash the password before storing
    const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
      password: formPassword,
    });

    if (hashError || !hashedPassword) {
      setFormError('Erro ao processar senha');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('clients').insert({
      cnpj: cnpjNumbers,
      company_name: formCompanyName.trim(),
      password_hash: hashedPassword,
      must_change_password: true,
    });

    if (error) {
      if (error.code === '23505') {
        setFormError('Este CNPJ já está cadastrado');
      } else {
        setFormError('Erro ao cadastrar cliente');
      }
    } else {
      toast({
        title: 'Sucesso',
        description: 'Cliente cadastrado com sucesso. Ele deverá alterar a senha no primeiro acesso.',
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchClients();
    }

    setIsSubmitting(false);
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;
    setFormError('');
    
    if (!formCompanyName.trim()) {
      setFormError('Digite o nome da empresa');
      return;
    }

    setIsSubmitting(true);

    const updateData: { company_name: string; password_hash?: string; must_change_password?: boolean } = {
      company_name: formCompanyName.trim(),
    };

    // If password is being changed, hash it
    if (formPassword.trim()) {
      const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
        password: formPassword,
      });

      if (hashError || !hashedPassword) {
        setFormError('Erro ao processar senha');
        setIsSubmitting(false);
        return;
      }
      
      updateData.password_hash = hashedPassword;
      updateData.must_change_password = true;
    }

    const { error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', selectedClient.id);

    if (error) {
      setFormError('Erro ao atualizar cliente');
    } else {
      toast({
        title: 'Sucesso',
        description: formPassword.trim() 
          ? 'Cliente atualizado. Ele deverá alterar a senha no próximo acesso.' 
          : 'Cliente atualizado com sucesso',
      });
      setIsEditModalOpen(false);
      resetForm();
      fetchClients();
    }

    setIsSubmitting(false);
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    
    setIsSubmitting(true);

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', selectedClient.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o cliente',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Cliente excluído com sucesso',
      });
      setIsDeleteModalOpen(false);
      fetchClients();
    }

    setIsSubmitting(false);
  };

  const handleToggleActive = async (client: Client) => {
    const { error } = await supabase
      .from('clients')
      .update({ is_active: !client.is_active })
      .eq('id', client.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status',
        variant: 'destructive',
      });
    } else {
      fetchClients();
    }
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setFormCnpj(formatCnpj(client.cnpj));
    setFormCompanyName(client.company_name);
    setFormPassword('');
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const openResetPasswordModal = (client: Client) => {
    setSelectedClient(client);
    setIsResetPasswordModalOpen(true);
  };

  const filteredClients = clients.filter(client => 
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cnpj.includes(searchTerm.replace(/\D/g, ''))
  );

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de troca de senha obrigatória */}
      <ChangePasswordModal
        isOpen={admin?.mustChangePassword ?? false}
        onPasswordChanged={handlePasswordChanged}
        adminEmail={admin?.email ?? ''}
      />
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Painel Administrativo</h1>
              <p className="text-xs sm:text-sm text-slate-300">Gerenciamento de Clientes</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <span className="text-xs sm:text-sm text-slate-300 hidden sm:inline">
              Olá, <span className="font-medium text-white">{admin?.name}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-slate-300 hover:text-white hover:bg-slate-700 text-xs sm:text-sm h-8 px-2 sm:px-3"
              title="Ver painel do cliente"
            >
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ver como Cliente</span>
            </Button>
            {hasPermission('manage_team') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsInviteModalOpen(true)}
                className="text-slate-300 hover:text-white hover:bg-slate-700 text-xs sm:text-sm h-8 px-2 sm:px-3"
              >
                <UserPlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Convidar Admin</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-300 hover:text-white hover:bg-slate-700 text-xs sm:text-sm h-8 px-2 sm:px-3"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6 overflow-x-hidden">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Clientes</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Clientes Ativos</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.is_active).length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Clientes Inativos</p>
                <p className="text-2xl font-bold">{clients.filter(c => !c.is_active).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Clients, News and Team */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="flex flex-wrap h-auto gap-1">
            {(hasPermission('view_clients') || hasPermission('manage_clients')) && (
              <TabsTrigger value="clients" className="gap-2 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                Clientes
              </TabsTrigger>
            )}
            {(hasPermission('view_news') || hasPermission('manage_news')) && (
              <TabsTrigger value="news" className="gap-2 text-xs sm:text-sm">
                <Newspaper className="h-4 w-4" />
                Notícias
              </TabsTrigger>
            )}
            {hasPermission('manage_team') && (
              <TabsTrigger value="team" className="gap-2 text-xs sm:text-sm">
                <Users2 className="h-4 w-4" />
                Equipe
              </TabsTrigger>
            )}
          </TabsList>

          {(hasPermission('view_clients') || hasPermission('manage_clients')) && (
          <TabsContent value="clients">
            {/* Clients Table */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Clientes Cadastrados</CardTitle>
                  <CardDescription>Gerencie os acessos dos seus clientes</CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setIsImportModalOpen(true)}
                    className="text-xs sm:text-sm flex-1 sm:flex-none"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1 sm:mr-2" />
                    Importar
                  </Button>
                  <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm flex-1 sm:flex-none">
                        <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                        Novo Cliente
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                      <DialogDescription>Preencha os dados do cliente</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {formError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                      )}
                      <div className="space-y-2">
                        <Label>CNPJ</Label>
                        <Input
                          placeholder="00.000.000/0000-00"
                          value={formCnpj}
                          onChange={(e) => setFormCnpj(formatCnpj(e.target.value))}
                          maxLength={18}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nome da Empresa</Label>
                        <Input
                          placeholder="Razão Social"
                          value={formCompanyName}
                          onChange={(e) => setFormCompanyName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Senha</Label>
                        <Input
                          type="password"
                          placeholder="Senha de acesso"
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                      <Button onClick={handleAddClient} disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando...' : 'Cadastrar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                </div>
                <ClientImportModal
                  isOpen={isImportModalOpen}
                  onOpenChange={setIsImportModalOpen}
                  onImportComplete={fetchClients}
                />
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome ou CNPJ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Table */}
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </div>
                ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead className="hidden sm:table-cell">CNPJ</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{client.company_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm hidden sm:table-cell">
                            {formatCnpj(client.cnpj)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={client.is_active}
                                onCheckedChange={() => handleToggleActive(client)}
                              />
                              <Badge variant={client.is_active ? 'default' : 'secondary'}>
                                {client.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openResetPasswordModal(client)}
                                title="Resetar Senha"
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(client)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(client)}
                                title="Excluir"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {(hasPermission('view_news') || hasPermission('manage_news')) && (
          <TabsContent value="news">
            <NewsManagement />
          </TabsContent>
          )}

          {hasPermission('manage_team') && (
          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize os dados do cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={formCnpj} disabled className="bg-gray-100" />
            </div>
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input
                placeholder="Razão Social"
                value={formCompanyName}
                onChange={(e) => setFormCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nova Senha (deixe em branco para manter)</Label>
              <Input
                type="password"
                placeholder="Nova senha"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditClient} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cliente "{selectedClient?.company_name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteClient} disabled={isSubmitting}>
              {isSubmitting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Invite Modal */}
      <AdminInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteSent={() => {}}
      />

      {/* Client Reset Password Modal */}
      <ClientResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => {
          setIsResetPasswordModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
      />
    </div>
  );
};

export default AdminDashboard;
