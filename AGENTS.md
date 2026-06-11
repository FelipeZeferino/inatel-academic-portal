# AGENTS.md

## Objetivo deste documento
Contexto rápido para próximos prompts sobre este repositório, com foco em decisões técnicas já presentes, comandos práticos e pontos de atenção.

## Resumo do projeto
- Nome: `inatel-academic-portal`
- Contexto: refatoração do portal acadêmico do Inatel (projeto acadêmico C14), ainda em fase inicial.
- Estado atual: base de projeto ainda próxima do template do `create-t3-app` em partes da UI.

## Stack atual
- Next.js `15.2.3` (App Router)
- React `19`
- TypeScript `5.8` (`strict: true`)
- Tailwind CSS `4`
- Better Auth `1.3`
- Prisma `6.6` + PostgreSQL
- Gerenciador de pacotes: `npm`

## Estrutura principal
- `src/app/`:
  - `page.tsx`: home atual (template + botões de login/logout)
  - `layout.tsx`: layout raiz e fonte Geist
  - `api/auth/[...all]/route.ts`: endpoint catch-all de autenticação
- `src/server/better-auth/`:
  - `config.ts`: instancia `betterAuth` com `prismaAdapter`
  - `server.ts`: helper `getSession` com cache
  - `client.ts`: `createAuthClient` para uso no client
  - `index.ts`: re-export de `auth`
- `src/server/db.ts`: instancia singleton do Prisma Client
- `prisma/schema.prisma`: schema com modelos `User`, `Session`, `Account`, `Verification`, `Post`
- `src/env.js`: validação de variáveis de ambiente com `@t3-oss/env-nextjs`
- `DESIGN.md`: diretrizes visuais (Academic Curator)

## Autenticação (estado atual)
- Rota API de auth:
  - `src/app/api/auth/[...all]/route.ts`
  - Exporta `GET` e `POST` via `toNextJsHandler(auth.handler)`.
  - Captura `/api/auth/*` por catch-all (`[...all]`).
- Configuração Better Auth:
  - `emailAndPassword.enabled = true`.
  - Banco via Prisma (`provider: postgresql`).

## Banco de dados
- `DATABASE_URL` obrigatório.
- Prisma Client é gerado em `generated/prisma`.
- Fluxo comum:
  1. `./start-database.sh`
  2. `npm run db:push`
  3. `npm run dev`

## Variáveis de ambiente
Arquivo de referência: `.env.example`.

Variáveis validadas hoje em `src/env.js`:
- `BETTER_AUTH_SECRET` (obrigatória apenas em produção)
- `DATABASE_URL`
- `NODE_ENV`

## Scripts úteis
- `npm run dev`: ambiente local (Turbopack)
- `npm run build`: build de produção
- `npm run check`: lint + typecheck
- `npm run lint` / `npm run lint:fix`
- `npm run typecheck`
- `npm run db:push`
- `npm run db:generate` (migrate dev)
- `npm run db:migrate` (deploy de migrations)
- `npm run db:studio`

## Regras de design (DESIGN.md)
- North Star: "The Academic Curator"
- Evitar separação por bordas sólidas de 1px.
- Priorizar hierarquia por tons de superfície e espaçamento.
- Paleta focada em azuis + neutros; dourado só como acento.
- Inputs sem visual "boxy", botões primários com gradiente.

## Pontos de atenção importantes
- `src/app/page.tsx` chama `auth.api.signInSocial` com `provider: "github"`, mas `config.ts` não configura provider social.
- `.env.example` tem variáveis de GitHub OAuth, porém `src/env.js` ainda não valida `BETTER_AUTH_GITHUB_CLIENT_ID`/`_SECRET`.
- `layout.tsx` e `page.tsx` ainda trazem texto/estilo padrão do template T3 (não alinhado ao domínio final do portal).
- Não há suíte de testes automatizados no repositório no momento.

## Convenções para próximos prompts
- Manter App Router (`src/app`) como padrão de rotas.
- UI de páginas deve ficar fora de `src/app/api/*`.
- Evitar commit de segredos (`.env` já está no `.gitignore`).
- `package-lock.json` deve permanecer versionado.
- Ao adicionar nova env var:
  1. atualizar `.env.example`;
  2. atualizar schema em `src/env.js`;
  3. usar via `env` (não acessar `process.env` diretamente no app).
