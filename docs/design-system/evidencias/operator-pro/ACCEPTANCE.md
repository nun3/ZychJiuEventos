# MEU CAMP LIVE — Operator Acceptance

Status: **MEU CAMP LIVE OPERATOR ACCEPTANCE: PASS**

Poll convergence: p50≈750ms · pior=750ms · UI poll window=2000ms

Realtime: BLOCKED por desenho

| Critério | Status | Detalhe |
| --- | --- | --- |
| Full fight | PASS | CALL→…→UNDO→FINISH→CONFIRM com asserts DB por etapa |
| Refresh running | PASS | version=11 scoreA=5 clock=05:00 |
| Refresh paused | PASS | relógio pausado congelado (05:00) |
| Two operators | PASS | A↔B via get_session (latências 750ms / 691ms) |
| Polling convergence | PASS | amostras=750,691ms (RPC get; UI poll=2s) |
| Version conflict | PASS | B rejeitado; sem ponto duplicado; mensagem PT-BR |
| Double tap | PASS | mesma key → duplicate; versão única |
| Lost response retry | PASS | retry com mesma key = duplicate=true, uma mutação |
| Network failure | PASS | offline badge/status observado=2; sem optimistic permanente (código espera server) |
| Reconnect | PASS | rede restaurada; poll/refetch disponíveis |
| Background tab | PASS | sem sessão running residual; recuperação definida por poll ~2s |
| Finish concurrency | PASS | late score rejeitado (Conflito de versao LIVE); B vê finished |
| Staff restriction | PASS | FINISH ok; CONFIRM bloqueado para staff |
| Owner confirmation | PASS | owner confirmou resultado |
| Finance isolation | PASS | finance bloqueado em create_match_live_session |
| Queue progression | PASS | match2 aberta; match1 permanece confirmed; area=0490b717-59d7-42cc-a47a-491e54f93815 |
| Desktop UX | PASS | chrome=true; clock=04:56; undersized=[]; scroll=true |
| Tablet UX | PASS | 1024 undersized=[]; 768 undersized=[] |
| Mobile fallback | PASS | undersized=[]; scroll=true |
| Keyboard safety | PASS | FINISH/CONFIRM só via botão (count=0); scoring gated por busy+status; doc mínima=false |
| Audit trail | PASS | 14 eventos; sequências monotônicas; finish≠confirm |
