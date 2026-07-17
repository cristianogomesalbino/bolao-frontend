'use client';

import { useState, useEffect } from 'react';
import { Bell, ShieldAlert } from 'lucide-react';
import {
  pushSuportado,
  inscreverNotificacoesPush,
  verificarInscricaoPushAtiva,
} from '@/lib/push-notifications';

const STORAGE_KEY = 'push-banner-dispensado';
const DIAS_COOLDOWN = 7;

function dentroDoCooldow(): boolean {
  const valor = localStorage.getItem(STORAGE_KEY);
  if (!valor) return false;

  const timestamp = Number(valor);
  if (Number.isNaN(timestamp)) return false;

  const diasPassados = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  return diasPassados < DIAS_COOLDOWN;
}

export function BannerPush() {
  const [visivel, setVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      if (!pushSuportado()) return;
      if (Notification.permission === 'denied') return;
      if (dentroDoCooldow()) return;

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
    } else if (Notification.permission === 'denied') {
      // Verifica se o usuário bloqueou no prompt do Chrome
      setBloqueado(true);
    } else {
      dispensar();
    }
  }

  function dispensar() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisivel(false);
    setBloqueado(false);
  }

  if (!visivel && !bloqueado) return null;

  // Estado bloqueado — instruções para desbloquear
  if (bloqueado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-[360px] rounded-2xl border border-amber-500/20 bg-fundo p-6 shadow-[0_8px_40px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-amber-500/15 p-4 mb-4">
              <ShieldAlert size={28} className="text-amber-400" />
            </div>

            <h2 className="text-base font-bold text-texto">
              Notificações bloqueadas
            </h2>

            <p className="text-xs text-texto/50 mt-2 leading-relaxed">
              O navegador bloqueou as notificações. Para ativar, siga os passos:
            </p>

            <ol className="mt-3 text-left text-xs text-texto/60 leading-relaxed list-decimal pl-5 space-y-1.5">
              <li>Toque no ícone de cadeado (🔒) na barra de endereço</li>
              <li>Toque em &quot;Permissões&quot; ou &quot;Configurações do site&quot;</li>
              <li>Ative &quot;Notificações&quot;</li>
              <li>Volte e recarregue a página</li>
            </ol>

            <button
              onClick={dispensar}
              className="mt-5 w-full h-9 rounded-lg text-texto/50 text-xs hover:text-texto/70 transition-colors"
              data-testid="banner-push-dispensar-bloqueado"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  }

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
