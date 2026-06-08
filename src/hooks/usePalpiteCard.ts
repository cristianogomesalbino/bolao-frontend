import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criarPalpite, atualizarPalpite, buscarMeuPalpite } from '@/services/palpite.service';
import { Palpite } from '@/types/palpite.types';

interface UsePalpiteCardOptions {
  jogoId: string;
  grupoId?: string;
  palpiteInicial?: Palpite | null;
}

export function usePalpiteCard({ jogoId, grupoId, palpiteInicial }: UsePalpiteCardOptions) {
  const queryClient = useQueryClient();
  const [golsCasa, setGolsCasa] = useState<number | ''>(palpiteInicial?.golsCasa ?? '');
  const [golsFora, setGolsFora] = useState<number | ''>(palpiteInicial?.golsFora ?? '');
  const [palpiteLocal, setPalpiteLocal] = useState<Palpite | null>(palpiteInicial ?? null);
  const [salvoFeedback, setSalvoFeedback] = useState(false);

  const golsRef = useRef<{ golsCasa: number | null; golsFora: number | null }>({
    golsCasa: palpiteInicial?.golsCasa ?? null,
    golsFora: palpiteInicial?.golsFora ?? null,
  });
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

  function mostrarFeedbackSalvo() {
    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 2000);
  }

  const mutationCriar = useMutation({
    mutationFn: (gols: { golsCasa: number; golsFora: number }) => criarPalpite(jogoId, gols),
    onSuccess: (data: Palpite) => {
      queryClient.setQueryData(['meu-palpite', jogoId], data);
      queryClient.invalidateQueries({ queryKey: ['estatisticas-palpite', grupoId, jogoId] });
      queryClient.invalidateQueries({ queryKey: ['palpites-copa-batch'] });
      setPalpiteLocal(data);
      palpiteRef.current = data;
      mostrarFeedbackSalvo();
    },
    onError: async (error: unknown) => {
      // 409 = palpite já existe — buscar o existente e atualizar
      const status = (error as { statusCode?: number })?.statusCode
        ?? (error as { status?: number })?.status
        ?? (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        const existente = await buscarMeuPalpite(jogoId);
        if (existente) {
          setPalpiteLocal(existente);
          palpiteRef.current = existente;
          queryClient.setQueryData(['meu-palpite', jogoId], existente);
          const gols = golsRef.current;
          if (gols.golsCasa !== null && gols.golsFora !== null &&
              (gols.golsCasa !== existente.golsCasa || gols.golsFora !== existente.golsFora)) {
            mutationAtualizar.mutate({
              palpiteId: existente.id,
              gols: { golsCasa: gols.golsCasa, golsFora: gols.golsFora },
            });
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
      queryClient.setQueryData(['meu-palpite', jogoId], data);
      queryClient.invalidateQueries({ queryKey: ['estatisticas-palpite', grupoId, jogoId] });
      queryClient.invalidateQueries({ queryKey: ['palpites-copa-batch'] });
      setPalpiteLocal(data);
      palpiteRef.current = data;
      mostrarFeedbackSalvo();
    },
  });

  const salvando = mutationCriar.isPending || mutationAtualizar.isPending;

  function salvar() {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      // Se o foco está em outro input dentro do mesmo container, não salvar ainda
      // Verifica de forma segura para evitar inconsistências no mobile
      const activeEl = document.activeElement;
      const containerEl = inputsRef.current;
      if (containerEl && activeEl && containerEl.contains(activeEl) && activeEl.tagName === 'INPUT') {
        return;
      }

      const gols = golsRef.current;

      // Guard: não salvar se algum campo está vazio/null
      if (gols.golsCasa === null || gols.golsFora === null) return;

      const golsValidados = { golsCasa: gols.golsCasa, golsFora: gols.golsFora };

      // Fonte de verdade: ref > cache > nada
      const palpite = palpiteRef.current
        ?? queryClient.getQueryData<Palpite | null>(['meu-palpite', jogoId])
        ?? null;

      // Sincronizar se encontrou no cache mas não no ref
      if (palpite && !palpiteRef.current) {
        palpiteRef.current = palpite;
        setPalpiteLocal(palpite);
      }

      if (palpite) {
        if (golsValidados.golsCasa !== palpite.golsCasa || golsValidados.golsFora !== palpite.golsFora) {
          mutationAtualizar.mutate({ palpiteId: palpite.id, gols: golsValidados });
        }
      } else {
        mutationCriar.mutate(golsValidados);
      }
    }, 80);
  }

  function handleSetGolsCasa(valor: number | '') {
    setGolsCasa(valor);
    golsRef.current = { ...golsRef.current, golsCasa: valor === '' ? null : valor };
  }

  function handleSetGolsFora(valor: number | '') {
    setGolsFora(valor);
    golsRef.current = { ...golsRef.current, golsFora: valor === '' ? null : valor };
  }

  return {
    golsCasa,
    golsFora,
    palpiteAtual,
    jaPalpitou,
    salvando,
    salvoFeedback,
    inputsRef,
    handleSetGolsCasa,
    handleSetGolsFora,
    salvar,
  };
}
