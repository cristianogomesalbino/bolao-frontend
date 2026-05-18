'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Trophy, CircleDot, User } from 'lucide-react';

const itens = [
  { href: '/inicio', label: 'Home', icone: Home },
  { href: '/grupos', label: 'Grupos', icone: Trophy },
  { href: '/jogos', label: 'Jogos', icone: CircleDot },
  { href: '/minha-conta', label: 'Conta', icone: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-2 safe-area-bottom" data-testid="bottom-nav">
      <div className="mx-auto max-w-[480px] flex items-center justify-around py-2.5 px-2 bg-black/40 backdrop-blur-2xl border border-white/[0.08] rounded-2xl">
        {itens.map((item) => {
          const ativo = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icone = item.icone;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all active:scale-90 ${
                ativo
                  ? 'text-primaria'
                  : 'text-texto/30 hover:text-texto/50'
              }`}
              aria-label={item.label}
              aria-current={ativo ? 'page' : undefined}
              data-testid={`nav-btn-${item.label.toLowerCase()}`}
            >
              {ativo && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primaria shadow-[0_0_6px_rgba(22,163,74,0.6)]" />
              )}
              <Icone size={20} strokeWidth={ativo ? 2.5 : 1.5} />
              <span className={`text-[10px] ${ativo ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
