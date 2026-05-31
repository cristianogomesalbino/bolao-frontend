'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Loader2, Pencil } from 'lucide-react';
import Image from 'next/image';
import { criarPalpite, atualizarPalpite, buscarEstatisticasPalpite } from '@/services/palpite.service';
import { calcularPontos } from '@/lib/pontuacao';
import { Card, CardContent } from '@/components/ui/card';
import { Jogo } from '@/types/jogo.types';
import { Palpite } from '@/types/palpite.types';

interface PropsCardJogoPalpite {
  jogo: Jogo;
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
  contagem: number | null;
  jaPalpitou: boolean;
  editando: boolean;
  palpiteAtual: Palpite | null;
  onEditar?: () => void;
  bloqueado?: boolean;
}

function FeedbackStatus({ salvando, salvoFeedback, contagem, jaPalpitou, editando, palpiteAtual, onEditar, bloqueado }: Readonly<PropsFeedbackStatus>) {
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
  if (contagem !== null) {
    return <span className="text-[10px] text-primaria-claro">Salvando em {contagem}...</span>;
  }
  if (!jaPalpitou && !bloqueado) {
    return <span className="text-[11px] text-destaque/80">⚠️ Você ainda não palpitou para este jogo!</span>;
  }
  if (!jaPalpitou && bloqueado) {
    return <span className="text-[10px] text-texto/30">🔒 Palpite encerrado</span>;
  }
  if (!editando && palpiteAtual && !bloqueado) {
    return (
      <button
        type="button"
        onClick={onEditar}
        className="text-[10px] text-primaria-claro hover:text-primaria-claro flex items-center gap-1"
      >
        <Pencil size={10} />
        Editar
      </button>
    );
  }
  if (!editando && palpiteAtual && bloqueado) {
    return <span className="text-[10px] text-texto/30">🔒 Palpite encerrado</span>;
  }
  return null;
}

interface PropsCentroCard {
  jogo: Jogo;
  palpitavel?: boolean;
  bloqueado?: boolean;
  jaPalpitou: boolean;
  editando: boolean;
  palpiteAtual: Palpite | null;
  golsCasa: number;
  golsFora: number;
  salvando: boolean;
  salvoFeedback: boolean;
  onAlterarGolsCasa: (delta: number) => void;
  onAlterarGolsFora: (delta: number) => void;
}

function CentroCard({
  jogo, palpitavel, bloqueado, jaPalpitou, editando, palpiteAtual,
  golsCasa, golsFora, salvando, salvoFeedback,
  onAlterarGolsCasa, onAlterarGolsFora,
}: Readonly<PropsCentroCard>) {
  if (jogo.status === 'FINALIZADO' || jogo.status === 'EM_ANDAMENTO') {
    return (
      <>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold ${jogo.status === 'EM_ANDAMENTO' ? 'text-primaria' : 'text-texto'}`}>
            {jogo.golsCasa ?? 0}
          </span>
          <span className="text-[10px] text-texto/20">×</span>
          <span className={`text-2xl font-bold ${jogo.status === 'EM_ANDAMENTO' ? 'text-primaria' : 'text-texto'}`}>
            {jogo.golsFora ?? 0}
          </span>
        </div>
        {palpiteAtual && (
          <span className="text-[9px] text-texto/30 mt-1">
            Meu palpite: {palpiteAtual.golsCasa} × {palpiteAtual.golsFora}
          </span>
        )}
      </>
    );
  }

  if (palpitavel && jaPalpitou && !editando && palpiteAtual) {
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

  if (palpitavel && !bloqueado) {
    const botoesInvisiveis = salvando || salvoFeedback ? 'invisible' : '';
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <div className={`flex flex-col items-center justify-center gap-1 ${botoesInvisiveis}`}>
            <button type="button" onClick={() => onAlterarGolsCasa(1)} className="text-texto/50 hover:text-texto active:scale-90 transition-all p-1 rounded border border-white/[0.12]">
              <ChevronDown size={24} className="rotate-180" />
            </button>
            <button type="button" onClick={() => onAlterarGolsCasa(-1)} className="text-texto/50 hover:text-texto active:scale-90 transition-all p-1 rounded border border-white/[0.12]">
              <ChevronDown size={24} />
            </button>
          </div>
          <div className="w-11 h-12 rounded-lg bg-black/60 border border-white/[0.12] flex items-center justify-center">
            <span className="text-2xl font-bold text-texto">{golsCasa}</span>
          </div>
        </div>
        <span className="text-sm font-bold text-texto/40">x</span>
        <div className="flex items-center gap-0.5">
          <div className="w-11 h-12 rounded-lg bg-black/60 border border-white/[0.12] flex items-center justify-center">
            <span className="text-2xl font-bold text-texto">{golsFora}</span>
          </div>
          <div className={`flex flex-col items-center justify-center gap-1 ${botoesInvisiveis}`}>
            <button type="button" onClick={() => onAlterarGolsFora(1)} className="text-texto/50 hover:text-texto active:scale-90 transition-all p-1 rounded border border-white/[0.12]">
              <ChevronDown size={24} className="rotate-180" />
            </button>
            <button type="button" onClick={() => onAlterarGolsFora(-1)} className="text-texto/50 hover:text-texto active:scale-90 transition-all p-1 rounded border border-white/[0.12]">
              <ChevronDown size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <span className="text-[11px] text-texto/40">—</span>;
}

// --- Componente principal ---

export function CardJogoPalpite({ jogo, palpitavel, bloqueado, grupoId, ativo, onFoco }: Readonly<PropsCardJogoPalpite>) {
  const queryClient = useQueryClient();
  const [golsCasa, setGolsCasa] = useState(0);
  const [golsFora, setGolsFora] = useState(0);
  const [editando, setEditando] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [palpiteLocal, setPalpiteLocal] = useState<Palpite | null>(null);
  const [salvoFeedback, setSalvoFeedback] = useState(false);
  const [contagem, setContagem] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contagemRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const golsRef = useRef({ golsCasa: 0, golsFora: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const palpiteRef = useRef<Palpite | null>(null);

  // Observar cache populado pelo batch
  useEffect(() => {
    const cached = queryClient.getQueryData<Palpite | null>(['meu-palpite', jogo.id]);
    if (cached && !palpiteLocal) {
      setPalpiteLocal(cached);
      palpiteRef.current = cached;
      setGolsCasa(cached.golsCasa);
      setGolsFora(cached.golsFora);
      golsRef.current = { golsCasa: cached.golsCasa, golsFora: cached.golsFora };
    }
  }, [jogo.id, palpiteLocal, queryClient]);

  const palpiteAtual = palpiteLocal;
  const jaPalpitou = !!palpiteAtual;

  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-palpite', grupoId, jogo.id],
    queryFn: () => buscarEstatisticasPalpite(grupoId!, jogo.id),
    enabled: !!grupoId && expandido,
    staleTime: 1000 * 60 * 5,
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
      setEditando(false);
    }, 2000);
  }

  // Refs estáveis para mutations (evita stale closures no useCallback)
  const mutationCriarRef = useRef(mutationCriar);
  const mutationAtualizarRef = useRef(mutationAtualizar);
  useEffect(() => { mutationCriarRef.current = mutationCriar; }, [mutationCriar]);
  useEffect(() => { mutationAtualizarRef.current = mutationAtualizar; }, [mutationAtualizar]);

  const salvarComDebounce = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (contagemRef.current) clearInterval(contagemRef.current);

    setContagem(3);
    let segundos = 3;

    contagemRef.current = setInterval(() => {
      segundos--;
      if (segundos > 0) {
        setContagem(segundos);
      } else {
        if (contagemRef.current) clearInterval(contagemRef.current);
        setContagem(null);
      }
    }, 1000);

    debounceRef.current = setTimeout(() => {
      const gols = golsRef.current;
      const palpite = palpiteRef.current;
      if (palpite) {
        if (gols.golsCasa !== palpite.golsCasa || gols.golsFora !== palpite.golsFora) {
          mutationAtualizarRef.current.mutate({ palpiteId: palpite.id, gols });
        } else {
          setContagem(null);
        }
      } else {
        mutationCriarRef.current.mutate(gols);
      }
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (contagemRef.current) clearInterval(contagemRef.current);
    };
  }, []);

  function alterarGolsCasa(delta: number) {
    onFoco?.();
    setGolsCasa((v) => {
      const novo = Math.max(0, v + delta);
      golsRef.current = { ...golsRef.current, golsCasa: novo };
      salvarComDebounce();
      return novo;
    });
  }

  function alterarGolsFora(delta: number) {
    onFoco?.();
    setGolsFora((v) => {
      const novo = Math.max(0, v + delta);
      golsRef.current = { ...golsRef.current, golsFora: novo };
      salvarComDebounce();
      return novo;
    });
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

  const emPreenchimento = palpitavel && (!palpiteAtual || editando);
  const cardBorda = ativo && emPreenchimento
    ? 'border-primaria border-[3px] shadow-[0_0_30px_rgba(34,197,94,0.35)]'
    : 'border-primaria';

  function handleEditar() {
    onFoco?.();
    setEditando(true);
    if (palpiteAtual) {
      setGolsCasa(palpiteAtual.golsCasa);
      setGolsFora(palpiteAtual.golsFora);
      golsRef.current = { golsCasa: palpiteAtual.golsCasa, golsFora: palpiteAtual.golsFora };
    }
  }

  return (
    <div ref={cardRef} className="scroll-mt-[140px]">
      <Card className={`${cardBorda} transition-all duration-300`}>
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
                jaPalpitou={jaPalpitou}
                editando={editando}
                palpiteAtual={palpiteAtual}
                golsCasa={golsCasa}
                golsFora={golsFora}
                salvando={salvando}
                salvoFeedback={salvoFeedback}
                onAlterarGolsCasa={alterarGolsCasa}
                onAlterarGolsFora={alterarGolsFora}
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
                contagem={contagem}
                jaPalpitou={jaPalpitou}
                editando={editando}
                palpiteAtual={palpiteAtual}
                onEditar={bloqueado ? undefined : handleEditar}
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
              {estatisticas && estatisticas.total > 0 ? (
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
              ) : (
                <p className="text-[10px] text-texto/30 text-center">Nenhum palpite ainda</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
