'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const schemaAlterarSenha = z
  .object({
    novaSenha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirmação é obrigatória'),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  });

type DadosAlterarSenhaForm = z.infer<typeof schemaAlterarSenha>;

interface PropsFormularioAlterarSenha {
  onSubmit: (novaSenha: string) => Promise<void>;
}

function calcularForcaSenha(senha: string): { nivel: number; texto: string; cor: string } {
  if (!senha) return { nivel: 0, texto: '', cor: '' };

  let pontos = 0;
  if (senha.length >= 6) pontos++;
  if (senha.length >= 8) pontos++;
  if (/[A-Z]/.test(senha)) pontos++;
  if (/[0-9]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;

  if (pontos <= 2) return { nivel: 1, texto: 'Fraca', cor: 'bg-erro' };
  if (pontos <= 3) return { nivel: 2, texto: 'Média', cor: 'bg-destaque' };
  return { nivel: 3, texto: 'Forte', cor: 'bg-sucesso' };
}

export function FormularioAlterarSenha({ onSubmit }: Readonly<PropsFormularioAlterarSenha>) {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<DadosAlterarSenhaForm>({
    resolver: zodResolver(schemaAlterarSenha),
    mode: 'onChange',
  });

  const novaSenha = watch('novaSenha') || '';
  const forca = calcularForcaSenha(novaSenha);

  async function aoEnviar(dados: DadosAlterarSenhaForm) {
    setErroServidor(null);
    setSucesso(false);
    try {
      await onSubmit(dados.novaSenha);
      setSucesso(true);
      reset();
      setTimeout(() => setSucesso(false), 3000);
    } catch (error: any) {
      setErroServidor(error?.mensagem || 'Erro ao alterar senha');
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Alterar senha</CardTitle>
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
              <AlertDescription>✓ Senha alterada com sucesso!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="novaSenha">Nova senha</Label>
            <div className="relative">
              <Input
                id="novaSenha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className={`pr-11 ${errors.novaSenha ? 'border-erro' : ''}`}
                aria-invalid={!!errors.novaSenha}
                {...register('novaSenha')}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-texto/40 hover:text-texto/70 transition-colors"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.novaSenha && (
              <p className="text-xs text-erro/90 mt-1" role="alert">{errors.novaSenha.message}</p>
            )}
            {/* Indicador de força */}
            {novaSenha.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        n <= forca.nivel ? forca.cor : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-[10px] uppercase tracking-wider ${
                  (() => {
                    if (forca.nivel === 1) return 'text-erro/70';
                    if (forca.nivel === 2) return 'text-destaque/70';
                    return 'text-sucesso/70';
                  })()
                }`}>
                  {forca.texto}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
            <Input
              id="confirmarSenha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              className={errors.confirmarSenha ? 'border-erro' : ''}
              aria-invalid={!!errors.confirmarSenha}
              {...register('confirmarSenha')}
            />
            {errors.confirmarSenha && (
              <p className="text-xs text-erro/90 mt-1" role="alert">{errors.confirmarSenha.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !isValid}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Alterando...</span>
              </span>
            ) : (
              'Alterar senha'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
