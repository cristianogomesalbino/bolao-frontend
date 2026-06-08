'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { buscarEstatisticasPalpite, EstatisticasPalpite } from '@/services/palpite.service';
import { calcularPontos } from '@/lib/pontuacao';
import { Card, CardContent } from '@/components/ui/card';
import { Jogo } from '@/types/jogo.types';
import { Palpite } from '@/types/palpite.types';
import { usePalpiteCard } from '@/hooks/usePalpiteCard';

interface PropsCardJogoPalpite {
  jogo: Jogo;
  palpiteInicial?: Palpite | null;
  palpitavel?: boolean;
  bloqueado?: boolean;
  grupoId?: string;
  ativo?: boolean;
  onFoco?: () => void;
  onProximoCard?: () => void;
  ehUltimoCard?: boolean;
  temaCopa?: boolean;
}

// --- Sub-componentes ---

interface PropsEscudoTime {
  time: { nome: string; sigla: string; escudo: string | null } | null | undefined;
  label: string;
}

function EscudoTime({ time, label }: Readonly<PropsEscudoTime>) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div className="relative h-14 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-white/30 blur-lg" />
        {time?.escudo ? (
          <Image src={time.escudo} alt={time.nome} width={56} height={56} className="relative h-14 w-14 object-contain" unoptimized />
        ) : (
          <div className="relative h-14 w-14 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
            {time?.sigla || '?'}
          </div>
        )}
      </div>
      <span className="text-[11px] text-texto font-medium text-center leading-tight max-w-[90px]">
        {time?.nome || label}
      </span>
    </div>
  );
}

interface PropsFeedbackStatus {
  salvando: boolean;
  salvoFeedback: boolean;
  jaPalpitou: boolean;
  bloqueado?: boolean;
}

function FeedbackStatus({ salvando, salvoFeedback, jaPalpitou, bloqueado }: Readonly<PropsFeedbackStatus>) {
  if (salvando) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-primaria-claro">
        <Loader2 size={10} className="animate-spin" />
        Salvando...
      </span>
    );
  }
  if (salvoFeedback) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-primaria-claro animate-[fadeIn_0.2s_ease-out]">
        <Check size={10} />
        Salvo!
      </span>
    );
  }
  if (bloqueado) {
    return <span className="text-[10px] text-texto/30">🔒 Palpite encerrado</span>;
  }
  if (!jaPalpitou) {
    return <span className="text-[11px] text-destaque/80">⚠️ Você ainda não palpitou para este jogo!</span>;
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-primaria-claro/70">
      <Check size={10} />
      Salvo
    </span>
  );
}

interface PropsCentroCard {
  jogo: Jogo;
  palpitavel?: boolean;
  bloqueado?: boolean;
  palpiteAtual: Palpite | null;
  golsCasa: number | '';
  golsFora: number | '';
  salvando: boolean;
  onSetGolsCasa: (valor: number | '') => void;
  onSetGolsFora: (valor: number | '') => void;
  onSalvar: () => void;
  onProximoCard?: () => void;
  ehUltimoCard?: boolean;
  inputsRef: React.RefObject<HTMLDivElement | null>;
}

function CentroCard({
  jogo, palpitavel, bloqueado, palpiteAtual,
  golsCasa, golsFora, salvando,
  onSetGolsCasa, onSetGolsFora, onSalvar, onProximoCard, ehUltimoCard, inputsRef,
}: Readonly<PropsCentroCard>) {
  const inputForaRef = useRef<HTMLInputElement>(null);

  if (jogo.status === 'FINALIZADO' || jogo.status === 'EM_ANDAMENTO') {
    return (
      <>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-texto">{jogo.golsCasa ?? 0}</span>
          <span className="text-[10px] text-texto/20">×</span>
          <span className="text-2xl font-bold text-texto">{jogo.golsFora ?? 0}</span>
        </div>
        {jogo.temPenaltis && jogo.penaltisCasa != null && jogo.penaltisFora != null && (
          <span className="text-[9px] text-texto/40 mt-0.5">({jogo.penaltisCasa} × {jogo.penaltisFora} pen.)</span>
        )}
        {palpiteAtual && (
          <span className="text-[9px] text-primaria-claro mt-1">Meu palpite: {palpiteAtual.golsCasa} × {palpiteAtual.golsFora}</span>
        )}
      </>
    );
  }

  if (bloqueado) {
    if (palpiteAtual) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-11 h-12 rounded-lg bg-black/60 border border-primaria/40 flex items-center justify-center">
            <span className="text-2xl font-bold text-primaria-claro">{palpiteAtual.golsCasa}</span>
          </div>
          <span className="text-sm font-bold text-texto/40">x</span>
          <div className="w-11 h-12 rounded-lg bg-black/60 border border-primaria/40 flex items-center justify-center">
            <span className="text-2xl font-bold text-primaria-claro">{palpiteAtual.golsFora}</span>
          </div>
        </div>
      );
    }
    return <span className="text-[11px] text-texto/40">—</span>;
  }

  if (palpitavel) {
    function handleInputCasa(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 1);
      if (raw === '') { onSetGolsCasa(''); return; }
      const val = Number.parseInt(raw, 10);
      onSetGolsCasa(Math.min(9, val));
      // Auto-avançar para golsFora
      setTimeout(() => inputForaRef.current?.focus(), 50);
    }

    function handleInputFora(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 1);
      if (raw === '') { onSetGolsFora(''); return; }
      const val = Number.parseInt(raw, 10);
      onSetGolsFora(Math.min(9, val));
      // Auto-avançar para próximo card após salvar
      setTimeout(() => {
        if (onProximoCard && !ehUltimoCard) {
          // Blur antes de avançar para evitar que salvar() detecte foco interno
          inputForaRef.current?.blur();
          // requestAnimationFrame garante que o blur foi processado pelo browser
          requestAnimationFrame(() => {
            onSalvar();
            onProximoCard();
          });
        } else {
          // Último card: blur para disparar salvar
          inputForaRef.current?.blur();
        }
      }, 50);
    }

    return (
      <div ref={inputsRef} className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          enterKeyHint="next"
          autoComplete="off"
          value={golsCasa === '' ? '' : golsCasa}
          placeholder="-"
          onChange={handleInputCasa}
          onFocus={(e) => e.target.select()}
          onBlur={onSalvar}
          className="w-12 h-14 rounded-lg bg-black/60 border border-white/[0.12] text-center text-2xl font-bold text-texto outline-none focus:border-primaria focus:ring-1 focus:ring-primaria transition-colors"
          disabled={salvando}
          data-testid="input-gols-casa"
        />
        <span className="text-sm font-bold text-texto/40">x</span>
        <input
          ref={inputForaRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          enterKeyHint={onProximoCard && !ehUltimoCard ? 'next' : 'done'}
          autoComplete="off"
          value={golsFora === '' ? '' : golsFora}
          placeholder="-"
          onChange={handleInputFora}
          onFocus={(e) => e.target.select()}
          onBlur={onSalvar}
          className="w-12 h-14 rounded-lg bg-black/60 border border-white/[0.12] text-center text-2xl font-bold text-texto outline-none focus:border-primaria focus:ring-1 focus:ring-primaria transition-colors"
          disabled={salvando}
          data-testid="input-gols-fora"
        />
      </div>
    );
  }

  return <span className="text-[11px] text-texto/40">—</span>;
}

interface PropsConteudoExpandido {
  carregando: boolean;
  estatisticas: EstatisticasPalpite | null | undefined;
}

function ConteudoExpandido({ carregando, estatisticas }: Readonly<PropsConteudoExpandido>) {
  if (carregando) {
    return <div className="h-8 rounded-full bg-white/[0.03] animate-pulse" />;
  }
  if (!estatisticas || estatisticas.total === 0) {
    return <p className="text-[10px] text-texto/30 text-center">Nenhum palpite ainda</p>;
  }
  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <div className="text-left">
          <span className="text-sm font-bold text-primaria">{estatisticas.percentualCasa}%</span>
          <p className="text-[9px] text-texto/40">da galera</p>
        </div>
        {estatisticas.percentualEmpate > 0 && (
          <div className="text-center">
            <span className="text-sm font-bold text-texto/60">{estatisticas.percentualEmpate}%</span>
            <p className="text-[9px] text-texto/40">empate</p>
          </div>
        )}
        <div className="text-right">
          <span className="text-sm font-bold text-erro">{estatisticas.percentualFora}%</span>
          <p className="text-[9px] text-texto/40">da galera</p>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden flex">
        <div className="h-full bg-primaria rounded-l-full" style={{ width: `${estatisticas.percentualCasa}%` }} />
        {estatisticas.percentualEmpate > 0 && (
          <div className="h-full bg-texto/30" style={{ width: `${estatisticas.percentualEmpate}%` }} />
        )}
        <div className="h-full bg-erro rounded-r-full" style={{ width: `${estatisticas.percentualFora}%` }} />
      </div>
      <p className="text-[9px] text-texto/30 text-center mt-1">{estatisticas.total} palpites</p>
    </>
  );
}

// --- Componente principal ---

export function CardJogoPalpite({ jogo, palpiteInicial, palpitavel, bloqueado, grupoId, ativo, onFoco, onProximoCard, ehUltimoCard, temaCopa }: Readonly<PropsCardJogoPalpite>) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [expandido, setExpandido] = useState(false);

  const {
    golsCasa, golsFora, palpiteAtual, jaPalpitou,
    salvando, salvoFeedback, inputsRef,
    handleSetGolsCasa, handleSetGolsFora, salvar,
  } = usePalpiteCard({ jogoId: jogo.id, grupoId, palpiteInicial });

  const { data: estatisticas, isLoading: carregandoEstatisticas } = useQuery({
    queryKey: ['estatisticas-palpite', grupoId, jogo.id],
    queryFn: () => buscarEstatisticasPalpite(grupoId!, jogo.id),
    enabled: !!grupoId && expandido,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (ativo && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Auto-focus no primeiro input ao avançar para este card
      if (palpitavel && !bloqueado) {
        setTimeout(() => {
          const firstInput = inputsRef.current?.querySelector('input:not(:disabled)') as HTMLInputElement | null;
          firstInput?.focus();
        }, 300);
      }
    }
  }, [ativo, palpitavel, bloqueado]); // eslint-disable-line react-hooks/exhaustive-deps -- inputsRef é ref estável

  const emPreenchimento = palpitavel && !palpiteAtual && !bloqueado;
  const bordaCopa = temaCopa ? 'border-[#ffdf00] shadow-[0_0_12px_rgba(255,223,0,0.2)]' : 'border-primaria';
  const bordaAtivaCopa = temaCopa
    ? 'border-[#ffdf00] border-[3px] shadow-[0_0_30px_rgba(255,223,0,0.4)]'
    : 'border-primaria border-[3px] shadow-[0_0_30px_rgba(34,197,94,0.35)]';
  const cardBorda = ativo && emPreenchimento ? bordaAtivaCopa : bordaCopa;

  function handleSetCasa(valor: number | '') {
    onFoco?.();
    handleSetGolsCasa(valor);
  }

  function handleSetFora(valor: number | '') {
    onFoco?.();
    handleSetGolsFora(valor);
  }

  return (
    <div ref={cardRef} className="scroll-mt-[140px]">
      <Card className={`${cardBorda} transition-all duration-300 overflow-hidden`}>
        <CardContent className="p-3">
          {/* Data/hora + status */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {jogo.dataHora ? (
              <span className="text-[11px] text-texto/80 uppercase tracking-wide">
                {new Date(jogo.dataHora).toLocaleDateString('pt-BR', {
                  weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo'
                }).toUpperCase().replace('.', '') + ' • ' +
                new Date(jogo.dataHora).toLocaleTimeString('pt-BR', {
                  hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
                })}
              </span>
            ) : (
              <span className="text-[9px] text-destaque font-semibold uppercase tracking-wide">Jogo adiado - Data a definir</span>
            )}
            {jogo.status === 'EM_ANDAMENTO' && (
              <span className="flex items-center gap-1 text-[8px] text-erro font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-erro animate-pulse" />{' '}
                AO VIVO
              </span>
            )}
            {jogo.status === 'FINALIZADO' && (
              <span className="text-[8px] text-texto/30 font-medium">ENCERRADO</span>
            )}
          </div>

          {/* Times + Placar/Palpite */}
          <div className="flex items-center gap-2">
            <EscudoTime time={jogo.timeCasa} label="Casa" />
            <div className="flex flex-col items-center shrink-0 w-[160px]">
              <CentroCard
                jogo={jogo}
                palpitavel={palpitavel}
                bloqueado={bloqueado}
                palpiteAtual={palpiteAtual}
                golsCasa={golsCasa}
                golsFora={golsFora}
                salvando={salvando}
                onSetGolsCasa={handleSetCasa}
                onSetGolsFora={handleSetFora}
                onSalvar={salvar}
                onProximoCard={onProximoCard}
                ehUltimoCard={ehUltimoCard}
                inputsRef={inputsRef}
              />
            </div>
            <EscudoTime time={jogo.timeFora} label="Fora" />
          </div>

          {/* Feedback */}
          {palpitavel && (
            <div className="mt-1.5 h-5 flex items-center justify-center">
              <FeedbackStatus salvando={salvando} salvoFeedback={salvoFeedback} jaPalpitou={jaPalpitou} bloqueado={bloqueado} />
            </div>
          )}

          {/* Pontuação */}
          {jogo.status === 'FINALIZADO' && palpiteAtual && (
            <div className="flex items-center justify-center mt-2 pt-2 border-t border-white/[0.05]">
              {(() => {
                const pts = calcularPontos({ ...palpiteAtual, jogo: { golsCasa: jogo.golsCasa, golsFora: jogo.golsFora, status: jogo.status } });
                if (pts === 3) return <span className="text-[10px] text-primaria font-semibold">+{pts} pts <span className="text-sm">🎯</span></span>;
                if (pts > 0) return <span className="text-[10px] text-primaria font-semibold">+{pts} pts</span>;
                return <span className="text-[10px] text-texto/30">0 pts</span>;
              })()}
            </div>
          )}

          {/* Expandir */}
          <button type="button" onClick={() => setExpandido(!expandido)} className="w-full flex items-center justify-center mt-2 pt-1">
            <ChevronDown size={20} className={`text-texto/80 transition-transform ${expandido ? 'rotate-180' : ''}`} />
          </button>

          {/* Estatísticas */}
          {expandido && (
            <div className="mt-2 pt-2 border-t border-white/[0.05]">
              {grupoId ? (
                <ConteudoExpandido carregando={carregandoEstatisticas} estatisticas={estatisticas} />
              ) : (
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <p className="text-[11px] text-texto/50 leading-relaxed">
                    Entre em um grupo para ver como seus amigos palpitaram neste jogo!
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
