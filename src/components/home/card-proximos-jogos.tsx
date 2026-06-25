'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Fase, Jogo } from '@/types/jogo.types';
import { buscarDetalhamentoJogo } from '@/services/palpite.service';
import { ListaPalpitesMembros } from '@/components/palpites/lista-palpites-membros';
import { usePalpiteCard } from '@/hooks/usePalpiteCard';
import { calcularCountdown, calcularTempoJogo } from '@/lib/jogo-helpers';

interface PropsCardProximosJogos {
  jogos: { fase: Fase; jogo: Jogo }[];
  meuPalpite?: { golsCasa: number; golsFora: number } | null;
  grupoId?: string;
  temaCopa?: boolean;
}

// --- Sub-componentes ---

interface PropsEscudoTime {
  time: { nome: string; sigla: string; escudo: string | null } | null | undefined;
  label: string;
}

function EscudoTime({ time, label }: Readonly<PropsEscudoTime>) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div className="relative h-14 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-white/30 blur-lg" />
        {time?.escudo ? (
          <Image src={time.escudo} alt={time.nome} width={56} height={56} className="relative h-14 w-14 object-contain" unoptimized />
        ) : (
          <div className="relative h-14 w-14 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
            {time?.sigla || '?'}
          </div>
        )}
      </div>
      <span className="text-[11px] text-texto font-medium text-center leading-tight max-w-[90px]">
        {time?.nome || label}
      </span>
    </div>
  );
}


// --- Componente principal ---

export function CardProximosJogos({
  jogos, meuPalpite, grupoId, temaCopa,
}: Readonly<PropsCardProximosJogos>) {
  const router = useRouter();
  const jogoDestaque = jogos[0];
  const jogosSimultaneos = jogos.slice(1);
  const dataHora = jogoDestaque.jogo.dataHora;
  const aoVivo = jogoDestaque.jogo.status === 'EM_ANDAMENTO';

  const [countdown, setCountdown] = useState(calcularCountdown(dataHora));
  const [tempoJogo, setTempoJogo] = useState(aoVivo ? calcularTempoJogo(dataHora) : '');
  const [palpitesExpandido, setPalpitesExpandido] = useState(false);

  // Countdown (só quando não ao vivo)
  useEffect(() => {
    if (aoVivo) return;
    const id = setInterval(() => setCountdown(calcularCountdown(dataHora)), 1000);
    return () => clearInterval(id);
  }, [dataHora, aoVivo]);

  // Tempo de jogo (só quando ao vivo)
  useEffect(() => {
    if (!aoVivo) return;
    setTempoJogo(calcularTempoJogo(dataHora));
    const id = setInterval(() => setTempoJogo(calcularTempoJogo(dataHora)), 30000);
    return () => clearInterval(id);
  }, [dataHora, aoVivo]);

  // Palpites do grupo (lazy)
  const { data: detalhamento, isLoading: carregandoDetalhamento } = useQuery({
    queryKey: ['detalhamento-home', grupoId, jogoDestaque.jogo.id],
    queryFn: () => buscarDetalhamentoJogo(grupoId ?? '', jogoDestaque.jogo.id),
    enabled: !!grupoId && palpitesExpandido,
    staleTime: 60_000,
  });

  function irParaPalpite() {
    const campeonato = temaCopa ? 'copa-do-mundo-2026' : 'brasileirao';
    const params = new URLSearchParams({ campeonato });
    if (jogoDestaque.jogo.id) params.set('foco', jogoDestaque.jogo.id);
    router.push(`/palpites?${params.toString()}`);
  }

  // Cores
  const corCountdownBase = temaCopa ? 'text-[#ff8c00]' : 'text-primaria-claro';
  const corCountdown = countdown.encerrado ? 'text-erro' : corCountdownBase;
  const bordaCard = temaCopa ? 'border-[#ffdf00] shadow-[0_0_12px_rgba(255,223,0,0.2)]' : 'border-primaria';

  return (
    <Card className={`${bordaCard} overflow-hidden relative`} data-testid="home-card-proximos-jogos">
      {/* Fundo temático */}
      {temaCopa ? (
        <div className="absolute inset-0 bg-gradient-to-b from-[#009c3b]/20 via-[#003d1a] to-[#ffdf00]/10" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-superficie/60 to-fundo/80" />
      )}
      <CardContent className="p-3 relative">

        {/* Header — data/hora + ver todos */}
        <HeaderCard
          dataHora={dataHora}
          aoVivo={aoVivo}
          grupoId={grupoId}
          faseNome={jogoDestaque.fase.nome}
          onVerTodos={irParaPalpite}
        />

        {/* Jogo destaque — Times + Placar */}
        <div className="flex items-center gap-2 mt-4 mb-3">
          <EscudoTime time={jogoDestaque.jogo.timeCasa} label="Casa" />

          <Colunacentral
            aoVivo={aoVivo}
            jogo={jogoDestaque.jogo}
            tempoJogo={tempoJogo}
            meuPalpite={meuPalpite}
            countdown={countdown}
            corCountdown={corCountdown}
            temaCopa={temaCopa}
            grupoId={grupoId}
          />

          <EscudoTime time={jogoDestaque.jogo.timeFora} label="Fora" />
        </div>

        {/* Footer */}
        <FooterCard
          grupoId={grupoId}
          temaCopa={temaCopa}
          palpitesExpandido={palpitesExpandido}
          onTogglePalpites={() => setPalpitesExpandido(!palpitesExpandido)}
        />

        {/* Palpites do grupo expandidos */}
        {palpitesExpandido && (
          <div className="mt-2 pt-2 border-t border-white/[0.05]">
            <PalpitesGrupoExpandido
              carregando={carregandoDetalhamento}
              detalhamento={detalhamento}
              statusJogo={jogoDestaque.jogo.status}
              temaCopa={temaCopa}
            />
          </div>
        )}

        {/* Jogos simultâneos — layout completo com accordion */}
        {jogosSimultaneos.length > 0 && jogosSimultaneos.map((item) => (
          <JogoSimultaneo
            key={item.jogo.id}
            jogo={item.jogo}
            grupoId={grupoId}
            temaCopa={temaCopa}
            corCountdown={corCountdown}
          />
        ))}

      </CardContent>
    </Card>
  );
}

// --- Header extraído para reduzir complexidade ---

interface PropsHeaderCard {
  dataHora: string;
  aoVivo: boolean;
  grupoId?: string;
  faseNome?: string;
  onVerTodos: () => void;
}

function HeaderCard({ dataHora, aoVivo, grupoId, faseNome, onVerTodos }: Readonly<PropsHeaderCard>) {
  const dataFormatada = dataHora
    ? new Date(dataHora).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).toUpperCase().replace('.', '')
      + ' • ' + new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
    : null;

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {faseNome && (
          <span className="text-[10px] font-bold text-primaria-claro uppercase tracking-wide">{faseNome}</span>
        )}
        {dataFormatada ? (
          <span className="text-[11px] text-texto/80 uppercase tracking-wide">{dataFormatada}</span>
        ) : (
          <span className="text-[9px] text-destaque font-semibold uppercase">Data a definir</span>
        )}
        {aoVivo && (
          <span className="flex items-center gap-1 text-[8px] text-erro font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-erro animate-pulse" />
            <span>AO VIVO</span>
          </span>
        )}
      </div>
      {grupoId && (
        <button onClick={onVerTodos} className="flex items-center gap-0.5 text-[11px] text-primaria-claro font-medium hover:text-primaria transition-colors">
          <span>Ver todos</span>
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

// --- Coluna central extraída ---

interface PropsColunacentral {
  aoVivo: boolean;
  jogo: Jogo;
  tempoJogo: string;
  meuPalpite?: { golsCasa: number; golsFora: number } | null;
  countdown: { texto: string; encerrado: boolean };
  corCountdown: string;
  temaCopa?: boolean;
  grupoId?: string;
}

function Colunacentral({ aoVivo, jogo, tempoJogo, meuPalpite, countdown, corCountdown, temaCopa, grupoId }: Readonly<PropsColunacentral>) {
  const corTempo = temaCopa ? 'text-[#ff8c00]' : 'text-primaria-claro';
  const corPalpiteBg = temaCopa ? 'bg-[#ffdf00]/10' : 'bg-primaria/10';
  const corPalpiteTexto = temaCopa ? 'text-[#ffdf00]/90' : 'text-primaria-claro/80';

  const {
    golsCasa, golsFora, jaPalpitou, salvando, salvoFeedback, inputsRef,
    handleSetGolsCasa, handleSetGolsFora, salvar,
  } = usePalpiteCard({
    jogoId: jogo.id,
    grupoId,
    palpiteInicial: meuPalpite
      ? { id: '', jogoId: jogo.id, usuarioId: '', golsCasa: meuPalpite.golsCasa, golsFora: meuPalpite.golsFora, dataCriacao: '', atualizadoEm: '' }
      : null,
  });

  if (aoVivo) {
    return (
      <div className="flex flex-col items-center shrink-0 w-[130px] py-1">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-texto">{jogo.golsCasa ?? 0}</span>
          <span className="text-[10px] text-texto/20">×</span>
          <span className="text-2xl font-bold text-texto">{jogo.golsFora ?? 0}</span>
        </div>
        <span className={`text-[10px] font-semibold mt-0.5 ${corTempo}`}>{tempoJogo}</span>
        {meuPalpite && (
          <span className={`text-[9px] font-medium mt-1 px-2 py-0.5 rounded-full ${corPalpiteBg} ${corPalpiteTexto}`}>
            Meu Palpite: {meuPalpite.golsCasa} × {meuPalpite.golsFora}
          </span>
        )}
      </div>
    );
  }

  // Agendado — inputs ou palpite salvo
  const palpitavel = !countdown.encerrado;

  function renderCentro() {
    if (palpitavel && !jaPalpitou) {
      return (
        <div ref={inputsRef} className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete="off"
            value={golsCasa === '' ? '' : golsCasa}
            placeholder="-"
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 1);
              handleSetGolsCasa(raw === '' ? '' : Math.min(9, Number.parseInt(raw, 10)));
            }}
            onFocus={(e) => e.target.select()}
            onBlur={salvar}
            className="w-11 h-12 rounded-lg bg-black/60 border border-white/[0.12] text-center text-2xl font-bold text-texto outline-none focus:border-primaria focus:ring-1 focus:ring-primaria transition-colors"
            disabled={salvando}
          />
          <span className="text-sm font-bold text-texto/40">x</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete="off"
            value={golsFora === '' ? '' : golsFora}
            placeholder="-"
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 1);
              handleSetGolsFora(raw === '' ? '' : Math.min(9, Number.parseInt(raw, 10)));
            }}
            onFocus={(e) => e.target.select()}
            onBlur={salvar}
            className="w-11 h-12 rounded-lg bg-black/60 border border-white/[0.12] text-center text-2xl font-bold text-texto outline-none focus:border-primaria focus:ring-1 focus:ring-primaria transition-colors"
            disabled={salvando}
          />
        </div>
      );
    }
    if (jaPalpitou) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-11 h-12 rounded-lg bg-black/60 border border-primaria/40 flex items-center justify-center">
            <span className="text-2xl font-bold text-primaria-claro">{golsCasa}</span>
          </div>
          <span className="text-sm font-bold text-texto/40">x</span>
          <div className="w-11 h-12 rounded-lg bg-black/60 border border-primaria/40 flex items-center justify-center">
            <span className="text-2xl font-bold text-primaria-claro">{golsFora}</span>
          </div>
        </div>
      );
    }
    return <span className="text-lg font-bold text-texto/25">VS</span>;
  }

  return (
    <div className="flex flex-col items-center shrink-0 w-[130px] py-2">
      {renderCentro()}
      <span className={`text-lg font-mono font-bold tabular-nums mt-1 ${corCountdown}`}>{countdown.texto}</span>
      {salvoFeedback && (
        <span className="text-[9px] text-primaria-claro mt-1">✓ Salvo!</span>
      )}
      {jaPalpitou && !salvoFeedback && (
        <span className={`text-[9px] font-medium mt-1 px-2 py-0.5 rounded-full ${corPalpiteBg} ${corPalpiteTexto}`}>
          Meu Palpite: {golsCasa} × {golsFora}
        </span>
      )}
    </div>
  );
}


// --- Palpites expandidos extraído ---

interface PropsPalpitesGrupoExpandido {
  carregando: boolean;
  detalhamento: { usuarioId: string; nomeUsuario: string; golsCasaPalpite: number | null; golsForaPalpite: number | null; pontosFinais: number | null; categoriaAcerto: string | null }[] | undefined;
  statusJogo: string;
  temaCopa?: boolean;
}

function PalpitesGrupoExpandido({ carregando, detalhamento, statusJogo, temaCopa }: Readonly<PropsPalpitesGrupoExpandido>) {
  if (carregando) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 size={16} className="animate-spin text-primaria-claro/60" />
      </div>
    );
  }
  if (detalhamento && detalhamento.length > 0) {
    return <ListaPalpitesMembros detalhamento={detalhamento} statusJogo={statusJogo} temaCopa={temaCopa} />;
  }
  return <p className="text-[10px] text-texto/30 text-center py-2">Nenhum palpite ainda</p>;
}


// --- Footer extraído ---

interface PropsFooterCard {
  grupoId?: string;
  temaCopa?: boolean;
  palpitesExpandido: boolean;
  onTogglePalpites: () => void;
}

function FooterCard({
  grupoId, temaCopa, palpitesExpandido, onTogglePalpites,
}: Readonly<PropsFooterCard>) {
  const corTexto = temaCopa ? 'text-[#ffdf00]/80' : 'text-texto/70';
  const label = 'Ver palpites do grupo';

  if (!grupoId) return null;

  return (
    <div className="flex items-center justify-center mt-1 pt-1 border-t border-white/[0.05]">
      <button type="button" onClick={onTogglePalpites} className="flex items-center gap-1">
        <span className={`text-[10px] font-semibold ${corTexto}`}>{label}</span>
        <ChevronDown size={16} className={`${corTexto} transition-transform`} style={{ transform: palpitesExpandido ? 'rotate(180deg)' : 'none' }} />
      </button>
    </div>
  );
}


// --- Jogo simultâneo com accordion ---

interface PropsJogoSimultaneo {
  jogo: Jogo;
  grupoId?: string;
  temaCopa?: boolean;
  corCountdown: string;
}

function JogoSimultaneo({ jogo, grupoId, temaCopa, corCountdown }: Readonly<PropsJogoSimultaneo>) {
  const [expandido, setExpandido] = useState(false);
  const aoVivo = jogo.status === 'EM_ANDAMENTO';
  const corTexto = temaCopa ? 'text-[#ffdf00]/80' : 'text-texto/70';

  const { data: detalhamento, isLoading: carregando } = useQuery({
    queryKey: ['detalhamento-home', grupoId, jogo.id],
    queryFn: () => buscarDetalhamentoJogo(grupoId ?? '', jogo.id),
    enabled: !!grupoId && expandido,
    staleTime: 60_000,
  });

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.05]">
      {/* Hora + status */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {jogo.dataHora ? (
          <span className="text-[10px] text-texto/60">
            {new Date(jogo.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
          </span>
        ) : null}
        {aoVivo && (
          <span className="flex items-center gap-1 text-[8px] text-erro font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-erro animate-pulse" />
            <span>AO VIVO</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <EscudoTime time={jogo.timeCasa} label="Casa" />
        <Colunacentral
          aoVivo={aoVivo}
          jogo={jogo}
          tempoJogo={aoVivo ? calcularTempoJogo(jogo.dataHora) : ''}
          meuPalpite={null}
          countdown={calcularCountdown(jogo.dataHora)}
          corCountdown={corCountdown}
          temaCopa={temaCopa}
        />
        <EscudoTime time={jogo.timeFora} label="Fora" />
      </div>

      {/* Accordion — ver palpites */}
      {grupoId && (
        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          className="flex items-center justify-center gap-1 w-full mt-2"
        >
          <span className={`text-[10px] font-semibold ${corTexto}`}>Ver palpites do grupo</span>
          <ChevronDown size={14} className={`${corTexto} transition-transform`} style={{ transform: expandido ? 'rotate(180deg)' : 'none' }} />
        </button>
      )}

      {expandido && (
        <div className="mt-2 pt-2 border-t border-white/[0.05]">
          <PalpitesGrupoExpandido
            carregando={carregando}
            detalhamento={detalhamento}
            statusJogo={jogo.status}
            temaCopa={temaCopa}
          />
        </div>
      )}
    </div>
  );
}
