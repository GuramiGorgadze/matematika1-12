import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chapterProblemCount, CHK, CURR, keyedProblems, PBYID, PROBS, renderMath, testable } from "../src/content/index.js";
import { CATALOG, GRADES } from "../src/content/grades.js";
import { EXAMS } from "../src/content/pack/exams.js";
import { buildChapterTest, chapterAnswers, examAnswers, examMax, scoreChapter, scoreExam } from "../src/content/tests.js";

/** a string the checker should accept for a problem's own answer key */
function correctInput(k) {
  if (k.t === "num") return String(k.v);
  if (k.t === "multi") return k.v.join("; ");
  if (k.t === "ch") return String(k.v);
  if (k.t === "expr") return k.v;
  if (k.t === "int") return k.v;
  if (k.t === "txt") return k.v[0];
  return null;
}
/* TeX commands the built-in converter does not know end up as literal text */
const leftoverTex = (html) => renderMath(html).replace(/<[^>]+>/g, " ").match(/\\[a-zA-Z]+/g);

describe("curriculum", () => {
  it("has material for every grade, keeping the original grades 7, 8 and 11", () => {
    for (let n = 1; n <= 12; n++) assert.ok(CURR[n].length >= 3, `grade ${n} has chapters`);
    assert.equal(CURR[7][0].placeholder, undefined);
    assert.equal(CURR[11].find((c) => c.id === "t1").lessons.length, 14);
    const t6 = CURR[11].find((c) => c.id === "t6");
    assert.ok(!t6.soon && t6.placeholder && t6.lessons.length === 3, "grade 11 chapter VI filled in");
  });

  it("keeps the light grade metadata (cover page, contents) in step with the curriculum", () => {
    let lessons = 0;
    let problems = 0;
    for (const g of GRADES) {
      const chs = CURR[g.n].filter((c) => !c.soon);
      const ls = chs.reduce((s, c) => s + c.lessons.length, 0);
      assert.equal(g.chapters, CURR[g.n].length, `grade ${g.n}: chapter count`);
      assert.equal(g.lessons, ls, `grade ${g.n}: lesson count`);
      assert.ok(g.topics.length >= 3, `grade ${g.n}: topics`);
      lessons += ls;
      problems += chs.reduce((s, c) => s + chapterProblemCount(c), 0);
    }
    assert.deepEqual(CATALOG, { grades: 12, lessons, problems, exams: EXAMS.length });
  });

  it("gives every chapter (original and placeholder) a usable summary test", () => {
    for (let n = 1; n <= 12; n++) for (const ch of CURR[n]) assert.ok(testable(ch), `grade ${n} ${ch.id} has ≥20 checkable problems`);
  });

  it("renders every placeholder lesson without unsupported TeX", () => {
    for (let n = 1; n <= 12; n++)
      for (const ch of CURR[n].filter((c) => c.placeholder))
        for (const l of ch.lessons) assert.equal(leftoverTex(l.html), null, `${l.id} html`);
  });

  it("accepts the right answer for every generated placeholder problem and renders it cleanly", () => {
    let n = 0;
    for (let g = 1; g <= 12; g++)
      for (const ch of CURR[g].filter((c) => c.placeholder))
        for (const l of ch.lessons) {
          const list = PROBS[l.id];
          assert.ok(list.length >= 10, `${l.id} has ${list.length} problems`);
          for (const p of list) {
            n++;
            assert.ok(p.k, `${p.id} is checkable`);
            assert.equal(CHK.check(correctInput(p.k), p.k), true, `${p.id}: ${p.q} — key ${JSON.stringify(p.k)}`);
            for (const part of [p.q, p.a, p.s]) assert.equal(leftoverTex(part), null, `${p.id} renders: ${part}`);
          }
        }
    assert.ok(n > 900, `generated ${n} placeholder problems`);
  });

  it("indexes problem ids uniquely", () => {
    const all = Object.values(PROBS).flat();
    assert.equal(new Set(all.map((p) => p.id)).size, all.length);
    assert.equal(Object.keys(PBYID).length, all.length);
  });
});

describe("chapter tests", () => {
  const ch = CURR[11].find((c) => c.id === "t1");

  it("is reproducible for a seed and spreads questions over the lessons", () => {
    const a = buildChapterTest(keyedProblems(ch), 30, 42);
    const b = buildChapterTest(keyedProblems(ch), 30, 42);
    assert.deepEqual(a, b);
    assert.equal(a.length, 30);
    assert.equal(new Set(a.map((x) => x.id)).size, 30);
    assert.ok(a.filter((x) => x.o).length >= 11, "about a third are multiple choice");
  });

  it("scores right, wrong and empty answers and reports them per question", () => {
    const items = buildChapterTest(keyedProblems(CURR[3][0]), 20, 7);
    const answers = {};
    items.forEach((it, i) => {
      if (i === 0) return; /* unanswered */
      if (i === 1) answers[i] = it.o ? (it.c + 1) % it.o.length : "123456789";
      else answers[i] = it.o ? it.c : correctInput(PBYID[it.id].k);
    });
    const { score, results } = scoreChapter(items, answers, PBYID, CHK);
    assert.equal(score, 18);
    assert.equal(results[0], "unanswered");
    assert.equal(results[1], "wrong");
    const rows = chapterAnswers(items, answers, results, PBYID);
    assert.equal(rows[1].status, "wrong");
    assert.ok(rows[2].prompt.length > 3 && !/<[a-z]/.test(rows[2].prompt), "plain-text prompt");
  });
});

describe("grade 12 exams", () => {
  it("full marks for right answers on every auto-graded item, open items wait for self-assessment", () => {
    assert.equal(EXAMS.length, 9);
    for (const ex of EXAMS) {
      const answers = {};
      for (const it of ex.items) answers[it.n] = it.o ? it.a : it.k ? correctInput(it.k) : "ჩემი ამოხსნა";
      const s = scoreExam(ex, answers, {}, CHK);
      const auto = ex.items.filter((it) => it.o || it.k).reduce((t, it) => t + it.p, 0);
      assert.equal(s.score, auto, `${ex.id}`);
      const self = Object.fromEntries(ex.items.filter((it) => !it.o && !it.k).map((it) => [it.n, it.p]));
      assert.equal(scoreExam(ex, answers, self, CHK).score, examMax(ex));
      const rows = examAnswers(ex, answers, s.results);
      assert.equal(rows.length, ex.items.length);
    }
  });
});
