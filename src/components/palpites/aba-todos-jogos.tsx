'use client';

import { Jogo } from '@/types/jogo.types';
import { Palpite } from '@/types/palpite.types';
import { CardJogoPalpite } from '@/components/jogos/card-jogo-palpite';
import { IconPalpite } from '@/components/icons/icon-palpite';
import { podePalpitar, estaBloqueado } from '@/hooks/usePalpitesData';

interface PropsAbaTodosJogos {
  jogosAtualVisiveis: Jogo[];
  jogosProximaVisiveis: Jogo[];
  palpitesPorJogo: Record<string, Palpite>;
  grupoId: string;
  rodadaAtual: number | null;
  proximaRodada: number | null;
  carregandoProxima: boolean;
  faseAtual: { id: string } | undefined;
  cardAtivo: string | null;
  onFoco: (jogoId: string) => void;
}

export function AbaTodosJogos({
  jogosAtualVisiveis,
  jogosProximaVisiveis,
  palpitesPorJogo,
  grupoId,
  rodadaAtual,
  proximaRodada,
  carregandoProxima,
  faseAtual,
  cardAtivo,
  onFoco,
}: Readonly<PropsAbaTodosJogos>) {
  // Todos os jogos palpitáveis para navegação sequencial
  const jogosPalpitaveis = [...jogosAtualVisiveis, ...jogosProximaVisiveis].filter((j) => podePalpitar(j));

  function proximoCardId(jogoAtualId: string): string | undefined {
    const idx = jogosPalpitaveis.findIndex((j) => j.id === jogoAtualId);
    if (idx >= 0 && idx < jogosPalpitaveis.length - 1) {
      return jogosPalpitaveis[idx + 1].id;
    }
    return undefined;
  }

  function ehUltimoPalpitavel(jogoId: string): boolean {
    return jogosPalpitaveis.at(-1)?.id === jogoId;
  }

  return (
    <div>
      {/* Rodada atual */}
      {jogosAtualVisiveis.length > 0 && (
        <>
          <SeparadorRodada rodada={jogosAtualVisiveis[0]?.rodada ?? rodadaAtual} />
          <div className="space-y-2">
            {jogosAtualVisiveis.map((jogo: Jogo) => (
              <CardJogoPalpite
                key={jogo.id}
                jogo={jogo}
                palpiteInicial={palpitesPorJogo[jogo.id] ?? null}
                palpitavel={podePalpitar(jogo)}
                bloqueado={estaBloqueado(jogo)}
                grupoId={grupoId}
                ativo={cardAtivo === jogo.id}
                onFoco={() => onFoco(jogo.id)}
                onProximoCard={() => {
                  const proximo = proximoCardId(jogo.id);
                  if (proximo) onFoco(proximo);
                }}
                ehUltimoCard={ehUltimoPalpitavel(jogo.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Próxima rodada */}
      {jogosProximaVisiveis.length > 0 && !!proximaRodada && (
        <>
          <div className="mt-4">
            <SeparadorRodada rodada={proximaRodada} />
          </div>
          <div className="space-y-2">
            {jogosProximaVisiveis.map((jogo: Jogo) => (
              <CardJogoPalpite
                key={jogo.id}
                jogo={jogo}
                palpiteInicial={palpitesPorJogo[jogo.id] ?? null}
                palpitavel={podePalpitar(jogo)}
                bloqueado={estaBloqueado(jogo)}
                grupoId={grupoId}
                ativo={cardAtivo === jogo.id}
                onFoco={() => onFoco(jogo.id)}
                onProximoCard={() => {
                  const proximo = proximoCardId(jogo.id);
                  if (proximo) onFoco(proximo);
                }}
                ehUltimoCard={ehUltimoPalpitavel(jogo.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Estado vazio */}
      {jogosAtualVisiveis.length === 0 && jogosProximaVisiveis.length === 0 && !carregandoProxima && !!faseAtual && (
        <div className="flex flex-col items-center py-12 text-center">
          <IconPalpite size={32} className="text-texto/15 mb-3" />
          <p className="text-texto/40 text-sm">Nenhum jogo disponível</p>
        </div>
      )}

      {/* Loading próxima rodada */}
      {jogosAtualVisiveis.length === 0 && jogosProximaVisiveis.length === 0 && carregandoProxima && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[120px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}

function SeparadorRodada({ rodada }: Readonly<{ rodada: number | null }>) {
  return (
    <div className="sticky top-[72px] z-10 flex items-center gap-3 py-3 -mx-4 px-4 bg-fundo/95 backdrop-blur-md">
      <span className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primaria/40 to-primaria/60 rounded-full" />
      <span className="text-sm text-texto font-bold uppercase tracking-wider px-5 py-2 rounded-full border border-primaria bg-gradient-to-r from-primaria/15 to-primaria/5 shadow-[0_0_20px_rgba(34,197,94,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
        ⚽ Rodada {rodada}
      </span>
      <span className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-primaria/40 to-primaria/60 rounded-full" />
    </div>
  );
}
