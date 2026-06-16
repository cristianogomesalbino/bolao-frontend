'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Loader2 } from 'lucide-react';
import { listarMeusPalpites, buscarDetalhamentoJogo } from '@/services/palpite.service';
import { listarFases } from '@/services/jogo.service';
import { formatarPontuacao } from '@/lib/pontuacao-formatada';
import { ListaPalpitesMembros } from '@/components/palpites/lista-palpites-membros';
import { PalpiteComJogo } from '@/types/palpite.types';

interface PropsAbaMeusPalpitesCopa {
  grupoId: string;
  temporadaId: string;
}

interface PalpiteAgrupado {
  chave: string;
  label: string;
  palpites: PalpiteComJogo[];
}

function obterClassePalpite(acertouEmCheio: boolean, acertouResultado: boolean | undefined, jogoFinalizado: boolean): string {
  if (acertouEmCheio) return 'bg-[#22c55e]/20 text-[#22c55e]';
  if (acertouResultado) return 'bg-[#ffdf00]/15 text-[#ffdf00]';
  if (jogoFinalizado) return 'bg-[#ff5500]/20 text-[#ff5500]';
  return 'bg-white/[0.06] text-white';
}

function agruparPalpites(palpites: PalpiteComJogo[]): PalpiteAgrupado[] {
  const grupos = new Map<string, PalpiteAgrupado>();

  for (const palpite of palpites) {
    const jogo = palpite.jogo;
    if (!jogo) continue;

    // Mostrar apenas jogos iniciados ou finalizados
    if (jogo.status !== 'EM_ANDAMENTO' && jogo.status !== 'FINALIZADO') continue;

    const rodada = jogo.rodada ?? 0;
    const chave = `rodada-${rodada}`;
    const label = rodada > 0 ? `Rodada ${rodada}` : 'Sem rodada';

    if (!grupos.has(chave)) {
      grupos.set(chave, { chave, label, palpites: [] });
    }
    const grupoExistente = grupos.get(chave);
    if (grupoExistente) {
      grupoExistente.palpites.push(palpite);
    }
  }

  return [...grupos.values()].sort((a, b) => {
    // Ordenar rodadas por data do jogo mais recente (último finalizado primeiro)
    const dataA = a.palpites.reduce((max, p) => {
      const d = p.jogo?.dataHora ? new Date(p.jogo.dataHora).getTime() : 0;
      return Math.max(d, max);
    }, 0);
    const dataB = b.palpites.reduce((max, p) => {
      const d = p.jogo?.dataHora ? new Date(p.jogo.dataHora).getTime() : 0;
      return Math.max(d, max);
    }, 0);
    return dataB - dataA;
  }).map((grupo) => ({
    ...grupo,
    // Dentro de cada rodada: jogos mais recentes primeiro (decrescente por dataHora)
    palpites: [...grupo.palpites].sort((a, b) => {
      const dataA = a.jogo?.dataHora ? new Date(a.jogo.dataHora).getTime() : 0;
      const dataB = b.jogo?.dataHora ? new Date(b.jogo.dataHora).getTime() : 0;
      return dataB - dataA;
    }),
  }));
}

export function AbaMeusPalpitesCopa({ grupoId, temporadaId }: Readonly<PropsAbaMeusPalpitesCopa>) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const { data: palpites, isLoading: carregandoPalpites } = useQuery({
    queryKey: ['meus-palpites-copa', temporadaId],
    queryFn: () => listarMeusPalpites(temporadaId),
    enabled: !!temporadaId,
    staleTime: Infinity,
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

  const agrupados = palpites ? agruparPalpites(palpites) : [];

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
    <div className="space-y-4">
      {agrupados.map((grupo) => (
        <div key={grupo.chave} className="space-y-2">
          {/* Header do grupo/rodada */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-[#ffdf00] uppercase tracking-wider font-bold">
              {grupo.label}
            </span>
            <div className="flex-1 h-px bg-[#009c3b]/20" />
            <span className="text-[9px] text-[#a8e6b0]/40">
              {grupo.palpites.length} palpite{grupo.palpites.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Lista de palpites */}
          {grupo.palpites.map((palpite) => (
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

  const acertouEmCheio = jogoFinalizado && jogo.golsCasa === palpite.golsCasa && jogo.golsFora === palpite.golsFora;
  const acertouResultado = jogoFinalizado && !acertouEmCheio && (() => {
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
          {jogo.rodada ? `Rodada ${jogo.rodada}` : ''}{nomeFase ? ` — ${nomeFase}` : ''}
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
            <img src={jogo.timeCasa.escudo} alt="" className="h-7 w-7 object-contain shrink-0" />
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
          <div className="flex items-center gap-1">
            <span className={`text-sm font-bold px-2 py-0.5 rounded ${obterClassePalpite(acertouEmCheio, acertouResultado, jogoFinalizado)}`}>
              {palpite.golsCasa} × {palpite.golsFora}
            </span>
          </div>
          {acertouEmCheio && <span className="text-[9px] text-[#22c55e] font-bold">{formatarPontuacao(3)}</span>}
          {acertouResultado && <span className="text-[9px] text-[#ffdf00] font-bold">{formatarPontuacao(1)}</span>}
          {jogoFinalizado && !acertouEmCheio && !acertouResultado && (
            <span className="text-[9px] text-[#ff5500] font-bold">{formatarPontuacao(0)}</span>
          )}
        </div>

        {/* Time fora */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-[11px] text-[#ffdf00] font-medium truncate">
            {jogo.timeFora?.sigla ?? '?'}
          </span>
          {jogo.timeFora?.escudo && (
            <img src={jogo.timeFora.escudo} alt="" className="h-7 w-7 object-contain shrink-0" />
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

