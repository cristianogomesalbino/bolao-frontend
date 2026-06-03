'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { listarMeusPalpites, buscarPalpitesGrupoJogo, PalpiteMembro } from '@/services/palpite.service';
import { listarMembros } from '@/services/grupo.service';
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
  if (jogoFinalizado) return 'bg-erro/10 text-erro/70';
  return 'bg-white/[0.06] text-white';
}

function obterClasseMembroPalpite(acertouEmCheio: boolean, acertouResultado: boolean | undefined): string {
  if (acertouEmCheio) return 'bg-[#22c55e]/15 text-[#22c55e]';
  if (acertouResultado) return 'bg-[#ffdf00]/10 text-[#ffdf00]';
  return 'bg-white/[0.04] text-[#a8e6b0]/50';
}

function agruparPalpites(palpites: PalpiteComJogo[]): PalpiteAgrupado[] {
  const grupos = new Map<string, PalpiteAgrupado>();

  for (const palpite of palpites) {
    const jogo = palpite.jogo;
    if (!jogo) continue;

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
    const rodadaA = a.palpites[0]?.jogo?.rodada ?? 0;
    const rodadaB = b.palpites[0]?.jogo?.rodada ?? 0;
    return rodadaA - rodadaB;
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

  const { data: membros } = useQuery({
    queryKey: ['grupo', grupoId, 'membros'],
    queryFn: () => listarMembros(grupoId),
    enabled: !!grupoId,
    staleTime: 1000 * 60 * 5,
  });

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
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-[#009c3b]/5 animate-pulse" />
        ))}
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
              membros={membros ?? []}
              expandido={expandidos.has(palpite.jogoId)}
              onToggle={() => toggleExpandido(palpite.jogoId)}
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
  membros: Array<{ id: string; usuarioId: string; usuario?: { id: string; nome: string } }>;
  expandido: boolean;
  onToggle: () => void;
}

function CardPalpiteCopa({ palpite, grupoId, membros, expandido, onToggle }: Readonly<PropsCardPalpiteCopa>) {
  const jogo = palpite.jogo;
  const jogoFinalizado = jogo?.status === 'FINALIZADO';

  const { data: palpitesMembros, isLoading: carregandoMembros } = useQuery({
    queryKey: ['palpites-grupo', grupoId, palpite.jogoId],
    queryFn: () => buscarPalpitesGrupoJogo(grupoId, palpite.jogoId),
    enabled: expandido && jogoFinalizado,
    staleTime: 1000 * 60 * 10,
  });

  if (!jogo) return null;

  const acertouEmCheio = jogoFinalizado && jogo.golsCasa === palpite.golsCasa && jogo.golsFora === palpite.golsFora;
  const acertouResultado = jogoFinalizado && !acertouEmCheio && (() => {
    const resultadoReal = Math.sign((jogo.golsCasa ?? 0) - (jogo.golsFora ?? 0));
    const resultadoPalpite = Math.sign(palpite.golsCasa - palpite.golsFora);
    return resultadoReal === resultadoPalpite;
  })();

  function obterNomeMembro(usuarioId: string): string {
    const membro = membros.find((m) => m.usuarioId === usuarioId);
    return membro?.usuario?.nome?.split(' ')[0] ?? 'Membro';
  }

  return (
    <div className="rounded-xl border border-[#009c3b]/20 bg-[#009c3b]/[0.04] overflow-hidden">
      {/* Card principal */}
      <button
        type="button"
        onClick={onToggle}
        disabled={!jogoFinalizado}
        className="w-full flex items-center gap-3 p-3 text-left disabled:cursor-default"
      >
        {/* Escudos */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {jogo.timeCasa?.escudo && (
            <img src={jogo.timeCasa.escudo} alt="" className="h-6 w-6 object-contain shrink-0" />
          )}
          <span className="text-[11px] text-[#ffdf00] font-medium truncate">
            {jogo.timeCasa?.sigla ?? '?'}
          </span>
        </div>

        {/* Placar / Palpite */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          {jogoFinalizado && (
            <span className="text-[8px] text-[#a8e6b0]/40">Real: {jogo.golsCasa} × {jogo.golsFora}</span>
          )}
          <div className="flex items-center gap-1">
            <span className={`text-sm font-bold px-2 py-0.5 rounded ${obterClassePalpite(acertouEmCheio, acertouResultado, jogoFinalizado)}`}>
              {palpite.golsCasa} × {palpite.golsFora}
            </span>
          </div>
          {acertouEmCheio && <span className="text-[8px] text-[#22c55e] font-bold">+3 pts</span>}
          {acertouResultado && <span className="text-[8px] text-[#ffdf00] font-bold">+1 pt</span>}
          {jogoFinalizado && !acertouEmCheio && !acertouResultado && (
            <span className="text-[8px] text-erro/50">0 pts</span>
          )}
        </div>

        {/* Time fora */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-[11px] text-[#ffdf00] font-medium truncate">
            {jogo.timeFora?.sigla ?? '?'}
          </span>
          {jogo.timeFora?.escudo && (
            <img src={jogo.timeFora.escudo} alt="" className="h-6 w-6 object-contain shrink-0" />
          )}
        </div>

        {/* Chevron para expandir (só se finalizado) */}
        {jogoFinalizado && (
          <ChevronDown
            size={14}
            className={`text-[#a8e6b0]/40 transition-transform shrink-0 ${expandido ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown: palpites dos outros membros */}
      {expandido && jogoFinalizado && (
        <div className="border-t border-[#009c3b]/15 bg-[#009c3b]/[0.02] px-3 py-2 space-y-1.5">
          {carregandoMembros && (
            <div className="flex items-center justify-center py-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#ffdf00] border-t-transparent" />
            </div>
          )}
          {palpitesMembros && palpitesMembros.length > 0 ? (
            palpitesMembros
              .filter((p) => p.usuarioId !== palpite.usuarioId)
              .map((p) => (
                <PalpiteMembroLinha
                  key={p.id}
                  palpite={p}
                  nome={obterNomeMembro(p.usuarioId)}
                  golsCasaReal={jogo.golsCasa}
                  golsForaReal={jogo.golsFora}
                />
              ))
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

interface PropsPalpiteMembroLinha {
  palpite: PalpiteMembro;
  nome: string;
  golsCasaReal: number | null;
  golsForaReal: number | null;
}

function PalpiteMembroLinha({ palpite, nome, golsCasaReal, golsForaReal }: Readonly<PropsPalpiteMembroLinha>) {
  const acertouEmCheio = golsCasaReal === palpite.golsCasa && golsForaReal === palpite.golsFora;
  const acertouResultado = !acertouEmCheio && (() => {
    const resultadoReal = Math.sign((golsCasaReal ?? 0) - (golsForaReal ?? 0));
    const resultadoPalpite = Math.sign(palpite.golsCasa - palpite.golsFora);
    return resultadoReal === resultadoPalpite;
  })();

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#009c3b]/20 text-[#ffdf00] text-[8px] font-bold">
        {nome.charAt(0)}
      </div>
      <span className="text-[10px] text-[#a8e6b0] flex-1 truncate">{nome}</span>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${obterClasseMembroPalpite(acertouEmCheio, acertouResultado)}`}>
        {palpite.golsCasa} × {palpite.golsFora}
      </span>
      <span className="text-[8px] w-8 text-right">
        {acertouEmCheio && <span className="text-[#22c55e]">+3</span>}
        {!acertouEmCheio && acertouResultado && <span className="text-[#ffdf00]">+1</span>}
        {!acertouEmCheio && !acertouResultado && <span className="text-[#a8e6b0]/30">0</span>}
      </span>
    </div>
  );
}
