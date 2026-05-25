'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PropsErroConexao {
  mensagem?: string;
  onTentarNovamente?: () => void;
}

export function ErroConexao({ mensagem, onTentarNovamente }: Readonly<PropsErroConexao>) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6" data-testid="erro-conexao">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-erro/[0.08] mb-4">
        <WifiOff size={28} className="text-erro/60" />
      </div>
      <p className="text-texto/70 font-medium mb-1">Sem conexão com o servidor</p>
      <p className="text-texto/40 text-sm mb-6 max-w-[260px]">
        {mensagem || 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.'}
      </p>
      {onTentarNovamente && (
        <Button
          variant="outline"
          size="sm"
          onClick={onTentarNovamente}
          className="gap-2"
          data-testid="erro-btn-tentar-novamente"
        >
          <RefreshCw size={14} />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
