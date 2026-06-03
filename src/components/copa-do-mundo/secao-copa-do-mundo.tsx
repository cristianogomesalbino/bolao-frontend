'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { listarFases, listarJogosFase } from '@/services/jogo.service';
import { Jogo } from '@/types/jogo.types';
import { CardProximoJogoCopa } from './card-proximo-jogo-copa';

interface PropsSecaoCopaDoMundo {
  temporadaId: string;
}

export function SecaoCopaDoMundo({ temporadaId }: Readonly<PropsSecaoCopaDoMundo>) {
  const router = useRouter();
  const [tab, setTab] = useState<'jogos' | 'palpites'>('jogos');

  const { data: fases, isLoading: carregandoFases } = useQuery({
    queryKey: ['fases-copa', temporadaId],
    queryFn: () => listarFases(temporadaId),
    enabled: !!temporadaId,
  });

  const fasesGrupos = fases?.filter((f) => f.tipo === 'PONTOS_CORRIDOS') ?? [];

  const { data: jogosPorGrupo, isLoading: carregandoJogos } = useQuery({
    queryKey: ['jogos-copa-grupo-page', fasesGrupos.map((f) => f.id).join(',')],
    queryFn: async () => {
      const resultados = await Promise.all(
        fasesGrupos.map(async (fase) => {
          try {
            const res = await listarJogosFase(fase.id);
            return { fase, jogos: res.jogos };
          } catch {
            return { fase, jogos: [] };
          }
        }),
      );
      return resultados;
    },
    enabled: fasesGrupos.length > 0,
    staleTime: 1000 * 60,
  });

  const agora = Date.now();
  const todosJogos = jogosPorGrupo?.flatMap((g) => g.jogos.map((j) => ({ ...j, fase: g.fase }))) ?? [];
  const proximoJogo = todosJogos
    .filter((j) => j.status === 'AGENDADO' && j.dataHora)
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
    .find((j) => new Date(j.dataHora).getTime() > agora);

  // Jogos da próxima rodada (para aba "Jogos")
  const proximosJogos = todosJogos
    .filter((j) => j.status === 'AGENDADO' && j.dataHora)
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
    .slice(0, 12);

  if (carregandoFases) {
    return (
      <div className="space-y-3">
        <div className="h-16 rounded-2xl bg-[#009c3b]/10 animate-pulse" />
        <div className="h-32 rounded-xl bg-[#009c3b]/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header temático */}
      <div className="relative px-4 py-3 rounded-2xl overflow-hidden border border-[#009c3b]/40">
        <div className="absolute inset-0 bg-gradient-to-r from-[#009c3b]/30 via-[#009c3b]/20 to-[#ffdf00]/20" />
        <div className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full bg-[#ffdf00]/20 blur-[40px] -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <h2 className="text-base font-bold text-[#ffdf00] drop-shadow-[0_0_10px_rgba(255,223,0,0.5)]">Copa do Mundo 2026</h2>
            <p className="text-[10px] text-[#009c3b] font-semibold">FIFA World Cup™ 🇧🇷🇺🇸🇲🇽</p>
          </div>
        </div>
      </div>

      {/* Tabs: Jogos / Palpites */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#009c3b]/10 border border-[#009c3b]/20">
        <button
          type="button"
          onClick={() => setTab('jogos')}
          className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all text-center ${
            tab === 'jogos'
              ? 'bg-[#009c3b]/30 text-[#ffdf00] border border-[#009c3b]/40'
              : 'text-white/80 hover:text-white'
          }`}
        >
          ⚽ Jogos
        </button>
        <button
          type="button"
          onClick={() => { setTab('palpites'); router.push('/palpites'); }}
          className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all text-center ${
            tab === 'palpites'
              ? 'bg-[#ffdf00]/30 text-[#ffdf00] border border-[#ffdf00]/40'
              : 'text-white/80 hover:text-white'
          }`}
        >
          🎯 Palpitar
        </button>
      </div>

      {/* Próximo jogo (sempre visível) */}
      {proximoJogo && (
        <CardProximoJogoCopa jogo={proximoJogo} fase={proximoJogo.fase} />
      )}

      {/* Tab: Jogos */}
      {tab === 'jogos' && (
        <div className="space-y-2">
          {proximosJogos.length > 0 ? (
            proximosJogos.map((jogo: Jogo & { fase: { nome: string } }) => (
              <div key={jogo.id} className="flex items-center justify-between p-3 rounded-xl border border-[#009c3b]/15 bg-[#009c3b]/[0.04]">
                <div className="flex items-center gap-2 flex-1">
                  {jogo.timeCasa?.escudo && (
                    <img src={jogo.timeCasa.escudo} alt="" className="h-6 w-6 object-contain" />
                  )}
                  <span className="text-[11px] text-[#ffdf00] font-medium truncate max-w-[60px]">
                    {jogo.timeCasa?.sigla || '?'}
                  </span>
                </div>
                <div className="text-center px-2">
                  <p className="text-[10px] text-[#ffdf00] font-medium">
                    {jogo.dataHora ? new Date(jogo.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }) : '?'}
                  </p>
                  <p className="text-[9px] text-[#a8e6b0]">
                    {jogo.dataHora ? new Date(jogo.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '?'}
                  </p>
                  <p className="text-[8px] text-[#009c3b]/70">{jogo.fase.nome}</p>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-[11px] text-[#ffdf00] font-medium truncate max-w-[60px]">
                    {jogo.timeFora?.sigla || '?'}
                  </span>
                  {jogo.timeFora?.escudo && (
                    <img src={jogo.timeFora.escudo} alt="" className="h-6 w-6 object-contain" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-[11px] text-texto/30 py-6">Nenhum jogo próximo</p>
          )}
          <button
            type="button"
            onClick={() => router.push('/palpites')}
            className="w-full py-2.5 rounded-xl text-[11px] font-semibold text-[#ffdf00] border border-[#ffdf00]/30 bg-[#ffdf00]/10 hover:bg-[#ffdf00]/15 transition-all"
          >
            Ver todos os jogos →
          </button>
        </div>
      )}

      {/* Loading */}
      {carregandoJogos && tab === 'jogos' && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#009c3b]/5 animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
