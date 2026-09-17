# Criterios de Aceite do MVP

## Conta e acesso

- [ ] Usuário consegue criar conta com e-mail e senha.
- [ ] Sistema permite que a mesma conta acumule papeis e aplica o papel correto conforme a organizacao e o contexto.
- [ ] Responsável consegue acessar atletas menores sem login próprio.
- [ ] Usuário não acessa dados fora do seu escopo.
- [ ] Recuperação de senha funciona por e-mail.

## Meus Atletas

- [ ] Professor ou responsável cadastra atleta com dados obrigatórios.
- [ ] Atleta fica vinculado a exatamente uma equipe.
- [ ] Professor/responsável edita somente atletas gerenciados.
- [ ] Histórico de inscrições aparece por atleta.
- [ ] Troca de equipe gera registro de auditoria.

## Eventos

- [x] Admin/organizador cria evento com datas, local, regras, fases e categorias.
- [x] Evento publicado aparece ordenado pela data.
- [ ] Público consulta detalhes, tabela de peso e lista permitida de inscritos.
- [ ] Evento concluído aparece no histórico com resultados publicados.
- [ ] Evento cancelado não aceita novas inscrições.
- [x] Todas as datas respeitam o fuso IANA configurado no evento.

## Inscrição

- [ ] Atleta maior pode fazer a própria inscrição.
- [ ] Professor/responsável pode selecionar múltiplos atletas gerenciados.
- [ ] Sistema bloqueia inscrição fora da fase de inscrição.
- [ ] Sistema calcula idade pela data completa na data do evento.
- [ ] Sistema aloca categoria automaticamente ou explica por que não conseguiu.
- [ ] Nova inscrição inicia pendente de pagamento.
- [ ] Inscricao confirmada preserva snapshot dos dados esportivos, categoria, preco, regras e termos aceitos.
- [ ] Não é possível duplicar inscrição ativa do mesmo atleta no evento.

## Checagem e categoria

- [x] Somente inscrições pagas ou baixadas manualmente aparecem na checagem.
- [ ] Lista permite filtros por categoria, equipe e professor sem expor dados indevidos.
- [x] Atleta sozinho pode solicitar mudança elegível.
- [x] Organizador aprova ou recusa com histórico.
- [x] Lista travada não aceita alterações comuns.

Filtros entregues na checagem autenticada: categoria e equipe. Filtro por professor e lista pública de checagem não fazem parte do núcleo operacional fechado da Sprint 7; a lista pública permanece bloqueada pela identidade do inscrito no PRD.

## Pagamento

- [x] Usuário gera PIX ou boleto para pagamento individual.
- [x] Usuário agrupa somente inscrições do mesmo evento.
- [x] Sistema rejeita lote com eventos diferentes.
- [x] Webhook atualiza pagamento de forma idempotente.
- [x] Webhook invalido nao altera dados e fica registrado para diagnostico sem expor segredos.
- [x] Pagamento confirmado efetiva as inscrições vinculadas.
- [x] Admin/organizador consegue fazer baixa manual auditada.
- [ ] Relatório separa bruto, taxa, líquido, pagos, pendentes, cancelados e estornados.

## Chaves e encerramento

- [ ] Admin/organizador só gera chaves após travar a checagem.
- [ ] Sistema registra versão da chave e seus confrontos.
- [ ] Sistema tenta evitar atletas da mesma equipe na primeira luta.
- [ ] Resultados publicados ficam disponíveis no histórico do evento.
- [ ] Encerramento impede alterações operacionais sem permissão excepcional.
