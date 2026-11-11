# Login de clientes por código enviado por email

## O que muda para o cliente
- A tela de login passa a ter só o campo de email e o botão "Receber código". Depois o cliente digita o código de 6 dígitos e entra.
- Saem da área do cliente: o login por CNPJ, a senha, o "esqueci minha senha" e a página de redefinir senha.
- O código só chega para clientes cadastrados e ativos. A mensagem é sempre a mesma: "Se o email estiver cadastrado, enviaremos um código".
- O email com o código vem em português, com a marca da 2M, e avisa que o código vale 10 minutos.
- O cliente fica conectado por 7 dias.

## O que muda para a equipe (admin)
- O email passa a ser obrigatório no cadastro e na importação de clientes.
- Novo filtro "sem email" na lista de clientes.
- Novo botão "Enviar acesso", que manda um email de boas-vindas com o link para o login.
- Continuam iguais: "Ver como Cliente", o login da equipe e a entrada pelo Brand Hub.
- Entrada pelo Brand Hub com email que não é cliente: aparece a mensagem "Seu acesso ainda não foi liberado. Entre em contato com a 2M."

## Etapas
1. **Banco de dados**
   - Nova coluna `clients.user_id`, ligada à conta de acesso do cliente.
   - O email passa a ser obrigatório para clientes novos. Os antigos sem email continuam e aparecem no filtro "sem email".
   - Regra de acesso: o cliente logado lê só o próprio registro (`user_id = auth.uid()`). Os admins continuam vendo tudo.
   - Criação de contas de acesso, sem senha e com papel 'user', para os clientes atuais que têm email.
   - Remoção de `verify_client_login`, `verify_client_login_by_email`, `reset_client_password_by_*`, `change_client_password`, `admin_reset_client_password`, `create_password_reset_token`, `verify_reset_code_and_change_password` e da tabela `password_reset_tokens`.
   - A coluna `password_hash` dos clientes fica opcional e deixa de ser usada.
2. **Funções no servidor**
   - `request-login-code`: confere se o email é de um cliente ativo e só então envia o código, sem criar conta nova. A resposta é sempre genérica e há limite de tentativas.
   - `admin-provision-client`: chamada no cadastro e na importação. Cria a conta de acesso sem senha, dá o papel 'user' e preenche `clients.user_id`. Só admins podem usar.
   - `send-client-welcome`: envia o email de boas-vindas com o link para /login. Só admins podem usar.
   - `sso`: passa a conferir se o email existe em `clients`. Remoção de `send-reset-code`.
3. **Telas**
   - `Login.tsx`: fluxo em duas etapas, email e depois código, com `verifyOtp` do tipo email.
   - `AuthContext`: passa a usar a sessão real de login e busca o cliente por `user_id`. Sai o `client_session` do navegador.
   - `AuthCallback`: só usa a sessão de login e mostra a mensagem de acesso não liberado quando for o caso.
   - Remoção da rota `/redefinir-senha`, do `ClientChangePasswordModal` e do `ClientResetPasswordModal`.
   - Admin: email obrigatório no formulário e na importação, filtro "sem email" e botão "Enviar acesso".
   - "Ver como Cliente" e `ProtectedRoute` continuam aceitando cliente ou admin.
4. **Emails**
   - Configuração dos emails de login com a marca 2M. O modelo "Magic link" passa a mostrar o código (`{{ .Token }}`) com o aviso de validade de 10 minutos.
   - Email de boas-vindas em português.
5. **Memória do projeto**
   - Remoção das regras da senha 2mCliente e do `client_session`.
   - Nova regra: "clientes entram por código enviado por email (OTP Supabase Auth)".
   - A senha padrão 2mGrupo da equipe continua.

## Ajustes que você faz nas configurações
Algumas opções não consigo mudar por aqui. Você ajusta em **Mais → Usuários → Configurações de autenticação → Email**:
- **Email OTP expiration** = 600, para o código valer 10 minutos.
- **Email OTP length** = 6.
- Duração da sessão de 7 dias: a conexão se renova sozinha. Para garantir o prazo de 7 dias, o app desconecta o cliente 7 dias depois da entrada.

## Pré-requisito: domínio de envio
Para os emails saírem com o nome e a marca da 2M, é preciso um domínio de envio verificado, por exemplo `2mgrupo.com.br`, o que pede um plano pago. Sem ele, o código chega pelo remetente padrão, com o texto em português.

## Riscos
- Clientes sem email ficam sem acesso até a equipe cadastrar o email deles.
- Admin e cliente passam a usar o mesmo login. Quem for admin entra como admin. "Ver como Cliente" continua funcionando como hoje.
