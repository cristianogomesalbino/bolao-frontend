'use client';

import { Card, CardContent } from '@/components/ui/card';

interface EntradaRanking {
  posicao: number;
  nome: string;
  pontos: number;
  destaque?: boolean;
}

interface PropsCardRanking {
  ranking: EntradaRanking[];
}

function medalha(posicao: number): string {
  if (posicao === 1) return '🥇';
  if (posicao === 2) return '🥈';
  if (posicao === 3) return '🥉';
  return '';
}

export function CardRanking({ ranking }: PropsCardRanking) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">🥇</span>
            <span className="text-[11px] text-texto/40 uppercase tracking-wider font-medium">
              Ranking
            </span>
          </div>
          <span className="text-[10px] text-link/60 cursor-pointer hover:text-link transition-colors">
            Completo
          </span>
        </div>

        {ranking.length === 0 ? (
          <p className="text-sm text-texto/40 text-center py-4">
            Ranking disponível após os primeiros jogos
          </p>
        ) : (
          <div className="space-y-0.5">
            {ranking.map((entrada) => (
              <div
                key={entrada.posicao}
                className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
                  entrada.destaque
                    ? 'bg-primaria/[0.08] border border-primaria/20'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base w-7 text-center">
                    {medalha(entrada.posicao) || (
                      <span className="text-xs text-texto/30">{entrada.posicao}º</span>
                    )}
                  </span>
                  <span className={`text-sm ${entrada.destaque ? 'text-texto font-semibold' : 'text-texto/70'}`}>
                    {entrada.nome}
                    {entrada.destaque && <span className="text-[10px] text-primaria/60 ml-1.5">você</span>}
                  </span>
                </div>
                <span className={`text-xs tabular-nums ${entrada.destaque ? 'text-primaria/70 font-medium' : 'text-texto/35'}`}>
                  {entrada.pontos} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
