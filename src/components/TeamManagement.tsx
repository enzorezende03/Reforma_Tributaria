import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Users2,
  Search,
  AlertCircle,
  Shield,
  Eye,
  FileEdit,
  Newspaper,
  UserCog
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  permissions: string[];
  created_at: string;
}

const PERMISSION_OPTIONS = [
  { id: 'view_clients', label: 'Visualizar Clientes', icon: Eye, description: 'Ver lista de clientes' },
  { id: 'manage_clients', label: 'Gerenciar Clientes', icon: FileEdit, description: 'Criar, editar e excluir clientes' },
  { id: 'view_news', label: 'Visualizar Notícias', icon: Newspaper, description: 'Ver lista de notícias' },
  { id: 'manage_news', label: 'Gerenciar Notícias', icon: FileEdit, description: 'Criar, editar e excluir notícias' },
  { id: 'manage_team', label: 'Gerenciar Equipe', icon: UserCog, description: 'Cadastrar e gerenciar colaboradores' },
];

export const TeamManagement = () => {
  const { toast } = useToast();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('admins_safe')
      .select('*')
      .order('name');
    
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a equipe',
        variant: 'destructive',
      });
    } else {
      setMembers(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPermissions([]);
    setFormError('');
  };

  const togglePermission = (permissionId: string) => {
    setFormPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleAddMember = async () => {
    setFormError('');
    
    if (!formName.trim()) {
      setFormError('Digite o nome do colaborador');
      return;
    }
    
    if (!formEmail.trim()) {
      setFormError('Digite o email do colaborador');
      return;
    }
    
    if (!formPassword.trim() || formPassword.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formPermissions.length === 0) {
      setFormError('Selecione pelo menos uma permissão');
      return;
    }

    setIsSubmitting(true);

    try {
      const email = formEmail.toLowerCase().trim();
      const name = formName.trim();

      const { data, error } = await supabase.functions.invoke('admin-create-team-member', {
        body: {
          email,
          name,
          password: formPassword,
          permissions: formPermissions,
        },
      });

      if (error) {
        // Quando a function retorna 4xx, o supabase-js pode preencher error.message
        setFormError(error.message || 'Erro ao cadastrar colaborador');
        setIsSubmitting(false);
        return;
      }

      const result = data as unknown as { success?: boolean; error?: string };

      if (result?.success === false) {
        setFormError(result.error || 'Erro ao cadastrar colaborador');
        setIsSubmitting(false);
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Colaborador cadastrado com sucesso. Ele já pode acessar o painel com este email e senha.',
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchMembers();
    } catch (err) {
      console.error('Erro ao criar colaborador:', err);
      setFormError('Erro inesperado ao cadastrar colaborador');
    }

    setIsSubmitting(false);
  };

  const handleEditMember = async () => {
    if (!selectedMember) return;
    setFormError('');
    
    if (!formName.trim()) {
      setFormError('Digite o nome do colaborador');
      return;
    }

    if (formPermissions.length === 0) {
      setFormError('Selecione pelo menos uma permissão');
      return;
    }

    setIsSubmitting(true);

    const updateData: { name: string; permissions: string[]; password_hash?: string; must_change_password?: boolean } = {
      name: formName.trim(),
      permissions: formPermissions,
    };

    // Se a senha foi alterada
    if (formPassword.trim()) {
      if (formPassword.length < 6) {
        setFormError('A senha deve ter pelo menos 6 caracteres');
        setIsSubmitting(false);
        return;
      }

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
      .from('admins')
      .update(updateData)
      .eq('id', selectedMember.id);

    if (error) {
      setFormError('Erro ao atualizar colaborador');
    } else {
      toast({
        title: 'Sucesso',
        description: 'Colaborador atualizado com sucesso',
      });
      setIsEditModalOpen(false);
      resetForm();
      fetchMembers();
    }

    setIsSubmitting(false);
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    setIsSubmitting(true);

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', selectedMember.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o colaborador',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Colaborador excluído com sucesso',
      });
      setIsDeleteModalOpen(false);
      fetchMembers();
    }

    setIsSubmitting(false);
  };

  const handleToggleActive = async (member: TeamMember) => {
    const { error } = await supabase
      .from('admins')
      .update({ is_active: !member.is_active })
      .eq('id', member.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status',
        variant: 'destructive',
      });
    } else {
      fetchMembers();
    }
  };

  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setFormName(member.name);
    setFormEmail(member.email);
    setFormPassword('');
    setFormPermissions(member.permissions || []);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isFullAdmin = (permissions: string[]) => {
    return permissions?.includes('manage_team') && 
           permissions?.includes('manage_clients') && 
           permissions?.includes('manage_news');
  };

  const getPermissionLabel = (permId: string) => {
    const perm = PERMISSION_OPTIONS.find(p => p.id === permId);
    return perm?.label || permId;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            Gerenciar Equipe
          </CardTitle>
          <CardDescription>Cadastre colaboradores com permissões personalizadas</CardDescription>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Colaborador</DialogTitle>
              <DialogDescription>Adicione um novo membro à equipe com permissões específicas</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Nome completo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Senha *</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label>Permissões *</Label>
                <div className="space-y-2 border rounded-lg p-3">
                  {PERMISSION_OPTIONS.map((perm) => (
                    <div
                      key={perm.id}
                      className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                        formPermissions.includes(perm.id) ? 'bg-blue-50' : 'hover:bg-muted'
                      }`}
                      onClick={() => togglePermission(perm.id)}
                    >
                      <Checkbox
                        checked={formPermissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <perm.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{perm.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddMember} disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Nenhum colaborador encontrado' : 'Nenhum colaborador cadastrado'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isFullAdmin(member.permissions) ? (
                        <Shield className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Users2 className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {isFullAdmin(member.permissions) ? (
                        <Badge className="bg-blue-600">Admin Completo</Badge>
                      ) : (
                        <>
                          {member.permissions?.slice(0, 2).map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {getPermissionLabel(perm)}
                            </Badge>
                          ))}
                          {member.permissions?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{member.permissions.length - 2}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={member.is_active}
                        onCheckedChange={() => handleToggleActive(member)}
                      />
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(member)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(member)}
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
        )}
      </CardContent>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
            <DialogDescription>Atualize os dados e permissões do colaborador</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome completo"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formEmail} disabled className="bg-gray-100" />
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
            <div className="space-y-3">
              <Label>Permissões *</Label>
              <div className="space-y-2 border rounded-lg p-3">
                {PERMISSION_OPTIONS.map((perm) => (
                  <div
                    key={perm.id}
                    className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                      formPermissions.includes(perm.id) ? 'bg-blue-50' : 'hover:bg-muted'
                    }`}
                    onClick={() => togglePermission(perm.id)}
                  >
                    <Checkbox
                      checked={formPermissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <perm.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{perm.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditMember} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Colaborador</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{selectedMember?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteMember} disabled={isSubmitting}>
              {isSubmitting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
