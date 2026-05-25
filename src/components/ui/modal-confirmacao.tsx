'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PropsModalConfirmacao {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
  variante?: 'default' | 'destructive';
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  variante = 'default',
  carregando = false,
  onConfirmar,
  onCancelar,
}: Readonly<PropsModalConfirmacao>) {
  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      data-testid="modal-confirmacao"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancelar}
        aria-hidden="true"
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-[320px] animate-[fadeIn_0.2s_ease-out]">
        <CardContent className="p-5">
          <h2 className="text-base font-semibold text-texto mb-2" data-testid="modal-titulo">
            {titulo}
          </h2>
          <p className="text-sm text-texto/60 mb-5">
            {mensagem}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancelar}
              disabled={carregando}
              data-testid="modal-btn-cancelar"
            >
              {textoBotaoCancelar}
            </Button>
            <Button
              variant={variante === 'destructive' ? 'destructive' : 'default'}
              className="flex-1"
              onClick={onConfirmar}
              disabled={carregando}
              data-testid="modal-btn-confirmar"
            >
              {carregando ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </span>
              ) : (
                textoBotaoConfirmar
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
