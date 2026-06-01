'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, ChevronRight, Star } from 'lucide-react';

interface Grupo {
  id: string;
  nome: string;
  participantes: number;
  palpitesRestantes?: number;
}

interface PropsCardMeusGrupos {
  grupos: Grupo[];
  carregando?: boolean;
  grupoFavoritoId?: string | null;
  onDefinirFavorito?: (grupoId: string) => void;
}

export function CardMeusGrupos({ grupos, carregando, grupoFavoritoId, onDefinirFavorito }: Readonly<PropsCardMeusGrupos>) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">🏆</span>
            <span className="text-[11px] text-texto/40 uppercase tracking-wider font-medium">
              Meus grupos
            </span>
          </div>
          <span className="text-[10px] text-link/60 cursor-pointer hover:text-link transition-colors">
            Ver todos
          </span>
        </div>

        {carregando ? (
          <div className="space-y-2 py-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : grupos.length === 0 ? (
          <p className="text-sm text-texto/40 text-center py-4">
            Você ainda não participa de nenhum grupo
          </p>
        ) : (
          <div className="space-y-1">
            {grupos.map((grupo) => {
              const ehFavorito = grupo.id === grupoFavoritoId;
              return (
                <div
                  key={grupo.id}
                  className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  {/* Estrela de favorito */}
                  {grupos.length > 1 && onDefinirFavorito && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!ehFavorito) onDefinirFavorito(grupo.id);
                      }}
                      className="mr-2 shrink-0"
                      aria-label={ehFavorito ? 'Grupo favorito' : 'Definir como favorito'}
                    >
                      <Star
                        size={16}
                        className={`transition-colors ${
                          ehFavorito
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-texto/20 hover:text-yellow-400/60'
                        }`}
                      />
                    </button>
                  )}
                  <div className="flex-1">
                    <span className="text-sm text-texto/80 font-medium group-hover:text-texto transition-colors">
                      {grupo.nome}
                    </span>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1 text-texto/30">
                        <Users size={11} />
                        <span className="text-[10px]">{grupo.participantes}</span>
                      </div>
                      {grupo.palpitesRestantes !== undefined && grupo.palpitesRestantes > 0 && (
                        <span className="text-[10px] text-destaque/60">
                          {grupo.palpitesRestantes} palpites restantes
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-texto/20 group-hover:text-texto/40 transition-colors" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
