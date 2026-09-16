# Instruções permanentes de QA — Playwright MCP + Gherkin + Automação

Sempre que houver:

* nova release;
* finalização de sprint;
* funcionalidade pronta para QA;
* alteração de fluxo;
* solicitação de testes;
* solicitação de validação de navegação;
* correção relevante;
* necessidade de regressão;

execute obrigatoriamente o processo completo abaixo.

## Objetivo

Não gerar apenas documentação ou cenários Gherkin.

O objetivo é:

**explorar a aplicação com Playwright MCP → entender o comportamento real → criar cenários Gherkin → implementar os testes automatizados → executar → corrigir a automação → entregar o resultado validado.**

## Estado atual do projeto

A automação atualmente cobre o fluxo de autenticação observado no portal Meu Camp:

* Feature: `tests/features/login.feature`;
* Steps: `tests/steps/login.steps.ts`;
* Fixture: `tests/support/fixtures.ts`;
* Configuração: `playwright.config.ts`;
* Geração: `npx bddgen`;
* Execução: `npx playwright test`;
* Resultado validado: 4 cenários aprovados;
* Page Objects e helpers próprios: não criados, pois o fluxo atual ainda é pequeno e não possui reutilização suficiente.

O servidor da aplicação deve estar disponível em `http://localhost:3000` antes da execução. A URL pode ser alterada pela variável `BASE_URL`.

---

# 1. Explorar a funcionalidade com Playwright MCP

Antes de implementar os testes, utilize o Playwright MCP para navegar pela aplicação.

Execute o fluxo real solicitado.

Durante a exploração:

* acesse a aplicação;
* navegue pelas telas envolvidas;
* clique nos elementos necessários;
* preencha formulários;
* valide mensagens;
* valide redirecionamentos;
* identifique estados da interface;
* identifique campos obrigatórios;
* valide comportamentos positivos e negativos;
* identifique possíveis regressões;
* identifique regras de negócio observáveis;
* registre os caminhos utilizados.

Não crie a automação apenas olhando o HTML ou código-fonte quando for possível executar o fluxo real utilizando o MCP.

A navegação realizada com MCP deve servir como referência para a implementação automatizada.

---

# 2. Identificar os cenários de teste

Depois de explorar a funcionalidade, identifique:

* caminho feliz;
* cenários negativos;
* validações de campos;
* campos obrigatórios;
* limites;
* erros;
* cancelamentos;
* navegação;
* permissões;
* regras de negócio;
* regressões;
* integrações relevantes.

Classifique os principais cenários como:

* P0 — crítico;
* P1 — alto;
* P2 — médio;
* P3 — baixo.

Utilize também tags quando apropriado:

```gherkin
@smoke
@regression
@critical
@positive
@negative
@navigation
@release
```

---

# 3. Criar os cenários Gherkin

Crie os arquivos `.feature` necessários no projeto de automação.

Utilize linguagem de negócio.

Evite detalhes técnicos de implementação dentro do Gherkin.

Exemplo:

```gherkin
@smoke @critical
Feature: Autenticação

  Background:
    Given que o usuário acessou a página de login

  Scenario: Realizar login com credenciais válidas
    When informar credenciais válidas
    And solicitar o acesso
    Then o sistema deve autenticar o usuário
    And apresentar a página inicial
```

Sempre que possível, reaproveite Steps já existentes antes de criar novos.

Evite duplicação de Steps com significados equivalentes.

---

# 4. Implementar a automação

Após criar ou atualizar os cenários Gherkin, implemente obrigatoriamente os testes correspondentes utilizando:

* Playwright;
* playwright-bdd;
* TypeScript.

A implementação deve reproduzir o fluxo que foi executado durante a exploração com Playwright MCP.

Exemplo:

Se durante o MCP foi realizado:

```text
Abrir aplicação
→ acessar Login
→ preencher usuário
→ preencher senha
→ clicar Entrar
→ validar Dashboard
```

a automação deverá reproduzir esse mesmo comportamento.

Não pare o trabalho após gerar o arquivo `.feature`.

Crie ou atualize, somente quando o fluxo justificar:

```text
tests/features/
tests/steps/
tests/pages/
tests/support/
tests/utils/
```

quando necessário.

---

# 5. Locators

Utilize locators resilientes.

Priorize:

```typescript
page.getByRole()
page.getByLabel()
page.getByPlaceholder()
page.getByText()
page.getByTestId()
```

Evite:

```typescript
page.locator('div:nth-child(3)')
```

XPath absoluto e seletores frágeis devem ser evitados.

Sempre que o MCP identificar um elemento por semântica ou acessibilidade, procure utilizar a mesma referência conceitual na automação.

---

# 6. Page Objects

Quando o fluxo justificar reutilização, utilize Page Objects. Até o momento, nenhum Page Object foi criado no projeto; os Steps atuais usam diretamente os locators semânticos porque cobrem apenas o fluxo de autenticação explorado.

Exemplo de estrutura futura, somente se houver reutilização:

```text
pages/
├── LoginPage.ts
├── HomePage.ts
└── CadastroPage.ts
```

Os Steps devem representar comportamento. A implementação atual usa `createBdd(test)` e o fixture exportado por `tests/support/fixtures.ts`.

Evite concentrar toda a lógica de interação diretamente nos arquivos de Step quando ela puder ser reutilizada.

Exemplo:

```typescript
When('informar credenciais válidas', async ({ loginPage }) => {
  await loginPage.login(usuario, senha);
});
```

---

# 7. Reaproveitar o projeto existente

Antes de adicionar novos arquivos:

1. analise a estrutura atual do projeto;
2. procure Steps existentes;
3. procure Page Objects existentes;
4. procure fixtures existentes;
5. procure helpers e utils existentes;
6. siga os padrões já adotados.

Não crie uma arquitetura paralela sem necessidade.

Priorize reutilização.

---

# 8. Gerar os testes do playwright-bdd

Depois da implementação, execute na pasta `automação`:

```bash
npx bddgen
```

O script equivalente configurado no projeto é:

```bash
npm run test:bdd
```

Verifique se os cenários foram convertidos corretamente.

Se existirem erros de Step não encontrado, duplicidade ou configuração, corrija-os antes de prosseguir.

---

# 9. Executar a automação

Execute os testes criados.

Na configuração atual, execute:

```bash
npx playwright test
```

Esse comando usa os testes gerados em `.features-gen/`.

Quando necessário, execute um cenário específico:

```bash
npx playwright test -g "nome do cenário"
```

Ou utilize as tags/configuração disponível no projeto.

A tarefa não está concluída somente porque o código foi criado.

A automação precisa ser executada.

---

# 10. Corrigir falhas da própria automação

Se o teste falhar devido a:

* locator incorreto;
* timeout inadequado;
* sincronização;
* Step incorreto;
* Page Object incorreto;
* preparação de massa;
* problema na própria implementação;

corrija a automação e execute novamente.

Repita até que o teste represente corretamente o comportamento observado.

---

# 11. Não mascarar defeitos da aplicação

Se a automação estiver correta e a aplicação apresentar comportamento diferente do esperado:

não altere o teste apenas para fazê-lo passar.

Classifique como possível defeito.

Exemplo:

```text
Esperado:
Após salvar, retornar para a listagem.

Observado com MCP:
Após salvar, permanece na mesma página.

Automação:
Falhou ao validar o retorno para a listagem.

Classificação:
Possível defeito funcional.
```

A automação deve representar a regra esperada, não esconder defeitos do produto.

---

# 12. Comparar MCP e automação

Depois da implementação, compare:

```text
Fluxo executado manualmente pelo MCP
                ↓
Fluxo implementado no Playwright
```

Eles devem ser funcionalmente equivalentes.

Exemplo:

```text
MCP
────────────────────────
abre página
clica Produtos
seleciona Seguro
preenche formulário
confirma
valida mensagem

AUTOMAÇÃO
────────────────────────
page.goto()
getByRole().click()
getByText().click()
fill()
click()
expect()
```

O teste automatizado deve reproduzir as ações relevantes realizadas durante a exploração.

---

# 13. Evidências

Quando o projeto possuir suporte, gere evidências utilizando:

* relatório Playwright;
* screenshot, configurado atualmente para todos os testes;
* trace;
* vídeo, configurado atualmente somente em caso de falha;
* Allure, não configurado atualmente.

Não adicione screenshots desnecessários em todos os Steps.

Utilize evidências principalmente para diagnóstico e resultado dos testes.

---

# 14. Resultado esperado ao finalizar

Ao concluir uma solicitação de QA, informe:

## Funcionalidade analisada

O que foi testado.

## Navegação realizada com MCP

Quais fluxos foram realmente explorados.

## Cenários Gherkin criados ou atualizados

Informe os arquivos `.feature`.

## Automação implementada

Informe:

* Steps adicionados;
* Page Objects adicionados ou alterados;
* fixtures utilizadas;
* helpers utilizados.

## Execução

Informe:

```text
PASS
FAIL
BLOCKED
```

para os testes executados.

## Defeitos encontrados

Diferencie:

* erro da automação;
* comportamento inesperado da aplicação;
* possível bug;
* impedimento de ambiente.

## Regressão

Informe quais cenários devem fazer parte da suíte:

```text
@smoke
@regression
```

Na Feature atual, as tags ainda não foram aplicadas. Os quatro cenários de autenticação devem entrar na regressão; o acesso à tela de login e a rejeição de credenciais inválidas são candidatos a `@smoke`.

---

# 15. Definição de pronto

Uma solicitação de criação de testes NÃO está concluída quando apenas o Gherkin foi criado.

Considere concluída somente quando:

```text
✓ aplicação explorada com MCP
✓ comportamento entendido
✓ cenários identificados
✓ Gherkin criado
✓ Steps implementados
✓ Page Objects atualizados quando necessário
✓ bddgen executado
✓ Playwright executado
✓ erros da automação corrigidos
✓ resultado informado
```

Na execução atual, `npx bddgen` e `npx playwright test` foram concluídos com 4 cenários aprovados. Não foram testadas credenciais válidas nem o envio real de e-mail, pois não há massa de teste confirmada para esses fluxos.

Fluxo obrigatório:

```text
RELEASE / SPRINT
        ↓
ANALISAR ALTERAÇÕES
        ↓
PLAYWRIGHT MCP
        ↓
EXPLORAR A APLICAÇÃO
        ↓
IDENTIFICAR CENÁRIOS
        ↓
CRIAR GHERKIN
        ↓
IMPLEMENTAR STEPS
        ↓
IMPLEMENTAR / REUTILIZAR PAGE OBJECTS
        ↓
BDDGEN
        ↓
PLAYWRIGHT TEST
        ↓
CORRIGIR AUTOMAÇÃO SE NECESSÁRIO
        ↓
VALIDAR RESULTADO
        ↓
REGRESSÃO
```

## Regra principal

**Nunca finalize uma solicitação de automação entregando somente cenários Gherkin quando houver acesso ao projeto de testes.**

O Gherkin deve resultar em uma automação executável.

O comportamento explorado com Playwright MCP deve ser convertido em testes Playwright-BDD dentro do projeto.
