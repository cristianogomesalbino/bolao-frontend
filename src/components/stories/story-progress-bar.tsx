interface StoryProgressBarProps {
  readonly total: number;
  readonly atual: number;
  readonly progresso: number; // 0-1
}

function calcularLargura(indice: number, indiceAtual: number, pct: number): string {
  if (indice < indiceAtual) return '100%';
  if (indice === indiceAtual) return `${pct * 100}%`;
  return '0%';
}

export function StoryProgressBar({
  total,
  atual,
  progresso,
}: StoryProgressBarProps) {
  return (
    <div className="flex gap-1 px-3 pt-3" data-testid="story-progress-bar">
      {Array.from({ length: total }, (_, i) => {
        const largura = calcularLargura(i, atual, progresso);
        return (
          <div
            key={i}
            className="h-[2px] flex-1 rounded-full bg-white/30 overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: largura }}
            />
          </div>
        );
      })}
    </div>
  );
}
