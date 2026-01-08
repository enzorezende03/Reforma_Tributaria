import { useState, useMemo } from "react";
import { Calculator, TrendingUp, Info, DollarSign, Percent, Building, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Alíquotas padrão de IBS e CBS (podem ser ajustadas conforme legislação)
const ALIQUOTA_IBS_PADRAO = 18.69;
const ALIQUOTA_CBS_PADRAO = 9.28;

// Cronograma de transição da reforma tributária
const TRANSICAO = {
  2025: { iss: 100, pis: 100, cofins: 100, ibs: 0, cbs: 0 },
  2026: { iss: 100, pis: 100, cofins: 100, ibs: 0.1, cbs: 0.9 },
  2027: { iss: 90, pis: 0, cofins: 0, ibs: 10, cbs: 100 },
  2028: { iss: 80, pis: 0, cofins: 0, ibs: 20, cbs: 100 },
  2029: { iss: 70, pis: 0, cofins: 0, ibs: 30, cbs: 100 },
  2030: { iss: 60, pis: 0, cofins: 0, ibs: 40, cbs: 100 },
  2031: { iss: 50, pis: 0, cofins: 0, ibs: 50, cbs: 100 },
  2032: { iss: 40, pis: 0, cofins: 0, ibs: 60, cbs: 100 },
  2033: { iss: 0, pis: 0, cofins: 0, ibs: 100, cbs: 100 },
};

// Reduções de alíquota por CST
const REDUCOES_CST: Record<string, { ibs: number; cbs: number; descricao: string }> = {
  '000': { ibs: 0, cbs: 0, descricao: 'Tributação integral' },
  '200': { ibs: 60, cbs: 60, descricao: 'Alíquota reduzida em 60%' },
  '300': { ibs: 30, cbs: 30, descricao: 'Alíquota reduzida em 30%' },
  '400': { ibs: 100, cbs: 100, descricao: 'Isento / Não incidência' },
  '500': { ibs: 100, cbs: 100, descricao: 'Suspensão' },
};

interface SimulacaoResultado {
  ano: number;
  iss: number;
  pis: number;
  cofins: number;
  cbs: number;
  ibs: number;
  total: number;
  precoFinal: number;
}

type Categoria = 'servicos' | 'produtos';
type RegimeTributario = 'normal' | 'simples';

export const SimuladorTab = () => {
  // Estados do formulário
  const [categoria, setCategoria] = useState<Categoria>('servicos');
  const [regimeTributario, setRegimeTributario] = useState<RegimeTributario>('normal');
  const [preco, setPreco] = useState<string>('1000');
  const [cstSelecionado, setCstSelecionado] = useState<string>('000');
  const [aliquotaIss, setAliquotaIss] = useState<string>('5');
  const [aliquotaPis, setAliquotaPis] = useState<string>('1.65');
  const [aliquotaCofins, setAliquotaCofins] = useState<string>('7.6');
  
  // Markup
  const [usarMarkup, setUsarMarkup] = useState(false);
  const [custosVariaveis, setCustosVariaveis] = useState<string>('10');
  const [custosFixos, setCustosFixos] = useState<string>('20');
  const [margemLucro, setMargemLucro] = useState<string>('30');

  // Calcular resultados
  const resultados = useMemo((): SimulacaoResultado[] => {
    const precoBase = parseFloat(preco) || 0;
    const issRate = parseFloat(aliquotaIss) || 0;
    const pisRate = parseFloat(aliquotaPis) || 0;
    const cofinsRate = parseFloat(aliquotaCofins) || 0;
    
    const reducao = REDUCOES_CST[cstSelecionado] || REDUCOES_CST['000'];
    const ibsEfetivo = ALIQUOTA_IBS_PADRAO * (1 - reducao.ibs / 100);
    const cbsEfetivo = ALIQUOTA_CBS_PADRAO * (1 - reducao.cbs / 100);

    const anos = Object.keys(TRANSICAO).map(Number).sort();
    
    return anos.map((ano) => {
      const transicao = TRANSICAO[ano as keyof typeof TRANSICAO];
      
      // Cálculo dos tributos com base na transição
      const iss = categoria === 'servicos' 
        ? (precoBase * issRate / 100) * (transicao.iss / 100)
        : 0;
      
      const pis = (precoBase * pisRate / 100) * (transicao.pis / 100);
      const cofins = (precoBase * cofinsRate / 100) * (transicao.cofins / 100);
      
      const cbs = (precoBase * cbsEfetivo / 100) * (transicao.cbs / 100);
      const ibs = (precoBase * ibsEfetivo / 100) * (transicao.ibs / 100);
      
      const total = iss + pis + cofins + cbs + ibs;
      const precoFinal = precoBase + (usarMarkup ? total : 0);
      
      return {
        ano,
        iss: Math.round(iss * 100) / 100,
        pis: Math.round(pis * 100) / 100,
        cofins: Math.round(cofins * 100) / 100,
        cbs: Math.round(cbs * 100) / 100,
        ibs: Math.round(ibs * 100) / 100,
        total: Math.round(total * 100) / 100,
        precoFinal: Math.round(precoFinal * 100) / 100,
      };
    });
  }, [preco, categoria, cstSelecionado, aliquotaIss, aliquotaPis, aliquotaCofins, usarMarkup]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const comparativo = useMemo(() => {
    const primeiro = resultados[0]; // 2025
    const ultimo = resultados[resultados.length - 1]; // 2033
    const diferenca = ultimo.total - primeiro.total;
    const percentual = primeiro.total > 0 ? (diferenca / primeiro.total) * 100 : 0;
    return { diferenca, percentual };
  }, [resultados]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Calculator className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Simulador da Reforma Tributária</h2>
            <p className="text-sm text-muted-foreground">Projete o impacto tributário de 2025 a 2033</p>
          </div>
        </div>
      </div>

      <Alert className="border-blue-500/50 bg-blue-500/10">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700 dark:text-blue-400">
          Os dados e resultados apresentados decorrem exclusivamente das informações inseridas pelo usuário, 
          sendo de inteira responsabilidade do contribuinte conferir a adequação à legislação vigente.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulário de entrada */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Dados da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={(v: Categoria) => setCategoria(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servicos">Serviços</SelectItem>
                  <SelectItem value="produtos">Produtos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Regime Tributário</Label>
              <Select value={regimeTributario} onValueChange={(v: RegimeTributario) => setRegimeTributario(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Regime Normal</SelectItem>
                  <SelectItem value="simples">Simples Nacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor da Operação (R$)</Label>
              <Input
                type="number"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="1.000,00"
              />
            </div>

            <div className="space-y-2">
              <Label>CST - Código de Situação Tributária</Label>
              <Select value={cstSelecionado} onValueChange={setCstSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="000">000 - Tributação integral</SelectItem>
                  <SelectItem value="200">200 - Alíquota reduzida 60%</SelectItem>
                  <SelectItem value="300">300 - Alíquota reduzida 30%</SelectItem>
                  <SelectItem value="400">400 - Isento / Não incidência</SelectItem>
                  <SelectItem value="500">500 - Suspensão</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {REDUCOES_CST[cstSelecionado]?.descricao}
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Alíquotas Atuais</p>
              
              {categoria === 'servicos' && (
                <div className="space-y-2">
                  <Label className="text-xs">ISS (%)</Label>
                  <Input
                    type="number"
                    value={aliquotaIss}
                    onChange={(e) => setAliquotaIss(e.target.value)}
                    step="0.01"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs">PIS (%)</Label>
                  <Input
                    type="number"
                    value={aliquotaPis}
                    onChange={(e) => setAliquotaPis(e.target.value)}
                    step="0.01"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">COFINS (%)</Label>
                  <Input
                    type="number"
                    value={aliquotaCofins}
                    onChange={(e) => setAliquotaCofins(e.target.value)}
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Alíquotas Reforma (IBS + CBS)</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  IBS: {(ALIQUOTA_IBS_PADRAO * (1 - (REDUCOES_CST[cstSelecionado]?.ibs || 0) / 100)).toFixed(2)}%
                </Badge>
                <Badge variant="outline" className="bg-emerald-50">
                  CBS: {(ALIQUOTA_CBS_PADRAO * (1 - (REDUCOES_CST[cstSelecionado]?.cbs || 0) / 100)).toFixed(2)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Projeção de Tributos por Ano
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant={comparativo.diferenca > 0 ? 'destructive' : 'default'}>
                  {comparativo.diferenca >= 0 ? '+' : ''}{formatCurrency(comparativo.diferenca)}
                </Badge>
                <Badge variant="outline">
                  {comparativo.percentual >= 0 ? '+' : ''}{comparativo.percentual.toFixed(1)}%
                </Badge>
              </div>
            </div>
            <CardDescription>
              Comparativo entre sistema atual e novo sistema tributário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    {categoria === 'servicos' && <TableHead className="text-right">ISS</TableHead>}
                    <TableHead className="text-right">PIS</TableHead>
                    <TableHead className="text-right">COFINS</TableHead>
                    <TableHead className="text-right">CBS</TableHead>
                    <TableHead className="text-right">IBS</TableHead>
                    <TableHead className="text-right font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultados.map((r) => (
                    <TableRow key={r.ano} className={r.ano === 2033 ? 'bg-muted/50 font-medium' : ''}>
                      <TableCell className="font-medium">{r.ano}</TableCell>
                      {categoria === 'servicos' && (
                        <TableCell className="text-right">{formatCurrency(r.iss)}</TableCell>
                      )}
                      <TableCell className="text-right">{formatCurrency(r.pis)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.cofins)}</TableCell>
                      <TableCell className="text-right text-emerald-600">{formatCurrency(r.cbs)}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(r.ibs)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(r.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Resumo visual */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Tributo 2025</p>
                  <p className="text-lg font-bold">{formatCurrency(resultados[0]?.total || 0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Tributo 2033</p>
                  <p className="text-lg font-bold">{formatCurrency(resultados[resultados.length - 1]?.total || 0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Valor Base</p>
                  <p className="text-lg font-bold">{formatCurrency(parseFloat(preco) || 0)}</p>
                </CardContent>
              </Card>
              <Card className={`${comparativo.diferenca > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Variação</p>
                  <p className={`text-lg font-bold ${comparativo.diferenca > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {comparativo.percentual >= 0 ? '+' : ''}{comparativo.percentual.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legenda */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-muted-foreground">ISS/PIS/COFINS - Sistema atual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">CBS - Contribuição sobre Bens e Serviços</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">IBS - Imposto sobre Bens e Serviços</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
