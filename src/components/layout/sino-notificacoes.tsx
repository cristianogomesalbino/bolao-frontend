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
  const textoContagem = naoLidas > 99 ? '99+' : String(naoLidas);
  const umDigito = naoLidas > 0 && naoLidas < 10;

  return (
    <Link
      href="/notificacoes"
      className="relative inline-flex items-center justify-center p-2 rounded-xl transition-all active:scale-90 text-texto/60 hover:text-texto"
      aria-label={`Notificações${labelNaoLidas}`}
      data-testid="btn-notificacoes"
    >
      <span className="relative inline-flex">
        <Bell size={22} strokeWidth={1.8} />
        {naoLidas > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 flex h-[15px] items-center justify-center rounded-full bg-[#FF0000] text-[10px] font-medium leading-none text-white tabular-nums ring-2 ring-fundo ${
              umDigito ? 'w-[15px]' : 'min-w-[15px] px-1'
            }`}
          >
            {textoContagem}
          </span>
        )}
      </span>
    </Link>
  );
}
