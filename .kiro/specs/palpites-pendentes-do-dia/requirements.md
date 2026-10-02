---
status: planejado
---

# Palpites pendentes do dia — Requisitos

## Contexto

Hoje `PALPITES_PENDENTES` só olha jogos que começam nas próximas 3 horas, e a deduplicação é uma vez por fase e rodada, para sempre. Uma rodada que dura vários dias só lembra no primeiro jogo. O aviso de "jogo em 10 minutos" (`JOGO_PROXIMO`) continua separado e não muda.

O caso que motivou a mudança: São Paulo × Santos em 02/10/2026 às 20:00 (Brasília). Às 13:40 o lembrete ainda não era para ter saído, porque a janela de 3 horas só abre por volta das 17:00.

## Regras de Negócio

### Aviso da manhã

1. QUANDO o job diário das 08:00 (horário de Brasília) roda, o sistema DEVE, além de agendar o `JOGO_PROXIMO`, criar `PALPITES_PENDENTES` para os jogos com status AGENDADO entre aquele instante e o fim do mesmo dia civil em Brasília.
2. O destinatário é quem ainda não tem palpite em pelo menos um desses jogos e está com a preferência `palpitesPendentes` habilitada.
3. A mensagem lista só os jogos pendentes daquele dia, não os jogos da rodada que caem em outros dias.

### Uma vez por dia

4. A deduplicação de `PALPITES_PENDENTES` DEVE ser por fase, rodada e dia civil de Brasília.
5. No mesmo dia, o aviso das 08:00 e o fallback de 3 horas geram no máximo uma notificação por usuário para aquela fase e rodada.
6. No dia seguinte da mesma rodada, quem ainda não palpitou nos jogos daquele dia DEVE receber outro aviso.

### Fallback de 3 horas

7. O cron que olha as próximas 3 horas PERMANECE. Ele cobre o caso em que o job das 08:00 não rodou.
8. Se o aviso da manhã daquele dia já foi criado, o fallback NÃO envia de novo.

### Fuso

9. "Hoje" e "fim do dia" são o dia civil de Brasília (00:00 até 23:59:59.999, offset -03:00), independente do fuso do processo.
10. Um jogo das 22:00 em Brasília entra no aviso da manhã mesmo que o servidor esteja em UTC.

## O que não muda

- `JOGO_PROXIMO` continua 10 minutos antes do apito, só para quem não palpitou, uma vez por jogo.
- Quem já palpitou em todos os jogos do dia não recebe `PALPITES_PENDENTES`.
- Preferência desligada continua suprimindo in-app e push.
