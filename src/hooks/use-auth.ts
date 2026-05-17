import { useAuthStore } from '@/stores/auth.store';

export function useAuth() {
  const usuario = useAuthStore((state) => state.usuario);
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  const estaCarregando = useAuthStore((state) => state.estaCarregando);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const atualizarUsuario = useAuthStore((state) => state.atualizarUsuario);

  return {
    usuario,
    estaAutenticado,
    estaCarregando,
    login,
    logout,
    atualizarUsuario,
  };
}
