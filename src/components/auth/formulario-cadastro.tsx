'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { schemaCadastro, DadosCadastroForm } from '@/lib/validacoes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PropsFormularioCadastro {
  onSubmit: (dados: DadosCadastroForm) => Promise<void>;
}

export function FormularioCadastro({ onSubmit }: Readonly<PropsFormularioCadastro>) {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosCadastroForm>({
    resolver: zodResolver(schemaCadastro),
  });

  async function aoEnviar(dados: DadosCadastroForm) {
    setErroServidor(null);
    try {
      await onSubmit(dados);
    } catch (error: any) {
      const mensagem = error?.mensagem || error?.message || 'Erro ao criar conta. Tente novamente.';
      if (error?.statusCode === 409) {
        setErroServidor('Este email já está cadastrado');
      } else {
        setErroServidor(mensagem);
      }
    }
  }

  return (
    <Card className="border-[#ffdf00] shadow-[0_0_32px_rgba(255,223,0,0.3)]">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
          {erroServidor && (
            <Alert variant="destructive">
              <AlertDescription>{erroServidor}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              className={errors.nome ? 'border-erro' : 'border-[#1a4db5]/60 focus-visible:border-[#3b82f6] focus-visible:ring-[#3b82f6]/25 focus-visible:shadow-[0_0_16px_rgba(59,130,246,0.3)]'}
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? 'nome-error' : undefined}
              {...register('nome')}
            />
            {errors.nome && (
              <p id="nome-error" className="text-sm text-erro" role="alert">
                {errors.nome.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className={errors.email ? 'border-erro' : 'border-[#1a4db5]/60 focus-visible:border-[#3b82f6] focus-visible:ring-[#3b82f6]/25 focus-visible:shadow-[0_0_16px_rgba(59,130,246,0.3)]'}
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

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <div className="relative">
              <Input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className={`pr-11 ${errors.senha ? 'border-erro' : 'border-[#1a4db5]/60 focus-visible:border-[#3b82f6] focus-visible:ring-[#3b82f6]/25 focus-visible:shadow-[0_0_16px_rgba(59,130,246,0.3)]'}`}
                aria-invalid={!!errors.senha}
                aria-describedby={errors.senha ? 'senha-error' : undefined}
                {...register('senha')}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-texto/50 hover:text-texto transition-colors"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.senha && (
              <p id="senha-error" className="text-sm text-erro" role="alert">
                {errors.senha.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar senha</Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                type={mostrarConfirmar ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repita a senha"
                className={`pr-11 ${errors.confirmarSenha ? 'border-erro' : 'border-[#1a4db5]/60 focus-visible:border-[#3b82f6] focus-visible:ring-[#3b82f6]/25 focus-visible:shadow-[0_0_16px_rgba(59,130,246,0.3)]'}`}
                aria-invalid={!!errors.confirmarSenha}
                aria-describedby={errors.confirmarSenha ? 'confirmarSenha-error' : undefined}
                {...register('confirmarSenha')}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-texto/50 hover:text-texto transition-colors"
                aria-label={mostrarConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {mostrarConfirmar ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
                Criando conta...
              </span>
            ) : (
              'Criar conta'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-texto/70">
          Já tem conta?{' '}
          <Link href="/login" className="text-link hover:text-link/80 hover:underline transition-colors">
            Já tenho conta
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
