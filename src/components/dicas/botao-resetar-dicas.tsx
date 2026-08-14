'use client';

import { useState } from 'react';
import { HelpCircle, Loader2 } from 'lucide-react';
import { useDicasStore } from '@/stores/dicas.store';

export function BotaoResetarDicas() {
  const resetarTodas = useDicasStore((s) => s.resetarTodas);
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleReset() {
    setCarregando(true);
    try {
      await resetarTodas();
      setSucesso(true);
      setTimeout(() => setSucesso(false), 2000);
    } catch {
      // falha silenciosa — o store não limpa se API falhar
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={carregando}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-texto/60 hover:text-texto/80 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all disabled:opacity-50"
      data-testid="btn-resetar-dicas"
    >
      {carregando ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <HelpCircle size={18} />
      )}
      <span className="text-sm font-semibold">
        {sucesso ? 'Dicas resetadas!' : 'Resetar dicas de ajuda'}
      </span>
    </button>
  );
}
