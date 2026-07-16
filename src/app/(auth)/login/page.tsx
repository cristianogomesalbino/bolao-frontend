'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FormularioLogin } from '@/components/auth/formulario-login';
import { useAuthStore } from '@/stores/auth.store';
import { DadosLoginForm } from '@/lib/validacoes';

function LoginPageInner() {
  const login = useAuthStore((state) => state.login);
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  async function aoFazerLogin(dados: DadosLoginForm) {
    await login(dados);
  }

  return <FormularioLogin onSubmit={aoFazerLogin} linkCadastro={redirect ? `/cadastro?redirect=${encodeURIComponent(redirect)}` : '/cadastro'} />;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
