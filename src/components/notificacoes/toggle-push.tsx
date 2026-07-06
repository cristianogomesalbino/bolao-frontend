'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, AlertTriangle } from 'lucide-react';
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
  const [erro, setErro] = useState<string | null>(null);

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
    setErro(null);
    setCarregando(true);

    if (inscrito) {
      const sucesso = await cancelarNotificacoesPush();
      if (!sucesso) { setCarregando(false); return; }
      setInscrito(false);
      localStorage.removeItem('push-banner-dispensado');
      setCarregando(false);
      return;
    }

    const sucesso = await inscreverNotificacoesPush();
    setCarregando(false);

    if (!sucesso) {
      const isHttps = globalThis.location?.protocol === 'https:';
      setErro(
        isHttps
          ? 'Não foi possível ativar. Verifique as permissões do navegador.'
          : 'Notificações push requerem HTTPS. Funcionará em produção.',
      );
      return;
    }

    setInscrito(true);
  }

  if (!suportado) return null;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between p-4">
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
      {erro && (
        <div className="flex items-center gap-2 px-4 pb-3 text-amber-400">
          <AlertTriangle size={14} className="flex-shrink-0" />
          <p className="text-[11px]">{erro}</p>
        </div>
      )}
    </div>
  );
}
