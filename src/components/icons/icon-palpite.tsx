interface PropsIconPalpite {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function IconPalpite({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className,
}: Readonly<PropsIconPalpite>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Círculo da bola */}
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
      {/* Pentágono central */}
      <path
        d="M12 7l3 2.2v3.6L12 15l-3-2.2V9.2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Gomos - linhas do pentágono para a borda */}
      <path
        d="M12 2v5M15 9.2l4.5-1.5M15 12.8l3 4M9 12.8l-3 4M9 9.2L4.5 7.7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
