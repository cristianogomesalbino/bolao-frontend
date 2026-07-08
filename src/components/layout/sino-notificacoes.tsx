'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { contarNaoLidas } from '@/services/notificacao.service';

export function SinoNotificacoes() {
  const { data } = useQuery({
    queryKey: ['notificacoes', 'contagem'],
    queryFn: contarNaoLidas,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const naoLidas: number = typeof data === 'number' ? data : 0;
  const labelNaoLidas = naoLidas > 0 ? ` (${String(naoLidas)} não lidas)` : '';

  return (
    <Link
      href="/notificacoes"
      className="relative p-2 rounded-xl transition-all active:scale-90 text-texto/60 hover:text-texto"
      aria-label={`Notificações${labelNaoLidas}`}
      data-testid="btn-notificacoes"
    >
      <Bell size={22} strokeWidth={1.8} />
      {naoLidas > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse"
        >
          {naoLidas > 99 ? '99+' : String(naoLidas)}
        </span>
      )}
    </Link>
  );
}
