/**
 * Avisos do admin exibidos na home.
 * Para adicionar um novo aviso, basta inserir um objeto neste array.
 * O aviso some quando o usuário clica "Entendi" (salvo em localStorage)
 * ou quando a data de expiração passa.
 */

export interface Aviso {
  id: string;
  titulo: string;
  mensagem: string;
  /** Data de criação (ISO string) */
  criadoEm: string;
  /** Data limite para exibição (ISO string). Após essa data, não aparece mais. */
  expiraEm: string;
}

export const AVISOS: Aviso[] = [
  {
    id: 'aviso-copa-2026-inicio',
    titulo: 'Atualizações',
    mensagem: 'Para ver os palpites dos membros do seu grupo faça o seguinte: \nEscolha um grupo \nClique em Meus Palpites \nEscolha um jogo e Clique na seta para baixo.\n[Lembrando que a visualização dos palpites é liberada ao iniciar um jogo]',
    criadoEm: '2026-06-11',
    expiraEm: '2026-06-30',
  },
];

const STORAGE_KEY = 'avisos-lidos';

export function obterAvisosLidos(): Set<string> {
  if (globalThis.window === undefined) return new Set();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function marcarAvisoComoLido(avisoId: string): void {
  const lidos = obterAvisosLidos();
  lidos.add(avisoId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...lidos]));
}

export function obterAvisosNaoLidos(): Aviso[] {
  const lidos = obterAvisosLidos();
  const agora = Date.now();
  return AVISOS.filter((a) => {
    if (lidos.has(a.id)) return false;
    if (new Date(a.expiraEm).getTime() < agora) return false;
    return true;
  });
}
