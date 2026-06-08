'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, User } from 'lucide-react';
import { IconPalpite } from '@/components/icons/icon-palpite';

const itens = [
  { href: '/inicio', label: 'Home', icone: Home },
  { href: '/grupos', label: 'Grupos', icone: Trophy },
  { href: '/palpites', label: 'Palpites', icone: IconPalpite },
  { href: '/minha-conta', label: 'Conta', icone: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-2 safe-area-bottom" data-testid="bottom-nav">
      <div className="mx-auto max-w-[480px] flex items-center justify-around py-2.5 px-2 bg-black/40 backdrop-blur-2xl border border-white/[0.08] rounded-2xl">
        {itens.map((item) => {
          const ativo = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icone = item.icone;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all active:scale-90 ${
                ativo
                  ? 'text-primaria'
                  : 'text-texto/30 hover:text-texto/50'
              }`}
              aria-label={item.label}
              aria-current={ativo ? 'page' : undefined}
              data-testid={`nav-btn-${item.label.toLowerCase()}`}
            >
              <span className="relative">
                {ativo && (
                  <span className="absolute -inset-3 rounded-full bg-primaria/25 blur-xl" />
                )}
                <Icone
                  size={ativo ? 32 : 22}
                  strokeWidth={ativo ? 2.5 : 1.5}
                  className={`relative transition-all duration-200 ${ativo ? 'drop-shadow-[0_0_12px_rgba(22,163,74,0.8)]' : ''}`}
                />
              </span>
              <span className="text-[10px] font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
