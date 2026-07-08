'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
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

      setVisivel(true);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-[360px] rounded-2xl border border-primaria/20 bg-fundo p-6 shadow-[0_8px_40px_rgba(0,0,0,0.8)]">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-primaria/15 p-4 mb-4">
            <Bell size={28} className="text-primaria" />
          </div>

          <h2 className="text-base font-bold text-texto">
            Ative as notificações
          </h2>

          <p className="text-xs text-texto/50 mt-2 leading-relaxed">
            Saiba quando o jogo vai começar, veja seus acertos em cheio e não
            esqueça de palpitar.
          </p>

          <button
            onClick={ativar}
            disabled={carregando}
            className="mt-5 w-full h-10 rounded-lg bg-primaria text-white text-sm font-semibold hover:bg-primaria-claro transition-colors disabled:opacity-50"
            data-testid="banner-push-ativar"
          >
            {carregando ? 'Ativando...' : 'Ativar notificações'}
          </button>

          <button
            onClick={dispensar}
            className="mt-3 w-full h-9 rounded-lg text-texto/50 text-xs hover:text-texto/70 transition-colors"
            data-testid="banner-push-dispensar"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
