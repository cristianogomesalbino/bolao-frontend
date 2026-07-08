import apiClient from '@/lib/api-client';
import type {
  ListarNotificacoesResponse,
  PreferenciaNotificacao,
} from '@/types/notificacao.types';

export async function listarNotificacoes(
  limit = 20,
  offset = 0,
  status?: 'NAO_LIDA' | 'LIDA',
): Promise<ListarNotificacoesResponse> {
  const params: Record<string, string | number> = { limit, offset };
  if (status) params.status = status;

  const response = await apiClient.get<ListarNotificacoesResponse>(
    '/notificacoes',
    { params },
  );
  return response.data;
}

export async function contarNaoLidas(): Promise<number> {
  const response = await apiClient.get<{ naoLidas: number }>(
    '/notificacoes/nao-lidas/contagem',
  );
  return response.data.naoLidas;
}

export async function marcarComoLida(id: string): Promise<void> {
  await apiClient.patch(`/notificacoes/${id}/lida`);
}

export async function marcarTodasComoLidas(): Promise<void> {
  await apiClient.patch('/notificacoes/marcar-todas-lidas');
}

export async function buscarPreferencias(): Promise<PreferenciaNotificacao> {
  const response = await apiClient.get<PreferenciaNotificacao>(
    '/notificacoes/preferencias',
  );
  return response.data;
}

export async function atualizarPreferencias(
  dados: Partial<PreferenciaNotificacao>,
): Promise<void> {
  await apiClient.patch('/notificacoes/preferencias', dados);
}

export async function inscreverPush(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON();
  await apiClient.post('/push/inscrever', {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
  });
}

export async function cancelarPush(endpoint: string): Promise<void> {
  await apiClient.delete('/push/cancelar', { data: { endpoint } });
}
