import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FormularioLogin } from '@/components/auth/formulario-login';

vi.mock('@/hooks/use-warm-up', () => ({
  useWarmUp: () => ({ status: 'online' }),
}));

async function preencherLogin() {
  const user = userEvent.setup();
  await user.type(screen.getByTestId('login-input-email'), 'joao@email.com');
  await user.type(screen.getByTestId('login-input-senha'), 'senha123');
  return user;
}

describe('FormularioLogin', () => {
  it('envia continuarLogado falso quando a opção está desmarcada', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<FormularioLogin onSubmit={onSubmit} />);
    const user = await preencherLogin();

    await user.click(screen.getByTestId('login-btn-entrar'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'joao@email.com',
        senha: 'senha123',
        continuarLogado: false,
      }),
    );
  });

  it('envia continuarLogado verdadeiro quando a opção está marcada', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<FormularioLogin onSubmit={onSubmit} />);
    const user = await preencherLogin();

    await user.click(screen.getByTestId('login-checkbox-continuar'));
    await user.click(screen.getByTestId('login-btn-entrar'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'joao@email.com',
        senha: 'senha123',
        continuarLogado: true,
      }),
    );
  });
});
