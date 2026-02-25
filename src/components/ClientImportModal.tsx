import { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Upload, FileSpreadsheet, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ParsedClient {
  cnpj: string;
  company_name: string;
  valid: boolean;
  error?: string;
}

interface ClientImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const cleanCnpj = (value: string): string => {
  return String(value || '').replace(/\D/g, '');
};

const formatCnpjDisplay = (cnpj: string): string => {
  const n = cnpj.replace(/\D/g, '');
  return n
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export const ClientImportModal = ({ isOpen, onOpenChange, onImportComplete }: ClientImportModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedClients, setParsedClients] = useState<ParsedClient[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [parseError, setParseError] = useState('');

  const reset = () => {
    setParsedClients([]);
    setFileName('');
    setImportProgress(0);
    setImportResult(null);
    setParseError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const findColumn = (headers: string[], keywords: string[]): number => {
    return headers.findIndex(h => {
      const lower = (h || '').toString().toLowerCase().trim();
      return keywords.some(k => lower.includes(k));
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    setImportResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      (async () => { try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.worksheets[0];
        if (!sheet) {
          setParseError('A planilha está vazia.');
          return;
        }
        const rows: string[][] = [];
        sheet.eachRow((row) => {
          const values = row.values as (string | number | null)[];
          // ExcelJS row.values is 1-indexed, skip index 0
          rows.push(values.slice(1).map(v => String(v ?? '')));
        });

        if (rows.length < 2) {
          setParseError('A planilha está vazia ou não possui dados além do cabeçalho.');
          return;
        }

        const headers = rows[0].map(h => String(h));
        const cnpjCol = findColumn(headers, ['cnpj']);
        const nameCol = findColumn(headers, ['razão social', 'razao social', 'empresa', 'nome', 'company', 'cliente']);

        if (cnpjCol === -1) {
          setParseError('Coluna de CNPJ não encontrada. Certifique-se de que a planilha possui uma coluna com "CNPJ" no cabeçalho.');
          return;
        }

        if (nameCol === -1) {
          setParseError('Coluna de nome/razão social não encontrada. Certifique-se de que a planilha possui uma coluna com "Razão Social", "Empresa" ou "Nome" no cabeçalho.');
          return;
        }

        const clients: ParsedClient[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const rawCnpj = String(row[cnpjCol] || '').trim();
          const rawName = String(row[nameCol] || '').trim();

          if (!rawCnpj && !rawName) continue; // skip empty rows

          const cnpj = cleanCnpj(rawCnpj);
          let valid = true;
          let error: string | undefined;

          if (!cnpj || cnpj.length !== 14) {
            valid = false;
            error = 'CNPJ inválido';
          }

          if (!rawName) {
            valid = false;
            error = (error ? error + '; ' : '') + 'Nome vazio';
          }

          clients.push({ cnpj, company_name: rawName, valid, error });
        }

        if (clients.length === 0) {
          setParseError('Nenhum cliente encontrado na planilha.');
          return;
        }

        setParsedClients(clients);
      } catch {
        setParseError('Erro ao ler o arquivo. Verifique se é um arquivo Excel válido (.xlsx ou .xls).');
      } })();
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    const validClients = parsedClients.filter(c => c.valid);
    if (validClients.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    let success = 0;
    let failed = 0;
    const defaultPassword = '2mCliente';

    for (let i = 0; i < validClients.length; i++) {
      const client = validClients[i];

      try {
        const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
          password: defaultPassword,
        });

        if (hashError || !hashedPassword) {
          failed++;
          parsedClients.find(c => c.cnpj === client.cnpj && c.valid)!.error = 'Erro ao processar senha';
          parsedClients.find(c => c.cnpj === client.cnpj && c.valid)!.valid = false;
          continue;
        }

        const { error } = await supabase.from('clients').insert({
          cnpj: client.cnpj,
          company_name: client.company_name,
          password_hash: hashedPassword,
          must_change_password: true,
        });

        if (error) {
          failed++;
          const c = parsedClients.find(c => c.cnpj === client.cnpj && c.valid);
          if (c) {
            c.valid = false;
            c.error = error.code === '23505' ? 'CNPJ já cadastrado' : 'Erro ao cadastrar';
          }
        } else {
          success++;
        }
      } catch {
        failed++;
      }

      setImportProgress(Math.round(((i + 1) / validClients.length) * 100));
    }

    setParsedClients([...parsedClients]);
    setImportResult({ success, failed });
    setIsImporting(false);

    if (success > 0) {
      onImportComplete();
      toast({
        title: 'Importação concluída',
        description: `${success} cliente(s) importado(s) com sucesso.${failed > 0 ? ` ${failed} falharam.` : ''} Senha padrão: 2mCliente`,
      });
    }
  };

  const validCount = parsedClients.filter(c => c.valid).length;
  const invalidCount = parsedClients.filter(c => !c.valid).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Clientes via Excel
          </DialogTitle>
          <DialogDescription>
            Envie uma planilha (.xlsx ou .xls) com colunas "CNPJ" e "Razão Social" (ou "Empresa"/"Nome"). A senha padrão será <strong>2mCliente</strong> e o cliente deverá alterá-la no primeiro acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* File input */}
          {!importResult && (
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <Upload className="h-4 w-4 mr-2" />
                {fileName || 'Selecionar arquivo'}
              </Button>
              {fileName && !isImporting && (
                <Button variant="ghost" size="icon" onClick={reset}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Preview table */}
          {parsedClients.length > 0 && (
            <>
              <div className="flex items-center gap-3 text-sm">
                <Badge className="bg-green-600">{validCount} válido(s)</Badge>
                {invalidCount > 0 && <Badge variant="destructive">{invalidCount} inválido(s)</Badge>}
              </div>

              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedClients.map((client, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">
                          {client.cnpj.length === 14 ? formatCnpjDisplay(client.cnpj) : client.cnpj || '—'}
                        </TableCell>
                        <TableCell>{client.company_name || '—'}</TableCell>
                        <TableCell>
                          {client.valid ? (
                            <Badge className="bg-green-600 text-xs">OK</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">{client.error}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Progress */}
          {isImporting && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Importando clientes...</p>
              <Progress value={importProgress} />
              <p className="text-xs text-muted-foreground text-right">{importProgress}%</p>
            </div>
          )}

          {/* Result */}
          {importResult && (
            <Alert className={importResult.failed > 0 ? '' : 'border-green-500'}>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>{importResult.success}</strong> cliente(s) importado(s) com sucesso.
                {importResult.failed > 0 && (
                  <> <strong>{importResult.failed}</strong> falharam (veja os detalhes acima).</>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            {importResult ? 'Fechar' : 'Cancelar'}
          </Button>
          {!importResult && (
            <Button onClick={handleImport} disabled={isImporting || validCount === 0}>
              {isImporting ? 'Importando...' : `Importar ${validCount} cliente(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
