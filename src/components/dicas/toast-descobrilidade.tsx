'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useDicasStore } from '@/stores/dicas.store';
import apiClient from '@/lib/api-client';

const DURACAO_TOAST = 5000;

export function ToastDescobrilidade() {
  const usuario = useAuthStore((s) => s.usuario);
  const atualizarUsuario = useAuthStore((s) => s.atualizarUsuario);
  const dicasDispensadas = useDicasStore((s) => s.dicasDispensadas);

  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    if (usuario.toastDescobrilidadeVisto) return;
    if (dicasDispensadas.size > 0) return;
    if ((usuario.toursCompletos?.length ?? 0) > 0) return;

    setVisivel(true);

    // Marcar como visto no backend (fire-and-forget)
    apiClient.patch('/usuarios/me', { toastDescobrilidadeVisto: true }).catch(() => {});
    atualizarUsuario({ toastDescobrilidadeVisto: true });

    const timer = setTimeout(() => setVisivel(false), DURACAO_TOAST);
    return () => clearTimeout(timer);
  }, [usuario, dicasDispensadas, atualizarUsuario]);

  if (!visivel) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9990] max-w-[320px] w-[calc(100%-32px)] animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-primaria/30 bg-[#0f1a2e]/95 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
        <span className="text-lg shrink-0">💡</span>
        <p className="text-xs text-texto/80 leading-relaxed">
          Procure as <span className="text-primaria-claro font-semibold">bolinhas verdes</span> para
          dicas sobre cada funcionalidade.
        </p>
        <button
          type="button"
          onClick={() => setVisivel(false)}
          className="text-texto/40 hover:text-texto/70 text-lg shrink-0 ml-auto"
          aria-label="Fechar dica"
        >
          ×
        </button>
      </div>
    </div>
  );
}
