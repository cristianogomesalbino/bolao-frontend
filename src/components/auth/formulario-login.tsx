'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { schemaLogin, DadosLoginForm } from '@/lib/validacoes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWarmUp } from '@/hooks/use-warm-up';

interface PropsFormularioLogin {
  onSubmit: (dados: DadosLoginForm) => Promise<void>;
}

export function FormularioLogin({ onSubmit }: Readonly<PropsFormularioLogin>) {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [shake, setShake] = useState(false);
  const { status: statusServidor } = useWarmUp();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<DadosLoginForm>({
    resolver: zodResolver(schemaLogin),
    mode: 'onChange',
  });

  async function aoEnviar(dados: DadosLoginForm) {
    setErroServidor(null);
    try {
      await onSubmit(dados);
    } catch (error: any) {
      if (error?.statusCode === 0) {
        setErroServidor('Servidor indisponível. Tente novamente em instantes.');
      } else if (error?.statusCode === 401) {
        setErroServidor('Email ou senha inválidos');
      } else {
        setErroServidor(error?.mensagem || 'Ocorreu um erro. Tente novamente.');
      }
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <Card className={shake ? 'animate-[shake_0.5s_ease-in-out]' : ''} data-testid="login-card">
      <CardContent className="pt-5 pb-4">
        {(statusServidor === 'verificando' || statusServidor === 'acordando') && (
          <div className="flex items-center gap-2.5 rounded-lg bg-primaria/10 border border-primaria/20 px-3 py-2.5 mb-3.5" data-testid="login-warmup-banner">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primaria border-t-transparent shrink-0" />
            <p className="text-xs text-texto/70">
              {statusServidor === 'verificando'
                ? 'Conectando ao servidor...'
                : 'Servidor inicializando, aguarde alguns segundos...'}
            </p>
          </div>
        )}
        {statusServidor === 'offline' && (
          <div className="flex items-center gap-2.5 rounded-lg bg-erro/10 border border-erro/20 px-3 py-2.5 mb-3.5">
            <p className="text-xs text-erro/90">
              Servidor indisponível. Tente novamente em alguns minutos.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-3.5" data-testid="login-form">
          {erroServidor && (
            <Alert variant="destructive" data-testid="login-alert-erro">
              <AlertDescription>{erroServidor}</AlertDescription>
            </Alert>
          )}

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
              aria-describedby={errors.email ? 'email-error' : undefined}
              data-testid="login-input-email"
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-erro/90 mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <div className="relative">
              <Input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Sua senha"
                className={`pr-11 ${errors.senha ? 'border-erro' : ''}`}
                aria-invalid={!!errors.senha}
                aria-describedby={errors.senha ? 'senha-error' : undefined}
                data-testid="login-input-senha"
                {...register('senha')}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-texto/40 hover:text-texto/70 transition-colors"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
                data-testid="login-btn-toggle-senha"
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.senha && (
              <p id="senha-error" className="text-xs text-erro/90 mt-1" role="alert">
                {errors.senha.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="continuar-logado"
                className="peer h-4 w-4 appearance-none rounded border border-white/20 bg-white/5 checked:bg-primaria checked:border-primaria transition-all cursor-pointer"
              />
              <svg
                className="absolute left-0.5 top-0.5 h-3 w-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 6l3 3 5-5" />
              </svg>
            </div>
            <label htmlFor="continuar-logado" className="text-sm text-texto/60 cursor-pointer select-none">
              Continuar logado
            </label>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !isValid} data-testid="login-btn-entrar">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{' '}
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </Button>

          {/* Separador social */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[11px] text-texto/30 uppercase tracking-wider">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-3 border-white/10 hover:bg-white/5 hover:border-white/20 text-texto/80 hover:text-texto transition-all"
            size="lg"
            disabled
            data-testid="login-btn-google"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-2.5 pb-5">
        <Link href="/esqueci-senha" className="text-sm text-link/80 hover:text-link hover:underline underline-offset-4 transition-all duration-200" data-testid="login-link-esqueci-senha">
          Esqueci minha senha
        </Link>
        <p className="text-sm text-texto/50">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-link/80 hover:text-link hover:underline underline-offset-4 transition-all duration-200" data-testid="login-link-cadastro">
            Criar conta
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
