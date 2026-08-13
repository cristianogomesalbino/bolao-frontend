import { dispensarDica } from '@/services/dica.service';

export const DICA_STORAGE_KEY = 'dicas-pendentes';

export function salvarDicaPendente(dicaId: string): void {
  try {
    const pendentes: string[] = JSON.parse(
      localStorage.getItem(DICA_STORAGE_KEY) ?? '[]',
    ) as string[];
    if (!pendentes.includes(dicaId)) {
      pendentes.push(dicaId);
      localStorage.setItem(DICA_STORAGE_KEY, JSON.stringify(pendentes));
    }
  } catch {
    // localStorage indisponível — ignora
  }
}

export async function sincronizarDicasPendentes(): Promise<void> {
  try {
    const raw = localStorage.getItem(DICA_STORAGE_KEY);
    if (!raw) return;

    const pendentes: string[] = JSON.parse(raw) as string[];
    if (pendentes.length === 0) return;

    const sucessos: string[] = [];

    for (const dicaId of pendentes) {
      try {
        await dispensarDica(dicaId);
        sucessos.push(dicaId);
      } catch {
        // falha individual — deixa pra próxima
      }
    }

    const restantes = pendentes.filter((id) => !sucessos.includes(id));

    if (restantes.length === 0) {
      localStorage.removeItem(DICA_STORAGE_KEY);
    } else {
      localStorage.setItem(DICA_STORAGE_KEY, JSON.stringify(restantes));
    }
  } catch {
    // localStorage indisponível — ignora
  }
}
