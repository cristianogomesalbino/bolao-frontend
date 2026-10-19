import { GuardAutenticacao } from '@/components/auth/guard-autenticacao';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AtivadorPush } from '@/components/notificacoes/ativador-push';
import { SwUpdater } from '@/components/notificacoes/sw-updater';
import { DicasProvider } from '@/components/dicas/dicas-provider';
import { ToastDescobrilidade } from '@/components/dicas/toast-descobrilidade';

export default function ProtegidoLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <GuardAutenticacao>
      <div className="pb-16">
        {children}
      </div>
      <DicasProvider />
      <ToastDescobrilidade />
      <AtivadorPush />
      <SwUpdater />
      <BottomNav />
    </GuardAutenticacao>
  );
}
