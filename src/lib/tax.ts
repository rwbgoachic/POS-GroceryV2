import { calculateTax } from '@paysurity/tax';

export const applyTax = (subtotal: number, state: string) => {
  return calculateTax(subtotal, state);
};