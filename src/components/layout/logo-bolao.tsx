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
      <h1 className="text-3xl font-bold text-texto tracking-tight">Bolão</h1>
    </div>
  );
}
