import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle, CheckCircle2, Database, FileDiff, FileUp, Loader2, Pencil,
  Plus, Save, Send, Trash2, Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { diffTaxRecords, toCstPayload, type CSTRecord, type TaxBaseVersion, type TaxRecordDiff } from "@/lib/taxBase";
import { parseCClassTribWorkbook } from "@/lib/taxBaseImport";
import { fuzzyMatch } from "@/lib/fuzzySearch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const emptyRecord = (vigencia = "2026-01-01"): CSTRecord => ({
  cstCode: "", cstDescription: "", cClassTrib: "", cClassTribName: "",
  cClassTribDescription: "", lcArticle: "", aliquotaType: "Padrão",
  pRedIBS: 0, pRedCBS: 0, dIniVig: vigencia.split("-").reverse().join("/"), link: "",
  ncmCodes: [], requisitosLegais: [],
});

const statusLabel: Record<TaxBaseVersion["status"], string> = {
  rascunho: "Rascunho", publicada: "Publicada", arquivada: "Arquivada",
};

const fieldLabels: Record<string, string> = {
  cstCode: "CST", cstDescription: "Descrição do CST", cClassTribName: "Nome",
  cClassTribDescription: "Descrição", lcArticle: "Artigo", aliquotaType: "Tipo de alíquota",
  pRedIBS: "Redução IBS", pRedCBS: "Redução CBS", dIniVig: "Vigência", link: "Link",
};

export const TaxBaseManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [search, setSearch] = useState("");
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CSTRecord>(emptyRecord());
  const [requirementsText, setRequirementsText] = useState("[]");
  const [isSaving, setIsSaving] = useState(false);
  const [newVersion, setNewVersion] = useState({ versao: "", data_vigencia: "2026-01-01", fonte: "", observacao: "" });
  const [diffs, setDiffs] = useState<TaxRecordDiff[]>([]);
  const [importName, setImportName] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);

  const versionsQuery = useQuery({
    queryKey: ["admin-tax-versions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tax_base_versions").select("*").order("criado_em", { ascending: false });
      if (error) throw error;
      return (data || []) as TaxBaseVersion[];
    },
  });
  const versions = versionsQuery.data || [];
  const selectedVersion = versions.find((version) => version.id === selectedVersionId);
  const isDraft = selectedVersion?.status === "rascunho";

  useEffect(() => {
    if (versions.length && !versions.some((version) => version.id === selectedVersionId)) {
      setSelectedVersionId((versions.find((version) => version.status === "rascunho") || versions[0]).id);
    }
  }, [versions, selectedVersionId]);

  const recordsQuery = useQuery({
    queryKey: ["admin-tax-records", selectedVersionId],
    enabled: Boolean(selectedVersionId),
    queryFn: async () => {
      const { data, error } = await supabase.from("tax_cst_records").select("*").eq("version_id", selectedVersionId).order("cclass_trib");
      if (error) throw error;
      return (data || []).map((row): CSTRecord => ({
        id: row.id, cstCode: row.cst_code, cstDescription: row.cst_description,
        cClassTrib: row.cclass_trib, cClassTribName: row.cclass_trib_name,
        cClassTribDescription: row.cclass_trib_description, lcArticle: row.lc_article,
        aliquotaType: row.aliquota_type, pRedIBS: Number(row.p_red_ibs), pRedCBS: Number(row.p_red_cbs),
        dIniVig: row.d_ini_vig, link: row.link, ncmCodes: row.ncm_codes,
        requisitosLegais: Array.isArray(row.requisitos_legais) ? row.requisitos_legais as unknown as CSTRecord["requisitosLegais"] : [],
      }));
    },
  });
  const records = useMemo(() => recordsQuery.data || [], [recordsQuery.data]);
  const filtered = useMemo(() => records.filter((record) => !search || fuzzyMatch([
    record.cstCode, record.cstDescription, record.cClassTrib, record.cClassTribName, record.cClassTribDescription,
  ].join(" "), search, true)), [records, search]);

  const invalidateRecords = () => queryClient.invalidateQueries({ queryKey: ["admin-tax-records", selectedVersionId] });
  const showError = (error: unknown, title = "Não foi possível concluir") => {
    const description = error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Tente novamente.";
    toast({ title, description, variant: "destructive" });
  };

  const createDraft = async () => {
    if (!newVersion.versao.trim() || !newVersion.fonte.trim() || !newVersion.data_vigencia) {
      toast({ title: "Preencha versão, vigência e fonte", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const { data, error } = await supabase.rpc("create_tax_base_draft", {
      p_versao: newVersion.versao.trim(), p_data_vigencia: newVersion.data_vigencia,
      p_fonte: newVersion.fonte.trim(), p_observacao: newVersion.observacao.trim(),
    });
    setIsSaving(false);
    if (error) return showError(error, "Não foi possível criar a versão");
    setIsNewOpen(false);
    setNewVersion({ versao: "", data_vigencia: "2026-01-01", fonte: "", observacao: "" });
    await queryClient.invalidateQueries({ queryKey: ["admin-tax-versions"] });
    setSelectedVersionId(data);
    toast({ title: "Rascunho criado", description: "A versão publicada foi copiada e continua disponível aos clientes." });
  };

  const saveVersionDetails = async () => {
    if (!selectedVersion || !isDraft) return;
    setIsSaving(true);
    const { error } = await supabase.from("tax_base_versions").update({
      versao: selectedVersion.versao.trim(), data_vigencia: selectedVersion.data_vigencia,
      fonte: selectedVersion.fonte.trim(), observacao: selectedVersion.observacao?.trim() || null,
    }).eq("id", selectedVersion.id);
    setIsSaving(false);
    if (error) return showError(error, "Não foi possível salvar os detalhes");
    await versionsQuery.refetch();
    toast({ title: "Detalhes da versão salvos" });
  };

  const updateSelectedVersion = (field: keyof TaxBaseVersion, value: string) => {
    queryClient.setQueryData<TaxBaseVersion[]>(["admin-tax-versions"], (current) =>
      (current || []).map((version) => version.id === selectedVersionId ? { ...version, [field]: value } : version));
  };

  const openEditor = (record?: CSTRecord) => {
    const value = record ? { ...record } : emptyRecord(selectedVersion?.data_vigencia);
    setEditing(value);
    setRequirementsText(JSON.stringify(value.requisitosLegais || [], null, 2));
    setIsEditorOpen(true);
  };

  const saveRecord = async () => {
    if (!/^\d{3}$/.test(editing.cstCode) || !/^\d{6}$/.test(editing.cClassTrib)) {
      toast({ title: "CST deve ter 3 dígitos e cClassTrib 6 dígitos", variant: "destructive" });
      return;
    }
    if (!editing.cstDescription.trim() || !editing.cClassTribName.trim() || !editing.cClassTribDescription.trim()) {
      toast({ title: "Preencha as descrições obrigatórias", variant: "destructive" });
      return;
    }
    let requirements: CSTRecord["requisitosLegais"];
    try {
      const parsed: unknown = JSON.parse(requirementsText);
      if (!Array.isArray(parsed)) throw new Error("formato");
      requirements = parsed as CSTRecord["requisitosLegais"];
    } catch {
      toast({ title: "Requisitos legais devem estar em uma lista JSON válida", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const payload = toCstPayload({ ...editing, requisitosLegais: requirements }, selectedVersionId);
    const result = editing.id
      ? await supabase.from("tax_cst_records").update(payload).eq("id", editing.id)
      : await supabase.from("tax_cst_records").insert(payload);
    setIsSaving(false);
    if (result.error) return showError(result.error, "Não foi possível salvar o registro");
    setIsEditorOpen(false);
    await invalidateRecords();
    toast({ title: editing.id ? "Registro atualizado" : "Registro incluído" });
  };

  const deleteRecord = async (record: CSTRecord) => {
    if (!record.id || !window.confirm(`Excluir o cClassTrib ${record.cClassTrib} deste rascunho?`)) return;
    const { error } = await supabase.from("tax_cst_records").delete().eq("id", record.id);
    if (error) return showError(error, "Não foi possível excluir");
    await invalidateRecords();
    toast({ title: "Registro removido do rascunho" });
  };

  const readImport = async (file?: File) => {
    if (!file) return;
    setIsSaving(true);
    try {
      const parsed = await parseCClassTribWorkbook(file);
      const currentByCode = new Map(records.map((record) => [record.cClassTrib, record]));
      const merged = parsed.map((record) => {
        const current = currentByCode.get(record.cClassTrib);
        return current ? { ...record, id: current.id, ncmCodes: current.ncmCodes, requisitosLegais: current.requisitosLegais } : record;
      });
      setDiffs(diffTaxRecords(records, merged));
      setImportName(file.name);
      setIsImportOpen(true);
    } catch (error) {
      showError(error, "Não foi possível ler a planilha");
    } finally {
      setIsSaving(false);
    }
  };

  const applyImport = async () => {
    setIsSaving(true);
    try {
      const removedIds = diffs.filter((diff) => diff.type === "removed").map((diff) => diff.current?.id).filter(Boolean) as string[];
      if (removedIds.length) {
        const { error } = await supabase.from("tax_cst_records").delete().in("id", removedIds);
        if (error) throw error;
      }
      const changed = diffs.filter((diff) => diff.type !== "removed").map((diff) => toCstPayload(diff.incoming, selectedVersionId));
      if (changed.length) {
        const { error } = await supabase.from("tax_cst_records").upsert(changed, { onConflict: "version_id,cclass_trib" });
        if (error) throw error;
      }
      setIsImportOpen(false);
      setDiffs([]);
      await invalidateRecords();
      toast({ title: "Planilha aplicada ao rascunho", description: "Revise os dados e publique quando estiver pronto." });
    } catch (error) {
      showError(error, "Não foi possível aplicar a planilha");
    } finally {
      setIsSaving(false);
    }
  };

  const publish = async () => {
    setIsSaving(true);
    const { error } = await supabase.rpc("publish_tax_base_version", { p_version_id: selectedVersionId });
    setIsSaving(false);
    if (error) return showError(error, "Não foi possível publicar");
    setIsPublishOpen(false);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-tax-versions"] }),
      queryClient.invalidateQueries({ queryKey: ["tax-base", "published"] }),
      invalidateRecords(),
    ]);
    toast({ title: "Nova base publicada", description: "A consulta dos clientes já usa esta versão." });
  };

  if (versionsQuery.isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (versionsQuery.error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{versionsQuery.error.message}</AlertDescription></Alert>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Base Tributária</CardTitle>
            <CardDescription>Edite uma cópia em rascunho e publique somente após a revisão.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsNewOpen(true)}><Plus className="mr-2 h-4 w-4" />Nova versão</Button>
            <Button disabled={!isDraft || isSaving} onClick={() => setIsPublishOpen(true)}><Send className="mr-2 h-4 w-4" />Publicar versão</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Versão em edição</Label>
            <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
              <SelectTrigger><SelectValue placeholder="Selecione uma versão" /></SelectTrigger>
              <SelectContent>
                {versions.map((version) => <SelectItem key={version.id} value={version.id}>{version.versao} — {statusLabel[version.status]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedVersion && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isDraft ? "secondary" : "default"}>{statusLabel[selectedVersion.status]}</Badge>
                <span className="text-sm text-muted-foreground">{records.length} registros CST/cClassTrib</span>
                {selectedVersion.publicado_em && <span className="text-sm text-muted-foreground">Publicada em {new Date(selectedVersion.publicado_em).toLocaleDateString("pt-BR")}</span>}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Versão</Label><Input value={selectedVersion.versao} disabled={!isDraft} onChange={(event) => updateSelectedVersion("versao", event.target.value)} /></div>
                <div className="space-y-2"><Label>Data de vigência</Label><Input type="date" value={selectedVersion.data_vigencia} disabled={!isDraft} onChange={(event) => updateSelectedVersion("data_vigencia", event.target.value)} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Fonte</Label><Input placeholder="Ex.: NT 2025.002 v1.xx" value={selectedVersion.fonte} disabled={!isDraft} onChange={(event) => updateSelectedVersion("fonte", event.target.value)} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Observação</Label><Textarea value={selectedVersion.observacao || ""} disabled={!isDraft} onChange={(event) => updateSelectedVersion("observacao", event.target.value)} /></div>
              </div>
              {isDraft && <Button variant="outline" onClick={saveVersionDetails} disabled={isSaving}><Save className="mr-2 h-4 w-4" />Salvar detalhes</Button>}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><CardTitle>Registros CST / cClassTrib</CardTitle><CardDescription>{isDraft ? "Inclua, altere ou remova registros deste rascunho." : "Versão somente para leitura. Crie uma nova versão para editar."}</CardDescription></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!isDraft || isSaving} asChild>
              <label className="cursor-pointer"><FileUp className="mr-2 h-4 w-4" />Importar cClassTrib<input type="file" accept=".xlsx" className="hidden" onChange={(event) => { void readImport(event.target.files?.[0]); event.target.value = ""; }} /></label>
            </Button>
            <Button disabled={!isDraft} onClick={() => openEditor()}><Plus className="mr-2 h-4 w-4" />Novo registro</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Input className="mb-4 max-w-md" placeholder="Buscar por CST, cClassTrib ou descrição..." value={search} onChange={(event) => setSearch(event.target.value)} />
          {recordsQuery.isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>CST</TableHead><TableHead>cClassTrib</TableHead><TableHead>Nome</TableHead><TableHead>IBS / CBS</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((record) => (
                    <TableRow key={record.id || record.cClassTrib}>
                      <TableCell className="font-medium">{record.cstCode}</TableCell>
                      <TableCell className="font-mono">{record.cClassTrib}</TableCell>
                      <TableCell className="max-w-md"><div className="font-medium">{record.cClassTribName}</div><div className="line-clamp-2 text-xs text-muted-foreground">{record.cClassTribDescription}</div></TableCell>
                      <TableCell>{record.pRedIBS}% / {record.pRedCBS}%</TableCell>
                      <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" disabled={!isDraft} onClick={() => openEditor(record)} title="Editar"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" disabled={!isDraft} onClick={() => void deleteRecord(record)} title="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar nova versão</DialogTitle><DialogDescription>A versão publicada será copiada para um rascunho. Nenhuma alteração aparece ao cliente antes da publicação.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Versão *</Label><Input placeholder="Ex.: NT 2025.002 v1.30" value={newVersion.versao} onChange={(event) => setNewVersion({ ...newVersion, versao: event.target.value })} /></div>
            <div className="space-y-2"><Label>Data de vigência *</Label><Input type="date" value={newVersion.data_vigencia} onChange={(event) => setNewVersion({ ...newVersion, data_vigencia: event.target.value })} /></div>
            <div className="space-y-2"><Label>Fonte *</Label><Input placeholder="Documento oficial de origem" value={newVersion.fonte} onChange={(event) => setNewVersion({ ...newVersion, fonte: event.target.value })} /></div>
            <div className="space-y-2"><Label>Observação</Label><Textarea value={newVersion.observacao} onChange={(event) => setNewVersion({ ...newVersion, observacao: event.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancelar</Button><Button onClick={createDraft} disabled={isSaving}>{isSaving ? "Criando..." : "Criar rascunho"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing.id ? "Editar registro" : "Novo registro"}</DialogTitle><DialogDescription>Os campos serão usados na consulta após a publicação desta versão.</DialogDescription></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>CST *</Label><Input maxLength={3} value={editing.cstCode} onChange={(event) => setEditing({ ...editing, cstCode: event.target.value.replace(/\D/g, "") })} /></div>
            <div className="space-y-2"><Label>cClassTrib *</Label><Input maxLength={6} value={editing.cClassTrib} onChange={(event) => setEditing({ ...editing, cClassTrib: event.target.value.replace(/\D/g, "") })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Descrição do CST *</Label><Input value={editing.cstDescription} onChange={(event) => setEditing({ ...editing, cstDescription: event.target.value })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Nome do cClassTrib *</Label><Input value={editing.cClassTribName} onChange={(event) => setEditing({ ...editing, cClassTribName: event.target.value })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Descrição do cClassTrib *</Label><Textarea value={editing.cClassTribDescription} onChange={(event) => setEditing({ ...editing, cClassTribDescription: event.target.value })} /></div>
            <div className="space-y-2"><Label>Artigo da LC</Label><Input value={editing.lcArticle} onChange={(event) => setEditing({ ...editing, lcArticle: event.target.value })} /></div>
            <div className="space-y-2"><Label>Tipo de alíquota</Label><Input value={editing.aliquotaType} onChange={(event) => setEditing({ ...editing, aliquotaType: event.target.value })} /></div>
            <div className="space-y-2"><Label>Redução IBS (%)</Label><Input type="number" min="0" max="100" value={editing.pRedIBS} onChange={(event) => setEditing({ ...editing, pRedIBS: Number(event.target.value) })} /></div>
            <div className="space-y-2"><Label>Redução CBS (%)</Label><Input type="number" min="0" max="100" value={editing.pRedCBS} onChange={(event) => setEditing({ ...editing, pRedCBS: Number(event.target.value) })} /></div>
            <div className="space-y-2"><Label>Início de vigência</Label><Input placeholder="DD/MM/AAAA" value={editing.dIniVig} onChange={(event) => setEditing({ ...editing, dIniVig: event.target.value })} /></div>
            <div className="space-y-2"><Label>Link da legislação</Label><Input type="url" value={editing.link} onChange={(event) => setEditing({ ...editing, link: event.target.value })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Códigos NCM (separados por vírgula)</Label><Input value={(editing.ncmCodes || []).join(", ")} onChange={(event) => setEditing({ ...editing, ncmCodes: event.target.value.split(",").map((code) => code.trim()).filter(Boolean) })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Requisitos legais (JSON)</Label><Textarea className="min-h-32 font-mono text-xs" value={requirementsText} onChange={(event) => setRequirementsText(event.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancelar</Button><Button onClick={saveRecord} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar registro"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileDiff className="h-5 w-5" />Comparativo da planilha</DialogTitle><DialogDescription>{importName} — confira todas as mudanças antes de aplicar ao rascunho.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{diffs.filter((diff) => diff.type === "included").length}</div><div className="text-sm text-muted-foreground">Incluídos</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{diffs.filter((diff) => diff.type === "changed").length}</div><div className="text-sm text-muted-foreground">Alterados</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{diffs.filter((diff) => diff.type === "removed").length}</div><div className="text-sm text-muted-foreground">Removidos</div></CardContent></Card>
          </div>
          {!diffs.length ? <Alert><CheckCircle2 className="h-4 w-4" /><AlertTitle>Planilha idêntica</AlertTitle><AlertDescription>Não há diferenças nos campos comparados.</AlertDescription></Alert> : (
            <div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Mudança</TableHead><TableHead>cClassTrib</TableHead><TableHead>Registro</TableHead><TableHead>Detalhes</TableHead></TableRow></TableHeader><TableBody>
              {diffs.map((diff) => <TableRow key={`${diff.type}-${diff.incoming.cClassTrib}`}><TableCell><Badge variant={diff.type === "removed" ? "destructive" : diff.type === "included" ? "default" : "secondary"}>{diff.type === "included" ? "Incluído" : diff.type === "changed" ? "Alterado" : "Removido"}</Badge></TableCell><TableCell className="font-mono">{diff.incoming.cClassTrib}</TableCell><TableCell>{diff.incoming.cClassTribName}</TableCell><TableCell className="text-xs text-muted-foreground">{diff.type === "changed" ? diff.changedFields.map((field) => fieldLabels[field] || field).join(", ") : diff.type === "removed" ? "Ausente na planilha" : "Novo na planilha"}</TableCell></TableRow>)}
            </TableBody></Table></div>
          )}
          <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>A remoção considera os códigos existentes no rascunho que não aparecem na planilha.</AlertDescription></Alert>
          <DialogFooter><Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancelar</Button><Button onClick={applyImport} disabled={isSaving || !diffs.length}><Upload className="mr-2 h-4 w-4" />{isSaving ? "Aplicando..." : "Confirmar alterações"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Publicar “{selectedVersion?.versao}”?</DialogTitle><DialogDescription>A versão atual será arquivada e este rascunho passará a ser usado imediatamente na consulta de todos os clientes.</DialogDescription></DialogHeader>
          <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Confira a fonte, a vigência e o comparativo da planilha antes de publicar. Esta ação não apaga o histórico.</AlertDescription></Alert>
          <DialogFooter><Button variant="outline" onClick={() => setIsPublishOpen(false)}>Voltar</Button><Button onClick={publish} disabled={isSaving}><Send className="mr-2 h-4 w-4" />{isSaving ? "Publicando..." : "Confirmar publicação"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
