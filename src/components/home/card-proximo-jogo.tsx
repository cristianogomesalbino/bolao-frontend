'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Clock, Check, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimeInfo {
  nome: string;
  sigla: string;
  escudo?: string | null;
}

interface PropsCardProximoJogo {
  jogoId?: string;
  timeCasa: TimeInfo;
  timeFora: TimeInfo;
  dataHora: string;
  totalPalpites?: number;
  jaPalpitou?: boolean;
  grupoId?: string;
  temaCopa?: boolean;
}

function calcularCountdown(dataHora: string): { texto: string; encerrado: boolean } {
  const target = new Date(dataHora).getTime() - 60000;
  const diff = target - Date.now();
  if (diff <= 0) return { texto: 'Encerrado', encerrado: true };

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const texto = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return { texto, encerrado: false };
}

function formatarDataJogo(dataHora: string): string {
  const data = new Date(dataHora);
  const agora = new Date();

  const hojeStr = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const jogoStr = data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const amanha = new Date(agora);
  amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  let dia: string;
  if (jogoStr === hojeStr) {
    dia = 'Hoje';
  } else if (jogoStr === amanhaStr) {
    dia = 'Amanhã';
  } else {
    dia = data.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' });
    dia = dia.charAt(0).toUpperCase() + dia.slice(1).replace('.', '');
  }

  const hora = data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });

  return `${dia} • ${hora}`;
}

function EscudoTime({ time }: Readonly<{ time: TimeInfo }>) {
  const [erroImagem, setErroImagem] = useState(false);

  if (!time.escudo || erroImagem) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.06]">
        <span className="text-xs font-bold text-texto/60">{time.sigla}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 h-14 w-14 bg-white/15 rounded-full blur-lg" />
      <Image
        src={time.escudo}
        alt={`Escudo ${time.nome}`}
        width={56}
        height={56}
        className="h-14 w-14 object-contain relative z-10 brightness-110 saturate-[1.2] drop-shadow-[0_0_16px_rgba(255,255,255,0.2)]"
        onError={() => setErroImagem(true)}
        unoptimized
      />
    </div>
  );
}

export function CardProximoJogo({
  jogoId,
  timeCasa,
  timeFora,
  dataHora,
  totalPalpites,
  jaPalpitou,
  grupoId: _grupoId,
  temaCopa,
}: Readonly<PropsCardProximoJogo>) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(calcularCountdown(dataHora));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calcularCountdown(dataHora));
    }, 1000);
    return () => clearInterval(interval);
  }, [dataHora]);

  function irParaPalpite() {
    const campeonato = temaCopa ? 'copa-do-mundo-2026' : 'brasileirao';
    const params = new URLSearchParams({ campeonato });
    if (jogoId) params.set('foco', jogoId);
    router.push(`/palpites?${params.toString()}`);
  }

  // Cores dinâmicas baseadas no tema
  const cores = temaCopa
    ? {
        border: 'border-[#ffdf00] shadow-[0_0_24px_rgba(255,223,0,0.3)]',
        titulo: 'text-[#ffdf00]/90',
        data: 'text-[#ffdf00]/70',
        nomeTime: 'text-[#ffdf00]',
        countdown: countdown.encerrado ? 'text-erro' : 'text-[#ff8c00]',
        palpites: 'text-[#ffdf00]',
        botao: 'bg-[#009c3b] hover:bg-[#009c3b]/80 shadow-[0_0_12px_rgba(0,156,59,0.4)]',
        divider: 'border-[#009c3b]/20',
      }
    : {
        border: 'border-primaria/40 shadow-[0_0_16px_rgba(22,163,74,0.15)]',
        titulo: 'text-texto/50',
        data: 'text-texto/50',
        nomeTime: 'text-texto',
        countdown: countdown.encerrado ? 'text-erro' : 'text-primaria-claro',
        palpites: 'text-primaria-claro',
        botao: 'bg-primaria hover:bg-primaria-claro shadow-[0_0_12px_rgba(22,163,74,0.3)]',
        divider: 'border-white/[0.06]',
      };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${cores.border} bg-white/[0.03] backdrop-blur-2xl`}
      data-testid="home-card-proximo-jogo"
    >
      {/* Background */}
      {temaCopa ? (
        <div className="absolute inset-0 bg-gradient-to-b from-[#009c3b]/20 via-[#003d1a] to-[#ffdf00]/10" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-superficie/60 to-fundo/80" />
      )}

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs uppercase tracking-wider font-bold ${cores.titulo}`}>
              Próximo jogo
            </span>
          </div>
          <div className={`flex items-center gap-1.5 ${cores.data}`}>
            <Clock size={13} />
            <span className="text-xs font-medium">{formatarDataJogo(dataHora)}</span>
          </div>
        </div>

        {/* Times VS */}
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col items-center gap-2 flex-1">
            <EscudoTime time={timeCasa} />
            <span className={`text-base font-bold text-center leading-tight ${cores.nomeTime}`}>
              {timeCasa.nome}
            </span>
          </div>

          <span className="text-lg font-bold text-texto/25 px-3">VS</span>

          <div className="flex flex-col items-center gap-2 flex-1">
            <EscudoTime time={timeFora} />
            <span className={`text-base font-bold text-center leading-tight ${cores.nomeTime}`}>
              {timeFora.nome}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between mt-3 pt-3 border-t ${cores.divider}`}>
          {/* Countdown */}
          <div className="flex flex-col">
            <span className="text-[9px] text-texto/40 flex items-center gap-1">⏱ Encerra em</span>
            <span className={`text-xl font-mono font-bold tabular-nums mt-0.5 ${cores.countdown}`}>
              {countdown.texto}
            </span>
          </div>

          {/* Stats + Botão */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              {totalPalpites !== undefined && totalPalpites > 0 && (
                <div className="flex items-center gap-1">
                  <Users size={12} className={cores.palpites} />
                  <span className={`text-xs font-semibold ${cores.palpites}`}>
                    {totalPalpites} palpitaram
                  </span>
                </div>
              )}
              {jaPalpitou ? (
                <div className="flex items-center gap-1 text-sucesso">
                  <Check size={12} />
                  <span className="text-[11px] font-medium">Você já palpitou</span>
                </div>
              ) : (
                <span className="text-[11px] text-texto/40">• Sem palpite</span>
              )}
            </div>

            {!jaPalpitou && !countdown.encerrado && (
              <Button
                onClick={irParaPalpite}
                size="sm"
                className={`${cores.botao} text-white font-bold text-xs pl-3 pr-1.5 h-8 rounded-lg gap-0`}
                data-testid="home-btn-palpitar"
              >
                PALPITAR<ChevronRight size={14} className="-ml-0.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
