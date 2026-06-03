'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { listarFases, listarJogosFase, importarJogos, sincronizarPlacares, listarTemporadas } from '@/services/jogo.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [faseBancoId, setFaseBancoId] = useState('');
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

  // Brasileirão: auto-selecionar fase slug (é sempre a primeira do ano atual)
  const ehBrasileiro = campeonatoSlug === 'brasileirao';
  const faseSlugEfetiva = ehBrasileiro
    ? (fasesApi[0]?.slug ?? faseSlugSelecionada)
    : faseSlugSelecionada;

  // Buscar temporadas para determinar temporadaId por campeonato
  const { data: temporadas } = useQuery({
    queryKey: ['temporadas-admin'],
    queryFn: listarTemporadas,
    staleTime: 1000 * 60 * 60,
  });

  const temporadaCopa = temporadas?.find((t) => t.campeonato?.nome?.toLowerCase().includes('copa'));
  const temporadaBrasileiro = temporadas?.find((t) => t.campeonato?.nome?.includes('Série A'));
  const temporadaAtiva = campeonatoSlug === 'copa-do-mundo-2026' ? temporadaCopa : temporadaBrasileiro;
  const temporadaId = temporadaAtiva?.id || '';

  // Buscar fases do banco para a temporada ativa
  const { data: fasesBanco } = useQuery({
    queryKey: ['fases-banco-admin', temporadaId],
    queryFn: () => listarFases(temporadaId),
    enabled: !!temporadaId,
  });

  // Auto-selecionar fase destino para Copa fase de grupos ou Brasileirão
  const faseBancoEfetiva = ehCopaGrupos || ehBrasileiro
    ? (fasesBanco?.find((f: Fase) => f.tipo === 'PONTOS_CORRIDOS')?.id ?? faseBancoId)
    : faseBancoId;

  // Buscar jogos adiados da fase selecionada do banco
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

  async function aoImportar() {
    if (!faseBancoEfetiva || !rodadaImportar || !faseSlugEfetiva) return;
    setErro(null);
    setLogs([]);
    setCarregando(true);

    const rodadas = rodadaImportar === 'todas'
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

  return (
    <div className="min-h-screen bg-fundo pb-20">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 bg-fundo/80 backdrop-blur-lg border-b border-white/[0.05]">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar" className="text-texto/70 hover:text-texto">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-semibold text-texto">Importar Jogos</h1>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-5 space-y-5">

        {/* 1. Campeonato (tabs visuais) */}
        <div className="space-y-2">
          <span className="text-[10px] text-texto/40 uppercase tracking-wider font-bold">Campeonato</span>
          <div className="flex gap-2">
            {CAMPEONATOS.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => { setCampeonatoSlug(c.slug); setFaseSlugSelecionada(''); setFaseBancoId(''); setRodadaImportar('1'); setLogs([]); setErro(null); }}
                className={`flex-1 py-3 px-3 rounded-xl text-xs font-semibold transition-all text-center ${
                  campeonatoSlug === c.slug
                    ? 'bg-primaria/20 text-primaria-claro border border-primaria/40 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                    : 'bg-white/[0.03] text-texto/50 border border-white/[0.08] hover:bg-white/[0.06]'
                }`}
              >
                {c.slug === 'copa-do-mundo-2026' ? '🏆 ' : '⚽ '}{c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Fase da API (só mostra para Copa — Brasileirão é auto) */}
        {campeonatoSlug === 'copa-do-mundo-2026' && (
          <div className="space-y-2">
            <span className="text-[10px] text-texto/40 uppercase tracking-wider font-bold">Fase</span>
            <div className="grid grid-cols-2 gap-1.5">
              {fasesApi.filter((f) => f.slug.includes('fase-de-grupos') || f.tipo === 'MATA_MATA').map((f) => (
                <button
                  key={f.slug}
                  type="button"
                  onClick={() => { setFaseSlugSelecionada(f.slug); setRodadaImportar(f.maxRodadas > 1 ? 'todas' : '1'); }}
                  className={`w-full py-2.5 px-3 rounded-lg text-[11px] font-medium transition-all text-left ${
                    faseSlugSelecionada === f.slug
                      ? 'bg-primaria/15 text-primaria-claro border border-primaria/30'
                      : 'bg-white/[0.03] text-texto/60 border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  {f.label}
                  {f.maxRodadas > 1 && <span className="text-[9px] text-texto/30 ml-1">({f.maxRodadas} rodadas)</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Fase do banco (destino) — só mostra para eliminatórias da Copa */}
        {faseSlugSelecionada && fasesBanco && fasesBanco.length > 0 && !ehBrasileiro && !ehCopaGrupos && (
          <div className="space-y-2">
            <span className="text-[10px] text-texto/40 uppercase tracking-wider font-bold">Fase destino (banco)</span>
            <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto">
              {fasesBanco
                .filter((f: Fase) => {
                  if (!faseApiSelecionada) return true;
                  return faseApiSelecionada.tipo === 'PONTOS_CORRIDOS'
                    ? f.tipo === 'PONTOS_CORRIDOS'
                    : f.tipo === 'MATA_MATA';
                })
                .map((f: Fase) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFaseBancoId(f.id)}
                  className={`py-2 px-2 rounded-lg text-[10px] font-medium transition-all text-center truncate ${
                    faseBancoId === f.id
                      ? 'bg-destaque/15 text-destaque border border-destaque/30'
                      : 'bg-white/[0.03] text-texto/50 border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  {f.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Rodada + Ações */}
        {faseSlugEfetiva && faseBancoEfetiva && (
          <Card>
            <CardContent className="p-4 space-y-4">
              {erro && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">{erro}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="rodada" className="text-xs">Rodada</Label>
                <div className="flex gap-2">
                  <Input
                    id="rodada"
                    type={rodadaImportar === 'todas' ? 'text' : 'number'}
                    min="1"
                    max={maxRodadas}
                    value={rodadaImportar === 'todas' ? 'Todas (1-' + maxRodadas + ')' : rodadaImportar}
                    onChange={(e) => setRodadaImportar(e.target.value)}
                    disabled={rodadaImportar === 'todas'}
                    className="h-10 flex-1"
                  />
                  {maxRodadas > 1 && (
                    <Button
                      type="button"
                      variant={rodadaImportar === 'todas' ? 'default' : 'outline'}
                      onClick={() => setRodadaImportar(rodadaImportar === 'todas' ? '1' : 'todas')}
                      className="text-[10px] px-3 h-10 shrink-0"
                    >
                      {rodadaImportar === 'todas' ? '✓ Todas' : 'Todas'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={aoImportar}
                  disabled={carregando || !rodadaImportar}
                  className="text-xs"
                >
                  {carregando ? <Loader2 size={14} className="animate-spin" /> : 'Importar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={aoSincronizar}
                  disabled={sincronizando}
                  className="text-xs"
                >
                  {sincronizando ? <Loader2 size={14} className="animate-spin" /> : <><RefreshCw size={12} /> Sincronizar</>}
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
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
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

        {/* Log de execução */}
        {logs.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={`${log.etapa}-${i}`} className="flex items-start gap-2">
                    <span className="mt-0.5 text-sm">
                      {log.status === 'ok' && '✅'}
                      {log.status === 'erro' && '❌'}
                      {log.status === 'pendente' && '⏳'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-texto/70 truncate">{log.etapa}</p>
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
      </div>
    </div>
  );
}
