'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FormularioResetarSenha } from '@/components/auth/formulario-resetar-senha';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ResetarSenhaPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>
              Link de recuperação inválido. O link pode ter expirado ou estar incompleto.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/esqueci-senha" className="text-sm text-primaria hover:underline">
            Solicitar novo link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return <FormularioResetarSenha token={token} />;
}

export default function ResetarSenhaPage() {
  return (
    <Suspense>
      <ResetarSenhaPageInner />
    </Suspense>
  );
}
