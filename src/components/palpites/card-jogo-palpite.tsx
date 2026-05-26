'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronUp, ChevronDown, Loader2, Star } from 'lucide-react';
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
    },
  });

  const mutationAtualizar = useMutation({
    mutationFn: () => atualizarPalpite(meuPalpite!.id, { golsCasa, golsFora }),
    onSuccess: (data: Palpite) => {
      queryClient.setQueryData(['meu-palpite', jogo.id], data);
      setEditando(false);
    },
  });

  const salvando = mutationCriar.isPending || mutationAtualizar.isPending;

  function salvar() {
    if (jaPalpitou) mutationAtualizar.mutate();
    else mutationCriar.mutate();
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
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-texto">{jogo.golsCasa}</span>
              <span className="text-[11px] text-texto/30">×</span>
              <span className="text-2xl font-bold text-texto">{jogo.golsFora}</span>
            </div>
          ) : jogo.status === 'EM_ANDAMENTO' ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primaria">{jogo.golsCasa ?? 0}</span>
              <span className="text-[11px] text-primaria/50">×</span>
              <span className="text-2xl font-bold text-primaria">{jogo.golsFora ?? 0}</span>
            </div>
          ) : mostraControles ? (
            <div className="flex items-center gap-2">
              {/* Controle Casa */}
              <div className="flex flex-col items-center">
                <button type="button" onClick={() => setGolsCasa((v) => v + 1)} className="text-texto/40 hover:text-primaria-claro">
                  <ChevronUp size={14} />
                </button>
                <span className="text-2xl font-bold text-texto w-8 text-center border border-white/[0.1] rounded-lg py-0.5">{golsCasa}</span>
                <button type="button" onClick={() => setGolsCasa((v) => Math.max(0, v - 1))} className="text-texto/40 hover:text-primaria-claro">
                  <ChevronDown size={14} />
                </button>
              </div>

              <span className="text-[11px] text-texto/30">×</span>

              {/* Controle Fora */}
              <div className="flex flex-col items-center">
                <button type="button" onClick={() => setGolsFora((v) => v + 1)} className="text-texto/40 hover:text-primaria-claro">
                  <ChevronUp size={14} />
                </button>
                <span className="text-2xl font-bold text-texto w-8 text-center border border-white/[0.1] rounded-lg py-0.5">{golsFora}</span>
                <button type="button" onClick={() => setGolsFora((v) => Math.max(0, v - 1))} className="text-texto/40 hover:text-primaria-claro">
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Botão salvar */}
              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="ml-2 h-8 w-8 rounded-full bg-primaria/20 flex items-center justify-center text-primaria-claro hover:bg-primaria/30 disabled:opacity-50 active:scale-90 transition-all"
              >
                {salvando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
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
