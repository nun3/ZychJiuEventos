---
name: validacao-por-risco
description: Define as verificações necessárias conforme o tipo de alteração no Meu Camp. Use após mudanças visuais, funcionais, de domínio crítico, persistência ou release candidate, e antes de declarar um lote concluído.
---

# Validação por risco — Meu Camp

Orienta o agente principal. Não executa comandos remotos automaticamente.
Não abre `.env*` nem `automação/.env.e2e`.
Não escreve em produção, não aplica migration e não cobra Asaas sem autorização explícita.

TypeScript, lint, build e testes cabem ao agente principal.
O `lot-verifier` só lê diffs e logs já produzidos.

## Distinção de evidência

| Tipo | O que prova | O que não prova |
| --- | --- | --- |
| Unitário | Função, regra pura, contrato local | Persistência, RLS, webhook, cobrança |
| Mock / fixture isolada | Integração com dependência substituída | Homologação no ambiente alvo |
| Homologação real de persistência | Escrita no ambiente alvo, com veredito registrado | Nada além do ambiente e do escopo citados |

Teste de branch ou localhost não testa produção.
Reutilize evidência válida da mesma sessão quando o código, o working tree e o ambiente não tiverem mudado.

Registrar sempre: comando, ambiente, resultado.

## Visual

Alteração de layout, token, componente de apresentação, responsividade ou acessibilidade visível.

- TypeScript (`tsc --noEmit`).
- Build.
- Lint quando o arquivo tocado participa da regra.
- Smoke visual no fluxo alterado, nos viewports 390 / 768 / 1024 / 1440 quando o layout mudou.
- Confirmar que estado não ficou só na cor.

Não executar suíte BDD completa por mudança visual.

## Funcional

Alteração localizada de comportamento, rota, formulário ou estado de UI, fora de domínio crítico.

- TypeScript.
- Build.
- Teste unitário ou de feature relacionado.
- Smoke funcional do caminho feliz e de um estado vazio ou de erro tocado pela mudança.

Não repetir a suíte inteira sem regressão sistêmica suspeita.

## Domínio crítico

Auth, autorização, pagamentos, Asaas, webhook, Server Actions, check-in, weigh-in, resultados, RLS ou persistência.

- TypeScript.
- Build.
- Testes específicos obrigatórios do fluxo tocado.
- Acionar `domain-risk-reviewer` no diff.
- Separar o que foi unitário, mockado e ainda NOT_RUN contra o ambiente real.

Não tratar PASS unitário como homologação operacional.

## Persistência

Schema, migration, RPC, RLS, trigger, auditoria ou escrita em banco.

- Ler schema, migrations, constraints, políticas e grants existentes antes de qualquer mudança.
- Teste de contrato local, se existir.
- Homologação real de persistência só com autorização e ambiente alvo explícitos.
- Sem autorização: marcar NOT_RUN — BLOCKED, não improvisar segundo projeto nem escrever no banco de produção.

Não criar migration só porque parece necessária.
Não remover RLS para “fazer funcionar”.

## Release candidate

Milestone, merge importante ou suspeita real de regressão sistêmica.

- TypeScript, lint e build.
- Testes relacionados aos lotes incluídos.
- Full BDD só neste caso, com `workers: 1` e `fullyParallel: false`.
- Conferir `docs/repository/PRODUCTION-MANIFEST.md` e `docs/engineering/CURRENT-HANDOFF.md`.
- Não promover working tree, não fazer push, deploy nem migration sem autorização.

## Encerramento do lote

1. Agente principal executa só o que o risco pede.
2. `lot-verifier` lê diffs e logs; resume PASS, FAIL e NOT_RUN.
3. Atualizar `docs/engineering/CURRENT-HANDOFF.md` após os commits finais.
4. Só então `/clear`.
