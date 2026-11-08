'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CardProximosJogos } from '@/components/home/card-proximos-jogos';
import { AlertaJogosAtrasados } from '@/components/palpites/alerta-jogos-atrasados';
import { SecaoPalpitesGrupo } from '@/components/grupo/secao-palpites-grupo';
import type { DadosTemporada } from '@/services/jogo.service';

type JogoDaTemporada = NonNullable<DadosTemporada['proximoJogo']>;

interface PropsSecaoBrasileiraoGrupo {
  readonly grupoId: string;
  readonly temporadaId: string;
  readonly proximoJogo: JogoDaTemporada | undefined;
  readonly proximosJogos: DadosTemporada['proximosJogos'] | undefined;
  readonly carregandoTemporada: boolean;
}

function jogosDoCard(
  proximo: JogoDaTemporada,
  proximos: DadosTemporada['proximosJogos'] | undefined,
): JogoDaTemporada[] {
  if (proximos && proximos.length > 0) return proximos;
  return [proximo];
}

export function SecaoBrasileiraoGrupo({
  grupoId,
  temporadaId,
  proximoJogo,
  proximosJogos,
  carregandoTemporada,
}: Readonly<PropsSecaoBrasileiraoGrupo>) {
  return (
    <>
      <AlertaJogosAtrasados temporadaId={temporadaId} grupoId={grupoId} />

      {proximoJogo && (
        <CardProximosJogos
          jogos={jogosDoCard(proximoJogo, proximosJogos)}
          grupoId={grupoId}
          temaCopa={false}
        />
      )}

      {!proximoJogo && !carregandoTemporada && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[11px] text-texto/30">Nenhum jogo agendado no momento</p>
          </CardContent>
        </Card>
      )}

      <SecaoPalpitesGrupo grupoId={grupoId} temporadaId={temporadaId} />
    </>
  );
}
