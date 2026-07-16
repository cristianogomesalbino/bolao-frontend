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
  linkCadastro?: string;
}

export function FormularioLogin({ onSubmit, linkCadastro = '/cadastro' }: Readonly<PropsFormularioLogin>) {
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
        // Não duplicar mensagem se o warm-up já mostra offline
        if (statusServidor !== 'offline') {
          setErroServidor('Servidor indisponível. Tente novamente em instantes.');
        }
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
    <Card className={`border-primaria shadow-[0_0_20px_rgba(22,163,74,0.3)] ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`} data-testid="login-card">
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
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pb-5">
        <Link
          href={linkCadastro}
          className="w-full flex items-center justify-center h-11 rounded-lg border border-white/20 bg-white/[0.06] text-texto font-semibold text-sm hover:bg-white/[0.12] hover:border-white/30 transition-all"
          data-testid="login-link-cadastro"
        >
          Criar conta
        </Link>
      </CardFooter>
    </Card>
  );
}
