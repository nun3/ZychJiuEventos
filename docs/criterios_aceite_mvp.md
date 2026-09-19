# Criterios de Aceite do MVP

Reconciliação documental em 2026-09-19. Itens marcados como concluídos possuem evidência em código, feature Gherkin, smoke SQL ou checkpoint de sprint. Requisitos parciais permanecem explícitos. Este documento não altera regra de negócio.

## Conta e acesso

- [x] Usuário consegue criar conta com e-mail e senha.
- [x] Sistema permite que a mesma conta acumule papeis e aplica o papel correto conforme a organizacao e o contexto.
- [x] Responsável consegue acessar atletas menores sem login próprio.
- [x] Usuário não acessa dados fora do seu escopo.
- [x] Recuperação de senha funciona por e-mail.

Notas:

- Cadastro, login, logout e recuperação foram integrados ao Supabase Auth na Sprint 2. `login.feature` cobre navegação, credencial inválida, abertura do cadastro e link expirado. Recuperação com conta real de teste foi registrada no checkpoint de 2026-09-03.
- Acúmulo de papéis: `tipo_cadastro`, `organization_members` e `athlete_managers` coexistentes. Não há UI de convite ou gestão de membros.
- Responsável acessa menores via `athlete_managers.relationship_type = responsavel` (`athletes.feature`). A regra “menor não cria conta própria” ainda não é enforced no cadastro público.
- Isolamento: RLS + smoke SQL da Sprint 1 (duas organizações) + `authorization.feature` (visitante e usuário sem vínculo). Não há feature Playwright dedicada a duas organizações.

## Meus Atletas

- [x] Professor ou responsável cadastra atleta com dados obrigatórios.
- [x] Atleta fica vinculado a exatamente uma equipe.
- [x] Professor/responsável edita somente atletas gerenciados.
- [x] Histórico de inscrições aparece por atleta.
- [x] Troca de equipe gera registro de auditoria.

Evidência: Sprint 3 e `athletes.feature`. Professor cadastral sem `organization_role` comprovado em `professor.feature`.

## Eventos

- [x] Admin/organizador cria evento com datas, local, regras, fases e categorias.
- [x] Evento publicado aparece ordenado pela data.
- [x] Público consulta detalhes, tabela de peso e lista permitida de inscritos.
- [x] Evento concluído aparece no histórico com resultados publicados.
- [x] Evento cancelado não aceita novas inscrições.
- [x] Todas as datas respeitam o fuso IANA configurado no evento.

Evidência: `events.feature`; `event-status-transitions.feature` (página pública permanece concluída e inscrições indisponíveis); lista pública inclui `concluido` em `lib/events/public-events.ts`. `create_event_registrations` exige `status = 'inscricao'`, portanto `cancelado` não aceita inscrição nova.

## Inscrição

- [ ] Atleta maior pode fazer a própria inscrição.
- [x] Professor/responsável pode selecionar múltiplos atletas gerenciados.
- [x] Sistema bloqueia inscrição fora da fase de inscrição.
- [x] Sistema calcula idade pela data completa na data do evento.
- [x] Sistema aloca categoria automaticamente ou explica por que não conseguiu.
- [x] Nova inscrição inicia pendente de pagamento.
- [x] Inscricao confirmada preserva snapshot dos dados esportivos, categoria, preco, regras e termos aceitos.
- [x] Não é possível duplicar inscrição ativa do mesmo atleta no evento.

Gap explícito: inscrição própria do atleta maior. O cadastro `atleta` cria conta e perfil; não cria registro em `athletes` nem fluxo de autoinscrição. `athletes.user_id` existe para vínculo posterior. O fluxo comprovado é professor/responsável (`registrations.feature`, Full Event).

## Checagem e categoria

- [x] Somente inscrições pagas ou baixadas manualmente aparecem na checagem.
- [x] Lista permite filtros por categoria, equipe e professor sem expor dados indevidos.
- [x] Atleta sozinho pode solicitar mudança elegível.
- [x] Organizador aprova ou recusa com histórico.
- [x] Lista travada não aceita alterações comuns.

Distinção vigente:

- Correção de categoria / realocação do sozinho: entregue (`checagem.feature`, Sprint 7). Snapshot e `category_id` original permanecem imutáveis; a alocação vigente é `coalesce(current_category_id, category_id)`.
- Solicitação auditada de correção de outros dados (faixa, peso, nome etc.): pendente. Não faz parte da realocação do sozinho.

Filtros da checagem autenticada e da lista pública: categoria, equipe e professor operacional da inscrição. A lista pública usa o nome completo de competição do snapshot. O Professor cadastral permanece distinto do professor operacional.

## Pagamento

- [x] Usuário gera PIX ou boleto para pagamento individual.
- [x] Usuário agrupa somente inscrições do mesmo evento.
- [x] Sistema rejeita lote com eventos diferentes.
- [x] Webhook atualiza pagamento de forma idempotente.
- [x] Webhook invalido nao altera dados e fica registrado para diagnostico sem expor segredos.
- [x] Pagamento confirmado efetiva as inscrições vinculadas.
- [x] Admin/organizador consegue fazer baixa manual auditada.
- [x] Relatório separa bruto, taxa, líquido, pagos, pendentes, cancelados e estornados.

O fechamento em `/admin/eventos/[id]/financeiro` entrega totais sintéticos e visão analítica (`financial-closing.feature`, `platform-fee.feature`). A taxa vem do snapshot gravado na efetivação. Exportação de arquivo não faz parte deste critério.

## Chaves e encerramento

- [x] Admin/organizador só gera chaves após travar a checagem.
- [x] Sistema registra versão da chave e seus confrontos.
- [x] Sistema tenta evitar atletas da mesma equipe na primeira luta.
- [x] Resultados publicados ficam disponíveis no histórico do evento.
- [x] Encerramento impede alterações operacionais sem permissão excepcional.

Evidência: Sprints 8–12, `event-status-transitions.feature` e Full Event BDD. Encerramento usa a máquina de estados; não existe permissão excepcional de reabertura.

## Pendências explícitas

Ainda não entregues, e portanto não marcadas acima:

- onboarding self-service de organização;
- gestão/convite de membros na UI;
- atleta independente completo (autoinscrição);
- enforcement da regra de menor sem login próprio;
- solicitação auditada de correção de dados além da categoria;
- indicadores do PRD §8;
- console platform admin;
- Asaas produção, backup, monitoramento e rollback (critério de liberação, não do fluxo operacional);
- protótipos com `localStorage` deixaram de ser hub operacional (redirecionam; inventário no PRD §11).
