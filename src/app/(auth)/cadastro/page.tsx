'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormularioCadastro } from '@/components/auth/formulario-cadastro';
import { DadosCadastroForm } from '@/lib/validacoes';
import { criarUsuario } from '@/services/usuario.service';
import { Alert, AlertDescription } from '@/components/ui/alert';

function CadastroPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [sucesso, setSucesso] = useState(false);

  async function aoCriarConta(dados: DadosCadastroForm) {
    await criarUsuario({ nome: dados.nome, email: dados.email, senha: dados.senha });
    setSucesso(true);
    const loginUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
    setTimeout(() => router.replace(loginUrl), 2000);
  }

  if (sucesso) {
    return (
      <Alert className="border-sucesso/50 bg-sucesso/10 text-sucesso">
        <AlertDescription>
          Conta criada com sucesso! Redirecionando para o login...
        </AlertDescription>
      </Alert>
    );
  }

  return <FormularioCadastro onSubmit={aoCriarConta} />;
}

export default function CadastroPage() {
  return (
    <Suspense>
      <CadastroPageInner />
    </Suspense>
  );
}
