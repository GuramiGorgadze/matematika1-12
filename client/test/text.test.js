import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { htmlToText, texToText } from "../src/lib/text.js";

describe("TeX → readable text (teacher sheet)", () => {
  const cases = [
    ["ა) $-16$", "ა) -16"],
    ["იპოვე $\\dfrac{a-b}{a+b}$, როცა $a=7$.", "იპოვე (a-b)/(a+b), როცა a=7."],
    ["$\\dfrac25$", "2/5"],
    ["$\\dfrac{a\\sqrt{a^2+b^2}}{2b}$", "(a√(a²+b²))/(2b)"],
    ["$9x^{2}y^{4}$", "9x²y⁴"],
    ["$\\sqrt[3]{27}=3$", "³√27=3"],
    ["$2{,}5$", "2,5"],
    ["$a_n=a_1+(n-1)d$", "aₙ=a₁+(n-1)d"],
    ["$\\left(\\frac12\\right)^2$", "(1/2)²"],
    ["$\\sin 30^\\circ$", "sin 30°"],
    ["<p>ფასი 5&#36; <b>და</b> $x\\le-2$</p>", "ფასი 5$ და x≤-2"],
  ];
  for (const [input, want] of cases) it(input, () => assert.equal(htmlToText(input), want));

  it("keeps unknown commands readable and never throws", () => {
    assert.equal(texToText("\\unknown{x}"), "unknownx");
    assert.equal(texToText("x^"), "x^");
    assert.equal(htmlToText("<svg><path/></svg> ამოცანა"), "[ნახაზი] ამოცანა");
  });
});
