'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { buscarGrupo } from '@/services/grupo.service';
import { listarFases, listarJogosFase } from '@/services/jogo.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PalpitesGrupoPage() {
  const router = useRouter();
  const params = useParams();
  const grupoId = params.grupoId as string;

  const [faseIndex, setFaseIndex] = useState(0);

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

  const faseAtual = fases?.[faseIndex];

  const { data: jogosData, isLoading: carregandoJogos } = useQuery({
    queryKey: ['jogos', faseAtual?.id],
    queryFn: () => listarJogosFase(faseAtual!.id),
    enabled: !!faseAtual?.id,
  });

  const jogos = jogosData?.jogos ?? [];

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
          <h1 className="text-base font-semibold text-texto">Palpites</h1>
          <p className="text-[10px] text-texto/35">{grupo?.nome}</p>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-4 space-y-4">
        {/* Seletor de fase/rodada */}
        {fases && fases.length > 0 && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFaseIndex(Math.max(0, faseIndex - 1))}
              disabled={faseIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] text-texto/40 hover:text-texto disabled:opacity-20 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-texto">{faseAtual?.nome}</span>
            <button
              type="button"
              onClick={() => setFaseIndex(Math.min((fases?.length ?? 1) - 1, faseIndex + 1))}
              disabled={faseIndex === (fases?.length ?? 1) - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] text-texto/40 hover:text-texto disabled:opacity-20 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Loading */}
        {carregandoJogos && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        )}

        {/* Lista de jogos */}
        {!carregandoJogos && jogos.length > 0 && (
          <div className="space-y-3">
            {jogos.map((jogo) => (
              <Card key={jogo.id} className={jogo.status === 'AGENDADO' ? 'border-primaria-claro/20' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Time casa */}
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        {jogo.timeCasa?.escudo ? (
                          <img src={jogo.timeCasa.escudo} alt={jogo.timeCasa.nome} className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
                            {jogo.timeCasa?.sigla || '?'}
                          </div>
                        )}
                        <span className="text-[9px] text-texto/50 truncate max-w-[60px]">{jogo.timeCasa?.sigla || jogo.timeCasaId.slice(0, 3).toUpperCase()}</span>
                      </div>

                      {/* Placar / Horário */}
                      <div className="flex-1 text-center">
                        {jogo.status === 'FINALIZADO' ? (
                          <p className="text-lg font-bold text-texto">{jogo.golsCasa} × {jogo.golsFora}</p>
                        ) : jogo.status === 'ADIADO' ? (
                          <p className="text-[10px] font-semibold text-destaque">Adiado</p>
                        ) : (
                          <p className="text-sm font-medium text-texto/60">
                            {new Date(jogo.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                          </p>
                        )}
                        <p className="text-[9px] text-texto/30">
                          {jogo.status === 'FINALIZADO' ? 'Encerrado' : jogo.status === 'ADIADO' ? 'A definir' : new Date(jogo.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })}
                        </p>
                      </div>

                      {/* Time fora */}
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        {jogo.timeFora?.escudo ? (
                          <img src={jogo.timeFora.escudo} alt={jogo.timeFora.nome} className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
                            {jogo.timeFora?.sigla || '?'}
                          </div>
                        )}
                        <span className="text-[9px] text-texto/50 truncate max-w-[60px]">{jogo.timeFora?.sigla || jogo.timeForaId.slice(0, 3).toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Botão palpitar */}
                    {jogo.status === 'AGENDADO' && (
                      <button
                        type="button"
                        className="ml-3 flex h-9 items-center gap-1.5 px-3 rounded-lg bg-primaria/15 text-primaria text-[11px] font-medium hover:bg-primaria/25 transition-all active:scale-95"
                      >
                        <Target size={12} />
                        Palpitar
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Vazio */}
        {!carregandoJogos && jogos.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Target size={32} className="text-texto/15 mb-3" />
            <p className="text-sm text-texto/40">Nenhum jogo nesta rodada</p>
          </div>
        )}
      </div>
    </div>
  );
}
