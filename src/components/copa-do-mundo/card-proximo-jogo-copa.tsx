'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Jogo, Fase } from '@/types/jogo.types';

interface PropsCardProximoJogoCopa {
  jogo: Jogo;
  fase: Fase;
}

export function CardProximoJogoCopa({ jogo, fase }: Readonly<PropsCardProximoJogoCopa>) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!jogo.dataHora) return;
    const target = new Date(jogo.dataHora).getTime() - 60000;

    function atualizar() {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown('');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      );
    }

    atualizar();
    const interval = setInterval(atualizar, 1000);
    return () => clearInterval(interval);
  }, [jogo.dataHora]);

  const dataFormatada = jogo.dataHora
    ? new Date(jogo.dataHora).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        timeZone: 'America/Sao_Paulo',
      }).toUpperCase()
    : 'DATA A DEFINIR';

  const horaFormatada = jogo.dataHora
    ? new Date(jogo.dataHora).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
    : '--:--';

  return (
    <Card className="border-[#009c3b] bg-gradient-to-b from-[#009c3b]/[0.08] to-[#ffdf00]/[0.04] overflow-hidden shadow-[0_0_20px_rgba(0,156,59,0.2)]">
      <CardContent className="p-4">
        {/* Header com badge da fase */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-bold text-[#ffdf00]/90 uppercase tracking-wider">
            🏆 {fase.nome}
          </span>
          <button
            type="button"
            className="text-[11px] text-[#ffdf00] font-bold hover:underline"
          >
            Ver todos →
          </button>
        </div>

        {/* Seleções com escudos */}
        <div className="flex items-center justify-between">
          {/* Time Casa */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#ffdf00]/25 blur-xl" />
              {jogo.timeCasa?.escudo ? (
                <img
                  src={jogo.timeCasa.escudo}
                  alt={jogo.timeCasa.nome}
                  className="relative h-16 w-16 object-contain drop-shadow-[0_0_16px_rgba(255,223,0,0.5)]"
                />
              ) : (
                <div className="relative h-16 w-16 rounded-full bg-[#009c3b]/20 border border-[#009c3b]/40 flex items-center justify-center text-lg font-bold text-[#ffdf00]">
                  {jogo.timeCasa?.sigla || '?'}
                </div>
              )}
            </div>
            <span className="text-xs text-[#ffdf00] font-semibold text-center max-w-[80px] truncate">
              {jogo.timeCasa?.nome || 'Casa'}
            </span>
          </div>

          {/* Centro: data + hora + countdown */}
          <div className="flex flex-col items-center gap-1 px-2">
            <span className="text-[10px] text-white font-medium">{dataFormatada}</span>
            <span className="text-xl font-bold text-white">{horaFormatada}</span>
            <span className="text-[10px] text-white/70 font-bold">VS</span>
            {countdown && (
              <div className="mt-1 px-2 py-0.5 rounded-md bg-[#ffdf00]/15 border border-[#ffdf00]/40">
                <span className="text-[11px] font-mono font-bold text-[#ffdf00]">{countdown}</span>
              </div>
            )}
          </div>

          {/* Time Fora */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#ffdf00]/25 blur-xl" />
              {jogo.timeFora?.escudo ? (
                <img
                  src={jogo.timeFora.escudo}
                  alt={jogo.timeFora.nome}
                  className="relative h-16 w-16 object-contain drop-shadow-[0_0_16px_rgba(255,223,0,0.5)]"
                />
              ) : (
                <div className="relative h-16 w-16 rounded-full bg-[#009c3b]/20 border border-[#009c3b]/40 flex items-center justify-center text-lg font-bold text-[#ffdf00]">
                  {jogo.timeFora?.sigla || '?'}
                </div>
              )}
            </div>
            <span className="text-xs text-[#ffdf00] font-semibold text-center max-w-[80px] truncate">
              {jogo.timeFora?.nome || 'Fora'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
