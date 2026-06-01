'use client';

import { FormularioLogin } from '@/components/auth/formulario-login';
import { useAuthStore } from '@/stores/auth.store';
import { DadosLoginForm } from '@/lib/validacoes';

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);

  async function aoFazerLogin(dados: DadosLoginForm) {
    await login(dados);
    // Redirect é feito pelo AuthLayout ao detectar estaAutenticado = true
  }

  return <FormularioLogin onSubmit={aoFazerLogin} />;
}
