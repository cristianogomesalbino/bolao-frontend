'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Loader2, Minus, Plus, Target } from 'lucide-react';
import { buscarMeuPalpite, criarPalpite, atualizarPalpite } from '@/services/palpite.service';
import { Palpite } from '@/types/palpite.types';

interface PalpiteInlineFormProps {
  jogoId: string;
  timeCasaNome: string;
  timeForaNome: string;
  disabled?: boolean;
}

export function PalpiteInlineForm({ jogoId, timeCasaNome, timeForaNome, disabled }: PalpiteInlineFormProps) {
  const queryClient = useQueryClient();
  const [golsCasa, setGolsCasa] = useState(0);
  const [golsFora, setGolsFora] = useState(0);
  const [editando, setEditando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const { data: palpiteExistente, isLoading } = useQuery({
    queryKey: ['meu-palpite', jogoId],
    queryFn: () => buscarMeuPalpite(jogoId),
    enabled: !!jogoId,
  });

  useEffect(() => {
    if (palpiteExistente) {
      setGolsCasa(palpiteExistente.golsCasa);
      setGolsFora(palpiteExistente.golsFora);
    }
  }, [palpiteExistente]);

  const mutationCriar = useMutation({
    mutationFn: () => criarPalpite(jogoId, { golsCasa, golsFora }),
    onSuccess: (data: Palpite) => {
      queryClient.setQueryData(['meu-palpite', jogoId], data);
      setEditando(false);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    },
  });

  const mutationAtualizar = useMutation({
    mutationFn: () => atualizarPalpite(palpiteExistente!.id, { golsCasa, golsFora }),
    onSuccess: (data: Palpite) => {
      queryClient.setQueryData(['meu-palpite', jogoId], data);
      setEditando(false);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    },
  });

  const salvando = mutationCriar.isPending || mutationAtualizar.isPending;
  const jaPalpitou = !!palpiteExistente;
  const modoVisualizacao = jaPalpitou && !editando;

  function salvar() {
    if (jaPalpitou) {
      mutationAtualizar.mutate();
    } else {
      mutationCriar.mutate();
    }
  }

  function incrementar(tipo: 'casa' | 'fora') {
    if (tipo === 'casa') setGolsCasa((v) => v + 1);
    else setGolsFora((v) => v + 1);
  }

  function decrementar(tipo: 'casa' | 'fora') {
    if (tipo === 'casa') setGolsCasa((v) => Math.max(0, v - 1));
    else setGolsFora((v) => Math.max(0, v - 1));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={16} className="animate-spin text-primaria-claro/50" />
      </div>
    );
  }

  if (disabled) {
    if (modoVisualizacao) {
      return (
        <div className="flex flex-col items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
          <span className="text-[10px] text-texto/40">Seu palpite</span>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-texto">{palpiteExistente!.golsCasa}</span>
            <span className="text-[10px] text-texto/30">×</span>
            <span className="text-lg font-bold text-texto">{palpiteExistente!.golsFora}</span>
          </div>
          <span className="text-[9px] text-texto/30">🔒 Palpites encerrados</span>
        </div>
      );
    }
    return null;
  }

  // Modo visualização (já palpitou, não está editando)
  if (modoVisualizacao) {
    return (
      <div className="relative mt-3 pt-3 border-t border-white/[0.05]">
        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center flex-1">
            <span className="text-[9px] text-texto/30 truncate max-w-[60px]">{timeCasaNome}</span>
            <span className="text-2xl font-bold text-texto">{palpiteExistente!.golsCasa}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-texto/40 mb-1">Meu palpite</span>
            <span className="text-[11px] text-texto/20 font-medium">×</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-[9px] text-texto/30 truncate max-w-[60px]">{timeForaNome}</span>
            <span className="text-2xl font-bold text-texto">{palpiteExistente!.golsFora}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="absolute right-0 bottom-0 flex items-center gap-1 text-[10px] text-primaria-claro/70 hover:text-primaria-claro transition-colors"
        >
          <Pencil size={10} />
          Editar
        </button>
      </div>
    );
  }

  // Estado inicial — botão "Fazer palpite"
  if (!jaPalpitou && !aberto) {
    return (
      <div className="mt-3 pt-3 border-t border-white/[0.05]">
        <p className="text-[11px] text-destaque/80 text-center mb-3">⚠️ Você ainda não palpitou para este jogo!</p>
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(30,215,96,0.25)] hover:shadow-[0_0_24px_rgba(30,215,96,0.4)] transition-all active:scale-[0.97]"
        >
          <Target size={16} />
          Fazer palpite
        </button>
      </div>
    );
  }

  // Modo edição / criação
  return (
    <div className="flex flex-col items-center gap-3 mt-3 pt-3 border-t border-white/[0.05]">
      {salvo && (
        <div className="flex items-center gap-1.5 text-primaria text-[11px] font-medium animate-in fade-in">
          <Check size={12} /> Palpite salvo!
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Gols Casa */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-semibold truncate max-w-[80px] text-primaria-claro">{timeCasaNome}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => decrementar('casa')}
              className="h-9 w-9 rounded-full border border-[#22c55e] bg-white/[0.04] hover:bg-primaria/10 flex items-center justify-center text-primaria-claro transition-colors active:scale-90"
              aria-label="Diminuir gols casa"
            >
              <Minus size={16} />
            </button>
            <span className="text-3xl font-bold text-texto w-8 text-center">{golsCasa}</span>
            <button
              type="button"
              onClick={() => incrementar('casa')}
              className="h-9 w-9 rounded-full border border-[#22c55e] bg-white/[0.04] hover:bg-primaria/10 flex items-center justify-center text-primaria-claro transition-colors active:scale-90"
              aria-label="Aumentar gols casa"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <span className="text-[11px] text-texto/20 font-medium mt-4">×</span>

        {/* Gols Fora */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-semibold truncate max-w-[80px] text-primaria-claro">{timeForaNome}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => decrementar('fora')}
              className="h-9 w-9 rounded-full border border-[#22c55e] bg-white/[0.04] hover:bg-primaria/10 flex items-center justify-center text-primaria-claro transition-colors active:scale-90"
              aria-label="Diminuir gols fora"
            >
              <Minus size={16} />
            </button>
            <span className="text-3xl font-bold text-texto w-8 text-center">{golsFora}</span>
            <button
              type="button"
              onClick={() => incrementar('fora')}
              className="h-9 w-9 rounded-full border border-[#22c55e] bg-white/[0.04] hover:bg-primaria/10 flex items-center justify-center text-primaria-claro transition-colors active:scale-90"
              aria-label="Aumentar gols fora"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Botão salvar */}
      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="w-full h-11 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(30,215,96,0.25)] hover:shadow-[0_0_24px_rgba(30,215,96,0.4)] transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {salvando ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Check size={16} />
        )}
        {salvando ? 'Salvando...' : jaPalpitou ? 'Atualizar palpite' : 'Confirmar palpite'}
      </button>

      {/* Cancelar edição */}
      {editando && (
        <button
          type="button"
          onClick={() => {
            setEditando(false);
            setGolsCasa(palpiteExistente!.golsCasa);
            setGolsFora(palpiteExistente!.golsFora);
          }}
          className="text-[10px] text-texto/40 hover:text-texto/60 transition-colors"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
