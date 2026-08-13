import { create } from 'zustand';
import { dispensarDica as dispensarDicaApi, resetarDicas as resetarDicasApi } from '@/services/dica.service';
import { salvarDicaPendente } from '@/lib/dica-sync';
import type { EstadoDica } from '@/types/dica.types';

const STORAGE_KEY_EXIBIDAS = 'dicas-exibidas';

function carregarExibidasDoStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXIBIDAS);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function salvarExibidasNoStorage(exibidas: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXIBIDAS, JSON.stringify([...exibidas]));
  } catch {
    // localStorage indisponível
  }
}

interface EstadoDicasStore {
  dicasDispensadas: Set<string>;
  dicasExibidas: Set<string>;
  dicaAtiva: string | null;
  filaAutoExibicao: string[];

  inicializar: (dispensadasDoBackend: string[]) => void;
  dispensar: (dicaId: string) => void;
  marcarComoExibida: (dicaId: string) => void;
  abrir: (dicaId: string) => void;
  fechar: () => void;
  enfileirar: (dicaId: string) => void;
  desenfileirar: () => string | null;
  resetarTodas: () => Promise<void>;
  obterEstado: (dicaId: string) => EstadoDica;
}

export const useDicasStore = create<EstadoDicasStore>((set, get) => ({
  dicasDispensadas: new Set(),
  dicasExibidas: carregarExibidasDoStorage(),
  dicaAtiva: null,
  filaAutoExibicao: [],

  inicializar: (dispensadasDoBackend: string[]) => {
    set({ dicasDispensadas: new Set(dispensadasDoBackend) });
  },

  dispensar: (dicaId: string) => {
    const { dicasDispensadas, dicasExibidas, dicaAtiva, filaAutoExibicao } = get();

    const novasDispensadas = new Set(dicasDispensadas);
    novasDispensadas.add(dicaId);

    const novasExibidas = new Set(dicasExibidas);
    novasExibidas.delete(dicaId);
    salvarExibidasNoStorage(novasExibidas);

    set({
      dicasDispensadas: novasDispensadas,
      dicasExibidas: novasExibidas,
      dicaAtiva: dicaAtiva === dicaId ? null : dicaAtiva,
      filaAutoExibicao: filaAutoExibicao.filter((id) => id !== dicaId),
    });

    dispensarDicaApi(dicaId).catch(() => {
      salvarDicaPendente(dicaId);
    });
  },

  marcarComoExibida: (dicaId: string) => {
    const { dicasExibidas, dicaAtiva, filaAutoExibicao } = get();

    const novasExibidas = new Set(dicasExibidas);
    novasExibidas.add(dicaId);
    salvarExibidasNoStorage(novasExibidas);

    set({
      dicasExibidas: novasExibidas,
      dicaAtiva: dicaAtiva === dicaId ? null : dicaAtiva,
      filaAutoExibicao: filaAutoExibicao.filter((id) => id !== dicaId),
    });
  },

  abrir: (dicaId: string) => {
    set({ dicaAtiva: dicaId });
  },

  fechar: () => {
    set({ dicaAtiva: null });
  },

  enfileirar: (dicaId: string) => {
    const { filaAutoExibicao } = get();
    if (filaAutoExibicao.includes(dicaId)) return;
    set({ filaAutoExibicao: [...filaAutoExibicao, dicaId] });
  },

  desenfileirar: () => {
    const { filaAutoExibicao } = get();
    if (filaAutoExibicao.length === 0) return null;
    const [proximo, ...restante] = filaAutoExibicao;
    set({ filaAutoExibicao: restante });
    return proximo;
  },

  resetarTodas: async () => {
    set({
      dicasDispensadas: new Set(),
      dicasExibidas: new Set(),
      dicaAtiva: null,
      filaAutoExibicao: [],
    });
    salvarExibidasNoStorage(new Set());

    await resetarDicasApi();
  },

  obterEstado: (dicaId: string): EstadoDica => {
    const { dicasDispensadas, dicasExibidas } = get();
    if (dicasDispensadas.has(dicaId)) return 'dispensado';
    if (dicasExibidas.has(dicaId)) return 'exibido';
    return 'inedito';
  },
}));
