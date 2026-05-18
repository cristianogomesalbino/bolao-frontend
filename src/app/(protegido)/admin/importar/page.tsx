'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LogItem {
  etapa: string;
  status: 'ok' | 'erro' | 'pendente';
  detalhe?: string;
}

export default function ImportarJogosPage() {
  const router = useRouter();
  const [season, setSeason] = useState('2025');
  const [rodada, setRodada] = useState('1');
  const [carregando, setCarregando] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  function addLog(etapa: string, status: 'ok' | 'erro' | 'pendente', detalhe?: string) {
    setLogs((prev) => [...prev, { etapa, status, detalhe }]);
  }

  async function aoImportarTudo() {
    setErro(null);
    setLogs([]);
    setCarregando(true);

    try {
      // 1. Criar campeonato
      addLog('Criando campeonato...', 'pendente');
      const campRes = await apiClient.post('/campeonatos', { nome: 'Brasileirão Série A' });
      const campeonatoId = campRes.data.id;
      setLogs((prev) => prev.map((l, i) => i === prev.length - 1 ? { ...l, status: 'ok', detalhe: `ID: ${campeonatoId}` } : l));

      // 2. Criar temporada
      addLog('Criando temporada...', 'pendente');
      const tempRes = await apiClient.post('/temporadas', { ano: Number(season), campeonatoId });
      const temporadaId = tempRes.data.id;
      setLogs((prev) => prev.map((l, i) => i === prev.length - 1 ? { ...l, status: 'ok', detalhe: `ID: ${temporadaId}` } : l));

      // 3. Criar fase
      addLog('Criando fase...', 'pendente');
      const faseRes = await apiClient.post(`/temporadas/${temporadaId}/fases`, {
        nome: 'Fase Única',
        tipo: 'PONTOS_CORRIDOS',
        ordem: 1,
      });
      const faseId = faseRes.data.id;
      setLogs((prev) => prev.map((l, i) => i === prev.length - 1 ? { ...l, status: 'ok', detalhe: `ID: ${faseId}` } : l));

      // 4. Importar jogos
      addLog(`Importando rodada ${rodada}...`, 'pendente');
      const importRes = await apiClient.post('/jogos/importar', {
        season: Number(season),
        rodada: Number(rodada),
        faseId,
      });
      const totalJogos = Array.isArray(importRes.data) ? importRes.data.length : importRes.data?.importados || '?';
      setLogs((prev) => prev.map((l, i) => i === prev.length - 1 ? { ...l, status: 'ok', detalhe: `${totalJogos} jogos importados` } : l));

    } catch (error: any) {
      const mensagem = error?.mensagem || error?.message || 'Erro desconhecido';
      setErro(mensagem);
      setLogs((prev) => prev.map((l, i) => i === prev.length - 1 ? { ...l, status: 'erro', detalhe: mensagem } : l));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-fundo">
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
        <span className="text-[10px] bg-destaque/20 text-destaque px-2 py-0.5 rounded-full uppercase tracking-wider">
          temp
        </span>
      </header>

      <div className="mx-auto max-w-[480px] px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Setup completo</CardTitle>
            <CardDescription className="text-texto/40">
              Cria campeonato + temporada + fase + importa jogos da rodada. Tudo de uma vez.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {erro && (
                <Alert variant="destructive">
                  <AlertDescription>{erro}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="season">Temporada</Label>
                  <Input
                    id="season"
                    type="number"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="2025"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rodada">Rodada</Label>
                  <Input
                    id="rodada"
                    type="number"
                    min="1"
                    max="38"
                    value={rodada}
                    onChange={(e) => setRodada(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={aoImportarTudo}
                disabled={carregando || !season || !rodada}
              >
                {carregando ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processando...
                  </span>
                ) : (
                  '🚀 Criar tudo e importar rodada'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Log de execução */}
        {logs.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
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
