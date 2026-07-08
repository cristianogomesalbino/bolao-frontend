'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Trophy, Target, TrendingUp, TrendingDown, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  buscarPreferencias,
  atualizarPreferencias,
} from '@/services/notificacao.service';
import { TogglePush } from '@/components/notificacoes/toggle-push';
import type { PreferenciaNotificacao } from '@/types/notificacao.types';

interface ItemPreferencia {
  campo: keyof PreferenciaNotificacao;
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
}

const ITENS_PREFERENCIA: ItemPreferencia[] = [
  {
    campo: 'jogoProximo',
    titulo: 'Jogo próximo',
    descricao: '10 minutos antes do início',
    icone: <Clock size={18} className="text-amber-400" />,
  },
  {
    campo: 'rodadaEncerrada',
    titulo: 'Rodada encerrada',
    descricao: 'Quando todos os jogos da rodada terminam',
    icone: <Trophy size={18} className="text-yellow-400" />,
  },
  {
    campo: 'acertoEmCheio',
    titulo: 'Acerto em cheio',
    descricao: 'Quando você acerta o placar exato',
    icone: <Target size={18} className="text-green-400" />,
  },
  {
    campo: 'subiuPosicao',
    titulo: 'Subiu no ranking',
    descricao: 'Quando sua posição melhora',
    icone: <TrendingUp size={18} className="text-emerald-400" />,
  },
  {
    campo: 'desceuPosicao',
    titulo: 'Desceu no ranking',
    descricao: 'Quando sua posição piora',
    icone: <TrendingDown size={18} className="text-red-400" />,
  },
  {
    campo: 'palpitesPendentes',
    titulo: 'Palpites pendentes',
    descricao: 'Lembrete antes da rodada começar',
    icone: <Bell size={18} className="text-blue-400" />,
  },
  {
    campo: 'jogoLiberado',
    titulo: 'Jogo liberado',
    descricao: 'Quando um confronto é definido no mata-mata',
    icone: <Bell size={18} className="text-cyan-400" />,
  },
];

export default function PreferenciasNotificacaoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [preferencias, setPreferencias] = useState<PreferenciaNotificacao | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notificacoes', 'preferencias'],
    queryFn: buscarPreferencias,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (data) setPreferencias(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (dados: Partial<PreferenciaNotificacao>) =>
      atualizarPreferencias(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes', 'preferencias'] });
    },
  });

  function alternarPreferencia(campo: keyof PreferenciaNotificacao) {
    if (!preferencias) return;
    const novoValor = !preferencias[campo];
    setPreferencias({ ...preferencias, [campo]: novoValor });
    mutation.mutate({ [campo]: novoValor });
  }

  return (
    <div className="min-h-screen bg-fundo pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 bg-fundo/80 backdrop-blur-xl border-b border-white/[0.06]">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg text-texto/60 hover:text-texto transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-texto">Preferências</h1>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-4 space-y-4">
        {/* Push notifications toggle */}
        <TogglePush />

        {/* Seção de tipos */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h2 className="text-xs font-semibold text-texto/50 uppercase tracking-wider">
              Tipos de notificação
            </h2>
          </div>

          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primaria" />
            </div>
          )}

          {!isLoading && preferencias && (
            <div className="divide-y divide-white/[0.04]">
              {ITENS_PREFERENCIA.map((item) => (
                <div
                  key={item.campo}
                  className="flex items-center justify-between px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0">{item.icone}</span>
                    <div>
                      <p className="text-sm font-medium text-texto">
                        {item.titulo}
                      </p>
                      <p className="text-[10px] text-texto/40">
                        {item.descricao}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => alternarPreferencia(item.campo)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      preferencias[item.campo] ? 'bg-primaria' : 'bg-white/10'
                    }`}
                    aria-label={`${preferencias[item.campo] ? 'Desativar' : 'Ativar'} ${item.titulo}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        preferencias[item.campo] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nota informativa */}
        <p className="text-[10px] text-texto/30 text-center px-4">
          As notificações in-app sempre aparecem no sino. As preferências acima controlam
          apenas se você recebe alertas push no navegador.
        </p>
      </div>
    </div>
  );
}
