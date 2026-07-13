'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { listarFases, listarJogosFase, importarJogos, sincronizarPlacares, listarTemporadas } from '@/services/jogo.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Jogo, CAMPEONATOS, type CampeonatoSlug, type Fase } from '@/types/jogo.types';

interface LogItem {
  etapa: string;
  status: 'ok' | 'erro' | 'pendente';
  detalhe?: string;
}

function formatarDetalheSync(j: any): string {
  let detalhe = j.status === 'FINALIZADO'
    ? `${j.golsCasa} x ${j.golsFora} — FINALIZADO`
    : j.status;

  if (j.horarioAlterado) {
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' };
    const anterior = j.horarioAnterior
      ? new Date(j.horarioAnterior).toLocaleString('pt-BR', opts)
      : 'sem data';
    const novo = j.horarioNovo
      ? new Date(j.horarioNovo).toLocaleString('pt-BR', opts)
      : 'sem data';
    detalhe += ` ⏰ ${anterior} → ${novo}`;
  }

  return detalhe;
}

export default function ImportarJogosPage() {
  const router = useRouter();
  const [campeonatoSlug, setCampeonatoSlug] = useState<CampeonatoSlug>('brasileirao');
  const [faseSlugSelecionada, setFaseSlugSelecionada] = useState('');
  const [rodadaImportar, setRodadaImportar] = useState('1');
  const [carregando, setCarregando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const campeonatoConfig = CAMPEONATOS.find((c) => c.slug === campeonatoSlug);
  const fasesApi = campeonatoConfig?.fases ?? [];
  const faseApiSelecionada = fasesApi.find((f) => f.slug === faseSlugSelecionada);
  const maxRodadas = faseApiSelecionada?.maxRodadas ?? 38;
  const ehCopaGrupos = campeonatoSlug === 'copa-do-mundo-2026' && faseApiSelecionada?.tipo === 'PONTOS_CORRIDOS';
  const ehMataMata = faseApiSelecionada?.tipo === 'MATA_MATA';
  const ehBrasileiro = campeonatoSlug === 'brasileirao';
  const faseSlugEfetiva = ehBrasileiro
    ? (fasesApi[0]?.slug ?? faseSlugSelecionada)
    : faseSlugSelecionada;

  const { data: temporadas } = useQuery({
    queryKey: ['temporadas-admin'],
    queryFn: listarTemporadas,
    staleTime: 1000 * 60 * 60,
  });

  const temporadaCopa = temporadas?.find((t) => t.campeonato?.nome?.toLowerCase().includes('copa'));
  const temporadaBrasileiro = temporadas?.find((t) => t.campeonato?.nome?.includes('Série A'));
  const temporadaAtiva = campeonatoSlug === 'copa-do-mundo-2026' ? temporadaCopa : temporadaBrasileiro;
  const temporadaId = temporadaAtiva?.id || '';

  const { data: fasesBanco } = useQuery({
    queryKey: ['fases-banco-admin', temporadaId],
    queryFn: () => listarFases(temporadaId),
    enabled: !!temporadaId,
  });

  // Fase destino resolvida automaticamente pelo backend (slug da API → fase no banco)
  // Para eliminatórias Copa, usa a primeira fase MATA_MATA encontrada (o backend distribui)
  const faseBancoEfetiva = (() => {
    if (ehCopaGrupos || ehBrasileiro) {
      return fasesBanco?.find((f: Fase) => f.tipo === 'PONTOS_CORRIDOS')?.id ?? '';
    }
    if (campeonatoSlug === 'copa-do-mundo-2026' && faseSlugSelecionada) {
      // Para eliminatórias, pegar a fase correspondente pelo nome
      const mapeamento: Record<string, string> = {
        'segunda-fase': '16 avos',
        'oitavas': 'oitavas',
        'quartas': 'quartas',
        'semifinal': 'semi',
        'terceiro': 'terceiro',
        'final': 'final',
      };
      for (const [slugParte, termo] of Object.entries(mapeamento)) {
        if (faseSlugSelecionada.includes(slugParte)) {
          const faseEncontrada = fasesBanco?.find((f: Fase) =>
            f.tipo === 'MATA_MATA' && f.nome.toLowerCase().includes(termo),
          );
          if (faseEncontrada) return faseEncontrada.id;
        }
      }
      // Fallback: primeira MATA_MATA
      return fasesBanco?.find((f: Fase) => f.tipo === 'MATA_MATA')?.id ?? '';
    }
    return '';
  })();

  const { data: jogosAdiados, refetch: refetchAdiados } = useQuery({
    queryKey: ['jogos-admin-adiados', faseBancoEfetiva],
    queryFn: () => listarJogosFase(faseBancoEfetiva, undefined, 'ADIADO'),
    enabled: !!faseBancoEfetiva,
  });

  const adiados = jogosAdiados?.jogos ?? [];

  function addLog(etapa: string, status: 'ok' | 'erro' | 'pendente', detalhe?: string) {
    setLogs((prev) => [...prev, { etapa, status, detalhe }]);
  }

  function atualizarUltimoLog(status: 'ok' | 'erro', detalhe?: string) {
    setLogs((prev) =>
      prev.map((l, i) => (i === prev.length - 1 ? { ...l, status, detalhe } : l)),
    );
  }

  function aoTrocarCampeonato(slug: CampeonatoSlug) {
    setCampeonatoSlug(slug);
    setFaseSlugSelecionada('');
    setRodadaImportar('1');
    setLogs([]);
    setErro(null);
  }

  function aoSelecionarFaseApi(slug: string) {
    const fase = fasesApi.find((f) => f.slug === slug);
    setFaseSlugSelecionada(slug);
    setRodadaImportar(fase && fase.maxRodadas > 1 ? 'todas' : '1');
  }

  async function aoImportar() {
    if (!faseBancoEfetiva || !faseSlugEfetiva) return;
    setErro(null);
    setLogs([]);
    setCarregando(true);

    const importarTodas = ehMataMata || rodadaImportar === 'todas';
    const rodadas = importarTodas
      ? Array.from({ length: maxRodadas }, (_, i) => i + 1)
      : [Number(rodadaImportar)];

    try {
      let totalImportados = 0;
      let totalIgnorados = 0;

      for (const rodada of rodadas) {
        const faseNome = faseApiSelecionada?.label || faseSlugEfetiva;
        addLog(`${faseNome} — Rodada ${rodada}...`, 'pendente');
        const result = await importarJogos({
          campeonatoSlug,
          faseSlug: faseSlugEfetiva,
          rodada,
          faseId: faseBancoEfetiva,
        });
        totalImportados += result.importados;
        totalIgnorados += result.ignorados;
        atualizarUltimoLog('ok', `${result.importados} importados, ${result.ignorados} ignorados`);
      }

      if (rodadas.length > 1) {
        addLog(`Total: ${totalImportados} importados, ${totalIgnorados} ignorados`, 'ok');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.erros?.[0]?.mensagens?.[0] || error?.message || 'Erro desconhecido';
      setErro(msg);
      atualizarUltimoLog('erro', msg);
    } finally {
      setCarregando(false);
    }
  }

  async function aoSincronizar() {
    if (!faseBancoEfetiva || !faseSlugEfetiva) return;
    setSincronizando(true);
    setErro(null);
    setLogs([]);

    try {
      addLog('Sincronizando placares...', 'pendente');
      const result = await sincronizarPlacares(faseBancoEfetiva, {
        campeonatoSlug,
        faseSlug: faseSlugEfetiva,
      });
      atualizarUltimoLog('ok', `${result.sincronizados} jogos atualizados`);

      if (result.jogosAtualizados && result.jogosAtualizados.length > 0) {
        for (const j of result.jogosAtualizados) {
          addLog(`R${j.rodada} • ${j.timeCasa} x ${j.timeFora}`, 'ok', formatarDetalheSync(j));
        }
      }
      refetchAdiados();
    } catch (error: any) {
      const msg = error?.response?.data?.erros?.[0]?.mensagens?.[0] || error?.message || 'Erro ao sincronizar';
      setErro(msg);
      atualizarUltimoLog('erro', msg);
    } finally {
      setSincronizando(false);
    }
  }

  const prontoParaAcao = !!faseSlugEfetiva && !!faseBancoEfetiva;

  return (
    <div className="min-h-screen bg-fundo pb-20">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 bg-fundo/80 backdrop-blur-lg border-b border-white/[0.05]">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar" className="text-texto/70 hover:text-texto">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-semibold text-texto">Admin — Importação</h1>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-5 space-y-4">

        {/* Campeonato */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-texto/40 uppercase tracking-wider font-bold">Campeonato</span>
          <div className="flex gap-2">
            {CAMPEONATOS.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => aoTrocarCampeonato(c.slug)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all text-center ${
                  campeonatoSlug === c.slug
                    ? 'bg-primaria/20 text-primaria-claro border border-primaria/40'
                    : 'bg-white/[0.03] text-texto/50 border border-white/[0.08]'
                }`}
              >
                {c.slug === 'copa-do-mundo-2026' ? '🏆 ' : '⚽ '}{c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fase (unificada) */}
        {campeonatoSlug === 'copa-do-mundo-2026' && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-texto/40 uppercase tracking-wider font-bold">Fase (fonte API)</span>
            <div className="grid grid-cols-2 gap-1.5">
              {fasesApi.filter((f) => f.slug.includes('fase-de-grupos') || f.tipo === 'MATA_MATA').map((f) => (
                <button
                  key={f.slug}
                  type="button"
                  onClick={() => aoSelecionarFaseApi(f.slug)}
                  className={`py-2 px-2.5 rounded-lg text-[11px] font-medium transition-all text-left ${
                    faseSlugSelecionada === f.slug
                      ? 'bg-primaria/15 text-primaria-claro border border-primaria/30'
                      : 'bg-white/[0.03] text-texto/60 border border-white/[0.06]'
                  }`}
                >
                  {f.label}
                  {f.maxRodadas > 1 && <span className="text-[9px] text-texto/30 ml-1">({f.maxRodadas}r)</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        {prontoParaAcao && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {erro && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">{erro}</AlertDescription>
                </Alert>
              )}

              {/* Rodada — esconde para mata-mata (importa todos automaticamente) */}
              {!ehMataMata && (
                <div className="space-y-1">
                  <Label htmlFor="rodada" className="text-[11px] text-texto/60">Rodada</Label>
                  <div className="flex gap-2">
                    <Input
                      id="rodada"
                      type={rodadaImportar === 'todas' ? 'text' : 'number'}
                      min="1"
                      max={maxRodadas}
                      value={rodadaImportar === 'todas' ? `Todas (1-${maxRodadas})` : rodadaImportar}
                      onChange={(e) => setRodadaImportar(e.target.value)}
                      disabled={rodadaImportar === 'todas'}
                      className="h-9 flex-1 text-sm"
                    />
                    {maxRodadas > 1 && (
                      <Button
                        type="button"
                        variant={rodadaImportar === 'todas' ? 'default' : 'outline'}
                        onClick={() => setRodadaImportar(rodadaImportar === 'todas' ? '1' : 'todas')}
                        className="text-[10px] px-3 h-9 shrink-0"
                      >
                        {rodadaImportar === 'todas' ? '✓ Todas' : 'Todas'}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={aoImportar}
                  disabled={carregando || !rodadaImportar}
                  className="text-xs h-10"
                >
                  {carregando ? <Loader2 size={14} className="animate-spin" /> : 'Importar jogos'}
                </Button>
                <Button
                  variant="outline"
                  onClick={aoSincronizar}
                  disabled={sincronizando}
                  className="text-xs h-10"
                >
                  {sincronizando ? <Loader2 size={14} className="animate-spin" /> : <><RefreshCw size={12} className="mr-1" /> Sincronizar</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Jogos adiados */}
        {adiados.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle size={14} className="text-destaque" />
                Adiados ({adiados.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {adiados.map((jogo: Jogo) => (
                  <div key={jogo.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[11px] text-texto/70">
                      {jogo.timeCasa?.sigla || '?'} x {jogo.timeFora?.sigla || '?'}
                    </span>
                    <span className="text-[9px] text-destaque/80">R{jogo.rodada}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Log */}
        {logs.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={`${log.etapa}-${i}`} className="flex items-start gap-2">
                    <span className="mt-0.5 text-sm shrink-0">
                      {log.status === 'ok' && '✅'}
                      {log.status === 'erro' && '❌'}
                      {log.status === 'pendente' && '⏳'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-texto/70 truncate">{log.etapa}</p>
                      {log.detalhe && (
                        <p className="text-[10px] text-texto/40 font-mono truncate">{log.detalhe}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Testar Push */}
        <BotaoTestarPush />
      </div>
    </div>
  );
}

function BotaoTestarPush() {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [tipo, setTipo] = useState('JOGO_PROXIMO');

  const tipos = [
    { value: 'JOGO_PROXIMO', label: '⚽ Jogo Próximo' },
    { value: 'ACERTO_EM_CHEIO', label: '🎯 Acerto em Cheio' },
    { value: 'JOGO_LIBERADO', label: '🏆 Jogo Liberado' },
    { value: 'RODADA_ENCERRADA', label: '🏁 Rodada Encerrada' },
    { value: 'SUBIU_POSICAO', label: '📈 Subiu Posição' },
    { value: 'DESCEU_POSICAO', label: '📉 Desceu Posição' },
    { value: 'PALPITES_PENDENTES', label: '⏰ Palpites Pendentes' },
  ];

  async function enviarTeste() {
    setEnviando(true);
    setResultado(null);
    try {
      await apiClient.post('/push/testar', { tipo });
      setResultado('✅ Push enviado!');
    } catch {
      setResultado('❌ Erro');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <span className="text-[10px] text-texto/40 uppercase tracking-wider font-bold">Push Notifications</span>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full h-9 rounded-md border border-white/10 bg-black/40 text-xs text-texto px-2"
        >
          {tipos.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <Button onClick={enviarTeste} disabled={enviando} className="w-full text-xs h-10">
          {enviando ? <Loader2 size={14} className="animate-spin" /> : '🔔 Enviar push de teste'}
        </Button>
        {resultado && <p className="text-[11px] text-texto/70 text-center">{resultado}</p>}
      </CardContent>
    </Card>
  );
}
