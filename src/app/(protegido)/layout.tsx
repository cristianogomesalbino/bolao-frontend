import { GuardAutenticacao } from '@/components/auth/guard-autenticacao';
import { BottomNav } from '@/components/layout/bottom-nav';
import { BannerPush } from '@/components/notificacoes/banner-push';

export default function ProtegidoLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <GuardAutenticacao>
      <div className="pb-16">
        {children}
      </div>
      <BannerPush />
      <BottomNav />
    </GuardAutenticacao>
  );
}
