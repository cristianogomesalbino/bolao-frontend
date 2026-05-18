'use client';

import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface JogoCompacto {
  id: string;
  timeCasa: string;
  timeFora: string;
  dataHora: string;
  countdown?: string;
}

interface PropsCardProximosJogos {
  jogos: JogoCompacto[];
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
  return `${dia} ${hora}`;
}

export function CardProximosJogos({ jogos }: Readonly<PropsCardProximosJogos>) {
  if (jogos.length === 0) return null;

  return (
    <Card data-testid="home-card-proximos-jogos">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={14} className="text-texto/40" />
          <span className="text-[11px] text-texto/40 uppercase tracking-wider font-medium">
            Próximos jogos
          </span>
        </div>

        <div className="space-y-0">
          {jogos.map((jogo, index) => (
            <div
              key={jogo.id}
              className={`flex items-center justify-between py-3 ${
                index < jogos.length - 1 ? 'border-b border-white/[0.04]' : ''
              }`}
              data-testid={`proximos-jogo-${jogo.id}`}
            >
              <span className="text-sm text-texto/70">
                {jogo.timeCasa} <span className="text-texto/25">×</span> {jogo.timeFora}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-texto/35 tabular-nums">
                  {formatarHorario(jogo.dataHora)}
                </span>
                {jogo.countdown && (
                  <span className="text-[10px] text-primaria/60 font-mono">
                    · {jogo.countdown}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
