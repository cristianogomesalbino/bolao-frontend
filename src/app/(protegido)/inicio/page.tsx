'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InicioPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/palpites');
  }, [router]);

  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primaria border-t-transparent" />
    </div>
  );
}
