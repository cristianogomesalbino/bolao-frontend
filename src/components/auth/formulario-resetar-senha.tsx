'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { schemaResetarSenha, DadosResetarSenhaForm } from '@/lib/validacoes';
import { resetarSenha } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PropsFormularioResetarSenha {
  token: string;
}

export function FormularioResetarSenha({ token }: Readonly<PropsFormularioResetarSenha>) {
  const [sucesso, setSucesso] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosResetarSenhaForm>({
    resolver: zodResolver(schemaResetarSenha),
  });

  async function aoEnviar(dados: DadosResetarSenhaForm) {
    setErroServidor(null);
    try {
      await resetarSenha(token, dados.novaSenha);
      setSucesso(true);
    } catch (error: any) {
      const mensagem = error?.mensagem || error?.message || '';
      if (mensagem.toLowerCase().includes('token') || mensagem.toLowerCase().includes('expirado')) {
        setErroServidor('Link de recuperação inválido ou expirado. Solicite um novo.');
      } else {
        setErroServidor('Erro ao resetar senha. Tente novamente.');
      }
    }
  }

  if (sucesso) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert className="border-sucesso/50 bg-sucesso/10 text-sucesso">
            <AlertDescription>
              Senha alterada com sucesso!
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-primaria hover:underline">
            Ir para o login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
          {erroServidor && (
            <Alert variant="destructive">
              <AlertDescription>{erroServidor}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova senha</Label>
            <Input
              id="novaSenha"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              aria-invalid={!!errors.novaSenha}
              aria-describedby={errors.novaSenha ? 'novaSenha-error' : undefined}
              {...register('novaSenha')}
            />
            {errors.novaSenha && (
              <p id="novaSenha-error" className="text-sm text-erro" role="alert">
                {errors.novaSenha.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
            <Input
              id="confirmarSenha"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              aria-invalid={!!errors.confirmarSenha}
              aria-describedby={errors.confirmarSenha ? 'confirmarSenha-error' : undefined}
              {...register('confirmarSenha')}
            />
            {errors.confirmarSenha && (
              <p id="confirmarSenha-error" className="text-sm text-erro" role="alert">
                {errors.confirmarSenha.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{' '}
                Alterando...
              </span>
            ) : (
              'Alterar senha'
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
