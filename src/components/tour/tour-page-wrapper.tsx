'use client';

import { usePathname } from 'next/navigation';
import { TourProvider } from './tour-provider';
import { BotaoRefazerTour } from './botao-refazer-tour';
import { getToursPorPagina } from '@/lib/tour-registry';

interface PropsTourPageWrapper {
  /** Override do pathname quando o path real não bate (ex: /grupos/[id] → /grupos/xxx) */
  pathname?: string;
}

/**
 * Renderiza automaticamente todos os TourProviders e o BotaoRefazerTour
 * para a página atual. Basta colocar no header da page.
 *
 * Uso:
 * ```tsx
 * <TourPageWrapper />                    // usa pathname real
 * <TourPageWrapper pathname="/grupos/x" /> // override para dynamic routes
 * ```
 */
export function TourPageWrapper({ pathname: overridePath }: Readonly<PropsTourPageWrapper>) {
  const realPathname = usePathname();
  const pathname = overridePath ?? realPathname;
  const toursDisponiveis = getToursPorPagina(pathname);

  return (
    <>
      {toursDisponiveis.map((tour) => (
        <TourProvider key={tour.id} tourId={tour.id} steps={tour.steps} />
      ))}
    </>
  );
}

/**
 * Renderiza apenas o BotaoRefazerTour para a página atual.
 * Usar no header, ao lado do título.
 */
export function TourRefazerBotao({ pathname: overridePath }: Readonly<PropsTourPageWrapper>) {
  const realPathname = usePathname();
  const pathname = overridePath ?? realPathname;
  const toursDisponiveis = getToursPorPagina(pathname);

  if (toursDisponiveis.length === 0) return null;

  return <BotaoRefazerTour toursDisponiveis={toursDisponiveis} />;
}
