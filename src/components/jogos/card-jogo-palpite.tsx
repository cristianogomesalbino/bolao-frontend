'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { criarPalpite, atualizarPalpite, buscarEstatisticasPalpite, EstatisticasPalpite } from '@/services/palpite.service';
import { calcularPontos } from '@/lib/pontuacao';
import { Card, CardContent } from '@/components/ui/card';
import { Jogo } from '@/types/jogo.types';
import { Palpite } from '@/types/palpite.types';

interface PropsCardJogoPalpite {
  jogo: Jogo;
  palpiteInicial?: Palpite | null;
  palpitavel?: boolean;
  bloqueado?: boolean;
  grupoId?: string;
  ativo?: boolean;
  onFoco?: () => void;
}

// --- Sub-componentes extraídos para reduzir complexidade cognitiva ---

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
          <Image
            src={time.escudo}
            alt={time.nome}
            width={56}
            height={56}
            className="relative h-14 w-14 object-contain"
            unoptimized
          />
        ) : (
          <div className="relative h-14 w-14 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
            {time?.sigla || '?'}
          </div>
        )}
      </div>
      <span className="text-xs text-texto font-medium truncate max-w-[70px]">
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
  if (!jaPalpitou && !bloqueado) {
    return <span className="text-[11px] text-destaque/80">⚠️ Você ainda não palpitou para este jogo!</span>;
  }
  if (!jaPalpitou && bloqueado) {
    return <span className="text-[10px] text-texto/30">🔒 Palpite encerrado</span>;
  }
  if (jaPalpitou && bloqueado) {
    return <span className="text-[10px] text-texto/30">🔒 Palpite encerrado</span>;
  }
  return null;
}

interface PropsCentroCard {
  jogo: Jogo;
  palpitavel?: boolean;
  bloqueado?: boolean;
  palpiteAtual: Palpite | null;
  golsCasa: number;
  golsFora: number;
  salvando: boolean;
  onSetGolsCasa: (valor: number) => void;
  onSetGolsFora: (valor: number) => void;
  onSalvar: () => void;
  inputsRef?: React.RefObject<HTMLDivElement | null>;
}

function CentroCard({
  jogo, palpitavel, bloqueado, palpiteAtual,
  golsCasa, golsFora, salvando,
  onSetGolsCasa, onSetGolsFora, onSalvar, inputsRef,
}: Readonly<PropsCentroCard>) {
  if (jogo.status === 'FINALIZADO' || jogo.status === 'EM_ANDAMENTO') {
    return (
      <>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-texto">
            {jogo.golsCasa ?? 0}
          </span>
          <span className="text-[10px] text-texto/20">×</span>
          <span className="text-2xl font-bold text-texto">
            {jogo.golsFora ?? 0}
          </span>
        </div>
        {palpiteAtual && (
          <span className="text-[9px] text-primaria-claro mt-1">
            Meu palpite: {palpiteAtual.golsCasa} × {palpiteAtual.golsFora}
          </span>
        )}
      </>
    );
  }

  // Bloqueado: mostra palpite estático ou traço
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

  // Palpitável e não bloqueado: sempre mostra inputs editáveis
  if (palpitavel) {
    return (
      <div ref={inputsRef} className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]"
          min={0}
          max={9}
          value={golsCasa}
          onChange={(e) => {
            const val = Number.parseInt(e.target.value, 10);
            onSetGolsCasa(Number.isNaN(val) ? 0 : Math.max(0, Math.min(9, val)));
          }}
          onFocus={(e) => e.target.select()}
          onBlur={onSalvar}
          className="w-12 h-14 rounded-lg bg-black/60 border border-white/[0.12] text-center text-2xl font-bold text-texto outline-none focus:border-primaria focus:ring-1 focus:ring-primaria transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          disabled={salvando}
          data-testid="input-gols-casa"
        />
        <span className="text-sm font-bold text-texto/40">x</span>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]"
          min={0}
          max={9}
          value={golsFora}
          onChange={(e) => {
            const val = Number.parseInt(e.target.value, 10);
            onSetGolsFora(Number.isNaN(val) ? 0 : Math.max(0, Math.min(9, val)));
          }}
          onFocus={(e) => e.target.select()}
          onBlur={onSalvar}
          className="w-12 h-14 rounded-lg bg-black/60 border border-white/[0.12] text-center text-2xl font-bold text-texto outline-none focus:border-primaria focus:ring-1 focus:ring-primaria transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

export function CardJogoPalpite({ jogo, palpiteInicial, palpitavel, bloqueado, grupoId, ativo, onFoco }: Readonly<PropsCardJogoPalpite>) {
  const queryClient = useQueryClient();
  const [golsCasa, setGolsCasa] = useState(palpiteInicial?.golsCasa ?? 0);
  const [golsFora, setGolsFora] = useState(palpiteInicial?.golsFora ?? 0);
  const [expandido, setExpandido] = useState(false);
  const [palpiteLocal, setPalpiteLocal] = useState<Palpite | null>(palpiteInicial ?? null);
  const [salvoFeedback, setSalvoFeedback] = useState(false);
  const golsRef = useRef({ golsCasa: palpiteInicial?.golsCasa ?? 0, golsFora: palpiteInicial?.golsFora ?? 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const palpiteRef = useRef<Palpite | null>(palpiteInicial ?? null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputsRef = useRef<HTMLDivElement>(null);

  // Sincronizar quando palpiteInicial muda (ex: batch re-executa)
  useEffect(() => {
    if (palpiteInicial && !palpiteRef.current) {
      setPalpiteLocal(palpiteInicial);
      palpiteRef.current = palpiteInicial;
      setGolsCasa(palpiteInicial.golsCasa);
      setGolsFora(palpiteInicial.golsFora);
      golsRef.current = { golsCasa: palpiteInicial.golsCasa, golsFora: palpiteInicial.golsFora };
    }
  }, [palpiteInicial]);

  const palpiteAtual = palpiteLocal;
  const jaPalpitou = !!palpiteAtual;

  const { data: estatisticas, isLoading: carregandoEstatisticas } = useQuery({
    queryKey: ['estatisticas-palpite', grupoId, jogo.id],
    queryFn: () => buscarEstatisticasPalpite(grupoId!, jogo.id),
    enabled: !!grupoId && expandido,
    staleTime: 1000 * 30,
  });

  const mutationCriar = useMutation({
    mutationFn: (gols: { golsCasa: number; golsFora: number }) => criarPalpite(jogo.id, gols),
    onSuccess: (data: Palpite) => {
      queryClient.setQueryData(['meu-palpite', jogo.id], data);
      queryClient.invalidateQueries({ queryKey: ['estatisticas-palpite', grupoId, jogo.id] });
      setPalpiteLocal(data);
      palpiteRef.current = data;
      mostrarFeedbackSalvo();
    },
    onError: async (error: unknown) => {
      // 409 = palpite já existe — buscar o existente e atualizar com os gols atuais
      const status = (error as { statusCode?: number })?.statusCode
        ?? (error as { status?: number })?.status
        ?? (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        const { buscarMeuPalpite } = await import('@/services/palpite.service');
        const existente = await buscarMeuPalpite(jogo.id);
        if (existente) {
          setPalpiteLocal(existente);
          palpiteRef.current = existente;
          queryClient.setQueryData(['meu-palpite', jogo.id], existente);
          // Atualizar com os gols que o usuário digitou
          const gols = golsRef.current;
          if (gols.golsCasa !== existente.golsCasa || gols.golsFora !== existente.golsFora) {
            mutationAtualizar.mutate({ palpiteId: existente.id, gols });
          } else {
            mostrarFeedbackSalvo();
          }
        }
      }
    },
  });

  const mutationAtualizar = useMutation({
    mutationFn: ({ palpiteId, gols }: { palpiteId: string; gols: { golsCasa: number; golsFora: number } }) =>
      atualizarPalpite(palpiteId, gols),
    onSuccess: (data: Palpite) => {
      queryClient.setQueryData(['meu-palpite', jogo.id], data);
      queryClient.invalidateQueries({ queryKey: ['estatisticas-palpite', grupoId, jogo.id] });
      setPalpiteLocal(data);
      palpiteRef.current = data;
      mostrarFeedbackSalvo();
    },
  });

  const salvando = mutationCriar.isPending || mutationAtualizar.isPending;

  function mostrarFeedbackSalvo() {
    setSalvoFeedback(true);
    setTimeout(() => {
      setSalvoFeedback(false);
    }, 2000);
  }

  function salvar() {
    // Delay curto para verificar se o foco foi para o outro input do mesmo card
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      // Se o foco está em outro input dentro do mesmo container, não salvar ainda
      if (inputsRef.current?.contains(document.activeElement)) return;

      const gols = golsRef.current;

      // Fonte de verdade: ref > cache > nada
      const palpite = palpiteRef.current
        ?? queryClient.getQueryData<Palpite | null>(['meu-palpite', jogo.id])
        ?? null;

      // Sincronizar se encontrou no cache mas não no ref
      if (palpite && !palpiteRef.current) {
        palpiteRef.current = palpite;
        setPalpiteLocal(palpite);
      }

      if (palpite) {
        // Já tem palpite → atualizar (só se mudou)
        if (gols.golsCasa !== palpite.golsCasa || gols.golsFora !== palpite.golsFora) {
          mutationAtualizar.mutate({ palpiteId: palpite.id, gols });
        }
      } else {
        // Sem palpite em nenhum lugar → criar
        mutationCriar.mutate(gols);
      }
    }, 150);
  }

  function handleSetGolsCasa(valor: number) {
    onFoco?.();
    setGolsCasa(valor);
    golsRef.current = { ...golsRef.current, golsCasa: valor };
  }

  function handleSetGolsFora(valor: number) {
    onFoco?.();
    setGolsFora(valor);
    golsRef.current = { ...golsRef.current, golsFora: valor };
  }

  useEffect(() => {
    if (ativo && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [ativo]);

  const dataHoraFormatada = jogo.dataHora
    ? new Date(jogo.dataHora).toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo'
      }).toUpperCase().replace('.', '') + ' • ' +
      new Date(jogo.dataHora).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
      })
    : '';

  const emPreenchimento = palpitavel && !palpiteAtual && !bloqueado;
  const cardBorda = ativo && emPreenchimento
    ? 'border-primaria border-[3px] shadow-[0_0_30px_rgba(34,197,94,0.35)]'
    : 'border-primaria';

  return (
    <div ref={cardRef} className="scroll-mt-[140px]">
      <Card className={`${cardBorda} transition-all duration-300 overflow-hidden`}>
        <CardContent className="p-3">
          {/* Data/hora + status */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {jogo.dataHora ? (
              <span className="text-[11px] text-texto/80 uppercase tracking-wide">{dataHoraFormatada}</span>
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
                onSetGolsCasa={handleSetGolsCasa}
                onSetGolsFora={handleSetGolsFora}
                onSalvar={salvar}
                inputsRef={inputsRef}
              />
            </div>

            <EscudoTime time={jogo.timeFora} label="Fora" />
          </div>

          {/* Feedback de status */}
          {palpitavel && (
            <div className="mt-1.5 h-5 flex items-center justify-center">
              <FeedbackStatus
                salvando={salvando}
                salvoFeedback={salvoFeedback}
                jaPalpitou={jaPalpitou}
                bloqueado={bloqueado}
              />
            </div>
          )}

          {/* Pontuação (jogos finalizados) */}
          {jogo.status === 'FINALIZADO' && palpiteAtual && (
            <div className="flex items-center justify-center mt-2 pt-2 border-t border-white/[0.05]">
              {(() => {
                const pts = calcularPontos({
                  ...palpiteAtual,
                  jogo: { golsCasa: jogo.golsCasa, golsFora: jogo.golsFora, status: jogo.status },
                });
                if (pts > 0) {
                  return <span className="text-[10px] text-primaria font-semibold">+{pts} pts</span>;
                }
                return <span className="text-[10px] text-texto/30">0 pts</span>;
              })()}
            </div>
          )}

          {/* Seta expandir */}
          <button
            type="button"
            onClick={() => setExpandido(!expandido)}
            className="w-full flex items-center justify-center mt-2 pt-1"
          >
            <ChevronDown size={20} className={`text-texto/80 transition-transform ${expandido ? 'rotate-180' : ''}`} />
          </button>

          {/* Barra de palpites da galera */}
          {expandido && (
            <div className="mt-2 pt-2 border-t border-white/[0.05]">
              <ConteudoExpandido carregando={carregandoEstatisticas} estatisticas={estatisticas} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
