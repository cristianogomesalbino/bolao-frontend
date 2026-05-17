import apiClient from '@/lib/api-client';
import { JogoProximo } from '@/types/jogo.types';

// Por enquanto retorna dados mock até o backend ter endpoint de próximos jogos
// Futuramente: GET /jogos/proximos?limit=2
export async function buscarProximosJogos(): Promise<JogoProximo[]> {
  try {
    // TODO: substituir por endpoint real quando disponível
    // const response = await apiClient.get<JogoProximo[]>('/jogos/proximos?limit=2');
    // return response.data;

    // Mock data para desenvolvimento
    await new Promise((resolve) => setTimeout(resolve, 800));
    return [
      {
        id: '1',
        timeCasa: 'Flamengo',
        timeFora: 'Palmeiras',
        dataHora: proximaData(0, 21, 30),
        status: 'AGENDADO',
      },
      {
        id: '2',
        timeCasa: 'Brasil',
        timeFora: 'Argentina',
        dataHora: proximaData(3, 22, 0),
        status: 'AGENDADO',
      },
    ];
  } catch {
    return [];
  }
}

function proximaData(diasAFrente: number, hora: number, minuto: number): string {
  const data = new Date();
  data.setDate(data.getDate() + diasAFrente);
  data.setHours(hora, minuto, 0, 0);
  return data.toISOString();
}
