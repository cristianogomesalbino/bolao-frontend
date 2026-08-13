import { create } from 'zustand';
import { dispensarDica as dispensarDicaApi, resetarDicas as resetarDicasApi } from '@/services/dica.service';
import { salvarDicaPendente } from '@/lib/dica-sync';
import type { EstadoDica } from '@/types/dica.types';

const CHAVE_EXIBIDOS = 'dicas-exibidos';

function carregarExibidosLocal(): Set<string> {
  try {
    const raw = localStorage.getItem(CHAVE_EXIBIDOS);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function salvarExibidosLocal(exibidos: Set<string>): void {
  try {
    localStorage.setItem(CHAVE_EXIBIDOS, JSON.stringify([...exibidos]));
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
  dispensarDica: (dicaId: string) => void;
  marcarComoExibida: (dicaId: string) => void;
  abrirDica: (dicaId: string) => void;
  fecharDica: () => void;
  enfileirar: (dicaId: string) => void;
  desenfileirar: () => string | null;
  resetarTodas: () => Promise<void>;
  obterEstado: (dicaId: string) => EstadoDica;
}

export const useDicasStore = create<EstadoDicasStore>((set, get) => ({
  dicasDispensadas: new Set(),
  dicasExibidas: new Set(),
  dicaAtiva: null,
  filaAutoExibicao: [],

  inicializar: (dispensadasDoBackend: string[]) => {
    const exibidosLocal = carregarExibidosLocal();
    set({
      dicasDispensadas: new Set(dispensadasDoBackend),
      dicasExibidas: exibidosLocal,
    });
  },

  dispensarDica: (dicaId: string) => {
    const { dicasDispensadas, dicasExibidas } = get();
    if (dicasDispensadas.has(dicaId)) return;

    const novasDispensadas = new Set(dicasDispensadas);
    novasDispensadas.add(dicaId);

    const novasExibidas = new Set(dicasExibidas);
    novasExibidas.delete(dicaId);
    salvarExibidosLocal(novasExibidas);

    set({
      dicasDispensadas: novasDispensadas,
      dicasExibidas: novasExibidas,
      dicaAtiva: get().dicaAtiva === dicaId ? null : get().dicaAtiva,
    });

    dispensarDicaApi(dicaId).catch(() => {
      salvarDicaPendente(dicaId);
    });
  },

  marcarComoExibida: (dicaId: string) => {
    const { dicasExibidas } = get();
    if (dicasExibidas.has(dicaId)) return;

    const novasExibidas = new Set(dicasExibidas);
    novasExibidas.add(dicaId);
    salvarExibidosLocal(novasExibidas);

    set({
      dicasExibidas: novasExibidas,
      dicaAtiva: get().dicaAtiva === dicaId ? null : get().dicaAtiva,
    });
  },

  abrirDica: (dicaId: string) => {
    set({ dicaAtiva: dicaId });
  },

  fecharDica: () => {
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
    await resetarDicasApi();
    localStorage.removeItem(CHAVE_EXIBIDOS);
    set({
      dicasDispensadas: new Set(),
      dicasExibidas: new Set(),
      dicaAtiva: null,
      filaAutoExibicao: [],
    });
  },

  obterEstado: (dicaId: string): EstadoDica => {
    const { dicasDispensadas, dicasExibidas } = get();
    if (dicasDispensadas.has(dicaId)) return 'dispensado';
    if (dicasExibidas.has(dicaId)) return 'exibido';
    return 'inedito';
  },
}));
