# Rotas

Fonte oficial das URLs do App Router. O diretório `app/` prevalece sobre catálogos antigos.

## Públicas

| URL | Arquivo | Acesso | Finalidade |
|---|---|---|---|
| `/` | `app/page.tsx` | público | Página inicial e lista de campeonatos |
| `/academias` | `app/academias/page.tsx` | público | Página de academias |
| `/quem-somos` | `app/quem-somos/page.tsx` | público | Institucional |
| `/noticias` | `app/noticias/page.tsx` | público | Notícias |
| `/sistema` | `app/sistema/page.tsx` | público | Apresentação do sistema |
| `/eventos/[id]` | `app/eventos/[id]/page.tsx` | público | Página do evento |
| `/eventos/[id]/chaves` | `app/eventos/[id]/chaves/page.tsx` | público | Chaves publicadas |
| `/eventos/[id]/checagem` | `app/eventos/[id]/checagem/page.tsx` | público | Checagem pública |
| `/eventos/[id]/programacao` | `app/eventos/[id]/programacao/page.tsx` | público | Programação pública |

## Autenticação

| URL | Arquivo | Acesso | Finalidade |
|---|---|---|---|
| `/login` | `app/login/page.tsx` | público | Entrar, criar conta e recuperar senha |
| `/recuperar-senha` | `app/recuperar-senha/page.tsx` | público | Pedido de redefinição |
| `/atualizar-senha` | `app/atualizar-senha/page.tsx` | público | Nova senha após o link |
| `/admin/autenticacao` | `app/admin/autenticacao/page.tsx` | público | Login do organizador |

## Dashboard

| URL | Arquivo | Acesso | Finalidade |
|---|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | autenticado | Painel da conta |
| `/dashboard/organizacao` | `app/dashboard/organizacao/page.tsx` | dono da organização | Membros |
| `/dashboard/inscricoes` | `app/dashboard/inscricoes/page.tsx` | atleta com perfil | Inscrições |
| `/dashboard/meu-perfil` | `app/dashboard/meu-perfil/page.tsx` | autenticado | Perfil |
| `/dashboard/meus-atletas` | `app/dashboard/meus-atletas/page.tsx` | perfil esportivo | Atletas vinculados |
| `/dashboard/meus-atletas/[id]/editar` | `app/dashboard/meus-atletas/[id]/editar/page.tsx` | perfil esportivo | Edição do atleta |
| `/dashboard/meus-atletas/[id]/inscricoes` | `app/dashboard/meus-atletas/[id]/inscricoes/page.tsx` | perfil esportivo | Inscrições do atleta |
| `/dashboard/completar-cadastro-esportivo` | `app/dashboard/completar-cadastro-esportivo/page.tsx` | atleta sem perfil | Completar cadastro |
| `/dashboard/pagamentos/[id]` | `app/dashboard/pagamentos/[id]/page.tsx` | autenticado | Resumo do pagamento |
| `/eventos/[id]/inscricao/cadastrar-atleta` | `app/eventos/[id]/inscricao/cadastrar-atleta/page.tsx` | autenticado | Inscrição do atleta |

## Admin

| URL | Arquivo | Acesso | Finalidade |
|---|---|---|---|
| `/admin/eventos` | `app/admin/eventos/page.tsx` | organização | Lista operacional |
| `/admin/eventos/novo` | `app/admin/eventos/novo/page.tsx` | organização | Criar evento |
| `/admin/eventos/[id]/editar` | `app/admin/eventos/[id]/editar/page.tsx` | organização | Dados básicos do rascunho |
| `/admin/eventos/[id]/configuracao` | `app/admin/eventos/[id]/(operacao)/configuracao/page.tsx` | organização | Categorias e regras |
| `/admin/eventos/[id]/checagem` | `app/admin/eventos/[id]/(operacao)/checagem/page.tsx` | organização | Checagem |
| `/admin/eventos/[id]/financeiro` | `app/admin/eventos/[id]/(operacao)/financeiro/page.tsx` | organização | Financeiro |
| `/admin/eventos/[id]/chaves` | `app/admin/eventos/[id]/(operacao)/chaves/page.tsx` | organização | Chaves |
| `/admin/eventos/[id]/programacao` | `app/admin/eventos/[id]/(operacao)/programacao/page.tsx` | organização | Programação |
| `/admin/eventos/[id]/resultados` | `app/admin/eventos/[id]/(operacao)/resultados/page.tsx` | organização | Resultados |

## Plataforma

| URL | Arquivo | Acesso | Finalidade |
|---|---|---|---|
| `/platform/destaques` | `app/platform/destaques/page.tsx` | admin da plataforma | Destaques |
| `/platform/organizacoes` | `app/platform/organizacoes/page.tsx` | admin da plataforma | Organizações |
| `/platform/organizacoes/[id]` | `app/platform/organizacoes/[id]/page.tsx` | admin da plataforma | Detalhe da organização |

## API e route handlers

| URL | Arquivo | Acesso | Finalidade |
|---|---|---|---|
| `POST /api/payments/webhook` | `app/api/payments/webhook/route.ts` | token do webhook | Receber eventos do Asaas |
| `GET /auth/callback` | `app/auth/callback/route.ts` | público | Troca do código de autenticação |
| `GET /dashboard/pagamentos/comprovantes/[id]` | `app/dashboard/pagamentos/comprovantes/[id]/route.ts` | sessão + policy do Storage | URL assinada do comprovante |

## Redirects e rotas legadas

| URL | Arquivo | Destino |
|---|---|---|
| `/eventos` | `app/eventos/page.tsx` | `/#eventos` |
| `/cadastro` | `app/cadastro/page.tsx` | `/login?mode=register` |
| `/dashboard/alterar-cadastro` | `app/dashboard/alterar-cadastro/page.tsx` | `/dashboard/meu-perfil#dados-pessoais` |
| `/dashboard/meus-ingressos` | `app/dashboard/meus-ingressos/page.tsx` | `/dashboard` |
| `/dashboard/minhas-filiacoes` | `app/dashboard/minhas-filiacoes/page.tsx` | `/dashboard` |
| `/admin/eventos/[id]/gerenciar` | `app/admin/eventos/[id]/gerenciar/page.tsx` | configuração |
| `/admin/eventos/[id]/regulamento` | `app/admin/eventos/[id]/regulamento/page.tsx` | configuração |
| `/admin/eventos/[id]/secretaria` | `app/admin/eventos/[id]/secretaria/page.tsx` | checagem |
| `/admin/eventos/[id]/tarefas` | `app/admin/eventos/[id]/tarefas/page.tsx` | programação |
| `/admin/eventos/[id]/placar` | `app/admin/eventos/[id]/placar/page.tsx` | programação |
| `/admin/eventos/[id]/pesagem` | `app/admin/eventos/[id]/pesagem/page.tsx` | resultados |
| `/admin/eventos/[id]/filiacao` | `app/admin/eventos/[id]/filiacao/page.tsx` | `/admin/eventos` |
