'use client';

import { formatarPontuacao } from '@/lib/pontuacao-formatada';

interface MembroDetalhamento {
  usuarioId: string;
  nomeUsuario: string;
  golsCasaPalpite: number | null;
  golsForaPalpite: number | null;
  pontosFinais: number | null;
  categoriaAcerto: string | null;
}

interface PropsListaPalpitesMembros {
  detalhamento: MembroDetalhamento[];
  statusJogo: string;
  temaCopa?: boolean;
}

function obterCorPontuacao(categoriaAcerto: string | null, temaCopa: boolean): string {
  if (categoriaAcerto === 'ACERTO_EM_CHEIO') {
    return temaCopa ? 'text-[#22c55e] font-bold' : 'text-primaria font-bold';
  }
  if (categoriaAcerto === 'ACERTO_DE_RESULTADO') {
    return temaCopa ? 'text-[#ffdf00] font-semibold' : 'text-amber-400 font-semibold';
  }
  return temaCopa ? 'text-white/40' : 'text-texto/40';
}

/**
 * Componente reutilizável para exibir a lista de palpites dos membros do grupo
 * dentro do chevron expandido dos cards de jogos.
 *
 * Utilizado em:
 * - card-jogo-palpite.tsx (aba Todos os Jogos)
 * - card-proximo-jogo-copa.tsx (card de próximo jogo Copa)
 * - aba-meus-palpites-copa.tsx (aba Meus Palpites Copa)
 */
export function ListaPalpitesMembros({ detalhamento, statusJogo, temaCopa }: Readonly<PropsListaPalpitesMembros>) {
  const jogoFinalizado = statusJogo === 'FINALIZADO';
  const jogoIniciado = statusJogo === 'EM_ANDAMENTO' || statusJogo === 'FINALIZADO';

  const membrosOrdenados = [...detalhamento].sort((a, b) => {
    const ptA = a.pontosFinais ?? 0;
    const ptB = b.pontosFinais ?? 0;
    return ptB - ptA;
  });

  const cores = temaCopa
    ? {
        bgPalpitou: 'bg-[#009c3b]/12',
        bgNaoPalpitou: 'bg-white/[0.03]',
        bolinha: 'bg-[#009c3b] shadow-[0_0_8px_rgba(0,156,59,0.7)]',
        bolinhaInativa: 'bg-white/20',
        avatar: 'bg-[#009c3b]/25 border-[#009c3b]/50',
        avatarInativo: 'bg-white/[0.06] border-white/[0.1]',
        iniciais: 'text-[#ffdf00]',
        iniciaisInativo: 'text-white/40',
        nome: 'text-white',
        nomeInativo: 'text-white/40',
        placar: 'text-white font-bold',
        badgeNao: 'bg-white/[0.05] text-white/30 border border-white/[0.08]',
      }
    : {
        bgPalpitou: 'bg-primaria/[0.08]',
        bgNaoPalpitou: 'bg-white/[0.03]',
        bolinha: 'bg-primaria shadow-[0_0_8px_rgba(34,197,94,0.7)]',
        bolinhaInativa: 'bg-texto/20',
        avatar: 'bg-primaria/25 border-primaria/50',
        avatarInativo: 'bg-white/[0.06] border-white/[0.1]',
        iniciais: 'text-primaria-claro',
        iniciaisInativo: 'text-texto/40',
        nome: 'text-texto',
        nomeInativo: 'text-texto/40',
        placar: 'text-texto font-bold',
        badgeNao: 'bg-white/[0.05] text-texto/30 border border-white/[0.08]',
      };

  return (
    <div className="space-y-1.5">
      {membrosOrdenados.map((membro) => {
        const iniciais = membro.nomeUsuario
          .split(' ')
          .slice(0, 2)
          .map((p) => p[0])
          .join('')
          .toUpperCase();
        const primeiroNome = membro.nomeUsuario.split(' ')[0];
        const fezPalpite = membro.golsCasaPalpite !== null && membro.golsForaPalpite !== null;
        const pontos = membro.pontosFinais ?? 0;
        const corPontos = obterCorPontuacao(membro.categoriaAcerto, temaCopa ?? false);

        return (
          <div
            key={membro.usuarioId}
            className={`flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors ${fezPalpite ? cores.bgPalpitou : cores.bgNaoPalpitou}`}
          >
            {/* Indicador de status */}
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${fezPalpite ? cores.bolinha : cores.bolinhaInativa}`} />

            {/* Avatar com iniciais */}
            <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 border ${fezPalpite ? cores.avatar : cores.avatarInativo}`}>
              <span className={`text-[10px] font-bold ${fezPalpite ? cores.iniciais : cores.iniciaisInativo}`}>
                {iniciais}
              </span>
            </div>

            {/* Nome */}
            <span className={`text-[12px] flex-1 truncate font-medium ${fezPalpite ? cores.nome : cores.nomeInativo}`}>
              {primeiroNome}
            </span>

            {/* Placar + Pontuação ou badge "Não palpitou" */}
            {fezPalpite ? (
              <div className="flex items-center gap-4">
                {jogoIniciado ? (
                  <span className={`text-[11px] ${cores.placar}`}>
                    {membro.golsCasaPalpite} × {membro.golsForaPalpite}
                  </span>
                ) : (
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${temaCopa ? 'bg-[#009c3b]/20 text-[#22c55e] border border-[#009c3b]/30' : 'bg-primaria/15 text-primaria-claro border border-primaria/30'}`}>
                    Palpitou ✓
                  </span>
                )}
                {jogoFinalizado && (
                  <span className={`text-[10px] min-w-[52px] text-right ${corPontos}`}>
                    {formatarPontuacao(pontos)}
                  </span>
                )}
              </div>
            ) : (
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${cores.badgeNao}`}>
                Não palpitou
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
