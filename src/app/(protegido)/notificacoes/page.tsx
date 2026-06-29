'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Loader2, Settings, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  listarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
} from '@/services/notificacao.service';
import type { Notificacao, StatusNotificacao } from '@/types/notificacao.types';

const LIMITE = 20;

function formatarDataRelativa(dataStr: string): string {
  const data = new Date(dataStr);
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${String(diffMin)}min atrás`;

  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `${String(diffHoras)}h atrás`;

  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias < 7) return `${String(diffDias)}d atrás`;

  return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function iconeNotificacao(tipo: string): string {
  const icones: Record<string, string> = {
    JOGO_PROXIMO: '⏰',
    RODADA_ENCERRADA: '🏁',
    ACERTO_EM_CHEIO: '🎯',
    SUBIU_POSICAO: '📈',
    DESCEU_POSICAO: '📉',
    PALPITES_PENDENTES: '📝',
  };
  return icones[tipo] ?? '🔔';
}

export default function NotificacoesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [filtro, setFiltro] = useState<StatusNotificacao | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['notificacoes', 'lista', offset, filtro],
    queryFn: () => listarNotificacoes(LIMITE, offset, filtro),
    staleTime: 10 * 1000,
  });

  const mutationLida = useMutation({
    mutationFn: marcarComoLida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });

  const mutationTodasLidas = useMutation({
    mutationFn: marcarTodasComoLidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });

  const notificacoes = data?.notificacoes ?? [];
  const total = data?.total ?? 0;
  const naoLidas = data?.naoLidas ?? 0;
  const temMais = offset + LIMITE < total;

  return (
    <div className="min-h-screen bg-fundo pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-fundo/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-primaria" />
            <h1 className="text-lg font-bold text-texto">Notificações</h1>
            {naoLidas > 0 && (
              <span className="bg-red-500/20 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                {String(naoLidas)}
              </span>
            )}
          </div>
          {naoLidas > 0 && (
            <button
              onClick={() => mutationTodasLidas.mutate()}
              disabled={mutationTodasLidas.isPending}
              className="flex items-center gap-1 text-xs text-primaria hover:text-primaria-claro transition-colors"
              data-testid="btn-marcar-todas-lidas"
            >
              <CheckCheck size={14} />
              <span>Marcar todas</span>
            </button>
          )}
          <Link
            href="/notificacoes/preferencias"
            className="p-1.5 rounded-lg text-texto/40 hover:text-texto/70 transition-colors"
            aria-label="Preferências de notificação"
          >
            <Settings size={18} />
          </Link>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mt-3">
          {(['todas', 'NAO_LIDA', 'LIDA'] as const).map((f) => {
            const ativo =
              f === 'todas' ? filtro === undefined : filtro === f;
            return (
              <button
                key={f}
                onClick={() => {
                  setFiltro(f === 'todas' ? undefined : f);
                  setOffset(0);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  ativo
                    ? 'bg-primaria/20 text-primaria'
                    : 'bg-white/[0.05] text-texto/50 hover:text-texto/70'
                }`}
              >
                {f === 'todas' && 'Todas'}
                {f === 'NAO_LIDA' && 'Não lidas'}
                {f === 'LIDA' && 'Lidas'}
              </button>
            );
          })}
        </div>
      </header>

      {/* Conteúdo */}
      <div className="px-4 py-3">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-primaria" />
          </div>
        )}

        {!isLoading && notificacoes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-texto/40">
            <Bell size={48} strokeWidth={1} />
            <p className="mt-3 text-sm">Nenhuma notificação</p>
          </div>
        )}

        {!isLoading && notificacoes.length > 0 && (
          <div className="space-y-2">
            {notificacoes.map((n) => (
              <NotificacaoCard
                key={n.id}
                notificacao={n}
                onMarcarLida={() => mutationLida.mutate(n.id)}
                onNavegar={(url) => router.push(url)}
              />
            ))}
          </div>
        )}

        {/* Paginação */}
        {total > LIMITE && (
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setOffset(Math.max(0, offset - LIMITE))}
              disabled={offset === 0}
              className="px-4 py-2 rounded-lg bg-white/[0.05] text-texto/60 text-sm disabled:opacity-30"
            >
              Anterior
            </button>
            <button
              onClick={() => setOffset(offset + LIMITE)}
              disabled={!temMais}
              className="px-4 py-2 rounded-lg bg-white/[0.05] text-texto/60 text-sm disabled:opacity-30"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface PropsNotificacaoCard {
  readonly notificacao: Notificacao;
  readonly onMarcarLida: () => void;
  readonly onNavegar: (url: string) => void;
}

function obterUrlNotificacao(notificacao: Notificacao): string | null {
  const { tipo, grupoId, jogoId } = notificacao;

  switch (tipo) {
    case 'JOGO_PROXIMO':
    case 'PALPITES_PENDENTES':
      return grupoId ? `/grupos/${grupoId}?aba=palpites` : '/palpites';
    case 'ACERTO_EM_CHEIO':
      if (grupoId) return `/grupos/${grupoId}?aba=palpites&jogoId=${jogoId ?? ''}`;
      return '/palpites';
    case 'RODADA_ENCERRADA':
    case 'SUBIU_POSICAO':
    case 'DESCEU_POSICAO':
      return grupoId ? `/grupos/${grupoId}` : null;
    default:
      return null;
  }
}

function NotificacaoCard({ notificacao, onMarcarLida, onNavegar }: PropsNotificacaoCard) {
  const naoLida = notificacao.status === 'NAO_LIDA';
  const url = obterUrlNotificacao(notificacao);

  function aoClicar() {
    if (naoLida) onMarcarLida();
    if (url) onNavegar(url);
  }

  return (
    <button
      type="button"
      className={`relative w-full text-left p-3 rounded-xl border transition-colors ${
        naoLida
          ? 'bg-primaria/[0.04] border-primaria/20'
          : 'bg-white/[0.02] border-white/[0.06]'
      } ${url ? 'cursor-pointer hover:bg-white/[0.04]' : ''}`}
      onClick={aoClicar}
      data-testid="card-notificacao"
    >
      <div className="flex gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">
          {iconeNotificacao(notificacao.tipo)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-sm font-semibold ${naoLida ? 'text-texto' : 'text-texto/60'}`}
            >
              {notificacao.titulo}
            </h3>
            {naoLida && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onMarcarLida();
                }}
                className="flex-shrink-0 p-1 rounded-md text-texto/30 hover:text-primaria transition-colors cursor-pointer"
                aria-label="Marcar como lida"
                data-testid="btn-marcar-lida"
              >
                <Check size={14} />
              </span>
            )}
          </div>
          <p
            className={`text-xs mt-0.5 ${naoLida ? 'text-texto/70' : 'text-texto/40'}`}
          >
            {notificacao.mensagem}
          </p>
          <span className="text-[10px] text-texto/30 mt-1 block">
            {formatarDataRelativa(notificacao.dataCriacao)}
          </span>
        </div>
        {url && (
          <ChevronRight size={14} className="text-texto/20 flex-shrink-0 self-center" />
        )}
      </div>
      {naoLida && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primaria" />
      )}
    </button>
  );
}
