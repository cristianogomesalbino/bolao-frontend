'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Crosshair, Trophy, TrendingUp } from 'lucide-react';
import { listarFases, listarJogosFase } from '@/services/jogo.service';
import { listarGrupos } from '@/services/grupo.service';
import { buscarMeusPalpitesPorJogos, listarMeusPalpites } from '@/services/palpite.service';
import { calcularPontos, PONTOS } from '@/lib/pontuacao';
import { Jogo } from '@/types/jogo.types';
import { PalpiteComJogo } from '@/types/palpite.types';
import { CardJogoPalpite } from '@/components/jogos/card-jogo-palpite';
import { IconPalpite } from '@/components/icons/icon-palpite';
import { useAuthStore } from '@/stores/auth.store';

/** Verifica se o jogo ainda aceita palpites (status + hora não passou) */
function jogoPalpitavel(jogo: Jogo): boolean {
  if (jogo.status !== 'AGENDADO' && jogo.status !== 'ADIADO') return false;
  return true;
}

/** Verifica se o jogo já começou (hora passou) — bloqueia edição */
function jogoJaComecou(jogo: Jogo): boolean {
  if (!jogo.dataHora) return false;
  return new Date(jogo.dataHora).getTime() <= Date.now();
}

export default function PalpitesPage() {
  const [abaAtiva, setAbaAtiva] = useState<'todos' | 'meus'>('todos');
  const [cardAtivo, setCardAtivo] = useState<string | null>(null);
  const [filtroRodada, setFiltroRodada] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'cheio' | 'parcial' | 'nada'>('todos');
  const [dropdownRodadaAberto, setDropdownRodadaAberto] = useState(false);
  const [dropdownTipoAberto, setDropdownTipoAberto] = useState(false);
  const usuario = useAuthStore((state) => state.usuario);
  const dropdownRodadaRef = useRef<HTMLDivElement>(null);
  const dropdownTipoRef = useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (dropdownRodadaAberto && dropdownRodadaRef.current && !dropdownRodadaRef.current.contains(e.target as Node)) {
        setDropdownRodadaAberto(false);
      }
      if (dropdownTipoAberto && dropdownTipoRef.current && !dropdownTipoRef.current.contains(e.target as Node)) {
        setDropdownTipoAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [dropdownRodadaAberto, dropdownTipoAberto]);

  // Buscar temporadaId do primeiro grupo do usuário
  const { data: gruposData } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => listarGrupos(),
    select: (grupos) => grupos.map((g) => ({ id: g.id, temporadaId: g.temporadaId })),
  });

  const temporadaId = gruposData?.[0]?.temporadaId || '';
  const grupoId = gruposData?.[0]?.id || '';

  const { data: fases } = useQuery({
    queryKey: ['fases', temporadaId],
    queryFn: () => listarFases(temporadaId),
    enabled: !!temporadaId,
  });

  const faseAtual = fases?.[0];

  // Buscar rodada atual (sem parâmetro = rodada atual)
  const { data: jogosRodadaAtual, isLoading } = useQuery({
    queryKey: ['jogos-rodada-atual', faseAtual?.id],
    queryFn: () => listarJogosFase(faseAtual!.id),
    enabled: !!faseAtual?.id,
  });

  const rodadaAtual = jogosRodadaAtual?.rodadaAtual ?? null;

  const jogosAtual = jogosRodadaAtual?.jogos ?? [];

  // Rodada real = rodada do primeiro jogo agendado (ignora adiados da rodada 4)
  const rodadaReal = jogosAtual.find((j: Jogo) => j.status === 'AGENDADO' && j.dataHora)?.rodada ?? rodadaAtual;
  const proximaRodada = rodadaReal ? rodadaReal + 1 : null;

  const { data: jogosProximaRodada } = useQuery({
    queryKey: ['jogos-proxima-rodada', faseAtual?.id, proximaRodada],
    queryFn: () => listarJogosFase(faseAtual!.id, proximaRodada!),
    enabled: !!faseAtual?.id && !!proximaRodada && proximaRodada <= 38,
  });

  const jogosProxima = jogosProximaRodada?.jogos ?? [];

  // Filtrar jogos relevantes e colocar palpitáveis no topo
  const jogosAtualVisiveis = jogosAtual
    .filter(
      (j: Jogo) => j.status === 'AGENDADO' || j.status === 'EM_ANDAMENTO' || j.status === 'FINALIZADO'
    )
    .sort((a: Jogo, b: Jogo) => {
      const palpitavelA = a.status === 'AGENDADO';
      const palpitavelB = b.status === 'AGENDADO';
      if (palpitavelA && !palpitavelB) return -1;
      if (!palpitavelA && palpitavelB) return 1;
      return 0;
    });
  const jogosProximaVisiveis = jogosProxima.filter(
    (j: Jogo) => j.status === 'AGENDADO' || j.status === 'EM_ANDAMENTO'
  );

  // Buscar todos os palpites do usuário de uma vez e popular cache individual
  const todosJogoIds = [...jogosAtualVisiveis, ...jogosProximaVisiveis].map((j) => j.id);
  const queryClient = useQueryClient();

  useQuery({
    queryKey: ['meus-palpites-batch', faseAtual?.id, rodadaReal, proximaRodada, usuario?.id],
    queryFn: async () => {
      const palpites = await buscarMeusPalpitesPorJogos(todosJogoIds);
      const palpitesPorJogo = new Map(palpites.map((p) => [p.jogoId, p]));
      for (const jogoId of todosJogoIds) {
        queryClient.setQueryData(['meu-palpite', jogoId], palpitesPorJogo.get(jogoId) ?? null);
      }
      return palpites;
    },
    enabled: todosJogoIds.length > 0 && !isLoading,
    staleTime: Infinity,
  });

  // Meus palpites anteriores (jogos finalizados)
  const { data: meusPalpitesAnteriores, isLoading: carregandoPalpites } = useQuery({
    queryKey: ['meus-palpites-historico', temporadaId, usuario?.id],
    queryFn: () => listarMeusPalpites(temporadaId),
    enabled: !!temporadaId && abaAtiva === 'meus',
  });

  // Agrupar por rodada (decrescente) e filtrar só finalizados
  const palpitesFinalizados = (meusPalpitesAnteriores ?? [])
    .filter((p: PalpiteComJogo) => p.jogo?.status === 'FINALIZADO')
    .sort((a: PalpiteComJogo, b: PalpiteComJogo) => (b.jogo?.rodada ?? 0) - (a.jogo?.rodada ?? 0));

  const palpitesPorRodada = palpitesFinalizados.reduce<Record<number, PalpiteComJogo[]>>((acc, p) => {
    const rodada = p.jogo?.rodada ?? 0;
    if (!acc[rodada]) acc[rodada] = [];
    acc[rodada].push(p);
    return acc;
  }, {});  if (!temporadaId) {
    return (
      <div className="min-h-screen bg-fundo flex items-center justify-center pb-20">
        <p className="text-texto/40 text-sm">Entre em um grupo para ver os palpites</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fundo pb-36">
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 bg-fundo/95 backdrop-blur-lg border-b border-white/[0.05]">
        <div className="mx-auto max-w-[480px]">
          <div className="flex items-center gap-2 mb-1">
            <IconPalpite size={22} className="text-primaria-claro" />
            <h1 className="text-lg font-bold text-texto">Palpites</h1>
          </div>
          <p className="text-[10px] text-texto/30">Mostre que você entende de futebol!</p>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 pt-3">
        {/* Abas */}
        <div className="flex items-center gap-0 border-b border-white/[0.06] mb-4">
          <button
            onClick={() => setAbaAtiva('todos')}
            className={`flex-1 py-2.5 text-[11px] font-semibold text-center border-b-2 transition-colors ${
              abaAtiva === 'todos'
                ? 'text-texto border-primaria-claro'
                : 'text-texto/40 border-transparent'
            }`}
          >
            Todos os jogos
          </button>
          <button
            onClick={() => setAbaAtiva('meus')}
            className={`flex-1 py-2.5 text-[11px] font-semibold text-center border-b-2 transition-colors ${
              abaAtiva === 'meus'
                ? 'text-texto border-primaria-claro'
                : 'text-texto/40 border-transparent'
            }`}
          >
            Meus palpites
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[120px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        )}

        {/* Conteúdo da aba "Todos os jogos" */}
        {!isLoading && abaAtiva === 'todos' && (
          <div>
            {/* Rodada atual */}
            {jogosAtualVisiveis.length > 0 && (
              <>
                <div className="sticky top-[72px] z-10 flex items-center gap-3 py-3 -mx-4 px-4 bg-fundo/95 backdrop-blur-md">
                  <span className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primaria/40 to-primaria/60 rounded-full" />
                  <span className="text-sm text-texto font-bold uppercase tracking-wider px-5 py-2 rounded-full border border-primaria bg-gradient-to-r from-primaria/15 to-primaria/5 shadow-[0_0_20px_rgba(34,197,94,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
                    ⚽ Rodada {jogosAtualVisiveis[0]?.rodada ?? rodadaAtual}
                  </span>
                  <span className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-primaria/40 to-primaria/60 rounded-full" />
                </div>
                <div className="space-y-2">
                  {jogosAtualVisiveis.map((jogo: Jogo) => (
                    <CardJogoPalpite
                      key={jogo.id}
                      jogo={jogo}
                      palpitavel={jogoPalpitavel(jogo)}
                      bloqueado={jogoJaComecou(jogo)}
                      grupoId={grupoId}
                      ativo={cardAtivo === jogo.id}
                      onFoco={() => setCardAtivo(jogo.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Próxima rodada */}
            {jogosProximaVisiveis.length > 0 && proximaRodada && (
              <>
                <div className="sticky top-[72px] z-10 flex items-center gap-3 py-3 -mx-4 px-4 bg-fundo/95 backdrop-blur-md mt-4">
                  <span className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primaria/40 to-primaria/60 rounded-full" />
                  <span className="text-sm text-texto font-bold uppercase tracking-wider px-5 py-2 rounded-full border border-primaria bg-gradient-to-r from-primaria/15 to-primaria/5 shadow-[0_0_20px_rgba(34,197,94,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
                    ⚽ Rodada {proximaRodada}
                  </span>
                  <span className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-primaria/40 to-primaria/60 rounded-full" />
                </div>
                <div className="space-y-2">
                  {jogosProximaVisiveis.map((jogo: Jogo) => (
                    <CardJogoPalpite
                      key={jogo.id}
                      jogo={jogo}
                      palpitavel={jogoPalpitavel(jogo)}
                      bloqueado={jogoJaComecou(jogo)}
                      grupoId={grupoId}
                      ativo={cardAtivo === jogo.id}
                      onFoco={() => setCardAtivo(jogo.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {jogosAtualVisiveis.length === 0 && jogosProximaVisiveis.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <IconPalpite size={32} className="text-texto/15 mb-3" />
                <p className="text-texto/40 text-sm">Nenhum jogo disponível</p>
              </div>
            )}
          </div>
        )}

        {/* Aba "Meus palpites" */}
        {!isLoading && abaAtiva === 'meus' && (
          <div>
            {/* Filtro por rodada com combobox */}
            {!carregandoPalpites && palpitesFinalizados.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] text-texto/40 uppercase tracking-wider shrink-0">Filtrar por rodada</span>
                <button
                  onClick={() => {
                    const rodadas = Object.keys(palpitesPorRodada).map(Number).sort((a, b) => b - a);
                    if (filtroRodada === null) { setFiltroRodada(rodadas[0]); return; }
                    const idx = rodadas.indexOf(filtroRodada);
                    if (idx < rodadas.length - 1) setFiltroRodada(rodadas[idx + 1]);
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.12] text-texto/60 hover:text-texto text-lg"
                >
                  ‹
                </button>
                <div ref={dropdownRodadaRef} className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setDropdownRodadaAberto(!dropdownRodadaAberto)}
                    className="w-full bg-white/[0.04] border border-primaria/50 rounded-lg pl-8 pr-6 py-2 text-xs text-texto text-center cursor-pointer focus:border-primaria focus:outline-none shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                  >
                    {filtroRodada ? `Rodada ${filtroRodada}` : 'Todas'}
                  </button>
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-primaria-claro"><Calendar size={14} /></span>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primaria-claro pointer-events-none text-[10px]">▼</span>

                  {/* Dropdown customizado */}
                  {dropdownRodadaAberto && (
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 rounded-xl border border-white/[0.12] bg-[#0d1a2d] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-2">
                      <button
                        type="button"
                        onClick={() => { setFiltroRodada(null); setDropdownRodadaAberto(false); }}
                        className={`w-full py-2 mb-1 text-xs text-center rounded-lg transition-colors ${
                          filtroRodada === null ? 'text-primaria-claro bg-primaria/15' : 'text-texto/70 hover:bg-white/[0.06]'
                        }`}
                      >
                        Todas
                      </button>
                      <div className="grid grid-cols-5 gap-1.5">
                        {Object.keys(palpitesPorRodada)
                          .sort((a, b) => Number(b) - Number(a))
                          .map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => { setFiltroRodada(Number(r)); setDropdownRodadaAberto(false); }}
                              className={`py-2 text-[11px] text-center rounded-lg font-medium transition-colors ${
                                filtroRodada === Number(r) ? 'text-primaria-claro bg-primaria/15' : 'text-texto/60 hover:bg-white/[0.06]'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    const rodadas = Object.keys(palpitesPorRodada).map(Number).sort((a, b) => b - a);
                    if (filtroRodada === null) return;
                    const idx = rodadas.indexOf(filtroRodada);
                    if (idx > 0) setFiltroRodada(rodadas[idx - 1]);
                    else setFiltroRodada(null);
                  }}
                  disabled={filtroRodada === null}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.12] text-lg ${
                    filtroRodada === null ? 'text-texto/20 cursor-not-allowed' : 'text-texto/60 hover:text-texto'
                  }`}
                >
                  ›
                </button>
                {/* Filtro por tipo */}
                <div ref={dropdownTipoRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownTipoAberto(!dropdownTipoAberto)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-semibold transition-colors ${
                      filtroTipo !== 'todos'
                        ? 'bg-primaria/10 text-primaria-claro border-primaria/50'
                        : 'bg-white/[0.04] text-texto/60 border-white/[0.12]'
                    }`}
                  >
                    {filtroTipo === 'todos' && '⚽ Filtros'}
                    {filtroTipo === 'cheio' && '🎯 Em cheio'}
                    {filtroTipo === 'parcial' && '✓ Parcial'}
                    {filtroTipo === 'nada' && '✗ Errou'}
                  </button>

                  {dropdownTipoAberto && (
                    <div className="absolute z-20 top-full mt-1 right-0 w-36 rounded-xl border border-white/[0.12] bg-[#0d1a2d] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1.5">
                      {([
                        { valor: 'todos', icone: '⚽', label: 'Todos' },
                        { valor: 'cheio', icone: '🎯', label: 'Em cheio' },
                        { valor: 'parcial', icone: '✓', label: 'Parcial' },
                        { valor: 'nada', icone: '✗', label: 'Errou' },
                      ] as const).map((item) => (
                        <button
                          key={item.valor}
                          type="button"
                          onClick={() => { setFiltroTipo(item.valor); setDropdownTipoAberto(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
                            filtroTipo === item.valor
                              ? 'text-primaria-claro bg-primaria/15'
                              : 'text-texto/70 hover:bg-white/[0.06]'
                          }`}
                        >
                          <span>{item.icone}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {carregandoPalpites ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[80px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
                ))}
              </div>
            ) : palpitesFinalizados.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <IconPalpite size={32} className="text-texto/15 mb-3" />
                <p className="text-texto/40 text-sm">Nenhum palpite anterior</p>
              </div>
            ) : (
              <>
                {Object.entries(palpitesPorRodada)
                  .filter(([rodada]) => filtroRodada === null || Number(rodada) === filtroRodada)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([rodada, palpites]) => {
                    const palpitesFiltrados = palpites.filter((p: PalpiteComJogo) => {
                      if (filtroTipo === 'todos') return true;
                      const pts = calcularPontos(p);
                      if (filtroTipo === 'cheio') return pts === PONTOS.ACERTO_EM_CHEIO;
                      if (filtroTipo === 'parcial') return pts === PONTOS.ACERTO_RESULTADO;
                      return pts === 0;
                    });
                    if (palpitesFiltrados.length === 0) return null;
                    return (
                      <div key={rodada} className="mb-4">
                        {/* Separador de rodada (oculto quando filtrado por rodada específica) */}
                        {filtroRodada === null && (
                          <div className="flex items-center gap-3 py-2 mb-2">
                            <span className="h-px flex-1 bg-white/[0.06]" />
                            <span className="text-[11px] text-texto/60 font-semibold uppercase tracking-wider">
                              Rodada {rodada}
                            </span>
                            <span className="h-px flex-1 bg-white/[0.06]" />
                          </div>
                        )}
                        <div className="space-y-2">
                          {palpitesFiltrados.map((p: PalpiteComJogo) => {
                            const pts = calcularPontos(p);
                            const temPontos = pts > 0;
                            return (
                              <div
                                key={p.id}
                                className={`rounded-2xl border p-3 relative overflow-hidden bg-white/[0.04] backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] ${
                                  temPontos
                                    ? 'border-primaria/40 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                                    : 'border-white/[0.12]'
                                }`}
                              >
                                {temPontos && (
                                  <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-gradient-to-b from-primaria via-primaria-claro to-primaria/30 shadow-[0_0_14px_rgba(34,197,94,0.6)]" />
                                )}
                                {pts === PONTOS.ACERTO_EM_CHEIO && (
                                  <>
                                    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-gradient-to-r from-primaria via-primaria-claro to-primaria/30 shadow-[0_0_14px_rgba(34,197,94,0.6)]" />
                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-xl bg-gradient-to-r from-primaria/30 via-primaria-claro to-primaria shadow-[0_0_14px_rgba(34,197,94,0.6)]" />
                                  </>
                                )}

                                {/* Layout igual ao card de todos os jogos */}
                                <div className="flex items-center gap-2">
                                  {/* Time Casa */}
                                  <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                                    <div className="relative h-14 flex items-center justify-center">
                                      <div className="absolute inset-0 rounded-full bg-white/30 blur-lg" />
                                      {p.jogo?.timeCasa?.escudo ? (
                                        <img src={p.jogo.timeCasa.escudo} alt="" className="relative h-14 w-14 object-contain" />
                                      ) : (
                                        <div className="relative h-14 w-14 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
                                          {p.jogo?.timeCasa?.sigla || '?'}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-xs text-texto font-medium truncate max-w-[70px]">
                                      {p.jogo?.timeCasa?.nome || 'Casa'}
                                    </span>
                                  </div>

                                  {/* Centro: Placar */}
                                  <div className="flex flex-col items-center shrink-0 w-[140px]">
                                    <span className="text-[11px] text-texto/80 uppercase tracking-wide mb-1.5">Placar final</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl font-bold text-texto">{p.jogo?.golsCasa ?? 0}</span>
                                      <span className="text-sm font-bold text-texto/40">x</span>
                                      <span className="text-2xl font-bold text-texto">{p.jogo?.golsFora ?? 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      <span className="text-[9px] text-texto/40">Palpite:</span>
                                      <span className="text-[11px] font-semibold text-primaria-claro">
                                        {p.golsCasa} × {p.golsFora}
                                      </span>
                                    </div>
                                    <div className="mt-1.5">
                                      {temPontos ? (
                                        <span className="text-[10px] text-primaria font-semibold flex items-center gap-1">
                                          +{pts} {pts > 1 ? 'pontos' : 'ponto'} ✓
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-texto/30">0 pontos</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Time Fora */}
                                  <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                                    <div className="relative h-14 flex items-center justify-center">
                                      <div className="absolute inset-0 rounded-full bg-white/30 blur-lg" />
                                      {p.jogo?.timeFora?.escudo ? (
                                        <img src={p.jogo.timeFora.escudo} alt="" className="relative h-14 w-14 object-contain" />
                                      ) : (
                                        <div className="relative h-14 w-14 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
                                          {p.jogo?.timeFora?.sigla || '?'}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-xs text-texto font-medium truncate max-w-[70px]">
                                      {p.jogo?.timeFora?.nome || 'Fora'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                {/* Resumo fixo acima do menu */}
                <div className="fixed bottom-[74px] left-0 right-0 z-20 px-4 safe-area-bottom">
                  <div className="mx-auto max-w-[480px] py-3 px-2 bg-[#0d1a2d]/95 backdrop-blur-md border border-white/[0.15] rounded-xl">
                    <div className="flex items-center justify-evenly">
                    <div className="flex items-center gap-1.5">
                      <Crosshair size={18} className="text-primaria-claro" />
                      <div>
                        <p className="text-[10px] text-texto/50 font-semibold">Em cheio</p>
                        <p className="text-sm font-bold text-primaria">
                          {(() => {
                            const total = (filtroRodada
                              ? palpitesPorRodada[filtroRodada] ?? []
                              : palpitesFinalizados
                            ).filter((p: PalpiteComJogo) => calcularPontos(p) === PONTOS.ACERTO_EM_CHEIO).length;
                            return total > 0 ? total : 0;
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy size={18} className="text-primaria-claro" />
                      <div>
                        <p className="text-[10px] text-texto/50 font-semibold">Pontuação</p>
                        <p className="text-sm font-bold text-primaria">
                          {(filtroRodada
                            ? palpitesPorRodada[filtroRodada] ?? []
                            : palpitesFinalizados
                          ).reduce((acc: number, p: PalpiteComJogo) => acc + calcularPontos(p), 0)} pts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={18} className="text-primaria-claro" />
                      <div>
                        <p className="text-[10px] text-texto/50 font-semibold">Aproveitamento</p>
                        <p className="text-sm font-bold text-primaria">
                          {(() => {
                            const lista = filtroRodada ? palpitesPorRodada[filtroRodada] ?? [] : palpitesFinalizados;
                            return lista.length > 0
                              ? Math.round((lista.filter((p: PalpiteComJogo) => calcularPontos(p) > 0).length / lista.length) * 100)
                              : 0;
                          })()}%
                        </p>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
