'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import {
  pushSuportado,
  inscreverNotificacoesPush,
  cancelarNotificacoesPush,
  verificarInscricaoPushAtiva,
} from '@/lib/push-notifications';

export function TogglePush() {
  const [inscrito, setInscrito] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [suportado, setSuportado] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      const suporte = pushSuportado();
      setSuportado(suporte);
      if (suporte) {
        const ativo = await verificarInscricaoPushAtiva();
        setInscrito(ativo);
      }
      setCarregando(false);
    };
    verificar();
  }, []);

  async function alternar() {
    setCarregando(true);
    if (inscrito) {
      const sucesso = await cancelarNotificacoesPush();
      if (sucesso) setInscrito(false);
    } else {
      const sucesso = await inscreverNotificacoesPush();
      if (sucesso) setInscrito(true);
    }
    setCarregando(false);
  }

  if (!suportado) return null;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <div className="flex items-center gap-3">
        {inscrito ? (
          <Bell size={18} className="text-primaria" />
        ) : (
          <BellOff size={18} className="text-texto/40" />
        )}
        <div>
          <p className="text-sm font-medium text-texto">
            Notificações push
          </p>
          <p className="text-[10px] text-texto/40">
            {inscrito ? 'Ativado — você receberá alertas' : 'Desativado'}
          </p>
        </div>
      </div>
      <button
        onClick={alternar}
        disabled={carregando}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          inscrito ? 'bg-primaria' : 'bg-white/10'
        } ${carregando ? 'opacity-50' : ''}`}
        aria-label={inscrito ? 'Desativar push' : 'Ativar push'}
        data-testid="toggle-push"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            inscrito ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
