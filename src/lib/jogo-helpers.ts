import { CAMPEONATOS } from '@/types/jogo.types';

/**
 * Calcula countdown até o fechamento de palpites (1 minuto antes do jogo).
 * Retorna texto formatado HH:MM:SS e flag indicando se já encerrou.
 */
export function calcularCountdown(dataHora: string): { texto: string; encerrado: boolean } {
  const target = new Date(dataHora).getTime() - 60000;
  const diff = target - Date.now();
  if (diff <= 0) return { texto: 'Encerrado', encerrado: true };

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return {
    texto: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
    encerrado: false,
  };
}

/**
 * Calcula tempo de jogo em andamento baseado na dataHora de início.
 * Retorna string com minutos jogados (ex: "35'", "45+", "Intervalo", "90+").
 */
export function calcularTempoJogo(dataHora: string): string {
  const diff = Date.now() - new Date(dataHora).getTime();
  if (diff <= 0) return "0'";
  const minutos = Math.floor(diff / 60000);
  if (minutos <= 45) return `${minutos}'`;
  if (minutos <= 60) return '45+';
  if (minutos <= 75) return 'Intervalo';
  const min2t = minutos - 15;
  if (min2t <= 90) return `${min2t}'`;
  return '90+';
}

/**
 * Verifica se o nome de um campeonato corresponde à Copa do Mundo.
 * Usa a label do config de CAMPEONATOS para detecção dinâmica.
 */
export function ehCampeonatoCopa(nome?: string): boolean {
  if (!nome) return false;
  const labelCopa = CAMPEONATOS.find((c) => c.slug === 'copa-do-mundo-2026')?.label ?? '';
  const palavraChave = labelCopa.split(' ')[0].toLowerCase(); // 'copa'
  return nome.toLowerCase().includes(palavraChave) && nome.toLowerCase().includes('mundo');
}
