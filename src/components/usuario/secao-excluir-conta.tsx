'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2 } from 'lucide-react';

interface PropsSecaoExcluirConta {
  onConfirmar: () => Promise<void>;
}

export function SecaoExcluirConta({ onConfirmar }: Readonly<PropsSecaoExcluirConta>) {
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoExcluir() {
    setErro(null);
    setExcluindo(true);
    try {
      await onConfirmar();
    } catch (error: any) {
      setErro(error?.mensagem || 'Erro ao excluir conta');
      setExcluindo(false);
    }
  }

  return (
    <Card className="border-erro/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-erro/90">Zona de perigo</CardTitle>
        <CardDescription className="text-texto/40 mt-1">
          Ações irreversíveis para sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {erro && (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {!mostrarConfirmacao ? (
          <Button
            variant="outline"
            className="w-full border-erro/30 text-erro/80 hover:bg-erro/10 hover:text-erro hover:border-erro/50"
            onClick={() => setMostrarConfirmacao(true)}
          >
            <Trash2 size={16} />
            Excluir minha conta
          </Button>
        ) : (
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertDescription>
                Tem certeza? Essa ação é irreversível. Todos os seus dados, palpites e participações em grupos serão removidos.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setMostrarConfirmacao(false)}
                disabled={excluindo}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={aoExcluir}
                disabled={excluindo}
              >
                {excluindo ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Excluindo...
                  </span>
                ) : (
                  'Sim, excluir'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
