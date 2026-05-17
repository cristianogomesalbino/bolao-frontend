import { useQuery } from '@tanstack/react-query';
import { buscarPerfil } from '@/services/usuario.service';
import { useAuthStore } from '@/stores/auth.store';

export function useUsuario() {
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);

  return useQuery({
    queryKey: ['usuario', 'perfil'],
    queryFn: buscarPerfil,
    enabled: estaAutenticado,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
