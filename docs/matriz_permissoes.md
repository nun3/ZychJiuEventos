# Matriz de Permissoes

Legenda: `C` consultar, `I` incluir, `E` editar, `A` aprovar/operar, `-` sem acesso.

| Recurso | Admin | Organizador | Professor | Responsavel | Atleta | Publico |
|---|---:|---:|---:|---:|---:|---:|
| Perfis da plataforma | C/E/A | - | - | - | - | - |
| Proprios dados | C/E | C/E | C/E | C/E | C/E | - |
| Eventos da propria organizacao | C/I/E/A | C/I/E/A | C | C | C | C publicados |
| Eventos de outras organizacoes | C/E/A | - | C publicados | C publicados | C publicados | C publicados |
| Equipes | C/I/E/A | C/I/E | C/E propria | C/E propria | C propria | C publicas |
| Meus atletas | C/I/E/A | - | C/I/E | C/I/E dependentes | C proprio | - |
| Inscricao propria | C/I/E | - | - | - | C/I/E | - |
| Inscricoes de atletas gerenciados | C/I/E/A | C/E/A do evento | C/I/E | C/I/E | C propria | C somente publicas |
| Categorias e fases | C/I/E/A | C/I/E | C | C | C | C publicadas |
| Solicitacao de mudanca de categoria | A | A | I propria | I propria | I propria | - |
| Aprovacao de mudanca | A | A do evento | - | - | - | - |
| Pagamentos | C/E/A | C/A do evento | C/I | C/I | C/I proprio | - |
| Baixa manual/estorno | A | A do evento | - | - | - | - |
| Checagem publica | C/A | C/A do evento | C | C | C | C |
| Geracao e publicacao de chaves | A | A do evento | C | C | C proprio | C publicadas |
| Pesagem e resultados | A | A do evento | C | C | C proprio | C publicados |
| Relatorio financeiro | C/E/A | C do evento | - | - | - | - |
| Auditoria | C | C do evento | - | - | - | - |

## Regras de escopo

- Admin possui visao global.
- Uma conta pode acumular papeis; a permissao efetiva depende do recurso, da organizacao e do vinculo com o atleta.
- Organizador somente acessa eventos da organizacao autorizada.
- Professor e responsavel acessam apenas atletas ligados por `athlete_managers`.
- Atleta acessa apenas seu proprio registro e suas inscricoes.
- Publico nunca acessa dados pessoais completos, pagamentos ou registros internos.
- Toda acao de aprovacao, baixa, estorno, travamento ou publicacao deve gerar auditoria.
