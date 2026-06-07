'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const schemaEntrarGrupo = z.object({
  codigoConvite: z.string().length(8, 'Código deve ter exatamente 8 caracteres'),
});

type DadosEntrarGrupoForm = z.infer<typeof schemaEntrarGrupo>;

interface PropsFormularioEntrarGrupo {
  onSubmit: (codigoConvite: string) => Promise<void>;
}

export function FormularioEntrarGrupo({ onSubmit }: Readonly<PropsFormularioEntrarGrupo>) {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<DadosEntrarGrupoForm>({
    resolver: zodResolver(schemaEntrarGrupo),
    mode: 'onChange',
  });

  async function aoEnviar(dados: DadosEntrarGrupoForm) {
    setErroServidor(null);
    setSucesso(false);
    try {
      await onSubmit(dados.codigoConvite);
      setSucesso(true);
      reset();
    } catch (error: any) {
      const mensagem = error?.mensagem || error?.message || 'Código inválido ou grupo indisponível';
      if (error?.statusCode === 409) {
        setErroServidor('Você já está neste grupo');
      } else {
        setErroServidor(mensagem);
      }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Entrar por convite</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-3" data-testid="entrar-grupo-form">
          {erroServidor && (
            <Alert variant="destructive" data-testid="entrar-grupo-alert-erro">
              <AlertDescription>{erroServidor}</AlertDescription>
            </Alert>
          )}
          {sucesso && (
            <Alert className="border-sucesso/50 bg-sucesso/10 text-sucesso" data-testid="entrar-grupo-alert-sucesso">
              <AlertDescription>✓ Você entrou no grupo!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="codigoConvite">Código de convite</Label>
            <Input
              id="codigoConvite"
              type="text"
              placeholder="ABC12345"
              maxLength={8}
              className={`uppercase tracking-widest text-center font-mono ${errors.codigoConvite ? 'border-erro' : ''}`}
              aria-invalid={!!errors.codigoConvite}
              data-testid="entrar-grupo-input-codigo"
              {...register('codigoConvite')}
            />
            {errors.codigoConvite && (
              <p className="text-xs text-erro/90 mt-1" role="alert">{errors.codigoConvite.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !isValid} data-testid="entrar-grupo-btn-entrar">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Entrando...</span>
              </span>
            ) : (
              'Entrar no grupo'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
