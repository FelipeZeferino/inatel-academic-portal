# Portal Acadêmico do Inatel

Refatoração conceitual do portal acadêmico do Inatel com foco em modernização e usabilidade. Projeto acadêmico da disciplina **C14 — Engenharia de Software**.

## Stack

| Camada         | Tecnologia              |
| -------------- | ----------------------- |
| Framework      | Next.js 15 (App Router) |
| Linguagem      | TypeScript 5 (strict)   |
| Estilização    | Tailwind CSS 4          |
| Autenticação   | Better Auth 1.3         |
| ORM            | Prisma 6                |
| Banco de dados | PostgreSQL              |
| Testes         | Vitest 3                |
| CI/CD          | GitLab CI               |

## Pré-requisitos

- Node.js >= 20 (recomendado; mínimo 18)
- npm >= 10
- Docker ou Podman — para o banco de dados local

> ⚠️ **Atenção:** O projeto usa `npm` como gerenciador de pacotes. **Não use `pnpm` ou `yarn`** — o `.npmrc` contém configurações específicas para npm.

## Configuração do ambiente local

### 1. Clone o repositório e instale as dependências

```bash
git clone https://github.com/C14-INATEL/inatel-academic-portal.git
cd inatel-academic-portal
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` gerado:

```env
# URL base da aplicação (opcional em dev, padrão: http://localhost:3000)
BETTER_AUTH_URL="http://localhost:3000"

# Chave secreta para sessões — gere com o comando abaixo:
# openssl rand -base64 32
BETTER_AUTH_SECRET="cole-o-resultado-aqui"

# Gerada automaticamente pelo start-database.sh — não altere manualmente
DATABASE_URL="postgresql://postgres:senha@localhost:5432/inatel-academic-portal"

# Necessário apenas para usar o assistente de IA do aluno (opcional)
OPENAI_API_KEY=""
```

### 3. Banco de dados

Suba o container PostgreSQL e aplique o schema:

```bash
chmod +x ./start-database.sh
./start-database.sh
npm run db:push
```

> O script `start-database.sh` cria e inicia o container automaticamente.
> Se o container já existir e estiver parado: `docker start inatel-academic-portal-postgres`

### 4. Dados iniciais (opcional, recomendado para desenvolvimento)

```bash
npm run db:seed
```

Usuários criados pelo seed:

| Papel     | E-mail                      | Senha           |
| --------- | --------------------------- | --------------- |
| Admin     | `admin@inatel.br`           | `Admin@123456`  |
| Professor | `carlos.henrique@inatel.br` | `Professor@123` |
| Professor | `marina.souza@inatel.br`    | `Professor@123` |
| Aluno     | `ana.beatriz@inatel.br`     | `Aluno@123`     |
| Aluno     | `lucas.pereira@inatel.br`   | `Aluno@123`     |
| Aluno     | `julia.martins@inatel.br`   | `Aluno@123`     |

> O seed é idempotente — pode ser rodado múltiplas vezes sem duplicar dados.

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Funcionalidades

### Área do Professor

- **Dashboard** com resumo de disciplinas, alunos e provas agendadas
- **Gerenciar Disciplinas:** criar disciplinas (nome, código, semestre, carga horária, encontros semanais), listar alunos matriculados e provas por disciplina
- **Adicionar Alunos:** matricular alunos por e-mail em cada disciplina
- **Lançar Notas:** registrar média final e faltas por aluno em cada disciplina, com cálculo automático de situação (Aprovado / Reprovado por nota / Reprovado por faltas)
- **Agendar Provas:** criar avaliações com título, data, sala e conteúdo programático; excluir provas agendadas
- **Relatórios:** visão consolidada por disciplina com média da turma, taxa de aprovação, alunos em risco de reprovação por faltas

### Área do Aluno

- **Dashboard** com disciplinas matriculadas, médias e faltas
- **Assistente de IA** para dúvidas acadêmicas (requer `OPENAI_API_KEY`)
- **Informações** acadêmicas pessoais

---

## Testes unitários

Os testes ficam em `tests/unit/` e são executados com:

```bash
npm run test:unit
```

Para gerar relatório de cobertura:

```bash
npm run test:unit:coverage
```

Os testes cobrem as seguintes áreas, todas com mocks via `vi.mock` do Vitest (sem dependência de banco ou sessão real):

| Arquivo de teste                           | O que valida                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `professor/dashboard.utils.test.ts`        | Funções de agregação e filtragem do dashboard do professor                                                      |
| `api/professor-service.test.ts`            | Autenticação do professor, validação e criação de disciplinas, matrícula de alunos                              |
| `api/professor-context-edge-cases.test.ts` | Casos de borda na autenticação do professor (sessão expirada, role inválido)                                    |
| `api/professor-notes-service.test.ts`      | Validação de notas e faltas, agendamento e remoção de provas, lançamento de notas, isolamento entre professores |
| `api/aluno-auth.test.ts`                   | Autenticação e autorização de alunos                                                                            |
| `api/aluno-auth-advanced.test.ts`          | Casos avançados de autenticação de alunos                                                                       |
| `ai/student-assistant.utils.test.ts`       | Utilitários do assistente de IA do aluno                                                                        |
| `app/login/page.test.tsx`                  | Renderização da página de login                                                                                 |
| `components/StudentAiChat.test.tsx`        | Componente de chat com IA                                                                                       |

---

## Scripts disponíveis

| Comando                      | Descrição                                      |
| ---------------------------- | ---------------------------------------------- |
| `npm run dev`                | Servidor de desenvolvimento (Turbopack)        |
| `npm run build`              | Build de produção                              |
| `npm run check`              | Lint + typecheck                               |
| `npm run test:unit`          | Testes unitários (Vitest)                      |
| `npm run test:unit:coverage` | Testes com relatório de cobertura              |
| `npm run db:generate`        | Cria migration a partir do schema              |
| `npm run db:migrate`         | Aplica migrations pendentes (produção/CI)      |
| `npm run db:push`            | Sync direto sem migration (prototipagem local) |
| `npm run db:seed`            | Popula o banco com dados iniciais              |
| `npm run db:studio`          | Abre o Prisma Studio                           |
| `npm run format:write`       | Formata o código com Prettier                  |

---

## Solução de problemas de instalação

### Erro `ERESOLVE` ou `peer dependency conflict` ao rodar `npm install`

**Causa:** React 19 (usado neste projeto) ainda não é oficialmente suportado por algumas dependências (ex: `@testing-library/react`, `@auth/prisma-adapter`), que declaram peer deps para React 18.

**Solução:** Use o flag `--legacy-peer-deps`:

```bash
npm install --legacy-peer-deps
```

### Erro `prisma generate` durante o `npm install`

O `postinstall` roda `prisma generate` automaticamente. Se o banco ainda não foi configurado, o Prisma pode emitir um aviso — isso é normal e não impede a instalação.

### Erro de conexão ao rodar `npm run dev`

Verifique se o container do banco está rodando:

```bash
docker ps | grep inatel
# Se não aparecer:
docker start inatel-academic-portal-postgres
```

---

## Trabalhando com migrations

O projeto usa **Prisma Migrate** para versionar o schema do banco de dados.

### Fluxo de desenvolvimento

```
Editar prisma/schema.prisma
        ↓
npm run db:generate      ← gera a migration e atualiza o banco local
        ↓
Revisar o SQL gerado em prisma/migrations/
        ↓
Commitar schema.prisma + a pasta da migration juntos
```

### Comandos

| Comando               | Quando usar                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| `npm run db:generate` | Após editar o `schema.prisma` — cria a migration e aplica no banco local |
| `npm run db:migrate`  | Em CI/CD e produção — aplica as migrations pendentes                     |
| `npm run db:push`     | **Nunca em produção.** Apenas para prototipar em dev sem gerar migration |
| `npm run db:studio`   | Inspecionar e editar dados via interface visual                          |

---

## CI/CD

O projeto usa **GitLab CI** (GitHub Actions não é utilizado, conforme especificação da disciplina). O pipeline está definido em `.gitlab-ci.yml` e é acionado automaticamente a cada push.

### Stages

| Stage     | Jobs                                | Descrição                                              |
| --------- | ----------------------------------- | ------------------------------------------------------ |
| `install` | `install_dependencies`              | Instala dependências com cache                         |
| `lint`    | `typecheck`, `lint_code`            | Valida tipagem TypeScript e estilo de código           |
| `test`    | `unit_tests`, `unit_tests_coverage` | Executa testes unitários e gera relatório de cobertura |
| `build`   | `build_app`                         | Build de produção Next.js                              |
| `report`  | `pipeline_summary`                  | Publica sumário da pipeline como artefato              |

Os testes não requerem banco de dados — todos os mocks isolam a camada de infraestrutura.

### Pipeline de segurança (DevSecOps)

> As tabelas de _stages_ acima descrevem uma configuração de GitLab CI legada. O pipeline efetivamente em uso é o **CircleCI**, definido em `.circleci/config.yml`.

Como parte da adoção de práticas de DevSecOps, o pipeline inclui um job dedicado de segurança (`security_scan`) que roda **em paralelo** aos testes unitários. O build de produção só é executado se ambos passarem:

```
unit_tests ────┐
               ├──► build_app
security_scan ─┘
```

O `security_scan` executa duas verificações:

| Verificação      | Ferramenta                | Comportamento                                                                                     |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| Vulnerabilidades em dependências | `npm audit`               | **Informativo** (não bloqueante). Gera o relatório `security-results/npm-audit.json` como artefato. |
| Vazamento de segredos            | [gitleaks](https://github.com/gitleaks/gitleaks) | **Bloqueante**. Falha o pipeline se encontrar um segredo no código ou no histórico de commits. Gera `security-results/gitleaks.sarif`. |

Pontos relevantes:

- O `npm audit` é informativo por enquanto porque ainda há vulnerabilidades herdadas a corrigir. Após a remediação das dependências, o gate será tornado **bloqueante** (`npm audit --audit-level=high`).
- A configuração do gitleaks está em `.gitleaks.toml`: usa o conjunto de regras padrão da ferramenta e mantém uma _allowlist_ apenas para o `.env.example`, que contém somente _placeholders_.
- Os relatórios de cada execução ficam disponíveis como artefatos do build no CircleCI.

Para reproduzir as verificações localmente:

```bash
# Auditoria de dependências
npm audit --audit-level=high

# Scan de segredos (requer o binário do gitleaks instalado)
gitleaks detect --source . --config .gitleaks.toml --verbose
```

---

## Segurança

### Rate limiting

O projeto aplica limites de requisição em dois pontos, com **chaves diferentes** conforme o sinal disponível:

| Endpoint                     | Chave do limite              | Limite              | Implementação                          |
| ---------------------------- | ---------------------------- | ------------------- | -------------------------------------- |
| Login / cadastro (`/api/auth/...`) | **IP**                 | 5/min em sign-in e sign-up; 100/min global | Nativo do better-auth (`src/server/better-auth/config.ts`) |
| Assistente de IA (`/api/aluno/ia`) | **`userId`** (aluno autenticado) | 10 mensagens/min    | Utilitário próprio (`src/server/rate-limit.ts`) |

O `src/server/rate-limit.ts` é um utilitário **genérico e reutilizável** (janela fixa em memória); hoje é consumido apenas pela rota de IA, mas pode ser usado por qualquer endpoint. O limite de login **não** usa esse utilitário — é o mecanismo interno do better-auth.

Ao exceder o limite, a rota de IA responde com **HTTP 429** e o header `Retry-After` (em segundos).

#### Ressalvas (limitações conhecidas)

Estas são provisões temporárias adequadas a um deploy **single-instance** (`next start`). Reveja-as antes de escalar:

- **Rate limit da IA por `userId`, não por IP:** é mais justo (cada aluno tem seu próprio limite, independente da rede) e evita que todos os alunos atrás do mesmo NAT do Inatel compartilhem um único balde. Em contrapartida, um usuário mal-intencionado poderia criar várias contas para obter vários limites — mitigado pelo fato de o cadastro também ser limitado (por IP) e a matrícula depender de um professor.
- **Rate limit de login por IP exige IP real do cliente:** atrás de um proxy/load balancer, o better-auth precisa enxergar o IP de origem via `X-Forwarded-For` (configurável em `advanced.ipAddress`); caso contrário ele vê apenas o IP do proxy e limitaria todos os usuários como se fossem um só. Em dev/single-server funciona direto.
- **Store em memória:** os contadores vivem no processo. Em deploy **serverless ou multi-instância**, cada instância tem seu próprio contador e o limite efetivo se multiplica — nesse cenário, migrar para um store compartilhado (ex.: Upstash Redis) e usar `storage: "database"` no better-auth.

---

## Histórias de Usuário

### US-01 — Gerenciar Disciplinas

**Como** professor, **eu quero** criar e gerenciar minhas disciplinas **para que** eu possa organizar turmas com código, semestre e carga horária.

**Critérios de aceitação:**

- Dado que estou autenticado como professor
- Quando acesso "Gerenciar Disciplinas" e clico em "Nova Disciplina"
- Então posso preencher nome (obrigatório), código, semestre, carga horária e encontros semanais
- E a disciplina aparece listada imediatamente após criação

**Prioridade:** Alta | **Status:** ✅ Entregue
**Rastreabilidade:** `criarDisciplina()` → `POST /api/professor/disciplines` → `professor-service.test.ts`

---

### US-02 — Matricular Alunos

**Como** professor, **eu quero** matricular alunos por e-mail em minhas disciplinas **para que** eu possa gerenciar quem está em cada turma.

**Critérios de aceitação:**

- Dado que tenho uma disciplina criada
- Quando informo o e-mail de um aluno cadastrado no sistema
- Então o aluno é matriculado e aparece na lista da disciplina
- E se o e-mail não existir, recebo uma mensagem de erro clara

**Prioridade:** Alta | **Status:** ✅ Entregue
**Rastreabilidade:** `matricularAluno()` → `POST /api/professor/register` → `professor-service.test.ts`

---

### US-03 — Lançar Notas e Faltas

**Como** professor, **eu quero** registrar a média final e o número de faltas de cada aluno **para que** o sistema calcule automaticamente a situação de aprovação.

**Critérios de aceitação:**

- Dado que tenho alunos matriculados em uma disciplina
- Quando acesso "Lançar Notas" e insiro média (0–10) e faltas
- Então o sistema exibe a situação: Aprovado, Reprovado por nota ou Reprovado por faltas (limite: 25% da carga horária)
- E se a nota for inválida (fora de 0–10 ou não numérica), recebo erro de validação

**Prioridade:** Alta | **Status:** ✅ Entregue
**Rastreabilidade:** `submitGrade()` / `validateGrade()` → `PUT /api/professor/notes` → `professor-notes-service.test.ts`

---

### US-04 — Agendar Provas

**Como** professor, **eu quero** agendar provas com data, sala e conteúdo **para que** os alunos possam se preparar com antecedência.

**Critérios de aceitação:**

- Dado que tenho uma disciplina
- Quando crio uma prova com título, data futura, sala (opcional) e conteúdo (opcional)
- Então a prova aparece na lista da disciplina ordenada por data
- E não é possível agendar uma prova com data no passado

**Prioridade:** Alta | **Status:** ✅ Entregue
**Rastreabilidade:** `scheduleExam()` / `validateScheduleExam()` → `POST /api/professor/tests` → `professor-notes-service.test.ts`

---

### US-05 — Visualizar Relatórios da Turma

**Como** professor, **eu quero** ver um relatório consolidado por disciplina **para que** eu possa identificar alunos em risco e acompanhar o desempenho geral da turma.

**Critérios de aceitação:**

- Dado que tenho alunos com notas lançadas
- Quando acesso "Relatórios"
- Então vejo média geral da turma, taxa de aprovação, número de alunos reprovados por nota e por faltas
- E alunos em risco de reprovação são destacados visualmente

**Prioridade:** Média | **Status:** ✅ Entregue
**Rastreabilidade:** `calcularStats()` em `ReportsClient.tsx` → dados via `GET /api/professor/disciplines`

---

### US-06 — Autenticar no Sistema

**Como** usuário (professor ou aluno), **eu quero** fazer login com e-mail e senha **para que** eu acesse apenas as funcionalidades do meu perfil.

**Critérios de aceitação:**

- Dado que tenho uma conta cadastrada
- Quando informo e-mail e senha corretos
- Então sou redirecionado para o dashboard do meu perfil (professor ou aluno)
- E se as credenciais forem inválidas, recebo mensagem de erro sem exposição de dados sensíveis

**Prioridade:** Alta | **Status:** ✅ Entregue
**Rastreabilidade:** `getProfessorContext()` / `getAlunoContext()` → `aluno-auth.test.ts`, `professor-service.test.ts`

---

### US-07 — Acessar o Assistente de IA do Aluno

**Como** aluno autenticado, **eu quero** acessar um assistente de IA dentro do portal **para que** eu tire dúvidas sobre meu desempenho acadêmico e informações institucionais.

**Critérios de aceitação:**

- Dado que estou autenticado como aluno
- Quando acesso a página do assistente de IA
- Então visualizo uma interface de chat personalizada com meu nome, curso e período
- E se eu não estiver autenticado, sou redirecionado para o login
- E se eu estiver autenticado com outro perfil, não acesso a área do aluno

**Prioridade:** Alta | **Status:** ✅ Entregue
**Rastreabilidade:** `AlunoIaPage()` / `getStudentContext()` / `StudentAiChat` → `aluno-auth.test.ts`, `aluno-auth-advanced.test.ts`, `StudentAiChat.test.tsx`

---

### US-08 — Conversar com a IA Sobre Desempenho Acadêmico

**Como** aluno, **eu quero** enviar perguntas ao assistente de IA **para que** eu receba respostas sobre médias, faltas, disciplinas e próximas provas com base nos dados do portal.

**Critérios de aceitação:**

- Dado que estou autenticado como aluno
- Quando envio uma pergunta válida no chat
- Então o sistema envia meu histórico de mensagens para a API `/api/aluno/ia`
- E a IA responde usando apenas meus dados acadêmicos cadastrados
- E a resposta pode considerar disciplinas, médias, faltas, professores e próximas provas
- E se a mensagem estiver vazia ou inválida, recebo uma mensagem de erro adequada

**Prioridade:** Alta | **Status:** ✅ Entregue
**Rastreabilidade:** `StudentAiChat` / `POST /api/aluno/ia` / `generateStudentAssistantReply()` → `StudentAiChat.test.tsx`, `student-assistant.utils.test.ts`

---

### US-09 — Consultar Informações Institucionais com a IA

**Como** aluno, **eu quero** perguntar ao assistente sobre editais, eventos e informações institucionais **para que** eu encontre rapidamente oportunidades e avisos relevantes do portal.

**Critérios de aceitação:**

- Dado que existem informações institucionais cadastradas no portal
- Quando pergunto sobre editais, eventos ou comunicados
- Então a IA responde usando apenas as informações disponíveis no contexto institucional
- E a resposta informa status como aberto, urgente ou encerrado quando aplicável
- E se houver link relacionado, ele deve ser mencionado na resposta
- E se a informação não existir no portal, a IA deve dizer claramente que não encontrou dados suficientes

**Prioridade:** Média | **Status:** ✅ Entregue
**Rastreabilidade:** `buildInstitutionContext()` / `informacoesMock` / `generateStudentAssistantReply()` → `student-assistant.utils.test.ts`

---

## Metodologia de Desenvolvimento

O grupo adotou uma metodologia **híbrida** inspirada em Scrum e Kanban, adaptada à realidade de um projeto acadêmico com prazo fixo.

### Papéis

| Membro          | Papel principal             |
| --------------- | --------------------------- |
| _(nome(s))_     | Product Owner / Facilitador |
| Bruna Magalhães | Dev — Área do Professor     |
| _(nome(s))_     | Dev — Área do Aluno         |
| _(nome(s))_     | Dev — Infra / CI-CD / Banco |

### Cadência

- Sprints de 1 semana com revisão informal ao final
- Comunicação via grupo no WhatsApp e issues no GitHub
- Decisões técnicas tomadas em pair review via Pull Requests

### Definição de Pronto (DoD)

- Funcionalidade implementada e testada localmente
- Ao menos 1 teste unitário relevante cobrindo a lógica principal
- PR aprovado por pelo menos 1 outro membro
- Pipeline passando (lint + testes + build)

### Ferramentas

- **Versionamento:** GitHub (repositório no time da matéria)
- **Revisão de código:** Pull Requests com discussão
- **CI/CD:** GitLab CI
- **Comunicação:** WhatsApp + issues do GitHub

---

## Dinâmica de Desenvolvimento

### Divisão de tarefas

O projeto foi dividido por áreas funcionais: cada membro ficou responsável por uma vertical (professor, aluno, infra), garantindo que todos tivessem commits significativos no código de produção.

### Fluxo de branches (VERIFICAR)

```
main ← develop ← feature/professor-notes
                ← feature/student-dashboard
                ← feature/ci-pipeline
```

- `main`: código estável, atualizado via PR de `develop`
- `develop`: integração contínua do desenvolvimento
- `feature/*`: branches por funcionalidade, com PR obrigatório para merge

### Padrão de commits

O projeto segue **Conventional Commits**:

```
feat(professor): add grade submission with validation
fix(professor): correct API endpoint URLs in ManageClient
refactor(professor): delegate routes to service layer
test(professor): add unit tests for notes and exams service
ci: add GitLab CI pipeline with install, lint, test and build stages
chore: add coverage support and @vitest/coverage-v8 dependency
```

### Conflitos e bloqueios

- **Problema:** Binário nativo do Tailwind (`@tailwindcss/oxide`) causava `EBADPLATFORM` em Windows.
  **Solução:** Movido para `optionalDependencies` no `package.json`, permitindo instalação cross-platform.
- **Problema:** `baseUrl` no `tsconfig.json` causava warnings com `moduleResolution: Bundler`.
  **Solução:** Removido — desnecessário nessa configuração do TypeScript 5.

### Lições aprendidas

- Separar lógica de negócio em camada de serviço (`professor-service.ts`, `professor-notes-service.ts`) torna os testes com mocks muito mais limpos e mantém as rotas enxutas
- Dependências nativas de plataforma devem sempre ir em `optionalDependencies`
- Pull Requests com revisão, mesmo que rápidos, evitam bugs que passariam despercebidos em merge direto

---

## Uso de IA

O grupo utilizou ferramentas de IA como apoio ao desenvolvimento, de forma transparente.

### Modelos utilizados (ADICIONAR MAIS SE TIVEREM USADO)

- **Claude (Anthropic)** — principal ferramenta utilizada ao longo do projeto

### Para quê foram usados

- Geração e refatoração de código (service layer, API routes, componentes React)
- Escrita e revisão de testes unitários com mocks
- Debugging de erros (EBADPLATFORM, URLs incorretas, configuração do Prisma)
- Geração de documentação (README, comentários)
- Brainstorming de arquitetura (decisões de modelagem como nota por disciplina vs. nota por prova)

### Exemplos reais de prompts utilizados

**Prompt 1** — geração do service layer:

> "Crie um `professor-notas-service.ts` seguindo o mesmo padrão do `professor-service.ts` já existente, com funções puras de validação separadas das funções que acessam o banco, para facilitar testes com vi.mock"

_Resultado:_ aceito com ajustes nos nomes das funções para seguir o padrão em inglês adotado pelo grupo.

**Prompt 2** — debugging de URL quebrada:

> "O modal de Adicionar Aluno retorna 'Erro de rede'. Aqui está o ManageClient.tsx [código]. O fetch está chamando qual endpoint?"

_Resultado:_ identificou que `/api/professor/` e `/api/professor/manage` estavam incorretos; corrigido para `/api/professor/register` e `/api/professor/disciplines`.

**Prompt 3** — decisão de arquitetura:

> "Notas não estão relacionadas com as provas — devo mudar o modelo para nota por prova ou manter média geral por disciplina?"

_Resultado:_ análise dos trade-offs apresentada; grupo decidiu manter média geral por ser mais simples e suficiente para o escopo.

### Dinâmica de uso

- IA usada individualmente por cada membro na sua área de responsabilidade
- Código gerado sempre revisado antes do commit — nenhum bloco foi aceito sem leitura e entendimento
- Testes gerados pela IA foram validados manualmente rodando `npm run test:unit`

### O que não foi feito por IA

- Decisões de arquitetura e modelagem do banco (schema Prisma definido pelo grupo)
- Configuração do ambiente Docker e scripts de banco
- Fluxo de autenticação com Better Auth (configurado manualmente)
- Definição das histórias de usuário e critérios de aceitação
- Revisão de código nos Pull Requests
