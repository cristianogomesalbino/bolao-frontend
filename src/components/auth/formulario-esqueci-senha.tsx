'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { schemaEsqueciSenha, DadosEsqueciSenhaForm } from '@/lib/validacoes';
import { esqueciSenha } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function FormularioEsqueciSenha() {
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosEsqueciSenhaForm>({
    resolver: zodResolver(schemaEsqueciSenha),
  });

  async function aoEnviar(dados: DadosEsqueciSenhaForm) {
    try {
      await esqueciSenha(dados.email);
    } catch {
      // Always show success message to prevent email enumeration
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert className="border-sucesso/50 bg-sucesso/10 text-sucesso">
            <AlertDescription>
              Se o email estiver cadastrado, você receberá instruções para recuperar sua senha.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-primaria hover:underline">
            Voltar ao login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="mb-4 text-sm text-texto/70">
          Informe seu email e enviaremos instruções para recuperar sua senha.
        </p>
        <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="seu@email.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-erro" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{' '}
                Enviando...
              </span>
            ) : (
              'Enviar instruções'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center">
        <Link href="/login" className="text-sm text-primaria hover:underline">
          Voltar ao login
        </Link>
      </CardFooter>
    </Card>
  );
}
