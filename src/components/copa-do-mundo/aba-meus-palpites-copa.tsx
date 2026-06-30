'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { listarMeusPalpites, buscarDetalhamentoJogo } from '@/services/palpite.service';
import { listarFases, listarJogosTemporada } from '@/services/jogo.service';
import { formatarPontuacao } from '@/lib/pontuacao-formatada';
import { ListaPalpitesMembros } from '@/components/palpites/lista-palpites-membros';
import { PalpiteComJogo } from '@/types/palpite.types';
import { Jogo } from '@/types/jogo.types';

interface PropsAbaMeusPalpitesCopa {
  grupoId: string;
  temporadaId: string;
}

function obterClassePalpite(acertouEmCheio: boolean, acertouResultado: boolean | undefined, jogoFinalizado: boolean): string {
  if (acertouEmCheio) return 'bg-[#22c55e]/20 text-[#22c55e]';
  if (acertouResultado) return 'bg-[#ffdf00]/15 text-[#ffdf00]';
  if (jogoFinalizado) return 'bg-[#ff5500]/20 text-[#ff5500]';
  return 'bg-white/[0.06] text-white';
}

function agruparPalpites(palpites: PalpiteComJogo[]): PalpiteComJogo[] {
  return palpites
    .filter((p) => {
      const jogo = p.jogo;
      if (!jogo) return false;
      return jogo.status === 'EM_ANDAMENTO' || jogo.status === 'FINALIZADO';
    })
    .sort((a, b) => {
      const dataA = a.jogo?.dataHora ? new Date(a.jogo.dataHora).getTime() : 0;
      const dataB = b.jogo?.dataHora ? new Date(b.jogo.dataHora).getTime() : 0;
      return dataB - dataA;
    });
}

export function AbaMeusPalpitesCopa({ grupoId, temporadaId }: Readonly<PropsAbaMeusPalpitesCopa>) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const { data: palpites, isLoading: carregandoPalpites } = useQuery({
    queryKey: ['meus-palpites-copa', temporadaId],
    queryFn: () => listarMeusPalpites(temporadaId),
    enabled: !!temporadaId,
    staleTime: Infinity,
  });

  const { data: todosJogos } = useQuery({
    queryKey: ['jogos-temporada-todos', temporadaId],
    queryFn: () => listarJogosTemporada(temporadaId),
    enabled: !!temporadaId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: fases } = useQuery({
    queryKey: ['fases', temporadaId],
    queryFn: () => listarFases(temporadaId),
    enabled: !!temporadaId,
    staleTime: 1000 * 60 * 60,
  });

  const fasesMap = new Map<string, string>();
  if (fases) {
    for (const f of fases) {
      fasesMap.set(f.id, f.nome);
    }
  }

  // Mesclar palpites com jogos finalizados sem palpite
  const palpitesMesclados = (() => {
    const meusPalpites = palpites ?? [];
    const jogosFinalizados = (todosJogos ?? []).filter((j: Jogo) => j.status === 'FINALIZADO' || j.status === 'EM_ANDAMENTO');
    const jogoIdsComPalpite = new Set(meusPalpites.map((p) => p.jogoId));

    const semPalpite: PalpiteComJogo[] = jogosFinalizados
      .filter((j) => !jogoIdsComPalpite.has(j.id))
      .map((j) => ({
        id: `sem-palpite-${j.id}`,
        golsCasa: -1,
        golsFora: -1,
        jogoId: j.id,
        usuarioId: '',
        dataCriacao: '',
        atualizadoEm: '',
        jogo: {
          id: j.id,
          faseId: j.faseId,
          rodada: j.rodada,
          status: j.status,
          dataHora: j.dataHora,
          golsCasa: j.golsCasa,
          golsFora: j.golsFora,
          foiAdiado: j.foiAdiado ?? false,
          temPenaltis: j.temPenaltis ?? false,
          penaltisCasa: j.penaltisCasa ?? null,
          penaltisFora: j.penaltisFora ?? null,
          timeCasa: j.timeCasa ?? null,
          timeFora: j.timeFora ?? null,
        },
      }));

    return [...meusPalpites, ...semPalpite];
  })();

  const listaOrdenada = agruparPalpites(palpitesMesclados);

  function toggleExpandido(jogoId: string) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(jogoId)) {
        next.delete(jogoId);
      } else {
        next.add(jogoId);
      }
      return next;
    });
  }

  if (carregandoPalpites) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-[#ffdf00]/60" />
      </div>
    );
  }

  if (!palpites || palpites.length === 0) {
    return (
      <div className="rounded-xl border border-[#009c3b]/20 bg-[#009c3b]/[0.04] p-6 text-center">
        <span className="text-2xl mb-2 block">🎯</span>
        <p className="text-[12px] text-[#a8e6b0]/70">Nenhum palpite registrado ainda</p>
        <p className="text-[10px] text-[#a8e6b0]/40 mt-1">Faça palpites nos jogos da Copa!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {listaOrdenada.map((palpite) => (
        <CardPalpiteCopa
          key={palpite.id}
          palpite={palpite}
          grupoId={grupoId}
          expandido={expandidos.has(palpite.jogoId)}
          onToggle={() => toggleExpandido(palpite.jogoId)}
          nomeFase={palpite.jogo?.faseId ? fasesMap.get(palpite.jogo.faseId) : undefined}
        />
      ))}
    </div>
  );
}

interface PropsCardPalpiteCopa {
  palpite: PalpiteComJogo;
  grupoId: string;
  expandido: boolean;
  onToggle: () => void;
  nomeFase?: string;
}

function CardPalpiteCopa({ palpite, grupoId, expandido, onToggle, nomeFase }: Readonly<PropsCardPalpiteCopa>) {
  const jogo = palpite.jogo;
  const jogoFinalizado = jogo?.status === 'FINALIZADO';
  const jogoEmAndamento = jogo?.status === 'EM_ANDAMENTO';
  const jogoIniciouOuFinalizou = jogoFinalizado || jogoEmAndamento;

  const { data: palpitesMembros, isLoading: carregandoMembros } = useQuery({
    queryKey: ['detalhamento-jogo', grupoId, palpite.jogoId],
    queryFn: () => buscarDetalhamentoJogo(grupoId, palpite.jogoId),
    enabled: expandido && jogoIniciouOuFinalizou,
    staleTime: 1000 * 60 * 10,
  });

  if (!jogo) return null;

  const semPalpite = palpite.golsCasa === -1 && palpite.golsFora === -1;
  const acertouEmCheio = !semPalpite && jogoFinalizado && jogo.golsCasa === palpite.golsCasa && jogo.golsFora === palpite.golsFora;
  const acertouResultado = !semPalpite && jogoFinalizado && !acertouEmCheio && (() => {
    const resultadoReal = Math.sign((jogo.golsCasa ?? 0) - (jogo.golsFora ?? 0));
    const resultadoPalpite = Math.sign(palpite.golsCasa - palpite.golsFora);
    return resultadoReal === resultadoPalpite;
  })();

  return (
    <div className="rounded-xl border border-[#ffdf00]/30 bg-[#009c3b]/[0.06] overflow-hidden shadow-[0_0_12px_rgba(255,223,0,0.1)]">
      {/* Data + Grupo */}
      <div className="flex items-center justify-between px-3 pt-2">
        <span className="text-[9px] text-[#ffdf00] font-bold">
          {jogo.dataHora
            ? new Date(jogo.dataHora).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).toUpperCase().replace('.', '')
            : ''}
          {jogo.dataHora && ' • '}
          {jogo.dataHora && new Date(jogo.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
        </span>
        <span className="text-[9px] text-[#ffdf00] font-bold">
          {(() => {
            if (nomeFase && !nomeFase.toLowerCase().includes('grupo')) return nomeFase;
            const rodadaLabel = jogo.rodada ? `Rodada ${jogo.rodada}` : '';
            if (rodadaLabel && nomeFase) return `${rodadaLabel} — ${nomeFase}`;
            return rodadaLabel || nomeFase || '';
          })()}
        </span>
      </div>

      {/* Card principal */}
      <button
        type="button"
        onClick={onToggle}
        disabled={!jogoIniciouOuFinalizou}
        className="w-full flex items-center gap-3 px-3 pb-3 pt-1.5 text-left disabled:cursor-default"
      >
        {/* Escudos */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {jogo.timeCasa?.escudo && (
            <Image src={jogo.timeCasa.escudo} alt={jogo.timeCasa.nome ?? ''} width={28} height={28} className="h-7 w-7 object-contain shrink-0" unoptimized />
          )}
          <span className="text-[11px] text-[#ffdf00] font-semibold truncate">
            {jogo.timeCasa?.sigla ?? '?'}
          </span>
        </div>

        {/* Placar / Palpite */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          {jogoFinalizado && (
            <span className="text-[9px] text-[#ffdf00] font-bold">PLACAR FINAL: {jogo.golsCasa} × {jogo.golsFora}</span>
          )}
          {jogo.temPenaltis && jogo.penaltisCasa != null && jogo.penaltisFora != null && (
            <span className="text-[8px] text-[#a8e6b0]/60">({jogo.penaltisCasa} × {jogo.penaltisFora} pen.)</span>
          )}
          <div className="flex items-center gap-1">
            {semPalpite ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-400">Sem palpite</span>
            ) : (
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${obterClassePalpite(acertouEmCheio, acertouResultado, jogoFinalizado)}`}>
                {palpite.golsCasa} × {palpite.golsFora}
              </span>
            )}
          </div>
          {acertouEmCheio && <span className="text-[9px] text-[#22c55e] font-bold">{formatarPontuacao(3)}</span>}
          {acertouResultado && <span className="text-[9px] text-[#ffdf00] font-bold">{formatarPontuacao(1)}</span>}
          {jogoFinalizado && !acertouEmCheio && !acertouResultado && !semPalpite && (
            <span className="text-[9px] text-[#ff5500] font-bold">{formatarPontuacao(0)}</span>
          )}
          {semPalpite && jogoFinalizado && (
            <span className="text-[9px] text-red-400/60">0 pts</span>
          )}
        </div>

        {/* Time fora */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-[11px] text-[#ffdf00] font-medium truncate">
            {jogo.timeFora?.sigla ?? '?'}
          </span>
          {jogo.timeFora?.escudo && (
            <Image src={jogo.timeFora.escudo} alt={jogo.timeFora.nome ?? ''} width={28} height={28} className="h-7 w-7 object-contain shrink-0" unoptimized />
          )}
        </div>

        {/* Chevron para expandir */}
        {jogoIniciouOuFinalizou ? (
          <ChevronDown
            size={18}
            className={`text-[#ffdf00] transition-transform shrink-0 ${expandido ? 'rotate-180' : ''}`}
          />
        ) : (
          <div className="w-[18px] shrink-0" />
        )}
      </button>

      {/* Dropdown: palpites dos outros membros */}
      {expandido && jogoIniciouOuFinalizou && (
        <div className="border-t border-[#009c3b]/15 bg-[#009c3b]/[0.03] px-3 py-2">
          {carregandoMembros && (
            <div className="flex items-center justify-center py-3">
              <Loader2 size={16} className="animate-spin text-[#ffdf00]/60" />
            </div>
          )}
          {palpitesMembros && palpitesMembros.length > 0 ? (
            <ListaPalpitesMembros
              detalhamento={palpitesMembros}
              statusJogo={jogo.status}
              temaCopa
            />
          ) : (
            !carregandoMembros && (
              <p className="text-[10px] text-[#a8e6b0]/40 text-center py-1">
                Nenhum outro palpite neste jogo
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}

