import { describe, expect, it } from "vitest";
import {
  DEFAULT_FIT_TARGET_INPUT,
  parseFitTargetInput,
} from "@/lib/recommendations/fitTargetInput";

describe("parseFitTargetInput", () => {
  it("defaults to the established 470 / 631 target", () => {
    const parsed = parseFitTargetInput(DEFAULT_FIT_TARGET_INPUT);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.target).toEqual({ x: 470, y: 631 });
  });

  it("maps the entered values straight onto TargetPosition", () => {
    const parsed = parseFitTargetInput({ handlebarX: "455.5", handlebarY: "610" });
    expect(parsed.ok && parsed.target).toEqual({ x: 455.5, y: 610 });
  });

  it("rejects non-numeric values", () => {
    const parsed = parseFitTargetInput({ handlebarX: "abc", handlebarY: "631" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.handlebarX).toMatch(/number/i);
  });

  it("rejects empty and non-positive values", () => {
    const empty = parseFitTargetInput({ handlebarX: "", handlebarY: "631" });
    const zero = parseFitTargetInput({ handlebarX: "470", handlebarY: "0" });
    const negative = parseFitTargetInput({ handlebarX: "470", handlebarY: "-10" });
    expect(empty.ok).toBe(false);
    expect(zero.ok).toBe(false);
    expect(negative.ok).toBe(false);
    if (!zero.ok) expect(zero.errors.handlebarY).toMatch(/greater than zero/i);
  });
});
