import { z } from 'zod';

// Schemas base reutilizáveis
export const schemaEmail = z
  .string({ message: 'Email é obrigatório' })
  .min(1, 'Email é obrigatório')
  .email('Email inválido');

export const schemaSenha = z
  .string({ message: 'Senha é obrigatória' })
  .min(6, 'Senha deve ter pelo menos 6 caracteres');

export const schemaNome = z
  .string({ message: 'Nome é obrigatório' })
  .min(3, 'Nome deve ter pelo menos 3 caracteres');

// Schema de login
export const schemaLogin = z.object({
  email: schemaEmail,
  senha: z.string({ message: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória'),
});

export type DadosLoginForm = z.infer<typeof schemaLogin>;

// Schema de cadastro
export const schemaCadastro = z
  .object({
    nome: schemaNome,
    email: schemaEmail,
    senha: schemaSenha,
    confirmarSenha: z.string({ message: 'Confirmação de senha é obrigatória' }).min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  });

export type DadosCadastroForm = z.infer<typeof schemaCadastro>;

// Schema de esqueci senha
export const schemaEsqueciSenha = z.object({
  email: schemaEmail,
});

export type DadosEsqueciSenhaForm = z.infer<typeof schemaEsqueciSenha>;

// Schema de resetar senha
export const schemaResetarSenha = z
  .object({
    novaSenha: schemaSenha,
    confirmarSenha: z.string({ message: 'Confirmação de senha é obrigatória' }).min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  });

export type DadosResetarSenhaForm = z.infer<typeof schemaResetarSenha>;
