/**
 * The whole curriculum, assembled once (≈1 MB, loaded lazily — see useContent.js):
 * original lessons and problems for grades 7, 8 and 11 from the content pack, plus general
 * placeholder chapters for every grade that had no material.
 */
import { CHK, CURR as BASE, GEN, MATHML, PROBS } from "./pack/core.js";
import { primaryGrades } from "./placeholders/primary.js";
import { secondaryGrades } from "./placeholders/secondary.js";

const primary = primaryGrades(GEN);
const secondary = secondaryGrades(GEN);

/* every generator is registered: build the problem banks and give each problem a stable id */
GEN.finish(PROBS);
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
export function keyedProblems(ch) {
  return ch.lessons.map((l) => problemsOf(l.id).filter((p) => p.k));
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
