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
 * Considera: 45min 1T + ~5min acréscimos + 15min intervalo + 45min 2T + acréscimos.
 */
export function calcularTempoJogo(dataHora: string): string {
  const diff = Date.now() - new Date(dataHora).getTime();
  if (diff <= 0) return "0'";

  const minutos = Math.floor(diff / 60000);

  // 1º tempo: 0-45 min
  if (minutos <= 45) return `${minutos}'`;

  // Acréscimos do 1º tempo: 46-50 min
  if (minutos <= 50) return '45+';

  // Intervalo: 51-65 min (15 min de descanso)
  if (minutos <= 65) return 'Intervalo';

  // 2º tempo: a partir de 66 min reais = minuto 46 do jogo
  const minuto2t = minutos - 20; // remove 5min acréscimo 1T + 15min intervalo
  if (minuto2t <= 90) return `${minuto2t}'`;

  // Acréscimos do 2º tempo
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
