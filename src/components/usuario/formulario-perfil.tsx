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
import { Usuario } from '@/types/usuario.types';

const schemaPerfil = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
});

type DadosPerfilForm = z.infer<typeof schemaPerfil>;

interface PropsFormularioPerfil {
  usuario: Usuario;
  onSubmit: (dados: DadosPerfilForm) => Promise<void>;
}

export function FormularioPerfil({ usuario, onSubmit }: Readonly<PropsFormularioPerfil>) {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DadosPerfilForm>({
    resolver: zodResolver(schemaPerfil),
    defaultValues: {
      nome: usuario.nome,
      email: usuario.email,
    },
  });

  async function aoEnviar(dados: DadosPerfilForm) {
    setErroServidor(null);
    setSucesso(false);
    try {
      await onSubmit(dados);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (error: any) {
      setErroServidor(error?.mensagem || 'Erro ao atualizar perfil');
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Dados pessoais</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-3.5">
          {erroServidor && (
            <Alert variant="destructive">
              <AlertDescription>{erroServidor}</AlertDescription>
            </Alert>
          )}
          {sucesso && (
            <Alert className="border-sucesso/50 bg-sucesso/10 text-sucesso">
              <AlertDescription>Perfil atualizado com sucesso!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              className={errors.nome ? 'border-erro' : ''}
              aria-invalid={!!errors.nome}
              {...register('nome')}
            />
            {errors.nome && (
              <p className="text-xs text-erro/90 mt-1" role="alert">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className={errors.email ? 'border-erro' : ''}
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-erro/90 mt-1" role="alert">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Salvando...</span>
              </span>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
