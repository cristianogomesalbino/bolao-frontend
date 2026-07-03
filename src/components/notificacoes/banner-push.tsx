'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import {
  pushSuportado,
  inscreverNotificacoesPush,
  verificarInscricaoPushAtiva,
} from '@/lib/push-notifications';

const STORAGE_KEY = 'push-banner-dispensado';

export function BannerPush() {
  const [visivel, setVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      if (!pushSuportado()) return;
      if (Notification.permission === 'denied') return;
      if (localStorage.getItem(STORAGE_KEY)) return;

      const jaInscrito = await verificarInscricaoPushAtiva();
      if (jaInscrito) return;

      // Mostra banner após 3s para não competir com o carregamento inicial
      setTimeout(() => setVisivel(true), 3000);
    };
    verificar();
  }, []);

  async function ativar() {
    setCarregando(true);
    const sucesso = await inscreverNotificacoesPush();
    setCarregando(false);

    if (sucesso) {
      setVisivel(false);
    } else {
      dispensar();
    }
  }

  function dispensar() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-[460px] animate-[fadeIn_0.3s_ease-out]">
      <div className="rounded-2xl border border-primaria/20 bg-fundo/95 backdrop-blur-xl p-4 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
        <button
          onClick={dispensar}
          className="absolute top-3 right-3 text-texto/40 hover:text-texto/70 transition-colors"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5 rounded-full bg-primaria/15 p-2">
            <Bell size={18} className="text-primaria" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-texto">
              Ative as notificações
            </p>
            <p className="text-[11px] text-texto/50 mt-0.5 leading-relaxed">
              Saiba quando o jogo vai começar, veja seus acertos em cheio e não esqueça de palpitar.
            </p>
            <button
              onClick={ativar}
              disabled={carregando}
              className="mt-3 w-full h-9 rounded-lg bg-primaria text-white text-xs font-semibold hover:bg-primaria-claro transition-colors disabled:opacity-50"
              data-testid="banner-push-ativar"
            >
              {carregando ? 'Ativando...' : 'Ativar notificações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
