import { useState, useMemo } from "react";
import { Calculator, TrendingUp, Info, DollarSign, Percent, MapPin, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Alíquotas padrão de IBS e CBS (podem ser ajustadas conforme legislação)
const ALIQUOTA_IBS_PADRAO = 18.69;
const ALIQUOTA_CBS_PADRAO = 9.28;

// Cronograma de transição da reforma tributária - Regime Normal
const TRANSICAO_NORMAL = {
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

// Anexos do Simples Nacional com alíquotas por faixa
const ANEXOS_SIMPLES = {
  'I': {
    nome: 'Anexo I - Comércio',
    descricao: 'Revenda de mercadorias',
    faixas: [
      { limite: 180000, aliquota: 4.0, deducao: 0, nome: '1ª Faixa (até R$ 180 mil)' },
      { limite: 360000, aliquota: 7.3, deducao: 5940, nome: '2ª Faixa (R$ 180 mil a R$ 360 mil)' },
      { limite: 720000, aliquota: 9.5, deducao: 13860, nome: '3ª Faixa (R$ 360 mil a R$ 720 mil)' },
      { limite: 1800000, aliquota: 10.7, deducao: 22500, nome: '4ª Faixa (R$ 720 mil a R$ 1,8 mi)' },
      { limite: 3600000, aliquota: 14.3, deducao: 87300, nome: '5ª Faixa (R$ 1,8 mi a R$ 3,6 mi)' },
      { limite: 4800000, aliquota: 19.0, deducao: 378000, nome: '6ª Faixa (R$ 3,6 mi a R$ 4,8 mi)' },
    ],
  },
  'II': {
    nome: 'Anexo II - Indústria',
    descricao: 'Fabricação e industrialização',
    faixas: [
      { limite: 180000, aliquota: 4.5, deducao: 0, nome: '1ª Faixa (até R$ 180 mil)' },
      { limite: 360000, aliquota: 7.8, deducao: 5940, nome: '2ª Faixa (R$ 180 mil a R$ 360 mil)' },
      { limite: 720000, aliquota: 10.0, deducao: 13860, nome: '3ª Faixa (R$ 360 mil a R$ 720 mil)' },
      { limite: 1800000, aliquota: 11.2, deducao: 22500, nome: '4ª Faixa (R$ 720 mil a R$ 1,8 mi)' },
      { limite: 3600000, aliquota: 14.7, deducao: 85500, nome: '5ª Faixa (R$ 1,8 mi a R$ 3,6 mi)' },
      { limite: 4800000, aliquota: 30.0, deducao: 720000, nome: '6ª Faixa (R$ 3,6 mi a R$ 4,8 mi)' },
    ],
  },
  'III': {
    nome: 'Anexo III - Serviços',
    descricao: 'Serviços de instalação, reparos, contabilidade, advocacia, etc.',
    faixas: [
      { limite: 180000, aliquota: 6.0, deducao: 0, nome: '1ª Faixa (até R$ 180 mil)' },
      { limite: 360000, aliquota: 11.2, deducao: 9360, nome: '2ª Faixa (R$ 180 mil a R$ 360 mil)' },
      { limite: 720000, aliquota: 13.5, deducao: 17640, nome: '3ª Faixa (R$ 360 mil a R$ 720 mil)' },
      { limite: 1800000, aliquota: 16.0, deducao: 35640, nome: '4ª Faixa (R$ 720 mil a R$ 1,8 mi)' },
      { limite: 3600000, aliquota: 21.0, deducao: 125640, nome: '5ª Faixa (R$ 1,8 mi a R$ 3,6 mi)' },
      { limite: 4800000, aliquota: 33.0, deducao: 648000, nome: '6ª Faixa (R$ 3,6 mi a R$ 4,8 mi)' },
    ],
  },
  'IV': {
    nome: 'Anexo IV - Serviços',
    descricao: 'Construção civil, vigilância, limpeza, obras',
    faixas: [
      { limite: 180000, aliquota: 4.5, deducao: 0, nome: '1ª Faixa (até R$ 180 mil)' },
      { limite: 360000, aliquota: 9.0, deducao: 8100, nome: '2ª Faixa (R$ 180 mil a R$ 360 mil)' },
      { limite: 720000, aliquota: 10.2, deducao: 12420, nome: '3ª Faixa (R$ 360 mil a R$ 720 mil)' },
      { limite: 1800000, aliquota: 14.0, deducao: 39780, nome: '4ª Faixa (R$ 720 mil a R$ 1,8 mi)' },
      { limite: 3600000, aliquota: 22.0, deducao: 183780, nome: '5ª Faixa (R$ 1,8 mi a R$ 3,6 mi)' },
      { limite: 4800000, aliquota: 33.0, deducao: 828000, nome: '6ª Faixa (R$ 3,6 mi a R$ 4,8 mi)' },
    ],
  },
  'V': {
    nome: 'Anexo V - Serviços',
    descricao: 'Engenharia, auditoria, tecnologia, publicidade',
    faixas: [
      { limite: 180000, aliquota: 15.5, deducao: 0, nome: '1ª Faixa (até R$ 180 mil)' },
      { limite: 360000, aliquota: 18.0, deducao: 4500, nome: '2ª Faixa (R$ 180 mil a R$ 360 mil)' },
      { limite: 720000, aliquota: 19.5, deducao: 9900, nome: '3ª Faixa (R$ 360 mil a R$ 720 mil)' },
      { limite: 1800000, aliquota: 20.5, deducao: 17100, nome: '4ª Faixa (R$ 720 mil a R$ 1,8 mi)' },
      { limite: 3600000, aliquota: 23.0, deducao: 62100, nome: '5ª Faixa (R$ 1,8 mi a R$ 3,6 mi)' },
      { limite: 4800000, aliquota: 30.5, deducao: 540000, nome: '6ª Faixa (R$ 3,6 mi a R$ 4,8 mi)' },
    ],
  },
};

type AnexoSimples = keyof typeof ANEXOS_SIMPLES;

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
  simples: number;
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
  
  // Simples Nacional
  const [anexoSimples, setAnexoSimples] = useState<AnexoSimples>('III');
  const [faixaSimples, setFaixaSimples] = useState<number>(0);
  const [optanteIbsCbs, setOptanteIbsCbs] = useState(false); // Opção de recolher IBS/CBS separadamente
  
  // Markup
  const [usarMarkup, setUsarMarkup] = useState(false);

  // Dados do Anexo e Faixa selecionados
  const anexoAtual = ANEXOS_SIMPLES[anexoSimples];
  const faixaAtual = anexoAtual.faixas[faixaSimples] || anexoAtual.faixas[0];
  const aliquotaSimples = faixaAtual.aliquota;

  // Calcular resultados
  const resultados = useMemo((): SimulacaoResultado[] => {
    const precoBase = parseFloat(preco) || 0;
    const issRate = parseFloat(aliquotaIss) || 0;
    const pisRate = parseFloat(aliquotaPis) || 0;
    const cofinsRate = parseFloat(aliquotaCofins) || 0;
    
    const reducao = REDUCOES_CST[cstSelecionado] || REDUCOES_CST['000'];
    const ibsEfetivo = ALIQUOTA_IBS_PADRAO * (1 - reducao.ibs / 100);
    const cbsEfetivo = ALIQUOTA_CBS_PADRAO * (1 - reducao.cbs / 100);

    const anos = Object.keys(TRANSICAO_NORMAL).map(Number).sort();
    
    return anos.map((ano) => {
      const transicao = TRANSICAO_NORMAL[ano as keyof typeof TRANSICAO_NORMAL];
      
      let iss = 0, pis = 0, cofins = 0, cbs = 0, ibs = 0, simples = 0;
      
      if (regimeTributario === 'simples') {
        // Simples Nacional
        if (ano <= 2026) {
          // Até 2026: recolhe normalmente pelo DAS
          simples = precoBase * aliquotaSimples / 100;
        } else {
          // A partir de 2027: pode optar por recolher IBS/CBS separadamente
          if (optanteIbsCbs) {
            // Optante: recolhe IBS/CBS separado (permite crédito aos clientes)
            cbs = (precoBase * cbsEfetivo / 100) * (transicao.cbs / 100);
            ibs = (precoBase * ibsEfetivo / 100) * (transicao.ibs / 100);
            // Simples reduzido (desconta a parte do IBS/CBS)
            const reducaoSimples = (ibsEfetivo + cbsEfetivo) * (transicao.ibs + transicao.cbs) / 200;
            simples = Math.max(0, (precoBase * aliquotaSimples / 100) - (precoBase * reducaoSimples / 100));
          } else {
            // Não optante: continua recolhendo tudo pelo DAS (sem gerar crédito)
            simples = precoBase * aliquotaSimples / 100;
          }
        }
      } else {
        // Regime Normal
        iss = categoria === 'servicos' 
          ? (precoBase * issRate / 100) * (transicao.iss / 100)
          : 0;
        
        pis = (precoBase * pisRate / 100) * (transicao.pis / 100);
        cofins = (precoBase * cofinsRate / 100) * (transicao.cofins / 100);
        
        cbs = (precoBase * cbsEfetivo / 100) * (transicao.cbs / 100);
        ibs = (precoBase * ibsEfetivo / 100) * (transicao.ibs / 100);
      }
      
      const total = iss + pis + cofins + cbs + ibs + simples;
      const precoFinal = precoBase + (usarMarkup ? total : 0);
      
      return {
        ano,
        iss: Math.round(iss * 100) / 100,
        pis: Math.round(pis * 100) / 100,
        cofins: Math.round(cofins * 100) / 100,
        cbs: Math.round(cbs * 100) / 100,
        ibs: Math.round(ibs * 100) / 100,
        simples: Math.round(simples * 100) / 100,
        total: Math.round(total * 100) / 100,
        precoFinal: Math.round(precoFinal * 100) / 100,
      };
    });
  }, [preco, categoria, regimeTributario, cstSelecionado, aliquotaIss, aliquotaPis, aliquotaCofins, usarMarkup, anexoSimples, faixaSimples, optanteIbsCbs, aliquotaSimples]);

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
              <Label>Preço de Custo (R$)</Label>
              <Input
                type="number"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="1.000,00"
              />
              <p className="text-xs text-muted-foreground">
                Valor base para cálculo dos tributos
              </p>
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

            {/* Opções específicas do Simples Nacional */}
            {regimeTributario === 'simples' && (
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-medium text-amber-700">Simples Nacional</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Anexo</Label>
                  <Select value={anexoSimples} onValueChange={(v: AnexoSimples) => {
                    setAnexoSimples(v);
                    setFaixaSimples(0); // Reset faixa quando muda o anexo
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ANEXOS_SIMPLES).map(([key, anexo]) => (
                        <SelectItem key={key} value={key}>
                          {anexo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {anexoAtual.descricao}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Faixa de Faturamento</Label>
                  <Select value={faixaSimples.toString()} onValueChange={(v) => setFaixaSimples(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anexoAtual.faixas.map((faixa, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {faixa.nome} - {faixa.aliquota}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">Optar por IBS/CBS separado?</p>
                      <p className="text-xs text-amber-700 mt-1">
                        A partir de 2027, permite gerar crédito tributário para seus clientes
                      </p>
                    </div>
                    <Switch
                      checked={optanteIbsCbs}
                      onCheckedChange={setOptanteIbsCbs}
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• <strong>Não optante:</strong> Recolhe tudo pelo DAS (não gera crédito ao cliente)</p>
                  <p>• <strong>Optante:</strong> Recolhe IBS/CBS separado (gera crédito ao cliente)</p>
                </div>
              </div>
            )}

            {/* Alíquotas atuais - apenas para Regime Normal */}
            {regimeTributario === 'normal' && (
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
            )}


            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">
                {regimeTributario === 'simples' ? 'Alíquota DAS' : 'Alíquotas Reforma (IBS + CBS)'}
              </p>
              <div className="flex flex-wrap gap-2">
                {regimeTributario === 'simples' ? (
                  <Badge variant="outline" className="bg-amber-50">
                    Simples: {aliquotaSimples}%
                  </Badge>
                ) : (
                  <>
                    <Badge variant="outline" className="bg-blue-50">
                      IBS: {(ALIQUOTA_IBS_PADRAO * (1 - (REDUCOES_CST[cstSelecionado]?.ibs || 0) / 100)).toFixed(2)}%
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-50">
                      CBS: {(ALIQUOTA_CBS_PADRAO * (1 - (REDUCOES_CST[cstSelecionado]?.cbs || 0) / 100)).toFixed(2)}%
                    </Badge>
                  </>
                )}
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
                    {regimeTributario === 'simples' ? (
                      <>
                        <TableHead className="text-right">DAS</TableHead>
                        {optanteIbsCbs && (
                          <>
                            <TableHead className="text-right">CBS</TableHead>
                            <TableHead className="text-right">IBS</TableHead>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {categoria === 'servicos' && <TableHead className="text-right">ISS</TableHead>}
                        <TableHead className="text-right">PIS</TableHead>
                        <TableHead className="text-right">COFINS</TableHead>
                        <TableHead className="text-right">CBS</TableHead>
                        <TableHead className="text-right">IBS</TableHead>
                      </>
                    )}
                    <TableHead className="text-right font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultados.map((r) => (
                    <TableRow key={r.ano} className={r.ano === 2033 ? 'bg-muted/50 font-medium' : ''}>
                      <TableCell className="font-medium">{r.ano}</TableCell>
                      {regimeTributario === 'simples' ? (
                        <>
                          <TableCell className="text-right text-amber-600">{formatCurrency(r.simples)}</TableCell>
                          {optanteIbsCbs && (
                            <>
                              <TableCell className="text-right text-emerald-600">{formatCurrency(r.cbs)}</TableCell>
                              <TableCell className="text-right text-blue-600">{formatCurrency(r.ibs)}</TableCell>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {categoria === 'servicos' && (
                            <TableCell className="text-right">{formatCurrency(r.iss)}</TableCell>
                          )}
                          <TableCell className="text-right">{formatCurrency(r.pis)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(r.cofins)}</TableCell>
                          <TableCell className="text-right text-emerald-600">{formatCurrency(r.cbs)}</TableCell>
                          <TableCell className="text-right text-blue-600">{formatCurrency(r.ibs)}</TableCell>
                        </>
                      )}
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
            {regimeTributario === 'simples' ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">DAS - Documento de Arrecadação do Simples</span>
                </div>
                {optanteIbsCbs && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">CBS - Recolhimento separado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">IBS - Recolhimento separado</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
