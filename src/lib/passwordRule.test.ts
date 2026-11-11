// @ts-ignore - executado com o bun test
import { describe, expect, test } from 'bun:test';
import { validateClientPassword } from './passwordRule';

describe('regra de senha do cliente', () => {
  test('rejeita menos de 8 caracteres', () => expect(validateClientPassword('abc1234')).not.toBeNull());
  test('rejeita sem número', () => expect(validateClientPassword('abcdefgh')).not.toBeNull());
  test('rejeita sem letra', () => expect(validateClientPassword('12345678')).not.toBeNull());
  test('aceita 8 caracteres com letra e número', () => expect(validateClientPassword('abcdefg1')).toBeNull());
});
