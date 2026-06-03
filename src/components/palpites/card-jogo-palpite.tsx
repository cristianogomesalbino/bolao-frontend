'use client';

import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Star } from 'lucide-react';
import { buscarMeuPalpite, criarPalpite, atualizarPalpite } from '@/services/palpite.service';
import { Jogo } from '@/types/jogo.types';
import { Palpite } from '@/types/palpite.types';

interface PropsCardJogoPalpite {
  jogo: Jogo;
}

export function CardJogoPalpite({ jogo }: Readonly<PropsCardJogoPalpite>) {
  const queryClient = useQueryClient();
  const [golsCasa, setGolsCasa] = useState(0);
  const [golsFora, setGolsFora] = useState(0);
  const [editando, setEditando] = useState(false);
  const [salvoFeedback, setSalvoFeedback] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputsRef = useRef<HTMLDivElement>(null);

  const palpitavel = jogo.status === 'AGENDADO';

  const { data: meuPalpite } = useQuery({
    queryKey: ['meu-palpite', jogo.id],
    queryFn: () => buscarMeuPalpite(jogo.id),
  });

  const jaPalpitou = !!meuPalpite;

  const mutationCriar = useMutation({
    mutationFn: () => criarPalpite(jogo.id, { golsCasa, golsFora }),
    onSuccess: (data: Palpite) => {
      queryClient.setQueryData(['meu-palpite', jogo.id], data);
      setEditando(false);
      mostrarFeedback();
    },
  });

  const mutationAtualizar = useMutation({
    mutationFn: () => atualizarPalpite(meuPalpite!.id, { golsCasa, golsFora }),
    onSuccess: (data: Palpite) => {
      queryClient.setQueryData(['meu-palpite', jogo.id], data);
      setEditando(false);
      mostrarFeedback();
    },
  });

  const salvando = mutationCriar.isPending || mutationAtualizar.isPending;

  function mostrarFeedback() {
    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 2000);
  }

  function salvar() {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      if (inputsRef.current?.contains(document.activeElement)) return;

      if (jaPalpitou) {
        if (golsCasa !== meuPalpite!.golsCasa || golsFora !== meuPalpite!.golsFora) {
          mutationAtualizar.mutate();
        }
      } else {
        mutationCriar.mutate();
      }
    }, 150);
  }

  function iniciarEdicao() {
    if (meuPalpite) {
      setGolsCasa(meuPalpite.golsCasa);
      setGolsFora(meuPalpite.golsFora);
    }
    setEditando(true);
  }

  // Formatar data/hora
  const dataHora = jogo.dataHora
    ? new Date(jogo.dataHora).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }).toUpperCase() + ' • ' + new Date(jogo.dataHora).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
    : '';

  const mostraControles = palpitavel && (!jaPalpitou || editando);
  const mostraPalpiteFeito = palpitavel && jaPalpitou && !editando;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      {/* Data + badges */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-texto/40">{dataHora}</span>
        <div className="flex items-center gap-2">
          {jogo.foiAdiado && (
            <span className="text-[8px] font-bold text-destaque bg-destaque/15 px-1.5 py-0.5 rounded">Jogo chave</span>
          )}
          <Star size={14} className="text-texto/20" />
        </div>
      </div>

      {/* Times + Placar/Controles */}
      <div className="flex items-center">
        {/* Time Casa */}
        <div className="flex flex-col items-center gap-1 w-20">
          {jogo.timeCasa?.escudo ? (
            <img src={jogo.timeCasa.escudo} alt={jogo.timeCasa.nome} className="h-10 w-10 object-contain" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
              {jogo.timeCasa?.sigla || '?'}
            </div>
          )}
          <span className="text-[10px] text-texto/70 font-medium truncate max-w-[70px]">
            {jogo.timeCasa?.nome || 'Casa'}
          </span>
        </div>

        {/* Centro */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {jogo.status === 'FINALIZADO' ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-texto">{jogo.golsCasa}</span>
                <span className="text-[11px] text-texto/30">×</span>
                <span className="text-2xl font-bold text-texto">{jogo.golsFora}</span>
              </div>
              {jogo.temPenaltis && jogo.penaltisCasa != null && jogo.penaltisFora != null && (
                <span className="text-[9px] text-texto/40 mt-0.5">
                  ({jogo.penaltisCasa} × {jogo.penaltisFora} pen.)
                </span>
              )}
            </div>
          ) : jogo.status === 'EM_ANDAMENTO' ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primaria">{jogo.golsCasa ?? 0}</span>
              <span className="text-[11px] text-primaria/50">×</span>
              <span className="text-2xl font-bold text-primaria">{jogo.golsFora ?? 0}</span>
            </div>
          ) : mostraControles ? (
            <div ref={inputsRef} className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={0}
                max={99}
                value={golsCasa}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value, 10);
                  setGolsCasa(Number.isNaN(val) ? 0 : Math.max(0, Math.min(99, val)));
                }}
                onFocus={(e) => e.target.select()}
                onBlur={salvar}
                className="w-10 h-10 rounded-lg bg-black/60 border border-white/[0.1] text-center text-2xl font-bold text-texto outline-none focus:border-primaria focus:ring-1 focus:ring-primaria transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={salvando}
                data-testid="input-gols-casa"
              />

              <span className="text-[11px] text-texto/30">×</span>

              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={0}
                max={99}
                value={golsFora}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value, 10);
                  setGolsFora(Number.isNaN(val) ? 0 : Math.max(0, Math.min(99, val)));
                }}
                onFocus={(e) => e.target.select()}
                onBlur={salvar}
                className="w-10 h-10 rounded-lg bg-black/60 border border-white/[0.1] text-center text-2xl font-bold text-texto outline-none focus:border-primaria focus:ring-1 focus:ring-primaria transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={salvando}
                data-testid="input-gols-fora"
              />

              {/* Feedback */}
              {salvando && <Loader2 size={14} className="animate-spin text-primaria-claro ml-1" />}
              {salvoFeedback && <Check size={14} className="text-primaria-claro ml-1" />}
            </div>
          ) : mostraPalpiteFeito ? (
            <button type="button" onClick={iniciarEdicao} className="flex items-center gap-3 group">
              <span className="text-2xl font-bold text-primaria-claro">{meuPalpite!.golsCasa}</span>
              <span className="text-[11px] text-primaria-claro/50">×</span>
              <span className="text-2xl font-bold text-primaria-claro">{meuPalpite!.golsFora}</span>
              <span className="text-[8px] text-texto/30 group-hover:text-primaria-claro/60 ml-1">✎</span>
            </button>
          ) : (
            <span className="text-sm text-destaque font-medium">Adiado</span>
          )}
        </div>

        {/* Time Fora */}
        <div className="flex flex-col items-center gap-1 w-20">
          {jogo.timeFora?.escudo ? (
            <img src={jogo.timeFora.escudo} alt={jogo.timeFora.nome} className="h-10 w-10 object-contain" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
              {jogo.timeFora?.sigla || '?'}
            </div>
          )}
          <span className="text-[10px] text-texto/70 font-medium truncate max-w-[70px]">
            {jogo.timeFora?.nome || 'Fora'}
          </span>
        </div>
      </div>

      {/* Barra de porcentagem da galera (mock por enquanto) */}
      {palpitavel && (
        <div className="mt-3 pt-2 border-t border-white/[0.05]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-primaria-claro font-medium">—%</span>
            <span className="text-[9px] text-texto/30">da galera</span>
            <span className="text-[9px] text-erro font-medium">—%</span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden flex">
            <div className="h-full bg-primaria" style={{ width: '50%' }} />
            <div className="h-full bg-erro" style={{ width: '50%' }} />
          </div>
        </div>
      )}

      {/* Meu palpite em jogos finalizados */}
      {jogo.status === 'FINALIZADO' && meuPalpite && (
        <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center justify-center gap-2">
          <span className="text-[9px] text-texto/30">Meu palpite:</span>
          <span className="text-[11px] font-medium text-texto/50">{meuPalpite.golsCasa} × {meuPalpite.golsFora}</span>
        </div>
      )}
    </div>
  );
}
