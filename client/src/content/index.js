/**
 * The whole curriculum, assembled once (≈1 MB, loaded lazily — see useContent.js):
 * original lessons and problems for grades 7, 8 and 11 from the content pack, plus general
 * placeholder chapters for every grade that had no material.
 */
import { CHK, CURR as BASE, GEN, MATHML, PROBS } from "./pack/core.js";
import { NOT_IN_TEST, registerTrig11 } from "./pack/trig11.js";
import { primaryGrades } from "./placeholders/primary.js";
import { secondaryGrades } from "./placeholders/secondary.js";

const primary = primaryGrades(GEN);
const secondary = secondaryGrades(GEN);

registerTrig11(GEN);

/* every generator is registered: build the problem banks and give each problem a stable id */
GEN.finish(PROBS);

/*
 * grade 11, chapter I (trigonometry): answers are exact (fractions, roots, π) — decimals are not accepted;
 * the triple-angle formulas and the sine/cosine theorems (lesson c1s13) stay in the lessons for practice
 * but are never drawn into the chapter test.
 */
const TRIG_LESSONS = BASE[11].find((c) => c.id === "t1").lessons.map((l) => l.id);
for (const id of TRIG_LESSONS)
  for (const p of PROBS[id] || []) {
    if (p.k && (p.k.t === "num" || p.k.t === "multi") && id !== "c1s13") {
      p.k.exact = true;
      delete p.k.tol;
    }
    if (id === "c1s13" || NOT_IN_TEST.test(p.q)) p.nt = 1;
  }
/* the chapter test leans on simplification and identities (problems marked `f`) */
BASE[11].find((c) => c.id === "t1").testFocus = 0.75;
/* a few lessons repeat the very same problem (same text → same id): keep one copy */
for (const id of Object.keys(PROBS)) {
  const seen = new Set();
  PROBS[id] = PROBS[id].filter((p) => !seen.has(p.id) && seen.add(p.id));
}

export const CURR = {};
for (let n = 1; n <= 12; n++) {
  let list = BASE[n] ? BASE[n].slice() : primary[n] || secondary[n] || [];
  const replace = secondary.replace[n];
  if (replace) list = list.map((ch) => replace[ch.id] || ch);
  CURR[n] = list;
}

export const PBYID = {};
for (const id of Object.keys(PROBS)) for (const p of PROBS[id]) PBYID[p.id] = p;

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9 };
export const chapterNo = (ch) => ch.num || ROMAN[ch.no] || Number(ch.no) || 0;
export const lessonNo = (ch, i) => `${chapterNo(ch)}.${i + 1}`;
export const problemsOf = (lessonId) => PROBS[lessonId] || [];
export const findChapter = (n, id) => (CURR[n] || []).find((c) => c.id === id && !c.soon) || null;

/** where a lesson lives (grade, chapter, 1-based index) */
export const LESSON_PLACE = {};
for (let n = 1; n <= 12; n++)
  for (const ch of CURR[n]) if (!ch.soon) ch.lessons.forEach((l, i) => (LESSON_PLACE[l.id] = { grade: n, chapterId: ch.id, index: i + 1 }));

export const MIN_TEST_POOL = 20;
/** problems a chapter test may draw from: auto-checked and not marked practice-only (`nt`) */
export function keyedProblems(ch) {
  return ch.lessons.map((l) => problemsOf(l.id).filter((p) => p.k && !p.nt));
}
export function testable(ch) {
  return !!ch && !ch.soon && keyedProblems(ch).reduce((s, a) => s + a.length, 0) >= MIN_TEST_POOL;
}
export function chapterProblemCount(ch) {
  return ch.soon ? 0 : ch.lessons.reduce((s, l) => s + problemsOf(l.id).length, 0);
}

export function totals() {
  let lessons = 0;
  let problems = 0;
  for (let n = 1; n <= 12; n++)
    for (const ch of CURR[n]) if (!ch.soon) {
      lessons += ch.lessons.length;
      problems += chapterProblemCount(ch);
    }
  return { lessons, problems };
}

/** TeX ($…$, $$…$$) inside lesson/problem HTML → MathML */
export const renderMath = (html) => MATHML.process(String(html ?? ""));

export { CHK, GEN, MATHML, PROBS };
