'use client';

import { useSearchParams } from 'next/navigation';
import { FormularioLogin } from '@/components/auth/formulario-login';
import { useAuthStore } from '@/stores/auth.store';
import { DadosLoginForm } from '@/lib/validacoes';

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  async function aoFazerLogin(dados: DadosLoginForm) {
    await login(dados);
    // Redirect é feito pelo AuthLayout ao detectar estaAutenticado = true
    // O redirect param é lido lá para determinar o destino
  }

  return <FormularioLogin onSubmit={aoFazerLogin} linkCadastro={redirect ? `/cadastro?redirect=${encodeURIComponent(redirect)}` : '/cadastro'} />;
}
