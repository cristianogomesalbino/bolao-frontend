import Image from 'next/image';

export function LogoBolao() {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <Image
        src="/logo-bolao.png?v=2"
        alt="Bolão"
        width={160}
        height={160}
        className="rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.3)]"
        priority
      />
      <h1 className="text-3xl font-bold text-[#ffdf00] tracking-tight drop-shadow-[0_0_8px_rgba(255,223,0,0.4)]">Bolão</h1>
      <p className="text-sm text-[#a8e6b0]/80 tracking-[0.15em] uppercase font-semibold">🇧🇷 Copa do Mundo 2026</p>
    </div>
  );
}
