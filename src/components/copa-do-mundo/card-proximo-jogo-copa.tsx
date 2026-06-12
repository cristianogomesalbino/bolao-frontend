'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { buscarEstatisticasPalpite } from '@/services/palpite.service';
import { Jogo, Fase } from '@/types/jogo.types';
import { Palpite } from '@/types/palpite.types';
import { usePalpiteCard } from '@/hooks/usePalpiteCard';

interface PropsCardProximoJogoCopa {
  jogo: Jogo;
  fase: Fase;
  palpiteInicial?: Palpite | null;
  grupoId?: string;
}

export function CardProximoJogoCopa({ jogo, fase, palpiteInicial, grupoId }: Readonly<PropsCardProximoJogoCopa>) {
  const [countdown, setCountdown] = useState('');
  const [expandido, setExpandido] = useState(false);

  const {
    golsCasa, golsFora, palpiteAtual,
    salvando, salvoFeedback, inputsRef,
    handleSetGolsCasa, handleSetGolsFora, salvar,
  } = usePalpiteCard({ jogoId: jogo.id, grupoId, palpiteInicial });

  // Countdown até o jogo
  useEffect(() => {
    if (!jogo.dataHora) return;
    const target = new Date(jogo.dataHora).getTime() - 60000;

    function atualizar() {
      const diff = target - Date.now();
      if (diff <= 0) { setCountdown(''); return; }
      const dias = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);

      if (dias > 0) {
        setCountdown(`Fecha em ${dias} dia${dias > 1 ? 's' : ''} e ${h}h`);
      } else if (h > 0) {
        setCountdown(`Fecha em ${h}h e ${m}min`);
      } else {
        setCountdown(`Fecha em ${m}min`);
      }
    }

    atualizar();
    const interval = setInterval(atualizar, 60000);
    return () => clearInterval(interval);
  }, [jogo.dataHora]);

  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-palpite', grupoId, jogo.id],
    queryFn: () => buscarEstatisticasPalpite(grupoId ?? '', jogo.id),
    enabled: !!grupoId && expandido,
    staleTime: 1000 * 30,
  });

  const palpitavel = jogo.status === 'AGENDADO' || jogo.status === 'ADIADO';
  const bloqueado = palpitavel && !!jogo.dataHora && new Date(jogo.dataHora).getTime() <= Date.now();

  const dataFormatada = jogo.dataHora
    ? new Date(jogo.dataHora).toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo',
      }).toUpperCase()
    : 'DATA A DEFINIR';

  const horaFormatada = jogo.dataHora
    ? new Date(jogo.dataHora).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
      })
    : '--:--';

  return (
    <Card className="border-[#009c3b] bg-gradient-to-b from-[#009c3b]/[0.08] to-[#ffdf00]/[0.04] overflow-hidden shadow-[0_0_20px_rgba(0,156,59,0.2)]" data-testid="card-proximo-jogo-copa">
      <CardContent className="p-4">
        {/* Título */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-[#ffdf00] font-bold uppercase tracking-wider">⚽ Próximo Jogo</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold text-[#ffdf00]/90 uppercase tracking-wider">
            🏆 {fase.nome}
          </span>
          <span className="text-[13px] text-[#ffdf00] font-bold">
            {dataFormatada} • {horaFormatada}
          </span>
          <Link
            href="/palpites?campeonato=copa-do-mundo-2026"
            className="text-[11px] text-[#ffdf00] font-bold hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        {countdown && (
          <p className="text-[12px] text-[#ff8c00] font-bold text-center mb-1 drop-shadow-[0_0_6px_rgba(255,140,0,0.4)]" data-testid="copa-countdown">
            ⏱ {countdown}
          </p>
        )}

        {/* Seleções com escudos */}
        <div className="flex items-center justify-between">
          <EscudoCopa time={jogo.timeCasa} label="Casa" />

          {/* Centro: inputs */}
          <div className="flex flex-col items-center gap-0.5 px-2 pt-5">
            {palpitavel && !bloqueado && (
              <div ref={inputsRef} className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  enterKeyHint="next"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-form-type="other"
                  value={golsCasa === '' ? '' : golsCasa}
                  placeholder="-"
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 1);
                    if (raw === '') { handleSetGolsCasa(''); return; }
                    const val = Number.parseInt(raw, 10);
                    handleSetGolsCasa(Number.isNaN(val) ? '' : Math.min(9, val));
                  }}
                  onFocus={(e) => e.target.select()}
                  onBlur={salvar}
                  className="w-12 h-14 rounded-lg bg-black/60 border border-[#ffdf00]/30 text-center text-2xl font-bold text-[#ffdf00] placeholder:text-[#ffdf00]/30 outline-none focus:border-[#ffdf00] focus:ring-1 focus:ring-[#ffdf00] transition-colors"
                  disabled={salvando}
                  data-testid="copa-input-gols-casa"
                />
                <span className="text-sm font-bold text-white/60">x</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  enterKeyHint="done"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-form-type="other"
                  value={golsFora === '' ? '' : golsFora}
                  placeholder="-"
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 1);
                    if (raw === '') { handleSetGolsFora(''); return; }
                    const val = Number.parseInt(raw, 10);
                    handleSetGolsFora(Number.isNaN(val) ? '' : Math.min(9, val));
                  }}
                  onFocus={(e) => e.target.select()}
                  onBlur={salvar}
                  className="w-12 h-14 rounded-lg bg-black/60 border border-[#ffdf00]/30 text-center text-2xl font-bold text-[#ffdf00] placeholder:text-[#ffdf00]/30 outline-none focus:border-[#ffdf00] focus:ring-1 focus:ring-[#ffdf00] transition-colors"
                  disabled={salvando}
                  data-testid="copa-input-gols-fora"
                />
              </div>
            )}

            {/* Bloqueado */}
            {palpitavel && bloqueado && palpiteAtual && (
              <div className="flex items-center gap-2">
                <div className="w-12 h-14 rounded-lg bg-black/60 border border-[#ffdf00]/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#ffdf00]/70">{palpiteAtual.golsCasa}</span>
                </div>
                <span className="text-sm font-bold text-white/40">x</span>
                <div className="w-12 h-14 rounded-lg bg-black/60 border border-[#ffdf00]/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#ffdf00]/70">{palpiteAtual.golsFora}</span>
                </div>
              </div>
            )}

            {/* Feedback */}
            {palpitavel && !bloqueado && (
              <FeedbackCopa salvando={salvando} salvoFeedback={salvoFeedback} palpiteAtual={palpiteAtual} />
            )}
          </div>

          <EscudoCopa time={jogo.timeFora} label="Fora" />
        </div>

        {/* Expandir */}
        <button type="button" onClick={() => setExpandido(!expandido)} className="w-full flex items-center justify-center mt-2 pt-1" data-testid="copa-btn-expandir">
          <ChevronDown size={20} className={`text-[#ffdf00]/60 transition-transform ${expandido ? 'rotate-180' : ''}`} />
        </button>

        {/* Estatísticas + Quem palpitou */}
        {expandido && estatisticas && estatisticas.total > 0 && (
          <div className="mt-2 pt-2 border-t border-[#009c3b]/20">
            <div className="flex items-center justify-between mb-1">
              <div className="text-left">
                <span className="text-sm font-bold text-[#009c3b]">{estatisticas.percentualCasa}%</span>
                <p className="text-[9px] text-[#a8e6b0]/50">da galera</p>
              </div>
              {estatisticas.percentualEmpate > 0 && (
                <div className="text-center">
                  <span className="text-sm font-bold text-white/60">{estatisticas.percentualEmpate}%</span>
                  <p className="text-[9px] text-white/40">empate</p>
                </div>
              )}
              <div className="text-right">
                <span className="text-sm font-bold text-erro">{estatisticas.percentualFora}%</span>
                <p className="text-[9px] text-[#a8e6b0]/50">da galera</p>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex">
              <div className="h-full bg-[#009c3b] rounded-l-full" style={{ width: `${estatisticas.percentualCasa}%` }} />
              {estatisticas.percentualEmpate > 0 && (
                <div className="h-full bg-white/30" style={{ width: `${estatisticas.percentualEmpate}%` }} />
              )}
              <div className="h-full bg-erro rounded-r-full" style={{ width: `${estatisticas.percentualFora}%` }} />
            </div>

            {/* Lista de membros */}
            {estatisticas.membrosStatus && estatisticas.membrosStatus.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#009c3b]/15 space-y-1">
                {[...estatisticas.membrosStatus]
                  .sort((a, b) => {
                    if (a.palpitou === b.palpitou) return 0;
                    return a.palpitou ? -1 : 1;
                  })
                  .map((membro) => {
                    const iniciais = membro.nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
                    const primeiroNome = membro.nome.split(' ')[0];
                    return (
                      <div
                        key={membro.nome}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg ${membro.palpitou ? 'bg-[#009c3b]/10' : 'bg-white/[0.02]'}`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${membro.palpitou ? 'bg-[#009c3b] shadow-[0_0_6px_rgba(0,156,59,0.6)]' : 'bg-white/15'}`} />
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 border ${membro.palpitou ? 'bg-[#009c3b]/20 border-[#009c3b]/40' : 'bg-white/[0.05] border-white/[0.08]'}`}>
                          <span className={`text-[9px] font-bold ${membro.palpitou ? 'text-[#ffdf00]' : 'text-white/40'}`}>{iniciais}</span>
                        </div>
                        <span className={`text-[11px] flex-1 truncate font-medium ${membro.palpitou ? 'text-white' : 'text-white/40'}`}>{primeiroNome}</span>
                        <span className={`text-[9px] font-semibold px-2.5 py-1 rounded-full ${membro.palpitou ? 'bg-[#009c3b]/20 text-[#ffdf00]' : 'bg-white/[0.04] text-white/25 border border-white/[0.06]'}`}>
                          {membro.palpitou ? '✓ Palpitou' : 'Pendente'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Sub-componentes Copa ---

function EscudoCopa({ time, label }: Readonly<{ time: { nome: string; sigla: string; escudo: string | null } | null | undefined; label: string }>) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[#ffdf00]/25 blur-xl" />
        {time?.escudo ? (
          <Image
            src={time.escudo}
            alt={time.nome}
            width={64}
            height={64}
            className="relative h-16 w-16 object-contain drop-shadow-[0_0_16px_rgba(255,223,0,0.5)]"
            unoptimized
          />
        ) : (
          <div className="relative h-16 w-16 rounded-full bg-[#009c3b]/20 border border-[#009c3b]/40 flex items-center justify-center text-lg font-bold text-[#ffdf00]">
            {time?.sigla || '?'}
          </div>
        )}
      </div>
      <span className="text-xs text-[#ffdf00] font-semibold text-center max-w-[80px] truncate">
        {time?.nome || label}
      </span>
    </div>
  );
}

function FeedbackCopa({ salvando, salvoFeedback, palpiteAtual }: Readonly<{ salvando: boolean; salvoFeedback: boolean; palpiteAtual: Palpite | null }>) {
  return (
    <div className="h-4 flex items-center justify-center">
      {salvando && (
        <span className="flex items-center gap-1 text-[9px] text-[#ffdf00]">
          <Loader2 size={9} className="animate-spin" />
          Salvando...
        </span>
      )}
      {salvoFeedback && !salvando && (
        <span className="flex items-center gap-1 text-[9px] text-[#ffdf00] animate-[fadeIn_0.2s_ease-out]">
          <Check size={9} />
          Salvo!
        </span>
      )}
      {!salvando && !salvoFeedback && palpiteAtual && (
        <span className="flex items-center gap-1 text-[9px] text-[#a8e6b0]/70">
          <Check size={9} />
          Salvo
        </span>
      )}
      {!salvando && !salvoFeedback && !palpiteAtual && (
        <span className="text-[9px] text-[#ffdf00]/60">Faça seu palpite ☝️</span>
      )}
    </div>
  );
}
