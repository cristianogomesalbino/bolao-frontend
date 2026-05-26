'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Loader2, Minus, Plus } from 'lucide-react';
import { buscarMeuPalpite, criarPalpite, atualizarPalpite } from '@/services/palpite.service';
import { ClassificacaoTime } from '@/services/classificacao.service';
import { Card, CardContent } from '@/components/ui/card';
import { Jogo } from '@/types/jogo.types';
import { Palpite } from '@/types/palpite.types';

interface PropsCardJogoPalpite {
  jogo: Jogo;
  classificacao?: ClassificacaoTime[];
  palpitavel?: boolean;
}

export function CardJogoPalpite({ jogo, classificacao, palpitavel }: Readonly<PropsCardJogoPalpite>) {
  const queryClient = useQueryClient();
  const [golsCasa, setGolsCasa] = useState(0);
  const [golsFora, setGolsFora] = useState(0);
  const [editando, setEditando] = useState(false);
  const [expandido, setExpandido] = useState(false);

  const { data: meuPalpite } = useQuery({
    queryKey: ['meu-palpite', jogo.id],
    queryFn: () => buscarMeuPalpite(jogo.id),
  });

  const jaPalpitou = !!meuPalpite;

  useEffect(() => {
    if (meuPalpite) {
      setGolsCasa(meuPalpite.golsCasa);
      setGolsFora(meuPalpite.golsFora);
    }
  }, [meuPalpite]);

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

  // Formatar data/hora centralizado
  const dataHoraFormatada = jogo.dataHora
    ? new Date(jogo.dataHora).toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo'
      }).toUpperCase().replace('.', '') + ' • ' +
      new Date(jogo.dataHora).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
      })
    : '';

  return (
    <Card>
      <CardContent className="p-3">
        {/* Data/hora centralizada + indicação de status */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-[9px] text-texto/40 uppercase tracking-wide">{dataHoraFormatada}</span>
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

          {/* Centro: Placar final (se finalizado) ou Palpite (se agendado) */}
          <div className="flex flex-col items-center shrink-0">
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
                {meuPalpite && (
                  <span className="text-[9px] text-texto/30 mt-1">
                    Meu palpite: {meuPalpite.golsCasa} × {meuPalpite.golsFora}
                  </span>
                )}
              </>
            ) : palpitavel && (jaPalpitou && !editando) ? (
              <>
                {/* Palpite feito - modo visualização */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primaria-claro">{meuPalpite!.golsCasa}</span>
                  <span className="text-[10px] text-texto/20">×</span>
                  <span className="text-2xl font-bold text-primaria-claro">{meuPalpite!.golsFora}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setEditando(true); setGolsCasa(meuPalpite!.golsCasa); setGolsFora(meuPalpite!.golsFora); }}
                  className="text-[9px] text-primaria-claro/60 hover:text-primaria-claro mt-1"
                >
                  Editar
                </button>
              </>
            ) : palpitavel ? (
              <>
                {/* Controles +/- */}
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setGolsCasa((v) => Math.max(0, v - 1))} className="h-6 w-6 rounded-full border border-primaria/40 flex items-center justify-center text-primaria-claro active:scale-90">
                    <Minus size={10} />
                  </button>
                  <span className="text-xl font-bold text-texto w-5 text-center">{golsCasa}</span>
                  <button type="button" onClick={() => setGolsCasa((v) => v + 1)} className="h-6 w-6 rounded-full border border-primaria/40 flex items-center justify-center text-primaria-claro active:scale-90">
                    <Plus size={10} />
                  </button>

                  <span className="text-[9px] text-texto/20 mx-0.5">×</span>

                  <button type="button" onClick={() => setGolsFora((v) => Math.max(0, v - 1))} className="h-6 w-6 rounded-full border border-primaria/40 flex items-center justify-center text-primaria-claro active:scale-90">
                    <Minus size={10} />
                  </button>
                  <span className="text-xl font-bold text-texto w-5 text-center">{golsFora}</span>
                  <button type="button" onClick={() => setGolsFora((v) => v + 1)} className="h-6 w-6 rounded-full border border-primaria/40 flex items-center justify-center text-primaria-claro active:scale-90">
                    <Plus size={10} />
                  </button>
                </div>
                {/* Botão salvar */}
                <button
                  type="button"
                  onClick={salvar}
                  disabled={salvando}
                  className="mt-1.5 h-6 px-3 rounded-md bg-primaria/20 text-primaria-claro text-[9px] font-semibold flex items-center gap-1 hover:bg-primaria/30 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {salvando ? <Loader2 size={9} className="animate-spin" /> : <Check size={9} />}
                  {jaPalpitou ? 'Salvar' : 'Confirmar'}
                </button>
              </>
            ) : (
              <span className="text-[11px] text-destaque font-semibold">Adiado</span>
            )}
          </div>

          {/* Time Fora */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
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

        {/* Pontuação (jogos finalizados) */}
        {jogo.status === 'FINALIZADO' && meuPalpite && (
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
          <ChevronDown size={14} className={`text-texto/20 transition-transform ${expandido ? 'rotate-180' : ''}`} />
        </button>

        {/* Detalhes expandidos */}
        {expandido && (
          <div className="mt-2 pt-2 border-t border-white/[0.05] text-center">
            <p className="text-[10px] text-texto/30">
              {jogo.timeCasa?.nome} vs {jogo.timeFora?.nome}
            </p>
            {jogo.rodada && <p className="text-[9px] text-texto/20">Rodada {jogo.rodada}</p>}
            {jogo.foiAdiado && <p className="text-[9px] text-destaque/60">⚠ Jogo remarcado</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
