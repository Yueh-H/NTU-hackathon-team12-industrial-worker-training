import { describe, expect, it } from "vitest";
import { matchesZhTarget, normalizeSpeechText, zhSpeechTarget } from "./speech";

describe("Chinese speech target matching", () => {
  it("accepts common simplified-character recognition output", () => {
    expect(matchesZhTarget("總成辨識", "总成辨识")).toBe(true);
  });

  it("accepts a sentence containing the card term", () => {
    expect(matchesZhTarget("防火玻璃", "這是防火玻璃")).toBe(true);
  });

  it("does not pass when the target term was not spoken", () => {
    expect(matchesZhTarget("母扇", "子扇")).toBe(false);
    expect(matchesZhTarget("母扇", "mother leaf")).toBe(false);
  });

  it("ignores punctuation and spaces", () => {
    expect(normalizeSpeechText("開外／開內")).toBe("開外開內");
  });

  it("keeps a short readable target for long card labels", () => {
    expect(zhSpeechTarget("開外／開內")).toBe("開外");
    expect(zhSpeechTarget("表頭：項次／製造規格")).toBe("表頭");
  });
});
