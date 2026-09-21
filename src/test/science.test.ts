import { describe, expect, it } from "vitest";
import {
  consistencyScore,
  fluencyBand,
  latencyProfile,
  learningCurve,
  linearRegression,
  median,
  quartiles,
} from "@/lib/science";

describe("measurement science", () => {
  it("fits a perfect line with r² of 1", () => {
    const fit = linearRegression([{ x: 1, y: 10 }, { x: 2, y: 20 }, { x: 3, y: 30 }]);
    expect(fit?.slope).toBe(10);
    expect(fit?.r2).toBe(1);
  });

  it("returns null for fewer than two points or zero variance in x", () => {
    expect(linearRegression([])).toBeNull();
    expect(linearRegression([{ x: 5, y: 1 }])).toBeNull();
    expect(linearRegression([{ x: 5, y: 1 }, { x: 5, y: 9 }])).toBeNull();
  });

  it("computes low r² for scattered data", () => {
    const fit = linearRegression([{ x: 1, y: 10 }, { x: 2, y: 90 }, { x: 3, y: 15 }, { x: 4, y: 85 }]);
    expect(fit?.r2 ?? 0).toBeLessThan(0.3);
  });

  it("splits quartiles and IQR", () => {
    const { q1, q2, q3, iqr } = quartiles([2, 4, 6, 8, 10]);
    expect(q2).toBe(6);
    expect(iqr).toBeGreaterThanOrEqual(0);
    expect(q3).toBeGreaterThanOrEqual(q1);
  });

  it("profiles latency with fluency bands and outlier counts", () => {
    const profile = latencyProfile([900, 1100, 1000, 950, 10500]);
    expect(profile.band).toBe("fluent");
    expect(profile.outliers).toBe(1);
    expect(profile.median).toBe(1000);

    const slow = latencyProfile([6000, 7000, 6500]);
    expect(slow.band).toBe("emerging");
  });

  it("scores consistency as longest correct run ratio", () => {
    expect(consistencyScore([true, true, true])).toBe(1);
    expect(consistencyScore([true, false, false, true])).toBe(0.25);
    expect(consistencyScore([])).toBe(0);
  });

  it("builds a learning curve verdict from session history", () => {
    const rising = learningCurve([
      { independenceRate: 40, score: 50 },
      { independenceRate: 50, score: 55 },
      { independenceRate: 65, score: 60 },
      { independenceRate: 80, score: 70 },
    ]);
    expect(rising.regression?.slope).toBeGreaterThan(10);
    expect(rising.tone).toBe("good");

    const short = learningCurve([{ score: 50 }, { score: 60 }]);
    expect(short.tone).toBe("info");
  });
});
