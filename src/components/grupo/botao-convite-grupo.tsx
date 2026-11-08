'use client';

import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

interface PropsBotaoConviteGrupo {
  readonly codigo: string;
}

export function BotaoConviteGrupo({ codigo }: Readonly<PropsBotaoConviteGrupo>) {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    const url = `${window.location.origin}/convite/${codigo}`;
    void navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const classeBotao = copiado
    ? 'bg-sucesso/15 border border-sucesso/30'
    : 'bg-primaria/10 border border-primaria/30 hover:bg-primaria/20';
  const classeTexto = copiado ? 'text-sucesso' : 'text-primaria-claro';

  return (
    <button
      type="button"
      onClick={copiar}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 ${classeBotao}`}
      aria-label="Copiar link de convite"
      data-testid="grupo-btn-convite"
      data-dica="grupo-convite"
    >
      {copiado ? (
        <Check size={14} className="text-sucesso" />
      ) : (
        <Link2 size={14} className="text-primaria-claro" />
      )}
      <span className={`text-[11px] font-semibold ${classeTexto}`}>
        {copiado ? 'Copiado!' : 'Convidar'}
      </span>
    </button>
  );
}
