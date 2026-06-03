'use client';

import { Jogo } from '@/types/jogo.types';

interface PropsTabelaGrupoCopa {
  nomeGrupo: string;
  jogos: Jogo[];
}

interface ClassificacaoTime {
  timeId: string;
  nome: string;
  sigla: string;
  escudo: string | null;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldoGols: number;
}

function registrarTime(timesMap: Map<string, ClassificacaoTime>, id: string, time: { nome: string; sigla: string; escudo: string | null } | undefined) {
  if (timesMap.has(id)) return;
  timesMap.set(id, {
    timeId: id,
    nome: time?.nome || 'Time',
    sigla: time?.sigla || '???',
    escudo: time?.escudo || null,
    pontos: 0, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, golsPro: 0, golsContra: 0, saldoGols: 0,
  });
}

function calcularClassificacao(jogos: Jogo[]): ClassificacaoTime[] {
  const timesMap = new Map<string, ClassificacaoTime>();

  // Primeiro: registrar todos os times que aparecem nos jogos (mesmo não finalizados)
  for (const jogo of jogos) {
    registrarTime(timesMap, jogo.timeCasaId, jogo.timeCasa);
    registrarTime(timesMap, jogo.timeForaId, jogo.timeFora);
  }

  // Depois: calcular métricas apenas dos jogos finalizados
  for (const jogo of jogos) {
    if (jogo.status !== 'FINALIZADO') continue;
    if (jogo.golsCasa == null || jogo.golsFora == null) continue;

    const casa = timesMap.get(jogo.timeCasaId);
    const fora = timesMap.get(jogo.timeForaId);
    if (!casa || !fora) continue;

    casa.jogos++;
    fora.jogos++;
    casa.golsPro += jogo.golsCasa;
    casa.golsContra += jogo.golsFora;
    fora.golsPro += jogo.golsFora;
    fora.golsContra += jogo.golsCasa;
    casa.saldoGols = casa.golsPro - casa.golsContra;
    fora.saldoGols = fora.golsPro - fora.golsContra;

    if (jogo.golsCasa > jogo.golsFora) {
      casa.vitorias++;
      casa.pontos += 3;
      fora.derrotas++;
    } else if (jogo.golsFora > jogo.golsCasa) {
      fora.vitorias++;
      fora.pontos += 3;
      casa.derrotas++;
    } else {
      casa.empates++;
      fora.empates++;
      casa.pontos++;
      fora.pontos++;
    }
  }

  return [...timesMap.values()].sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
    return b.golsPro - a.golsPro;
  });
}

export function TabelaGrupoCopa({ nomeGrupo, jogos }: Readonly<PropsTabelaGrupoCopa>) {
  const classificacao = calcularClassificacao(jogos);

  if (classificacao.length === 0) {
    return (
      <div className="rounded-xl border border-[#009c3b]/20 bg-[#009c3b]/[0.04] p-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-[#ffdf00] uppercase tracking-wider">
            {nomeGrupo}
          </span>
          <p className="text-[9px] text-[#a8e6b0]/50">Sem times importados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#009c3b]/20 bg-[#009c3b]/[0.04] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#009c3b]/10 border-b border-[#009c3b]/15">
        <span className="text-[10px] font-bold text-[#ffdf00] uppercase tracking-wider">
          {nomeGrupo}
        </span>
        <div className="flex items-center gap-3 text-[8px] text-texto/30 font-medium">
          <span className="w-4 text-center">P</span>
          <span className="w-4 text-center">J</span>
          <span className="w-4 text-center">V</span>
          <span className="w-4 text-center">E</span>
          <span className="w-4 text-center">D</span>
          <span className="w-6 text-center">SG</span>
          <span className="w-6 text-center">PTS</span>
        </div>
      </div>

      {/* Linhas */}
      {classificacao.map((time, idx) => {
        const classificado = idx < 2;
        return (
          <div
            key={time.timeId}
            className={`flex items-center justify-between px-3 py-2 border-b border-[#009c3b]/10 last:border-b-0 ${
              classificado ? 'bg-[#009c3b]/[0.06]' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold w-4 ${classificado ? 'text-[#009c3b]' : 'text-texto/40'}`}>
                {idx + 1}
              </span>
              {time.escudo ? (
                <img src={time.escudo} alt={time.sigla} className="h-5 w-5 object-contain" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[7px] text-texto/40">
                  {time.sigla}
                </div>
              )}
              <span className="text-[11px] text-[#ffdf00] font-medium truncate max-w-[80px]">
                {time.sigla}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#a8e6b0] font-mono">
              <span className="w-4 text-center">{time.pontos}</span>
              <span className="w-4 text-center">{time.jogos}</span>
              <span className="w-4 text-center">{time.vitorias}</span>
              <span className="w-4 text-center">{time.empates}</span>
              <span className="w-4 text-center">{time.derrotas}</span>
              <span className="w-6 text-center">{time.saldoGols > 0 ? `+${time.saldoGols}` : time.saldoGols}</span>
              <span className="w-6 text-center font-bold text-[#ffdf00]">{time.pontos}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
