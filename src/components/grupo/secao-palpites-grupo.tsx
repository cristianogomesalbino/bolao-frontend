'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { listarJogosTemporada } from '@/services/jogo.service';
import { buscarDetalhamentoJogo, DetalhamentoPalpiteMembro } from '@/services/palpite.service';
import { Jogo } from '@/types/jogo.types';

interface PropsSecaoPalpitesGrupo {
  grupoId: string;
  temporadaId: string;
}

interface GrupoRodada {
  rodada: number;
  jogos: Jogo[];
  label: string;
}

/**
 * Agrupa jogos por data de realização, respeitando a ordem cronológica reversa.
 * Jogos atrasados (rodada menor realizados depois) aparecem na posição correta
 * pela data de realização, não pela rodada original.
 */
function agruparPorDataRealizacao(jogos: Jogo[]): GrupoRodada[] {
  // Ordenar TODOS os jogos por data de realização decrescente
  const ordenados = jogos.toSorted(
    (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
  );

  // Agrupar jogos consecutivos da mesma rodada
  const grupos: GrupoRodada[] = [];
  let grupoAtual: GrupoRodada | null = null;

  for (const jogo of ordenados) {
    const rodada = jogo.rodada ?? 0;
    const ehAtrasado = jogo.foiAdiado === true;

    if (grupoAtual !== null && grupoAtual.rodada === rodada && !ehAtrasado) {
      grupoAtual.jogos.push(jogo);
    } else if (ehAtrasado && grupoAtual !== null) {
      // Jogo atrasado: agrupa como "Atrasado (R4)" dentro do bloco atual
      const labelAtrasado = `Rodada ${rodada} (atrasado)`;
      const grupoAtrasado = grupos.find((g) => g.label === labelAtrasado);
      if (grupoAtrasado) {
        grupoAtrasado.jogos.push(jogo);
      } else {
        grupos.push({ rodada, jogos: [jogo], label: labelAtrasado });
      }
    } else {
      grupoAtual = { rodada, jogos: [jogo], label: `Rodada ${rodada}` };
      grupos.push(grupoAtual);
    }
  }

  return grupos;
}

function formatarDataHora(dataHora: string): string {
  return new Date(dataHora).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

const RODADAS_POR_PAGINA = 2;

export function SecaoPalpitesGrupo({ grupoId, temporadaId }: Readonly<PropsSecaoPalpitesGrupo>) {
  const [expandido, setExpandido] = useState(false);
  const [jogoAberto, setJogoAberto] = useState<string | null>(null);
  const [rodadasVisiveis, setRodadasVisiveis] = useState(RODADAS_POR_PAGINA);

  const { data: jogos, isLoading } = useQuery({
    queryKey: ['jogos-temporada', temporadaId, 'finalizados'],
    queryFn: async () => {
      const todos = await listarJogosTemporada(temporadaId);
      return todos.filter((j) => j.status === 'FINALIZADO');
    },
    enabled: expandido,
    staleTime: 1000 * 60 * 5,
  });

  const rodadas = jogos ? agruparPorDataRealizacao(jogos) : [];
  const rodadasExibidas = rodadas.slice(0, rodadasVisiveis);
  const temMais = rodadas.length > rodadasVisiveis;

  function alternarJogo(jogoId: string) {
    setJogoAberto(jogoAberto === jogoId ? null : jogoId);
  }

  function carregarMais() {
    setRodadasVisiveis((prev) => prev + RODADAS_POR_PAGINA);
  }

  return (
    <div className="rounded-2xl border border-primaria bg-white/[0.03] shadow-[0_0_20px_rgba(22,163,74,0.2)] overflow-hidden">
      {/* Header clicável */}
      <button
        type="button"
        onClick={() => setExpandido(!expandido)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
        data-testid="grupo-btn-palpites"
        data-dica="grupo-palpites"
      >
        <span className="text-sm font-semibold text-texto">Palpites do grupo</span>
        <ChevronDown
          size={22}
          className={`text-primaria-claro/60 transition-transform duration-200 ${expandido ? 'rotate-180' : 'animate-bounce'}`}
        />
      </button>

      {/* Conteúdo expandido */}
      {expandido && (
        <div className="border-t border-white/[0.05] px-4 pb-4 pt-3 animate-[fadeIn_0.2s_ease-out]" data-dica="palpites-grupo-conteudo">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && rodadas.length === 0 && (
            <p className="text-[11px] text-texto/30 text-center py-4">
              Nenhum jogo finalizado ainda
            </p>
          )}

          {!isLoading && rodadasExibidas.length > 0 && (
            <div className="space-y-4">
              {rodadasExibidas.map((grupo, idx) => (
                <div key={`${idx}-${grupo.label}`}>
                  <span className={`text-[10px] uppercase tracking-[0.12em] font-bold ${
                    grupo.label.includes('atrasado')
                      ? 'text-destaque/70'
                      : 'text-primaria-claro/70'
                  }`}>
                    {grupo.label}
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {grupo.jogos.map((jogo, jogoIdx) => (
                      <JogoExpandivel
                        key={jogo.id}
                        jogo={jogo}
                        grupoId={grupoId}
                        aberto={jogoAberto === jogo.id}
                        onToggle={() => alternarJogo(jogo.id)}
                        ehPrimeiro={idx === 0 && jogoIdx === 0}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Botão carregar mais */}
              {temMais && (
                <button
                  type="button"
                  onClick={carregarMais}
                  className="w-full py-2.5 text-[11px] text-primaria-claro font-semibold hover:text-primaria transition-colors border-t border-white/[0.05] mt-2"
                >
                  Mais jogos ↓
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Jogo com palpites expandíveis inline */
function JogoExpandivel({
  jogo,
  grupoId,
  aberto,
  onToggle,
  ehPrimeiro,
}: Readonly<{
  jogo: Jogo;
  grupoId: string;
  aberto: boolean;
  onToggle: () => void;
  ehPrimeiro?: boolean;
}>) {
  const casaSigla = jogo.timeCasa?.sigla ?? '???';
  const foraSigla = jogo.timeFora?.sigla ?? '???';
  const escudoCasa = jogo.timeCasa?.escudo;
  const escudoFora = jogo.timeFora?.escudo;

  const { data: detalhamento, isLoading: carregandoPalpites } = useQuery({
    queryKey: ['detalhamento-jogo', grupoId, jogo.id],
    queryFn: () => buscarDetalhamentoJogo(grupoId, jogo.id),
    enabled: aberto,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="rounded-lg overflow-hidden">
      {/* Linha do jogo — clicável */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-2 py-2.5 px-2.5 rounded-lg border transition-colors ${
          aberto
            ? 'bg-white/[0.05] border-white/[0.12]'
            : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]'
        }`}
      >
        {/* Time casa */}
        <div className="flex items-center gap-1.5 w-[70px] justify-end shrink-0">
          <span className="text-[11px] text-texto font-medium">{casaSigla}</span>
          {escudoCasa ? (
            <Image src={escudoCasa} alt={casaSigla} width={20} height={20} className="h-5 w-5 object-contain" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-white/[0.08]" />
          )}
        </div>

        {/* Placar + data */}
        <div className="flex flex-col items-center min-w-[50px]">
          <span className="text-[13px] text-texto font-bold">
            {jogo.golsCasa ?? 0} × {jogo.golsFora ?? 0}
          </span>
          <span className="text-[9px] text-texto/30">
            {formatarDataHora(jogo.dataHora)}
          </span>
        </div>

        {/* Time fora */}
        <div className="flex items-center gap-1.5 w-[70px] shrink-0">
          {escudoFora ? (
            <Image src={escudoFora} alt={foraSigla} width={20} height={20} className="h-5 w-5 object-contain" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-white/[0.08]" />
          )}
          <span className="text-[11px] text-texto font-medium">{foraSigla}</span>
        </div>

        <ChevronDown
          size={16}
          className={`text-primaria-claro/60 ml-auto transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
          {...(ehPrimeiro ? { 'data-dica': 'chevron-jogo-grupo' } : {})}
        />
      </button>

      {/* Palpites dos membros — expandido */}
      {aberto && (
        <div className="bg-white/[0.02] border-t border-white/[0.04] px-3 py-2 animate-[fadeIn_0.15s_ease-out]">
          {carregandoPalpites && (
            <div className="flex items-center justify-center py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primaria border-t-transparent" />
            </div>
          )}

          {!carregandoPalpites && (!detalhamento || detalhamento.length === 0) && (
            <p className="text-[10px] text-texto/25 text-center py-2">Nenhum palpite</p>
          )}

          {!carregandoPalpites && detalhamento && detalhamento.length > 0 && (
            <div className="space-y-1">
              {detalhamento.map((membro) => (
                <PalpiteMembroLinha key={membro.usuarioId} membro={membro} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Linha de palpite de um membro */
function PalpiteMembroLinha({ membro }: Readonly<{ membro: DetalhamentoPalpiteMembro }>) {
  const naoPalpitou = membro.golsCasaPalpite === null;
  const primeiroNome = membro.nomeUsuario.split(' ')[0];

  if (naoPalpitou) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-[11px] text-texto/40 flex-1 truncate">{primeiroNome}</span>
        <span className="text-[10px] text-texto/20">—</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[11px] text-texto flex-1 truncate">{primeiroNome}</span>
      <span className="text-[12px] font-bold text-primaria-claro">
        {membro.golsCasaPalpite} × {membro.golsForaPalpite}
      </span>
    </div>
  );
}
