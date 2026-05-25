'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock } from 'lucide-react';
import { buscarGrupo } from '@/services/grupo.service';
import { listarFases, listarJogosFase } from '@/services/jogo.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Jogo, Fase } from '@/types/jogo.types';

export default function JogosAdiados() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;

  const { data: grupo } = useQuery({
    queryKey: ['grupo', grupoId],
    queryFn: () => buscarGrupo(grupoId),
    enabled: !!grupoId,
  });

  const { data: fases } = useQuery({
    queryKey: ['fases', grupo?.temporadaId],
    queryFn: () => listarFases(grupo!.temporadaId),
    enabled: !!grupo?.temporadaId,
  });

  const { data: jogosAdiados, isLoading } = useQuery({
    queryKey: ['grupo', grupoId, 'jogos-adiados-lista'],
    queryFn: async () => {
      if (!fases) return [];
      const resultado: Array<{ jogo: Jogo; fase: Fase }> = [];

      for (const fase of fases) {
        const { jogos } = await listarJogosFase(fase.id);
        const pendentes = jogos.filter((j) => j.status === 'ADIADO' || j.status === 'AGENDADO');
        for (const jogo of pendentes) {
          resultado.push({ jogo, fase });
        }
      }

      return resultado;
    },
    enabled: !!fases && fases.length > 0,
  });

  return (
    <div className="min-h-screen bg-fundo pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-2 px-2 py-4 bg-fundo/80 backdrop-blur-lg border-b border-white/[0.05]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="text-texto/70 hover:text-texto shrink-0"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-texto">Jogos Atrasados</h1>
          <p className="text-[10px] text-texto/35">{grupo?.nome}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destaque/10 border border-destaque/20">
          <Clock size={12} className="text-destaque" />
          <span className="text-[11px] font-semibold text-destaque">{jogosAdiados?.length ?? 0}</span>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-4 space-y-3">
        {/* Info */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destaque/[0.05] border border-destaque/15">
          <span className="text-destaque">⏱</span>
          <p className="text-[11px] text-texto/50">Jogos de rodadas anteriores que foram adiados e ainda não têm nova data definida.</p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        )}

        {/* Lista */}
        {!isLoading && jogosAdiados && jogosAdiados.length > 0 && (
          <div className="space-y-2">
            {jogosAdiados.map(({ jogo, fase }) => (
              <Card key={jogo.id} className="border-destaque/20">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Time casa */}
                      <div className="flex flex-col items-center gap-1 min-w-[50px]">
                        {jogo.timeCasa?.escudo ? (
                          <img src={jogo.timeCasa.escudo} alt={jogo.timeCasa.nome} className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-texto/50">
                            {jogo.timeCasa?.sigla || '?'}
                          </div>
                        )}
                        <span className="text-[9px] text-texto/50 truncate max-w-[50px]">{jogo.timeCasa?.sigla || '?'}</span>
                      </div>

                      {/* Centro */}
                      <div className="flex-1 text-center">
                        <span className="text-[10px] text-destaque font-semibold bg-destaque/10 px-2 py-0.5 rounded">Adiado</span>
                        <p className="text-[9px] text-texto/30 mt-1">
                          {jogo.rodada ? `Rodada ${jogo.rodada}` : fase.nome}
                        </p>
                      </div>

                      {/* Time fora */}
                      <div className="flex flex-col items-center gap-1 min-w-[50px]">
                        {jogo.timeFora?.escudo ? (
                          <img src={jogo.timeFora.escudo} alt={jogo.timeFora.nome} className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-texto/50">
                            {jogo.timeFora?.sigla || '?'}
                          </div>
                        )}
                        <span className="text-[9px] text-texto/50 truncate max-w-[50px]">{jogo.timeFora?.sigla || '?'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Vazio */}
        {!isLoading && jogosAdiados?.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Clock size={32} className="text-texto/15 mb-3" />
            <p className="text-sm text-texto/40">Nenhum jogo atrasado</p>
          </div>
        )}
      </div>
    </div>
  );
}
