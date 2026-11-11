// Senha do cliente: mínimo 8 caracteres, com pelo menos uma letra e um número
export const validateClientPassword = (pw: string): string | null => {
  if (pw.length < 8) return 'A senha precisa ter no mínimo 8 caracteres';
  if (!/[A-Za-zÀ-ÿ]/.test(pw)) return 'A senha precisa ter pelo menos uma letra';
  if (!/\d/.test(pw)) return 'A senha precisa ter pelo menos um número';
  return null;
};
