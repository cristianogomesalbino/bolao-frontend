import apiClient from '@/lib/api-client';

export async function dispensarDica(dicaId: string): Promise<void> {
  await apiClient.patch('/usuarios/me/dicas', { dicaId });
}

export async function resetarDicas(): Promise<void> {
  await apiClient.delete('/usuarios/me/dicas');
}
