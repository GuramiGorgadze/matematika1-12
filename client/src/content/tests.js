/**
 * Test logic, ported from the original app (chapter summary tests and the grade 12 exams).
 * Pure functions: no React, no storage — easy to test and shared by the runners.
 */
import { htmlToText } from "../lib/text.js";

export const LETTERS = ["ა", "ბ", "გ", "დ"];
export const CHAPTER_TEST_SIZES = [
  { n: 20, min: 30 },
  { n: 30, min: 45 },
  { n: 50, min: 75 },
];
export const minutesFor = (n) => CHAPTER_TEST_SIZES.find((s) => s.n === n)?.min ?? Math.round(n * 1.5);

const has = (v) => v != null && String(v).trim() !== "";

/* seeded random (same generator as the original, so a seed always gives the same test) */
export function rng(seed) {
  let a = Math.imul((seed ^ 0x9e3779b9) >>> 0, 2654435761) >>> 0;
  function f() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  for (let i = 0; i < 6; i++) f();
  return f;
}
function shuffle(f, arr) {
  const b = arr.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(f() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
const sig = (a) => String(a).replace(/\d+/g, "0").replace(/\s+/g, "");

/* turn a number problem into a choice question: distractors are answers of sibling problems */
function asChoice(p, sibs, f) {
  const same = [];
  const other = [];
  const seen = { [p.a]: 1 };
  for (const q of shuffle(f, sibs)) {
    if (q === p || q.k.t !== "num" || !q.a || seen[q.a]) continue;
    if (Math.abs(q.k.v - p.k.v) < 1e-6) continue;
    seen[q.a] = 1;
    (sig(q.a) === sig(p.a) ? same : other).push(q.a);
  }
  const ds = same.concat(other).slice(0, 3);
  if (ds.length < 3) return null;
  const opts = shuffle(f, [p.a, ...ds]);
  return { id: p.id, o: opts, c: opts.indexOf(p.a) };
}

/**
 * Picks `size` questions spread evenly over the chapter's lessons, mixing levels, and turns
 * about a third of them into multiple choice. Returns item specs: { id, o?, c? }.
 */
export function buildChapterTest(pools, size, seed) {
  const f = rng(seed);
  const idx = [];
  pools.forEach((a, i) => a.length && idx.push(i));
  const L = idx.length;
  const base = Math.floor(size / L);
  const quota = {};
  idx.forEach((i) => (quota[i] = base));
  shuffle(f, idx).slice(0, size - base * L).forEach((i) => quota[i]++);

  const chosen = [];
  const seenQ = {};
  const order = [2, 1, 3];
  for (const i of idx) {
    const list = shuffle(f, pools[i]);
    const used = {};
    let c = 0;
    for (let j = 0; c < quota[i] && j < quota[i] * 3 + 3; j++) {
      const lvl = order[j % 3];
      let pick = list.findIndex((p, k) => !used[k] && !seenQ[p.q] && p.l === lvl);
      if (pick < 0) pick = list.findIndex((p, k) => !used[k] && !seenQ[p.q]);
      if (pick < 0) break;
      used[pick] = 1;
      seenQ[list[pick].q] = 1;
      chosen.push({ p: list[pick], li: i });
      c++;
    }
  }
  for (let guard = 0; chosen.length < size && guard < 400; guard++) {
    const li = idx[Math.floor(f() * L)];
    const cand = pools[li][Math.floor(f() * pools[li].length)];
    if (cand && !seenQ[cand.q]) {
      seenQ[cand.q] = 1;
      chosen.push({ p: cand, li });
    }
  }
  chosen.sort((a, b) => a.li - b.li);

  const specs = chosen.map(({ p, li }) => {
    if (p.k.t === "ch") return { id: p.id, o: p.k.opts.slice(), c: parseInt(p.k.v, 10) };
    if (p.k.t === "num" && f() < 0.45) {
      const s = asChoice(p, pools[li], f);
      if (s) return s;
    }
    return { id: p.id };
  });
  const need = Math.ceil(size * 0.35);
  let have = specs.filter((s) => s.o).length;
  for (let i = 0; i < specs.length && have < need; i++) {
    const p = chosen[i].p;
    if (!specs[i].o && p.k.t === "num") {
      const s = asChoice(p, pools[chosen[i].li], f);
      if (s) {
        specs[i] = s;
        have++;
      }
    }
  }
  return specs;
}

/** converted number problems are shown as choices, so drop their "type your answer like …" hint */
export function chapterQuestion(item, p) {
  const q = p ? p.q : "";
  return item.o && p && p.k && p.k.t !== "ch" ? q.replace(/\s*\(\s*ჩაწერ[^()]*\)/g, "") : q;
}

export function judgeChapterItem(item, answer, PBYID, CHK) {
  if (!has(answer)) return "unanswered";
  if (item.o) return answer === item.c ? "correct" : "wrong";
  const p = PBYID[item.id];
  return p && CHK.check(String(answer), p.k) ? "correct" : "wrong";
}

export function scoreChapter(items, answers, PBYID, CHK) {
  const results = items.map((it, i) => judgeChapterItem(it, answers[i], PBYID, CHK));
  return { score: results.filter((r) => r === "correct").length, max: items.length, results };
}

/** per-question rows for the server and the teacher's sheet */
export function chapterAnswers(items, answers, results, PBYID) {
  return items.map((it, i) => {
    const p = PBYID[it.id] || { q: "", a: "" };
    const a = answers[i];
    const optText = (j) => `${LETTERS[j]}) ${htmlToText(it.o[j], 120)}`;
    return {
      n: i + 1,
      qid: it.id,
      type: it.o ? "choice" : "written",
      prompt: htmlToText(chapterQuestion(it, p), 500),
      given: has(a) ? (it.o ? optText(a) : String(a)) : null,
      correct: it.o ? optText(it.c) : htmlToText(p.a, 200),
      status: results[i],
      points: results[i] === "correct" ? 1 : 0,
      maxPoints: 1,
    };
  });
}

/* ---------- grade 12 exams ---------- */
export const examMax = (ex) => ex.items.reduce((s, it) => s + it.p, 0);
export const isWritten = (it) => !it.o;

/** status and points of one exam item; `self` holds points the student gave open answers */
export function judgeExamItem(it, answer, self, CHK) {
  const given = has(answer);
  const r = { points: 0, max: it.p, status: "unanswered", manual: false, auto: !!(it.o || it.k) };
  if (it.o) {
    if (given) {
      const ok = answer === it.a;
      r.status = ok ? "correct" : "wrong";
      r.points = ok ? it.p : 0;
    }
    return r;
  }
  if (it.k && given) {
    const ok = !!CHK.check(String(answer), it.k);
    r.status = ok ? "correct" : "wrong";
    r.points = ok ? it.p : 0;
  } else if (!it.k && given) {
    r.status = "pending";
  }
  if (self && self[it.n] != null) {
    r.points = Math.max(0, Math.min(it.p, self[it.n]));
    r.status = r.points >= it.p ? "correct" : r.points > 0 ? "partial" : given ? "wrong" : "unanswered";
    r.manual = true;
  }
  return r;
}

export function scoreExam(ex, answers, self, CHK) {
  const results = ex.items.map((it) => judgeExamItem(it, answers[it.n], self, CHK));
  return { score: results.reduce((s, r) => s + r.points, 0), max: examMax(ex), results };
}

export function examAnswers(ex, answers, results) {
  return ex.items.map((it, i) => {
    const a = answers[it.n];
    const r = results[i];
    const opt = (j) => `${LETTERS[j]}) ${htmlToText(it.o[j], 120)}`;
    return {
      n: it.n,
      qid: `${ex.id}:${it.n}`,
      type: it.o ? "choice" : "written",
      prompt: htmlToText(it.t, 500),
      given: has(a) ? (it.o ? opt(a) : String(a)) : null,
      correct: it.o ? opt(it.a) : htmlToText(it.ans, 200),
      status: r.status,
      points: r.points,
      maxPoints: it.p,
      selfScored: r.manual,
    };
  });
}

export function countStatuses(results) {
  const c = { correct: 0, wrong: 0, unanswered: 0, partial: 0, pending: 0 };
  for (const r of results) c[typeof r === "string" ? r : r.status]++;
  return c;
}
