'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, AlertTriangle, ShieldAlert } from 'lucide-react';
import {
  pushSuportado,
  inscreverNotificacoesPush,
  cancelarNotificacoesPush,
  verificarInscricaoPushAtiva,
  testarNotificacaoLocal,
} from '@/lib/push-notifications';

export function TogglePush() {
  const [inscrito, setInscrito] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [suportado, setSuportado] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const verificar = async () => {
      const suporte = pushSuportado();
      setSuportado(suporte);

      if (!suporte) {
        setCarregando(false);
        return;
      }

      if (Notification.permission === 'denied') {
        setBloqueado(true);
        setCarregando(false);
        return;
      }

      const ativo = await verificarInscricaoPushAtiva();
      setInscrito(ativo);
      setCarregando(false);
    };
    verificar();
  }, []);

  async function testarLocal() {
    setErro(null);
    setInfo(null);
    setCarregando(true);
    const resultado = await testarNotificacaoLocal();
    setCarregando(false);
    if (resultado.ok) {
      setInfo('Alerta local enviado — confira a notificação do sistema.');
      return;
    }
    if (Notification.permission === 'denied') {
      setBloqueado(true);
      return;
    }
    setErro(resultado.motivo);
  }

  async function alternar() {
    setErro(null);
    setInfo(null);
    setCarregando(true);

    if (inscrito) {
      const sucesso = await cancelarNotificacoesPush();
      if (!sucesso) { setCarregando(false); return; }
      setInscrito(false);
      setCarregando(false);
      return;
    }

    if (Notification.permission === 'denied') {
      setBloqueado(true);
      setCarregando(false);
      return;
    }

    const resultado = await inscreverNotificacoesPush();
    setCarregando(false);

    if (resultado.ok) {
      setInscrito(true);
      return;
    }

    if ((Notification.permission as NotificationPermission) === 'denied') {
      setBloqueado(true);
      return;
    }

    setErro(resultado.motivo);
  }

  if (!suportado) return null;

  // Estado bloqueado — mostra instruções para desbloquear
  if (bloqueado) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <ShieldAlert size={18} className="text-amber-400 flex-shrink-0" />
            <p className="text-sm font-medium text-texto">
              Notificações bloqueadas
            </p>
          </div>
          <p className="text-xs text-texto/60 leading-relaxed">
            As notificações foram bloqueadas nas configurações do navegador.
            Para ativar:
          </p>
          <ol className="mt-2 ml-4 text-xs text-texto/50 leading-relaxed list-decimal space-y-1">
            <li>Toque no ícone de cadeado (🔒) na barra de endereço</li>
            <li>Toque em &quot;Permissões&quot; ou &quot;Configurações do site&quot;</li>
            <li>Ative &quot;Notificações&quot;</li>
            <li>Volte e recarregue a página</li>
          </ol>
        </div>
      </div>
    );
  }

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
        <div className="space-y-2 px-4 pb-3">
          <div className="flex items-start gap-2 text-amber-400">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <p className="text-[11px] leading-relaxed">{erro}</p>
          </div>
          <button
            type="button"
            onClick={() => void testarLocal()}
            disabled={carregando}
            className="text-[11px] font-medium text-primaria underline-offset-2 hover:underline disabled:opacity-50"
            data-testid="btn-testar-notificacao-local"
          >
            Testar alerta local (sem FCM)
          </button>
        </div>
      )}
      {info && !erro && (
        <p className="px-4 pb-3 text-[11px] text-emerald-400">{info}</p>
      )}
    </div>
  );
}
