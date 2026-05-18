'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface TimeInfo {
  nome: string;
  sigla: string;
  escudo?: string | null;
}

interface PropsCardProximoJogo {
  timeCasa: TimeInfo;
  timeFora: TimeInfo;
  dataHora: string;
  totalPalpites?: number;
  jaPalpitou?: boolean;
}

function calcularCountdown(dataHora: string): string {
  const diff = new Date(dataHora).getTime() - Date.now();
  if (diff <= 0) return 'Encerrado';

  const horas = Math.floor(diff / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diff % (1000 * 60)) / 1000);

  if (horas > 24) {
    const dias = Math.floor(horas / 24);
    return `${dias}d ${horas % 24}h`;
  }
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function formatarHorario(dataHora: string): string {
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
  return `${dia} • ${hora}`;
}

function EscudoTime({ time }: { time: TimeInfo }) {
  const [erroImagem, setErroImagem] = useState(false);

  if (!time.escudo || erroImagem) {
    // Fallback: sigla do time em círculo
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.06]">
        <span className="text-[10px] font-bold text-texto/60">{time.sigla}</span>
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center">
      <Image
        src={time.escudo}
        alt={`Escudo ${time.nome}`}
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
        onError={() => setErroImagem(true)}
        unoptimized
      />
    </div>
  );
}

export function CardProximoJogo({ timeCasa, timeFora, dataHora, totalPalpites, jaPalpitou }: PropsCardProximoJogo) {
  const [countdown, setCountdown] = useState(calcularCountdown(dataHora));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calcularCountdown(dataHora));
    }, 1000);
    return () => clearInterval(interval);
  }, [dataHora]);

  return (
    <Card className="border-primaria/15 shadow-[0_0_20px_rgba(22,163,74,0.08)]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚽</span>
            <span className="text-[11px] text-texto/40 uppercase tracking-wider font-medium">
              Próximo jogo
            </span>
          </div>
          <span className="text-[11px] text-texto/35">{formatarHorario(dataHora)}</span>
        </div>

        {/* Times */}
        <div className="flex items-center justify-center gap-5 py-4">
          <div className="flex flex-col items-center gap-2">
            <EscudoTime time={timeCasa} />
            <span className="text-sm font-semibold text-texto">{timeCasa.nome}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs text-texto/25 font-bold">VS</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <EscudoTime time={timeFora} />
            <span className="text-sm font-semibold text-texto">{timeFora.nome}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-texto/40">Encerra em</span>
            <span className="text-xs font-mono text-primaria/80 tabular-nums">{countdown}</span>
          </div>
          <div className="flex items-center gap-3">
            {totalPalpites && totalPalpites > 0 && (
              <span className="text-[10px] text-destaque/70">
                🔥 {totalPalpites} palpites
              </span>
            )}
            {jaPalpitou !== undefined && (
              <span className={`text-[10px] ${jaPalpitou ? 'text-sucesso/70' : 'text-texto/40'}`}>
                {jaPalpitou ? '✓ Palpite feito' : '• Sem palpite'}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
