import { GuardAutenticacao } from '@/components/auth/guard-autenticacao';

export default function ProtegidoLayout({ children }: { readonly children: React.ReactNode }) {
  return <GuardAutenticacao>{children}</GuardAutenticacao>;
}
