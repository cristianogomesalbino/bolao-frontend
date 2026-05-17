# Requirements Document

## Introduction

Frontend PWA para o sistema de bolão de futebol, focado no módulo de autenticação. A aplicação será construída com Next.js 15 (App Router), Tailwind CSS + shadcn/ui, com design mobile-first e visual esportivo/colorido. O backend já existe (NestJS + Prisma + PostgreSQL) e expõe endpoints REST para autenticação e gerenciamento de usuários. Esta especificação cobre o scaffolding do projeto, infraestrutura de autenticação, e todas as páginas do fluxo de login/registro/recuperação de senha.

## Glossário

- **Aplicacao**: A aplicação frontend PWA (Next.js 15 App Router)
- **Cliente_API**: Módulo HTTP configurado com interceptors para comunicação com o backend
- **Store_Auth**: Store de estado de autenticação (contexto React ou Zustand)
- **Gerenciador_Token**: Módulo responsável por armazenar, recuperar e renovar tokens JWT
- **Pagina_Login**: Página de autenticação com formulário de email e senha
- **Pagina_Cadastro**: Página de criação de nova conta de usuário
- **Pagina_Esqueci_Senha**: Página para solicitar recuperação de senha
- **Pagina_Resetar_Senha**: Página para definir nova senha via token de recuperação
- **Rota_Protegida**: Rota que requer autenticação para acesso
- **Service_Worker**: Worker registrado para funcionalidades PWA (cache, offline)
- **Token_Acesso**: JWT de curta duração (15min) para autenticação de requisições
- **Token_Refresh**: JWT de longa duração (7d) para renovação do token de acesso

## Requisitos

### Requisito 1: Scaffolding do Projeto

**User Story:** Como desenvolvedor, quero um projeto Next.js 15 bem estruturado com todas as ferramentas configuradas, para construir features de forma eficiente sobre uma base sólida.

#### Critérios de Aceitação

1. A Aplicacao DEVE ser criada com Next.js 15 usando o App Router
2. A Aplicacao DEVE incluir Tailwind CSS configurado com uma paleta de cores esportiva/colorida
3. A Aplicacao DEVE incluir a biblioteca shadcn/ui configurada e pronta para uso
4. A Aplicacao DEVE incluir um arquivo manifest PWA com nome "Bolão", cor do tema, ícones e display mode "standalone"
5. A Aplicacao DEVE registrar um Service_Worker para cache básico de assets
6. A Aplicacao DEVE incluir React Hook Form e Zod como dependências de formulários e validação
7. A Aplicacao DEVE incluir TanStack Query configurado como camada de data fetching
8. A Aplicacao DEVE usar TypeScript com strict mode habilitado

### Requisito 2: Estrutura de Pastas Escalável

**User Story:** Como desenvolvedor, quero uma estrutura de pastas modular que suporte crescimento futuro, para que adicionar novos módulos (grupos, palpites, ranking) seja simples.

#### Critérios de Aceitação

1. A Aplicacao DEVE organizar o código-fonte nos seguintes diretórios top-level: `app/`, `components/`, `lib/`, `hooks/`, `services/`, `stores/`, `types/`
2. A Aplicacao DEVE agrupar componentes específicos de feature em diretórios `components/[feature]/`
3. A Aplicacao DEVE colocar primitivos de UI compartilhados em `components/ui/`
4. A Aplicacao DEVE colocar funções de serviço da API em `services/` agrupados por módulo do backend
5. A Aplicacao DEVE colocar hooks customizados reutilizáveis em `hooks/`
6. A Aplicacao DEVE colocar stores Zustand ou contextos React em `stores/`
7. A Aplicacao DEVE colocar definições de tipos TypeScript em `types/`

### Requisito 3: Configuração do Cliente API

**User Story:** Como desenvolvedor, quero um cliente HTTP centralizado com gerenciamento automático de tokens, para que todas as chamadas à API sejam autenticadas sem intervenção manual.

#### Critérios de Aceitação

1. O Cliente_API DEVE ser configurado com a URL base do backend a partir de variáveis de ambiente
2. O Cliente_API DEVE anexar o Token_Acesso como Bearer token no header Authorization de toda requisição autenticada
3. QUANDO uma requisição receber resposta 401, O Cliente_API DEVE tentar renovar o Token_Acesso usando o Token_Refresh
4. QUANDO a renovação do token for bem-sucedida, O Cliente_API DEVE reenviar a requisição original com o novo Token_Acesso
5. QUANDO a renovação do token falhar, O Cliente_API DEVE limpar os tokens armazenados e redirecionar o usuário para a Pagina_Login
6. O Cliente_API DEVE enfileirar requisições concorrentes durante a renovação do token e resolvê-las após obter o novo token
7. SE ocorrer um erro de rede, ENTÃO O Cliente_API DEVE retornar um objeto de erro estruturado com mensagem amigável em português

### Requisito 4: Gerenciamento de Tokens

**User Story:** Como usuário, quero que minha sessão persista entre recarregamentos de página e se renove automaticamente, para não precisar fazer login repetidamente.

#### Critérios de Aceitação

1. O Gerenciador_Token DEVE armazenar o Token_Acesso e Token_Refresh de forma segura em memória e persistir o Token_Refresh em cookie httpOnly ou storage seguro
2. O Gerenciador_Token DEVE fornecer métodos para recuperar, atualizar e limpar tokens armazenados
3. QUANDO a Aplicacao carregar, O Gerenciador_Token DEVE verificar a existência de um Token_Refresh e tentar obter um novo Token_Acesso
4. O Gerenciador_Token DEVE expor o estado de autenticação (autenticado, carregando, não-autenticado) para o Store_Auth

### Requisito 5: Store de Auth e Rotas Protegidas

**User Story:** Como usuário, quero ser redirecionado para o login ao acessar conteúdo protegido sem autenticação, para que meus dados permaneçam seguros.

#### Critérios de Aceitação

1. O Store_Auth DEVE manter o perfil do usuário atual (id, nome, email, perfil) quando autenticado
2. O Store_Auth DEVE expor um booleano `estaAutenticado` e um booleano `estaCarregando` para consumo da UI
3. QUANDO um usuário não-autenticado navegar para uma Rota_Protegida, A Aplicacao DEVE redirecionar o usuário para a Pagina_Login
4. QUANDO um usuário autenticado navegar para a Pagina_Login ou Pagina_Cadastro, A Aplicacao DEVE redirecionar o usuário para a página inicial
5. O Store_Auth DEVE fornecer as ações `login`, `logout` e `atualizarUsuario`

### Requisito 6: Página de Login

**User Story:** Como usuário, quero fazer login com meu email e senha em uma página otimizada para celular, para acessar meus bolões.

#### Critérios de Aceitação

1. A Pagina_Login DEVE exibir um formulário com campos de email e senha
2. A Pagina_Login DEVE validar que o campo email contém um formato de email válido antes do envio
3. A Pagina_Login DEVE validar que o campo senha não está vazio antes do envio
4. A Pagina_Login DEVE exibir erros de validação inline em português abaixo de cada campo inválido
5. QUANDO o usuário enviar credenciais válidas, A Pagina_Login DEVE enviar um POST para `/auth/login` com `{ email, senha }`
6. QUANDO o login for bem-sucedido, A Pagina_Login DEVE armazenar os tokens recebidos e redirecionar o usuário para a página inicial
7. QUANDO o backend retornar "Credenciais inválidas", A Pagina_Login DEVE exibir a mensagem "Email ou senha incorretos" acima do formulário
8. A Pagina_Login DEVE exibir um indicador de carregamento no botão de envio durante a requisição
9. A Pagina_Login DEVE incluir um link para a Pagina_Cadastro com texto "Criar conta"
10. A Pagina_Login DEVE incluir um link para a Pagina_Esqueci_Senha com texto "Esqueci minha senha"
11. A Pagina_Login DEVE usar um layout responsivo mobile-first com estilo visual esportivo
12. A Pagina_Login DEVE ser acessível com labels de formulário, atributos ARIA e navegação por teclado adequados

### Requisito 7: Página de Cadastro

**User Story:** Como novo usuário, quero criar uma conta com meu nome, email e senha, para participar de bolões.

#### Critérios de Aceitação

1. A Pagina_Cadastro DEVE exibir um formulário com campos de nome, email, senha e confirmação de senha
2. A Pagina_Cadastro DEVE validar que o campo nome tem pelo menos 3 caracteres
3. A Pagina_Cadastro DEVE validar que o campo email contém um formato de email válido
4. A Pagina_Cadastro DEVE validar que o campo senha tem pelo menos 6 caracteres
5. A Pagina_Cadastro DEVE validar que a confirmação de senha corresponde ao campo senha
6. A Pagina_Cadastro DEVE exibir erros de validação inline em português abaixo de cada campo inválido
7. QUANDO o usuário enviar um formulário válido, A Pagina_Cadastro DEVE enviar um POST para `/usuarios` com `{ nome, email, senha }`
8. QUANDO o cadastro for bem-sucedido, A Pagina_Cadastro DEVE exibir uma mensagem de sucesso e redirecionar o usuário para a Pagina_Login
9. QUANDO o backend retornar erro de conflito (email já cadastrado), A Pagina_Cadastro DEVE exibir "Este email já está cadastrado"
10. A Pagina_Cadastro DEVE exibir um indicador de carregamento no botão de envio durante a requisição
11. A Pagina_Cadastro DEVE incluir um link para a Pagina_Login com texto "Já tenho conta"
12. A Pagina_Cadastro DEVE usar um layout responsivo mobile-first consistente com o estilo da Pagina_Login
13. A Pagina_Cadastro DEVE ser acessível com labels de formulário, atributos ARIA e navegação por teclado adequados

### Requisito 8: Página Esqueci Senha

**User Story:** Como usuário que esqueceu a senha, quero solicitar um email de recuperação, para recuperar o acesso à minha conta.

#### Critérios de Aceitação

1. A Pagina_Esqueci_Senha DEVE exibir um formulário com um campo de email
2. A Pagina_Esqueci_Senha DEVE validar que o campo email contém um formato de email válido antes do envio
3. QUANDO o usuário enviar um email válido, A Pagina_Esqueci_Senha DEVE enviar um POST para `/auth/esqueci-senha` com `{ email }`
4. QUANDO a requisição for bem-sucedida, A Pagina_Esqueci_Senha DEVE exibir a mensagem "Se o email estiver cadastrado, você receberá instruções para recuperar sua senha"
5. A Pagina_Esqueci_Senha DEVE exibir a mesma mensagem de confirmação independente de o email existir no sistema (para prevenir enumeração de emails)
6. A Pagina_Esqueci_Senha DEVE exibir um indicador de carregamento no botão de envio durante a requisição
7. A Pagina_Esqueci_Senha DEVE incluir um link de volta para a Pagina_Login com texto "Voltar ao login"
8. A Pagina_Esqueci_Senha DEVE usar um layout responsivo mobile-first consistente com o estilo da Pagina_Login

### Requisito 9: Página Resetar Senha

**User Story:** Como usuário com um token de recuperação, quero definir uma nova senha, para acessar minha conta novamente.

#### Critérios de Aceitação

1. A Pagina_Resetar_Senha DEVE extrair o token de recuperação do parâmetro de query da URL
2. A Pagina_Resetar_Senha DEVE exibir um formulário com campos de nova senha e confirmação de senha
3. A Pagina_Resetar_Senha DEVE validar que a nova senha tem pelo menos 6 caracteres
4. A Pagina_Resetar_Senha DEVE validar que a confirmação de senha corresponde ao campo nova senha
5. QUANDO o usuário enviar um formulário válido, A Pagina_Resetar_Senha DEVE enviar um POST para `/auth/resetar-senha` com `{ token, novaSenha }`
6. QUANDO o reset for bem-sucedido, A Pagina_Resetar_Senha DEVE exibir a mensagem "Senha alterada com sucesso" e fornecer um link para a Pagina_Login
7. QUANDO o backend retornar "Token inválido ou expirado", A Pagina_Resetar_Senha DEVE exibir "Link de recuperação inválido ou expirado. Solicite um novo."
8. SE a URL não contiver um parâmetro de token válido, ENTÃO A Pagina_Resetar_Senha DEVE exibir uma mensagem de erro e um link para a Pagina_Esqueci_Senha

### Requisito 10: Configuração PWA

**User Story:** Como usuário mobile, quero instalar o app na minha tela inicial e ter suporte offline básico, para ter uma experiência nativa.

#### Critérios de Aceitação

1. A Aplicacao DEVE incluir um `manifest.json` com name "Bolão", short_name "Bolão", start_url "/", display "standalone" e cores de tema/background apropriadas
2. A Aplicacao DEVE incluir ícones do app nos tamanhos 192x192 e 512x512
3. O Service_Worker DEVE cachear assets estáticos (JS, CSS, imagens) usando estratégia cache-first
4. O Service_Worker DEVE cachear respostas da API para o perfil do usuário usando estratégia network-first
5. QUANDO o dispositivo estiver offline, A Aplicacao DEVE exibir um indicador de offline amigável
6. A Aplicacao DEVE incluir meta tags apropriadas para capacidade de web app mobile (viewport, theme-color, apple-mobile-web-app-capable)

### Requisito 11: Design Responsivo Mobile-First

**User Story:** Como usuário mobile, quero que todas as páginas de auth sejam otimizadas para telas de celular, para usar o app confortavelmente no meu dispositivo principal.

#### Critérios de Aceitação

1. A Aplicacao DEVE usar abordagem mobile-first onde estilos base visam telas de 320px ou mais
2. A Aplicacao DEVE garantir que todos os inputs de formulário tenham tamanho mínimo de toque de 44x44 pixels
3. A Aplicacao DEVE garantir que inputs de texto usem atributos `inputMode` e `autocomplete` apropriados para teclados mobile
4. A Aplicacao DEVE exibir páginas de auth em layout de coluna única centralizado no mobile com padding apropriado
5. ENQUANTO a largura do viewport exceder 768px, A Aplicacao DEVE restringir o conteúdo do formulário de auth a uma largura máxima de 400px centralizado na tela
6. A Aplicacao DEVE usar tamanhos de fonte não menores que 16px para inputs de formulário para prevenir zoom do iOS no foco
