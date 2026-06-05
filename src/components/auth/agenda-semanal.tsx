'use client';

import { useQuery } from '@tanstack/react-query';
import { buscarProximosJogos } from '@/services/jogo.service';
import { JogoProximo } from '@/types/jogo.types';
import { useAuthStore } from '@/stores/auth.store';

function formatarData(dataHora: string): string {
  const data = new Date(dataHora);
  const agora = new Date();
  const diffDias = Math.floor((data.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));

  let dia: string;
  if (diffDias <= 0 && data.getDate() === agora.getDate()) {
    dia = 'Hoje';
  } else if (diffDias <= 1) {
    dia = 'Amanhã';
  } else {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dia = dias[data.getDay()];
  }

  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} ${hora}`;
}

function calcularCountdown(dataHora: string): string | null {
  const data = new Date(dataHora);
  const agora = new Date();
  const diffMs = data.getTime() - agora.getTime();

  if (diffMs <= 0) return null;

  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  if (horas < 24) {
    return `${horas}h`;
  }
  return null;
}

function SkeletonJogo() {
  return (
    <div className="flex items-center justify-between py-2.5 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 rounded bg-white/10" />
        <div className="h-3 w-4 rounded bg-white/5" />
        <div className="h-3 w-20 rounded bg-white/10" />
      </div>
      <div className="h-3 w-16 rounded bg-white/10" />
    </div>
  );
}

function LinhaJogo({ jogo }: { jogo: JogoProximo }) {
  const countdown = calcularCountdown(jogo.dataHora);

  return (
    <div className="flex items-center justify-between py-2.5 group cursor-default hover:bg-white/[0.02] -mx-4 px-4 transition-colors rounded-lg">
      <span className="text-xs text-texto/60 group-hover:text-texto/80 transition-colors">
        {jogo.timeCasa} <span className="text-texto/25">×</span> {jogo.timeFora}
      </span>
      <span className="text-[11px] text-texto/35 tabular-nums flex items-center gap-1.5">
        {formatarData(jogo.dataHora)}
        {countdown && (
          <span className="text-primaria/60 text-[10px]">• {countdown}</span>
        )}
      </span>
    </div>
  );
}

export function AgendaSemanal() {
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);

  const { data: jogos, isLoading } = useQuery({
    queryKey: ['jogos', 'proximos'],
    queryFn: buscarProximosJogos,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: estaAutenticado,
  });

  return (
    <div className="w-full opacity-0 animate-[fadeIn_0.5s_ease-out_0.3s_forwards]">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span className="text-[10px] opacity-40">⚽</span>
        <span className="text-[10px] text-texto/30 uppercase tracking-[0.15em] font-medium">
          Próximos jogos
        </span>
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] px-4 py-1 backdrop-blur-sm">
        {isLoading ? (
          <>
            <SkeletonJogo />
            <SkeletonJogo />
          </>
        ) : jogos && jogos.length > 0 ? (
          <div className="divide-y divide-white/[0.03]">
            {jogos.slice(0, 2).map((jogo) => (
              <LinhaJogo key={jogo.id} jogo={jogo} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
