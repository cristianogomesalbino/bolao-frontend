'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { listarFases, listarJogosFase } from '@/services/jogo.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Jogo } from '@/types/jogo.types';

interface LogItem {
  etapa: string;
  status: 'ok' | 'erro' | 'pendente';
  detalhe?: string;
}

export default function ImportarJogosPage() {
  const router = useRouter();
  const [rodadaImportar, setRodadaImportar] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  // Buscar temporada atual (primeiro grupo do admin)
  const { data: gruposData } = useQuery({
    queryKey: ['grupos-admin'],
    queryFn: async () => {
      const response = await apiClient.get('/grupos', { params: { membro: true } });
      return response.data as Array<{ id: string; temporadaId: string }>;
    },
  });

  const temporadaId = gruposData?.[0]?.temporadaId || '';

  // Buscar fases da temporada
  const { data: fases } = useQuery({
    queryKey: ['fases-admin', temporadaId],
    queryFn: () => listarFases(temporadaId),
    enabled: !!temporadaId,
  });

  const faseAtual = fases?.[0];

  // Buscar rodada atual (menor rodada com jogos AGENDADO/EM_ANDAMENTO, ignorando ADIADO)
  const { data: jogosRodadaAtual } = useQuery({
    queryKey: ['jogos-admin-rodada', faseAtual?.id],
    queryFn: () => listarJogosFase(faseAtual!.id),
    enabled: !!faseAtual?.id,
  });

  // A API retorna rodada 4 (tem adiados). Precisamos da rodada real.
  // Buscar rodada atual e próxima para exibir
  const rodadaApi = jogosRodadaAtual?.rodadaAtual ?? null;
  const jogosRodadaApi = jogosRodadaAtual?.jogos ?? [];

  // Se todos os jogos da rodada retornada são ADIADO/FINALIZADO ou AGENDADO sem data, avançar
  const temJogosPendentes = jogosRodadaApi.some(
    (j: Jogo) => (j.status === 'AGENDADO' && !!j.dataHora) || j.status === 'EM_ANDAMENTO',
  );
  const rodadaAtual = temJogosPendentes ? rodadaApi : (rodadaApi ? rodadaApi + 1 : null);

  // Buscar próxima rodada (para referência)
  const proximaRodada = rodadaAtual ? rodadaAtual + 1 : null;

  // Buscar jogos adiados (atrasados)
  const { data: jogosAdiados, refetch: refetchAdiados } = useQuery({
    queryKey: ['jogos-admin-adiados', faseAtual?.id],
    queryFn: () => listarJogosFase(faseAtual!.id, undefined, 'ADIADO'),
    enabled: !!faseAtual?.id,
  });

  const adiados = jogosAdiados?.jogos ?? [];

  function addLog(etapa: string, status: 'ok' | 'erro' | 'pendente', detalhe?: string) {
    setLogs((prev) => [...prev, { etapa, status, detalhe }]);
  }

  function atualizarUltimoLog(status: 'ok' | 'erro', detalhe?: string) {
    setLogs((prev) =>
      prev.map((l, i) => (i === prev.length - 1 ? { ...l, status, detalhe } : l)),
    );
  }

  async function aoImportarRodada() {
    if (!faseAtual || !rodadaImportar) return;
    setErro(null);
    setLogs([]);
    setCarregando(true);

    try {
      addLog(`Importando rodada ${rodadaImportar}...`, 'pendente');
      const importRes = await apiClient.post('/jogos/importar', {
        season: 2025,
        rodada: Number(rodadaImportar),
        faseId: faseAtual.id,
      });
      const totalJogos = Array.isArray(importRes.data)
        ? importRes.data.length
        : importRes.data?.importados || '?';
      atualizarUltimoLog('ok', `${totalJogos} jogos importados`);
    } catch (error: any) {
      const mensagem = error?.mensagem || error?.message || 'Erro desconhecido';
      setErro(mensagem);
      atualizarUltimoLog('erro', mensagem);
    } finally {
      setCarregando(false);
    }
  }

  async function aoSincronizarPlacares() {
    if (!faseAtual) return;
    setSincronizando(true);
    setErro(null);
    setLogs([]);

    try {
      addLog('Sincronizando placares...', 'pendente');
      const res = await apiClient.post(`/fases/${faseAtual.id}/jogos/sincronizar`);
      const { sincronizados, jogosAtualizados } = res.data;
      atualizarUltimoLog('ok', `${sincronizados} jogos atualizados`);

      // Mostrar lista dos jogos sincronizados
      if (jogosAtualizados && jogosAtualizados.length > 0) {
        for (const j of jogosAtualizados) {
          let detalhe = '';
          if (j.status === 'FINALIZADO') {
            detalhe = `${j.golsCasa} x ${j.golsFora} — FINALIZADO`;
          } else {
            detalhe = j.status;
          }

          if (j.horarioAlterado) {
            const anterior = j.horarioAnterior
              ? new Date(j.horarioAnterior).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
              : 'sem data';
            const novo = j.horarioNovo
              ? new Date(j.horarioNovo).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
              : 'sem data';
            detalhe += ` ⏰ Horário alterado: ${anterior} → ${novo}`;
          }

          addLog(`R${j.rodada} • ${j.timeCasa} x ${j.timeFora}`, 'ok', detalhe);
        }
      }

      refetchAdiados();
    } catch (error: any) {
      const mensagem = error?.mensagem || error?.message || 'Erro ao sincronizar';
      setErro(mensagem);
      atualizarUltimoLog('erro', mensagem);
    } finally {
      setSincronizando(false);
    }
  }

  return (
    <div className="min-h-screen bg-fundo pb-20">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 bg-fundo/80 backdrop-blur-lg border-b border-white/[0.05]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="text-texto/70 hover:text-texto"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-semibold text-texto">Importar Jogos</h1>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-6 space-y-4">
        {/* Info da temporada */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-texto/40 uppercase tracking-wider">Temporada</span>
                <span className="text-sm font-medium text-texto">Brasileirão 2025</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-texto/40 uppercase tracking-wider">Fase</span>
                <span className="text-sm font-medium text-texto">{faseAtual?.nome || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-texto/40 uppercase tracking-wider">Rodada atual</span>
                <span className="text-sm font-bold text-primaria">{rodadaAtual ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-texto/40 uppercase tracking-wider">Próxima rodada</span>
                <span className="text-sm font-medium text-texto">{proximaRodada ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-texto/40 uppercase tracking-wider">Jogos atrasados</span>
                <span className={`text-sm font-bold ${adiados.length > 0 ? 'text-destaque' : 'text-texto/40'}`}>
                  {adiados.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jogos adiados */}
        {adiados.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle size={14} className="text-destaque" />
                Jogos adiados ({adiados.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {adiados.map((jogo: Jogo) => (
                  <div
                    key={jogo.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-2">
                      {jogo.timeCasa?.escudo && (
                        <img src={jogo.timeCasa.escudo} alt="" className="h-5 w-5 object-contain" />
                      )}
                      <span className="text-[11px] text-texto/70">
                        {jogo.timeCasa?.sigla || '?'} x {jogo.timeFora?.sigla || '?'}
                      </span>
                      {jogo.timeFora?.escudo && (
                        <img src={jogo.timeFora.escudo} alt="" className="h-5 w-5 object-contain" />
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-destaque/80 font-medium">
                        R{jogo.rodada} • Sem data
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Importar rodada */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Importar rodada</CardTitle>
            <CardDescription className="text-texto/40">
              Importa jogos de uma rodada específica da API externa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {erro && (
                <Alert variant="destructive">
                  <AlertDescription>{erro}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="rodada">Rodada</Label>
                <Input
                  id="rodada"
                  type="number"
                  min="1"
                  max="38"
                  value={rodadaImportar}
                  onChange={(e) => setRodadaImportar(e.target.value)}
                  placeholder={rodadaAtual ? String(rodadaAtual) : '1'}
                />
              </div>

              <Button
                className="w-full"
                onClick={aoImportarRodada}
                disabled={carregando || !rodadaImportar || !faseAtual}
              >
                {carregando ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Importando...
                  </span>
                ) : (
                  `Importar rodada ${rodadaImportar || '?'}`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sincronizar placares */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw size={16} />
              Sincronizar placares
            </CardTitle>
            <CardDescription className="text-texto/40">
              Atualiza status e placares dos jogos em andamento/agendados via API externa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={aoSincronizarPlacares}
              disabled={sincronizando || !faseAtual}
            >
              {sincronizando ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primaria border-t-transparent" />
                  Sincronizando...
                </span>
              ) : (
                'Sincronizar agora'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Log de execução */}
        {logs.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <div key={`${log.etapa}-${i}`} className="flex items-start gap-2">
                    <span className="mt-0.5">
                      {log.status === 'ok' && '✅'}
                      {log.status === 'erro' && '❌'}
                      {log.status === 'pendente' && '⏳'}
                    </span>
                    <div>
                      <p className="text-sm text-texto/70">{log.etapa}</p>
                      {log.detalhe && (
                        <p className="text-[11px] text-texto/40 font-mono">{log.detalhe}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
