'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Loader2, Pencil } from 'lucide-react';
import { criarPalpite, atualizarPalpite, buscarEstatisticasPalpite } from '@/services/palpite.service';
import { ClassificacaoTime } from '@/services/classificacao.service';
import { Card, CardContent } from '@/components/ui/card';
import { Jogo } from '@/types/jogo.types';
import { Palpite } from '@/types/palpite.types';

interface PropsCardJogoPalpite {
  jogo: Jogo;
  classificacao?: ClassificacaoTime[];
  palpitavel?: boolean;
  grupoId?: string;
  ativo?: boolean;
  onFoco?: () => void;
}

export function CardJogoPalpite({ jogo, classificacao, palpitavel, grupoId, ativo, onFoco }: Readonly<PropsCardJogoPalpite>) {
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
  });

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

  const salvarComDebounce = useCallback(() => {
    // Limpar timers anteriores
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (contagemRef.current) clearInterval(contagemRef.current);

    // Iniciar contagem regressiva de 3s
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

    // Disparar save após 3s
    debounceRef.current = setTimeout(() => {
      const gols = golsRef.current;
      const palpite = palpiteRef.current;
      if (palpite) {
        if (gols.golsCasa !== palpite.golsCasa || gols.golsFora !== palpite.golsFora) {
          mutationAtualizar.mutate({ palpiteId: palpite.id, gols });
        } else {
          // Nada mudou, só limpar contagem
          setContagem(null);
        }
      } else {
        mutationCriar.mutate(gols);
      }
    }, 3000);
  }, []);

  // Cleanup on unmount
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

  // Scroll into view quando ativo
  useEffect(() => {
    if (ativo && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [ativo]);

  // Formatar data/hora centralizado
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

  return (
    <div ref={cardRef} className="scroll-mt-[140px]">
      <Card className={`${cardBorda} transition-all duration-300`}>
        <CardContent className="p-3">
        {/* Data/hora centralizada + indicação de status */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {jogo.dataHora ? (
            <span className="text-[11px] text-texto/80 uppercase tracking-wide">{dataHoraFormatada}</span>
          ) : (
            <span className="text-[9px] text-destaque font-semibold uppercase tracking-wide">Jogo adiado - Data a definir</span>
          )}
          {jogo.status === 'EM_ANDAMENTO' && (
            <span className="flex items-center gap-1 text-[8px] text-erro font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-erro animate-pulse" />
              AO VIVO
            </span>
          )}
          {jogo.status === 'FINALIZADO' && (
            <span className="text-[8px] text-texto/30 font-medium">ENCERRADO</span>
          )}
        </div>

        {/* Times + Placar/Palpite */}
        <div className="flex items-center gap-2">
          {/* Time Casa */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="relative h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-white/30 blur-lg" />
              {jogo.timeCasa?.escudo ? (
                <img src={jogo.timeCasa.escudo} alt={jogo.timeCasa.nome} className="relative h-14 w-14 object-contain" />
              ) : (
                <div className="relative h-14 w-14 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
                  {jogo.timeCasa?.sigla || '?'}
                </div>
              )}
            </div>
            <span className="text-xs text-texto font-medium truncate max-w-[70px]">
              {jogo.timeCasa?.nome || 'Casa'}
            </span>
          </div>

          {/* Centro: Placar final (se finalizado) ou Palpite (se agendado) */}
          <div className="flex flex-col items-center shrink-0 w-[160px]">
            {jogo.status === 'FINALIZADO' || jogo.status === 'EM_ANDAMENTO' ? (
              <>
                {/* Placar final */}
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${jogo.status === 'EM_ANDAMENTO' ? 'text-primaria' : 'text-texto'}`}>
                    {jogo.golsCasa ?? 0}
                  </span>
                  <span className="text-[10px] text-texto/20">×</span>
                  <span className={`text-2xl font-bold ${jogo.status === 'EM_ANDAMENTO' ? 'text-primaria' : 'text-texto'}`}>
                    {jogo.golsFora ?? 0}
                  </span>
                </div>
                {/* Meu palpite abaixo */}
                {palpiteAtual && (
                  <span className="text-[9px] text-texto/30 mt-1">
                    Meu palpite: {palpiteAtual.golsCasa} × {palpiteAtual.golsFora}
                  </span>
                )}
              </>
            ) : palpitavel && (jaPalpitou && !editando) ? (
              <>
                {/* Palpite feito - modo visualização */}
                <div className="flex items-center gap-2">
                  <div className="w-11 h-12 rounded-lg bg-black/60 border border-primaria/40 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primaria-claro">{palpiteAtual!.golsCasa}</span>
                  </div>
                  <span className="text-sm font-bold text-texto/40">x</span>
                  <div className="w-11 h-12 rounded-lg bg-black/60 border border-primaria/40 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primaria-claro">{palpiteAtual!.golsFora}</span>
                  </div>
                </div>
              </>
            ) : palpitavel ? (
              <>
                {/* Controles estilo caixa com setas laterais */}
                <div className="flex items-center gap-2">
                  {/* Gols Casa */}
                  <div className="flex items-center gap-0.5">
                    <div className={`flex flex-col items-center justify-center gap-1 ${salvando || salvoFeedback ? 'invisible' : ''}`}>
                      <button
                        type="button"
                        onClick={() => alterarGolsCasa(1)}
                        className="text-texto/50 hover:text-texto active:scale-90 transition-all p-1 rounded border border-white/[0.12]"
                      >
                        <ChevronDown size={24} className="rotate-180" />
                      </button>
                      <button
                        type="button"
                        onClick={() => alterarGolsCasa(-1)}
                        className="text-texto/50 hover:text-texto active:scale-90 transition-all p-1 rounded border border-white/[0.12]"
                      >
                        <ChevronDown size={24} />
                      </button>
                    </div>
                    <div className="w-11 h-12 rounded-lg bg-black/60 border border-white/[0.12] flex items-center justify-center">
                      <span className="text-2xl font-bold text-texto">{golsCasa}</span>
                    </div>
                  </div>

                  <span className="text-sm font-bold text-texto/40">x</span>

                  {/* Gols Fora */}
                  <div className="flex items-center gap-0.5">
                    <div className="w-11 h-12 rounded-lg bg-black/60 border border-white/[0.12] flex items-center justify-center">
                      <span className="text-2xl font-bold text-texto">{golsFora}</span>
                    </div>
                    <div className={`flex flex-col items-center justify-center gap-1 ${salvando || salvoFeedback ? 'invisible' : ''}`}>
                      <button
                        type="button"
                        onClick={() => alterarGolsFora(1)}
                        className="text-texto/50 hover:text-texto active:scale-90 transition-all p-1 rounded border border-white/[0.12]"
                      >
                        <ChevronDown size={24} className="rotate-180" />
                      </button>
                      <button
                        type="button"
                        onClick={() => alterarGolsFora(-1)}
                        className="text-texto/50 hover:text-texto active:scale-90 transition-all p-1 rounded border border-white/[0.12]"
                      >
                        <ChevronDown size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <span className="text-[11px] text-texto/40">—</span>
            )}
          </div>

          {/* Time Fora */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="relative h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-white/30 blur-lg" />
              {jogo.timeFora?.escudo ? (
                <img src={jogo.timeFora.escudo} alt={jogo.timeFora.nome} className="relative h-14 w-14 object-contain" />
              ) : (
                <div className="relative h-14 w-14 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
                  {jogo.timeFora?.sigla || '?'}
                </div>
              )}
            </div>
            <span className="text-xs text-texto font-medium truncate max-w-[70px]">
              {jogo.timeFora?.nome || 'Fora'}
            </span>
          </div>
        </div>

        {/* Feedback de status (abaixo dos times, centralizado) */}
        {palpitavel && (
          <div className="mt-1.5 h-5 flex items-center justify-center">
            {salvando ? (
              <span className="flex items-center gap-1 text-[10px] text-primaria-claro">
                <Loader2 size={10} className="animate-spin" />
                Salvando...
              </span>
            ) : salvoFeedback ? (
              <span className="flex items-center gap-1 text-[10px] text-primaria-claro animate-[fadeIn_0.2s_ease-out]">
                <Check size={10} />
                Salvo!
              </span>
            ) : contagem !== null ? (
              <span className="text-[10px] text-primaria-claro">
                Salvando em {contagem}...
              </span>
            ) : !jaPalpitou ? (
              <span className="text-[11px] text-destaque/80">
                ⚠️ Você ainda não palpitou para este jogo!
              </span>
            ) : !editando ? (
              <button
                type="button"
                onClick={() => {
                  onFoco?.();
                  setEditando(true);
                  setGolsCasa(palpiteAtual!.golsCasa);
                  setGolsFora(palpiteAtual!.golsFora);
                  golsRef.current = { golsCasa: palpiteAtual!.golsCasa, golsFora: palpiteAtual!.golsFora };
                }}
                className="text-[10px] text-primaria-claro hover:text-primaria-claro flex items-center gap-1"
              >
                <Pencil size={10} />
                Editar
              </button>
            ) : null}
          </div>
        )}

        {/* Pontuação (jogos finalizados) */}
        {jogo.status === 'FINALIZADO' && palpiteAtual && (
          <div className="flex items-center justify-center mt-2 pt-2 border-t border-white/[0.05]">
            <span className="text-[10px] text-primaria font-semibold">+10 pts</span>
          </div>
        )}

        {/* Seta expandir detalhes */}
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
