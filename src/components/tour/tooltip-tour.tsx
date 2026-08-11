'use client';

interface PropsTooltipTour {
  continuous: boolean;
  index: number;
  step: { title?: React.ReactNode; content?: React.ReactNode };
  size: number;
  isLastStep: boolean;
  backProps: React.HTMLAttributes<HTMLButtonElement>;
  primaryProps: React.HTMLAttributes<HTMLButtonElement>;
  tooltipProps: React.HTMLAttributes<HTMLDivElement>;
}

export function TooltipTour({
  index,
  step,
  size,
  isLastStep,
  backProps,
  primaryProps,
  tooltipProps,
}: Readonly<PropsTooltipTour>) {
  return (
    <div
      {...tooltipProps}
      className="max-w-[300px] p-4 rounded-2xl border border-white/[0.12] bg-[#0f1a2e]/95 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
    >
      {step.title && (
        <h3 className="text-sm font-semibold text-texto mb-1.5">
          {step.title}
        </h3>
      )}

      {step.content && (
        <p className="text-xs text-texto/70 leading-relaxed mb-4">
          {step.content}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-texto/40 font-medium">
          {index + 1}/{size}
        </span>

        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-white/[0.12] text-texto/70 hover:bg-white/[0.06] transition-colors"
            >
              Anterior
            </button>
          )}

          <button
            {...primaryProps}
            className="text-[11px] px-4 py-1.5 rounded-lg bg-primaria text-white font-semibold hover:bg-primaria-claro transition-colors shadow-[0_0_12px_rgba(22,163,74,0.4)]"
          >
            {isLastStep ? 'Concluir' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}
