export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'SUPER_ADMIN' | 'USER';
  grupoFavoritoId: string | null;
  toursCompletos: string[];
  dicasDispensadas: string[];
  toastDescobrilidadeVisto: boolean;
}
