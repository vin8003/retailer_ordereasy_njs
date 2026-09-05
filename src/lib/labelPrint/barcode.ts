import type { BarcodeFormat } from "./types";

export function ean13CheckDigit(digits12: string): number {
  const nums = digits12.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += nums[i] * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidEan13(value: string): boolean {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12) return true;
  if (digits.length !== 13) return false;
  return ean13CheckDigit(digits.slice(0, 12)) === Number(digits[12]);
}

export function resolveBarcodeFormat(value: string, preferred: BarcodeFormat): BarcodeFormat {
  if (preferred === "EAN13" && isValidEan13(value)) return "EAN13";
  return "CODE128";
}
