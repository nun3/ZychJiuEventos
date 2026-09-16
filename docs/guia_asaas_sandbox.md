# Asaas Sandbox no Meu Camp — primeiro acesso e configuração

Este guia é para quem nunca configurou uma integração de pagamentos. O objetivo desta etapa é conectar o projeto à sua conta **de testes** e verificar a autenticação, sem criar cobranças.

Projeto no seu computador: `/home/nune/Meus Projetos/jiu`.

## 1. Entenda os três nomes

| Nome | O que significa |
| --- | --- |
| Sandbox | Ambiente de testes do Asaas. É separado da conta de produção. |
| Chave de API | Uma credencial que permite ao servidor do Meu Camp acessar sua conta Asaas. |
| Webhook | Um aviso enviado pelo Asaas ao Meu Camp quando uma cobrança muda, por exemplo quando é recebida. |

Neste momento, PIX e boleto reais já foram emitidos pela interface no Sandbox. O PIX foi criado sem duplicidade, mas o QR Code ainda ficou como instrução pendente. A entrega do webhook pelo próprio Asaas depende de uma URL HTTPS pública.

## 2. Confirme que a conta é Sandbox

1. Abra [Asaas Sandbox](https://sandbox.asaas.com) no navegador.
2. Confira se o endereço começa com `https://sandbox.asaas.com`.
3. Entre na conta criada.
4. Se você criou apenas uma conta de produção, faça o cadastro também no Sandbox. Contas, dados e chaves dos dois ambientes são independentes. [Documentação dos ambientes](https://docs.asaas.com/reference/comece-por-aqui).

**Resultado esperado:** você consegue entrar no painel do Sandbox.

Não use o aplicativo do seu banco para pagar os testes. A simulação de recebimento será feita no ambiente de testes quando o fluxo estiver integrado.

## 3. Gere a chave de API

Faça isso no navegador, dentro do **Sandbox**:

1. Abra o menu do usuário, geralmente no canto superior direito.
2. Procure **Integração** ou **Integrações**.
3. Abra **Chaves de API**.
4. Clique na opção para gerar uma nova chave.
5. Se houver um campo de nome, use `Meu Camp - Sandbox local`.
6. Se definir uma validade, anote quando precisará renovar.
7. Copie a chave completa e guarde-a em um gerenciador de senhas antes de sair dessa tela.

Os rótulos podem variar conforme a interface. A criação exige um usuário administrador; a chave completa é exibida apenas uma vez. [Guia oficial de chaves](https://docs.asaas.com/docs/chaves-de-api).

Uma chave nova de Sandbox começa com `$aact_hmlg_`. Se começar com `$aact_prod_`, pertence à produção. Não use essa chave neste projeto de testes. [Autenticação por ambiente](https://docs.asaas.com/docs/authentication).

**Resultado esperado:** você guardou a chave Sandbox. Não a envie no chat nem em capturas de tela.

## 4. Abra o arquivo de configuração do projeto

No VS Code:

1. Abra a pasta `/home/nune/Meus Projetos/jiu`.
2. Pressione **Ctrl + P**.
3. Digite `.env.local` e pressione **Enter**.
4. Se o arquivo não existir, crie um arquivo com esse nome na raiz da pasta `jiu`, junto do `package.json`.

Esse é um arquivo de texto. Os valores são escritos nele, **não no SQL Editor do Supabase e não diretamente no terminal**.

Mantenha as configurações Supabase que já existem. Não substitua todo o arquivo pelo exemplo abaixo.

## 5. Adicione a configuração Asaas

Acrescente estas duas linhas ao `.env.local`. Se já existirem, edite as linhas existentes, sem duplicá-las:

```dotenv
ASAAS_ENVIRONMENT=sandbox
ASAAS_SANDBOX_API_KEY=\$aact_hmlg_COLE_O_RESTANTE_DA_SUA_CHAVE_AQUI
```

O texto acima é apenas um exemplo. Na segunda linha, coloque sua chave completa, com um cuidado:

1. Cole o valor original depois do sinal `=`.
2. Coloque uma barra invertida `\` antes de **cada** caractere `$` da chave.
3. Deixe tudo em uma única linha, sem espaços extras.
4. Salve com **Ctrl + S**.

Exemplo fictício:

| Onde | Como fica |
| --- | --- |
| Chave copiada do Asaas | `$aact_hmlg_EXEMPLO123` |
| Linha no arquivo | `ASAAS_SANDBOX_API_KEY=\$aact_hmlg_EXEMPLO123` |

O Next.js interpreta `$` como referência a outra variável. A barra faz com que ele preserve o caractere original. Isso é necessário no arquivo `.env.local`; não acrescente a barra à chave guardada no gerenciador de senhas. Apenas colocar aspas não resolve a expansão do Next.js. [Variáveis de ambiente do Next.js](https://nextjs.org/docs/14/app/building-your-application/configuring/environment-variables).

Não crie uma variável chamada `NEXT_PUBLIC_ASAAS_SANDBOX_API_KEY`: esse prefixo é destinado a valores que podem ir para o navegador.

`SUPABASE_SECRET_KEY` é necessária para emissão e webhook e já deve estar configurada apenas no servidor. `ASAAS_WEBHOOK_TOKEN` pode ficar vazio somente para o teste de conexão do passo 7; antes de cadastrar o webhook, siga o passo 9. Nunca use prefixo `NEXT_PUBLIC_` nessas variáveis.

## 6. Prepare o terminal

Abra um terminal e execute:

```bash
cd "/home/nune/Meus Projetos/jiu"
node --version
```

Se aparecer `v24...`, pode seguir.

Se aparecer “node: comando não encontrado”, execute estes comandos, usando a instalação já existente no seu computador:

```bash
source /home/nune/.nvm/nvm.sh
nvm use 24
node --version
```

Não execute `source .env.local`. O arquivo é carregado pelo Next.js, e não deve ser interpretado como um script de terminal.

## 7. Teste a conexão sem criar cobrança

Na mesma pasta `jiu`, copie **todo** o bloco abaixo, incluindo a primeira linha e a última linha `NODE`, cole no terminal e pressione **Enter**.

Não precisa substituir nenhum texto neste comando. Ele lê a chave do arquivo, faz uma consulta e mostra apenas o resultado HTTP. Não imprime a chave nem os dados retornados.

```bash
node <<'NODE'
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

async function main() {
  const key = process.env.ASAAS_SANDBOX_API_KEY;

  if (process.env.ASAAS_ENVIRONMENT !== 'sandbox') {
    console.log('CONFIGURACAO: defina ASAAS_ENVIRONMENT=sandbox.');
    process.exitCode = 1;
    return;
  }
  if (!key || !key.startsWith('$aact_hmlg_')) {
    console.log('CONFIGURACAO: confira a chave Sandbox e as barras antes dos caracteres $ no .env.local.');
    process.exitCode = 1;
    return;
  }

  try {
    const response = await fetch('https://api-sandbox.asaas.com/v3/customers?limit=1', {
      method: 'GET',
      redirect: 'error',
      headers: {
        access_token: key,
        'Content-Type': 'application/json',
        'User-Agent': 'MeuCamp-Sandbox-Check/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });
    console.log(response.ok
      ? 'CONEXAO APROVADA: HTTP ' + response.status + '. Nenhuma cobranca criada.'
      : 'CONEXAO RECUSADA: HTTP ' + response.status + '. Consulte a secao de problemas do guia.');
    await response.body?.cancel();
    if (!response.ok) process.exitCode = 1;
  } catch {
    console.log('FALHA DE REDE: confira sua internet e tente novamente.');
    process.exitCode = 1;
  }
}

main();
NODE
```

A consulta usa a autenticação e o endereço de Sandbox documentados pelo Asaas. [Referência](https://docs.asaas.com/docs/authentication).

**Resultado esperado:**

```text
CONEXAO APROVADA: HTTP 200. Nenhuma cobranca criada.
```

Mesmo se não houver clientes cadastrados, a consulta pode ser aprovada.

Esse resultado confirma apenas o acesso à API. Ainda não confirma emissão de PIX, boleto, webhook ou efetivação de inscrições.

## 8. Reinicie o site, se ele estiver aberto

Se houver um terminal executando o site:

1. Vá até esse terminal.
2. Pressione **Ctrl + C** uma vez.
3. Na pasta `jiu`, execute:

```bash
npm run dev
```

Abra o endereço mostrado no terminal, normalmente [localhost:3000](http://localhost:3000).

Se você não estava executando o site, este passo é opcional para o teste de conexão: o comando do passo 7 funciona sem o servidor aberto.

## 9. Validar o QR Code PIX no Sandbox

O teste de 8 de setembro de 2026 confirmou:

- boleto: habilitado e homologado pela interface;
- PIX: habilitado e cobrança real homologada pela interface;
- QR Code PIX: ainda retornou como instrução pendente.

Se o QR Code continuar pendente:

1. Entre em [sandbox.asaas.com](https://sandbox.asaas.com).
2. Abra a área PIX e confirme se existe uma chave PIX cadastrada para a conta Sandbox.
3. Se não existir, cadastre uma chave somente de teste.
4. Gere uma nova cobrança pelo teste automatizado abaixo.
5. Se continuar pendente, consulte os logs do Sandbox ou o Sucesso de Integrações do Asaas, sem enviar a chave de API.

A documentação oficial informa que contas criadas diretamente no Sandbox são aprovadas automaticamente quando os dados comerciais obrigatórios são válidos; nomes com números ou caracteres especiais podem impedir a aprovação e o PIX. [Aprovação de contas](https://docs.asaas.com/docs/aprova%C3%A7%C3%A3o-de-contas) e [FAQ Sandbox](https://docs.asaas.com/docs/faq-sandbox).

Com o painel mostrando PIX habilitado, mantenha o site rodando e execute:

```bash
cd "/home/nune/Meus Projetos/jiu/automação"
npm run test:payments:asaas:pix
```

Esse comando cria cliente/cobrança fictícios, valida a UI e remove os recursos pelos IDs e referências da própria execução. Ele não movimenta dinheiro real.

## 10. Configurar e homologar o webhook

### Credencial privada do Supabase — quando solicitada na Sprint 6

Para o servidor persistir tentativas de cobranca e processar eventos internos:

1. Abra [o projeto correto no Supabase](https://supabase.com/dashboard/project/kfvypacjzlzwwblsbpwj).
2. Acesse **Settings → API Keys → Publishable and secret API keys**.
3. Na seção **Secret keys**, copie uma chave começando com `sb_secret_`. Se não existir, crie uma nova chave.
4. Abra `/home/nune/Meus Projetos/jiu/.env.local` no VS Code.
5. Preencha a linha abaixo com o valor completo e salve:

```dotenv
SUPABASE_SECRET_KEY=sb_secret_SUA_CHAVE_COMPLETA
```

O texto acima é um exemplo. Não substitua `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` nem as linhas Asaas existentes. Se o servidor estiver aberto, reinicie conforme o passo 8.

A Secret key tem privilégios elevados e só pode ser usada no servidor. Não a envie no chat nem adicione `NEXT_PUBLIC_` ao seu nome. Esta configuração não significa que o checkout/webhook já esteja implementado. [Referência oficial](https://supabase.com/docs/guides/getting-started/api-keys).

### Cadastro do webhook

O endpoint pronto é `POST /api/payments/webhook`. Ele autentica, limita e valida o corpo, persiste o ID externo, processa pagamento/inscrições em transação e ignora reenvios já processados. Para receber uma entrega do próprio Asaas, ele precisa estar publicado em HTTPS.

Antes do cadastro:

1. Gere um token forte no terminal, sem publicá-lo:

   ```bash
   openssl rand -hex 32
   ```

2. Copie o resultado para `ASAAS_WEBHOOK_TOKEN=` no `.env.local` e para a variável privada equivalente do ambiente HTTPS. Não use a chave da API como token de webhook.
3. Confirme que `SUPABASE_SECRET_KEY` também existe no servidor HTTPS.
4. Publique a aplicação e confirme que a URL abre por HTTPS. O endereço será `https://SEU-DOMINIO/api/payments/webhook`.
5. No painel Sandbox, abra **Integrações → Webhooks** e crie um webhook de pagamentos.
6. Informe a URL HTTPS e, no campo de token/autenticação, cole exatamente o mesmo valor de `ASAAS_WEBHOOK_TOKEN`.
7. Habilite ao menos `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED` e `PAYMENT_REFUNDED`. `PAYMENT_CONFIRMED` pode ser recebido, mas o Meu Camp o envia para conciliação em vez de efetivar automaticamente.
8. Use envio sequencial, mantenha o webhook ativo e salve.
9. Crie uma cobrança pelo Meu Camp. No painel Sandbox, confirme manualmente o pagamento dessa cobrança.
10. Confira os logs do webhook e confirme no Meu Camp que pagamento, tentativa e inscrição mudaram uma única vez.
11. Reenvie o mesmo evento no painel/log do Asaas e confirme que o estado não duplicou nem regrediu.

O `authToken` deve ter entre 32 e 255 caracteres e chega no cabeçalho `asaas-access-token`. A API do Asaas também modela os webhooks como entrega repetível, por isso o ID externo é a chave de idempotência. [Criar webhook](https://docs.asaas.com/reference/create-new-webhook) e [introdução oficial](https://docs.asaas.com/docs/sobre-os-webhooks).

`localhost:3000` só aponta para o computador de quem acessa; o Asaas não consegue usá-lo para chamar seu computador. O endereço público definitivo de teste será informado quando o endpoint estiver pronto.

O segredo do webhook é diferente da chave de API. O Asaas o envia no cabeçalho `asaas-access-token`; ele deve ter de 32 a 255 caracteres, sem espaços. [Guia oficial de webhook](https://docs.asaas.com/docs/receive-asaas-events-at-your-webhook-endpoint).

## 11. Problemas comuns

| O que apareceu | O que conferir |
| --- | --- |
| Não encontro “Integrações” | Entre pelo navegador e confirme que seu usuário é administrador da conta. |
| Perdi a chave depois de sair da tela | Gere outra e atualize o arquivo; o painel não recupera a chave completa anterior. |
| Mensagem começando com CONFIGURACAO | Confira o nome do arquivo, a pasta, as duas variáveis e a barra antes de cada `$`. Salve e repita o passo 7. |
| HTTP 401 | Confira se a chave é Sandbox, foi copiada inteira e está ativa. |
| HTTP 403 | Pode haver restrição de acesso/IP. Confira as configurações da conta e informe apenas o código do erro para investigarmos. |
| `invalid_billingType` ao criar PIX | Complete os dados comerciais da conta Sandbox, remova números/caracteres especiais do nome e aguarde a aprovação automática. |
| Webhook retorna HTTP 401 | O token configurado no Asaas é diferente de `ASAAS_WEBHOOK_TOKEN`, está ausente ou tem menos de 32 caracteres. |
| Webhook retorna HTTP 413 | O corpo excedeu 64 KiB; confira se a URL/evento está correto e não reenvie payload transformado. |
| FALHA DE REDE | Confira a internet e tente novamente; não gere outra chave apenas por essa mensagem. |
| Cannot find module '@next/env' | Confirme que está na pasta `jiu`, não em `automação`, e que as dependências do projeto estão instaladas. |
| npm ou node não encontrado | Execute os comandos do passo 6 no terminal atual. |

A documentação do Asaas detalha erros de [autenticação](https://docs.asaas.com/docs/authentication) e [restrição por IP](https://docs.asaas.com/docs/chaves-de-api).

## 12. Como saber que sua parte está pronta

- [ ] Entrei no painel em `sandbox.asaas.com`.
- [ ] Gerei e guardei uma chave de Sandbox.
- [ ] Acrescentei as duas configurações ao `.env.local`, mantendo o Supabase.
- [ ] Preservei os caracteres `$` com barras no arquivo.
- [ ] O passo 7 retornou HTTP 200.
- [ ] Completei os dados comerciais e o painel mostra PIX habilitado.
- [ ] Configurei um `ASAAS_WEBHOOK_TOKEN` exclusivo no servidor e no webhook Sandbox.
- [ ] Publiquei uma URL HTTPS e recebi `PAYMENT_RECEIVED` real do Sandbox.
- [ ] Reenviei o mesmo evento e confirmei uma única efetivação.

Quando terminar, informe apenas: **“Configurei a chave e o teste retornou HTTP 200.”**

Se falhar, informe a mensagem de resultado. Não envie a chave nem o conteúdo do `.env.local`.
