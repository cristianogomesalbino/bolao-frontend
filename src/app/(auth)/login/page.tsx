'use client';

import { useRouter } from 'next/navigation';
import { FormularioLogin } from '@/components/auth/formulario-login';
import { useAuthStore } from '@/stores/auth.store';
import { DadosLoginForm } from '@/lib/validacoes';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  async function aoFazerLogin(dados: DadosLoginForm) {
    await login(dados);
    router.replace('/inicio');
  }

  return <FormularioLogin onSubmit={aoFazerLogin} />;
}
