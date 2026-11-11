# Login de clientes: senha própria + código por email no primeiro acesso

O login por código já existe. Este plano acrescenta a senha própria por cima dele.

## O que muda para o cliente
- **Tela de login:** a forma principal passa a ser email + senha → **Entrar**.
- **Link "Primeiro acesso ou esqueci minha senha":** o cliente digita o email → **Receber código** → digita os 6 dígitos → vai direto para a tela "Crie sua senha".
- **Tela "Crie sua senha":** obrigatória depois de entrar por código. Tem senha e confirmação, com no mínimo 8 caracteres, letras e números. Enquanto o cliente não criar a senha, não acessa o sistema.
- **"Alterar senha":** nova opção no topo da área do cliente, ao lado do botão Sair. Pede a senha atual e a nova.
- Continuam iguais:
  - A mensagem genérica no envio do código.
  - Só clientes ativos recebem código.
  - A conexão de até 7 dias.
  - A entrada pelo Brand Hub.
  - O "Ver como Cliente".

## O que muda para a equipe (admin)
- **Enviar acesso em lote:** caixas de seleção na lista de clientes e o botão "Enviar acesso aos selecionados".
- **Email de boas-vindas:** passa a explicar o primeiro acesso: entrar em /login, clicar em "Primeiro acesso", receber o código e criar a senha.
- Continuam iguais: o email obrigatório, o filtro "sem email" e o botão individual.

## Etapas técnicas
1. **Banco:** nova coluna `clients.must_set_password` (padrão true; o cliente 2M atual também fica true). Função segura `mark_password_set()`: o cliente logado marca o próprio registro como false. `password_hash` continua sem uso (já marcada como descontinuada).
2. **Login.tsx:** dois modos, `password` (`signInWithPassword`) e `code` (fluxo atual de OTP). Depois do código, a pessoa vai para `/criar-senha`.
3. **Nova página `/criar-senha`:** chama `supabase.auth.updateUser({ password })` e depois `mark_password_set()`. A regra da senha fica numa função testada: no mínimo 8 caracteres, com pelo menos uma letra e um número.
4. **AuthContext:** expõe `mustSetPassword`. `ProtectedRoute` manda para `/criar-senha` quando for true. Admins não são afetados.
5. **Modal "Alterar senha" no Header:** confirma a senha atual com `signInWithPassword` e depois usa `updateUser`.
6. **Admin:** seleção múltipla e envio em lote, que chama `admin-provision-client` para cada cliente.
7. **Memória do projeto:** nova regra: "clientes entram com email e senha própria; primeiro acesso e recuperação por código enviado por email (OTP Supabase Auth)".
8. **Teste automático:** da regra da senha (8 caracteres, letras e números).

## Atenções
- **Email da equipe usado como cliente** (por exemplo, ana.braga@2mgrupo.com.br): a conta de acesso é a mesma. Criar a senha de cliente troca também a senha de admin. Recomendo emails diferentes para equipe e clientes.
- **Email de boas-vindas com a marca 2M e o modelo do código:** continuam dependendo do domínio de envio verificado. Sem ele, o texto sai pelo remetente padrão.
- **Validade de 10 minutos:** continua sendo ajustada por você em **Configurações de autenticação → Email → Email OTP expiration = 600**.
