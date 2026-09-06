import { Decimal } from "decimal.js";

Decimal.set({ precision: 32 });
export function numeric(value: unknown): number {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    String(value).trim() === ""
  )
    throw new Error("invalidNumber");
  const decimal = new Decimal(value);
  if (!decimal.isFinite() || decimal.abs().greaterThan("1e20"))
    throw new Error("invalidNumber");
  return decimal.toNumber();
}
export const sum = (values: number[]): number =>
  values
    .reduce((total, v) => total.plus(numeric(v)), new Decimal(0))
    .toNumber();
export const multiply = (a: number, b: number): number =>
  new Decimal(a).times(b).toNumber();
export const subtract = (a: number, b: number): number =>
  new Decimal(a).minus(b).toNumber();
export const divide = (a: number, b: number): number =>
  new Decimal(a).div(b).toNumber();
