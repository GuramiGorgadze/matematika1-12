/* eslint-disable */
/**
 * Grade 11, chapter I (trigonometry): problem generators with EXACT answers.
 *
 * Every number answer is a fraction, a root or a multiple of π: the key carries `exact: true`, so the
 * checker accepts „√3/2", „-1/2", „(√6+√2)/4", „2π/3" and rejects decimals such as „0,87".
 * Shown answers and multiple-choice options are written the same way.
 *
 * Besides computing values, a large part of the bank is simplification and identities
 * (გამარტივება / იგივეობის ჩვენება): choose the simplified form, find the constant k that makes an
 * identity true, decide whether an identity holds, simplify and then evaluate.
 *
 * Kept out of the chapter test on purpose: the triple-angle formulas (3α) and the sine and cosine
 * theorems (lesson c1s13) — those problems stay in the lessons for practice only.
 *
 * Registered from content/index.js before GEN.finish(); the identity banks are exported so the tests
 * can verify every identity numerically.
 */
var R = String.raw;
var PI = Math.PI;
var S = Math.sin, C = Math.cos, T = Math.tan;
function K(x) { return 1 / Math.tan(x); }
function rad(d) { return (d * PI) / 180; }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }

/* ---------- exact numbers as TeX ---------- */
function fracTex(n, d) {
  if (d < 0) { n = -n; d = -d; }
  var g = gcd(n, d); n /= g; d /= g;
  if (d === 1) return String(n);
  return (n < 0 ? "-" : "") + "\\dfrac{" + Math.abs(n) + "}{" + d + "}";
}
function rat(v, maxD) {
  maxD = maxD || 1000;
  for (var d = 1; d <= maxD; d++) {
    var n = Math.round(v * d);
    if (Math.abs(v - n / d) < 1e-10) return [n, d];
  }
  return null;
}
/* k·√m with m square-free */
function sqrtParts(x) {
  var k = 1, m = x;
  for (var f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; }
  return [k, m];
}
function rootTex(k, m) { return m === 1 ? String(k) : (k === 1 ? "" : k) + "\\sqrt{" + m + "}"; }
/* numerator terms → TeX over d (d > 0), the sign of a lone negative numerator pulled in front */
function overTex(num, d) {
  if (d === 1) return num;
  if (/^-[^+-]*$/.test(num)) return "-\\dfrac{" + num.slice(1) + "}{" + d + "}";
  return "\\dfrac{" + num + "}{" + d + "}";
}
function joinTerms(terms) {
  /* terms: [coef, tex] — tex "" means a plain number; positive term first */
  terms = terms.filter(function (t) { return t[0] !== 0; });
  terms.sort(function (x, y) { return (y[0] > 0) - (x[0] > 0); });
  var s = "";
  terms.forEach(function (t, i) {
    var a = Math.abs(t[0]), body = t[1] ? (a === 1 ? "" : a) + t[1] : String(a);
    s += t[0] < 0 ? "-" + body : (i ? "+" : "") + body;
  });
  return s;
}
var RADS = [2, 3, 5, 6];
var PAIRS2 = [[6, 2], [3, 2], [6, 3], [3, 1]];
/** TeX of an exact value (rational, rational·√m, (p+q√r)/d, (a√6+b√2)/d …); throws when there is none */
function ex(v) {
  if (!isFinite(v)) throw new Error("not finite");
  var r = rat(v);
  if (r) return fracTex(r[0], r[1]);
  var sgn = v < 0 ? -1 : 1, q = rat(v * v, 2000);
  if (q && q[0] > 0) {
    var p = sqrtParts(q[0] * q[1]), k = p[0], m = p[1], d = q[1], g = gcd(k, d);
    k /= g; d /= g;
    if (m !== 1) return overTex((sgn < 0 ? "-" : "") + rootTex(k, m), d);
  }
  for (var dd = 1; dd <= 60; dd++)
    for (var ri = 0; ri < RADS.length; ri++)
      for (var qq = 1; qq <= 30; qq++)
        for (var s = -1; s <= 1; s += 2) {
          var pp = v * dd - s * qq * Math.sqrt(RADS[ri]), pr = Math.round(pp);
          if (pr !== 0 && Math.abs(pp - pr) < 1e-9 && gcd(gcd(pr, qq), dd) === 1)
            return overTex(joinTerms([[pr, ""], [s * qq, "\\sqrt{" + RADS[ri] + "}"]]), dd);
        }
  for (var d2 = 1; d2 <= 8; d2++)
    for (var pi = 0; pi < PAIRS2.length; pi++)
      for (var a = -6; a <= 6; a++)
        for (var b = -6; b <= 6; b++) {
          if (!a || !b) continue;
          var r1 = PAIRS2[pi][0], r2 = PAIRS2[pi][1];
          if (Math.abs(v * d2 - a * Math.sqrt(r1) - b * Math.sqrt(r2)) < 1e-9 && gcd(gcd(a, b), d2) === 1)
            return overTex(joinTerms([[a, "\\sqrt{" + r1 + "}"], [b, r2 === 1 ? "" : "\\sqrt{" + r2 + "}"]]), d2);
        }
  throw new Error("no exact form for " + v);
}
/** v as a rational multiple of π, TeX */
function exPi(v) {
  var r = rat(v / PI, 720);
  if (!r) throw new Error("not a multiple of pi: " + v);
  var n = r[0], d = r[1];
  if (n === 0) return "0";
  var a = Math.abs(n), top = (a === 1 ? "" : a) + "\\pi";
  return (n < 0 ? "-" : "") + (d === 1 ? top : "\\dfrac{" + top + "}{" + d + "}");
}
/* degrees → radians as TeX */
function piFr(d) { return exPi(rad(d)); }

/* shorthand for formulas in the banks: @ = α, # = β, tg / ctg = \operatorname{…} */
function tx(s) {
  return String(s)
    .replace(/(c?)tg/g, "\\operatorname{$1tg}")
    .replace(/@/g, "\\alpha ")
    .replace(/#/g, "\\beta ")
    .replace(/ (?=[}^)_+\-=,.\]\\$]|$)/g, "");
}

/* ---------- simplified forms used as answers and distractors ---------- */
var RS = {
  "0": ["0", function () { return 0; }],
  "1": ["1", function () { return 1; }],
  "-1": ["-1", function () { return -1; }],
  "2": ["2", function () { return 2; }],
  "-2": ["-2", function () { return -2; }],
  "3": ["3", function () { return 3; }],
  "4": ["4", function () { return 4; }],
  "1/2": ["\\dfrac12", function () { return 0.5; }],
  s: ["\\sin@", function (a) { return S(a); }],
  c: ["\\cos@", function (a) { return C(a); }],
  t: ["tg@", function (a) { return T(a); }],
  k: ["ctg@", function (a) { return K(a); }],
  "-s": ["-\\sin@", function (a) { return -S(a); }],
  "-c": ["-\\cos@", function (a) { return -C(a); }],
  "-t": ["-tg@", function (a) { return -T(a); }],
  "-k": ["-ctg@", function (a) { return -K(a); }],
  "2s": ["2\\sin@", function (a) { return 2 * S(a); }],
  "2c": ["2\\cos@", function (a) { return 2 * C(a); }],
  "2t": ["2tg@", function (a) { return 2 * T(a); }],
  "2k": ["2ctg@", function (a) { return 2 * K(a); }],
  "-2s": ["-2\\sin@", function (a) { return -2 * S(a); }],
  "-2c": ["-2\\cos@", function (a) { return -2 * C(a); }],
  s2: ["\\sin^2@", function (a) { return S(a) * S(a); }],
  c2: ["\\cos^2@", function (a) { return C(a) * C(a); }],
  t2: ["tg^2@", function (a) { return T(a) * T(a); }],
  k2: ["ctg^2@", function (a) { return K(a) * K(a); }],
  "-s2": ["-\\sin^2@", function (a) { return -S(a) * S(a); }],
  "-c2": ["-\\cos^2@", function (a) { return -C(a) * C(a); }],
  "-t2": ["-tg^2@", function (a) { return -T(a) * T(a); }],
  "2t2": ["2tg^2@", function (a) { return 2 * T(a) * T(a); }],
  t4: ["tg^4@", function (a) { return Math.pow(T(a), 4); }],
  t6: ["tg^6@", function (a) { return Math.pow(T(a), 6); }],
  "2s2": ["2\\sin^2@", function (a) { return 2 * S(a) * S(a); }],
  "2c2": ["2\\cos^2@", function (a) { return 2 * C(a) * C(a); }],
  s3: ["\\sin^3@", function (a) { return Math.pow(S(a), 3); }],
  c3: ["\\cos^3@", function (a) { return Math.pow(C(a), 3); }],
  ic: ["\\dfrac{1}{\\cos@}", function (a) { return 1 / C(a); }],
  is: ["\\dfrac{1}{\\sin@}", function (a) { return 1 / S(a); }],
  ic2: ["\\dfrac{1}{\\cos^2@}", function (a) { return 1 / (C(a) * C(a)); }],
  is2: ["\\dfrac{1}{\\sin^2@}", function (a) { return 1 / (S(a) * S(a)); }],
  "2ic": ["\\dfrac{2}{\\cos@}", function (a) { return 2 / C(a); }],
  "2is": ["\\dfrac{2}{\\sin@}", function (a) { return 2 / S(a); }],
  "2ic2": ["\\dfrac{2}{\\cos^2@}", function (a) { return 2 / (C(a) * C(a)); }],
  "2is2": ["\\dfrac{2}{\\sin^2@}", function (a) { return 2 / (S(a) * S(a)); }],
  sc: ["\\sin@\\cos@", function (a) { return S(a) * C(a); }],
  "2sc": ["2\\sin@\\cos@", function (a) { return 2 * S(a) * C(a); }],
  isc: ["\\dfrac{1}{\\sin@\\cos@}", function (a) { return 1 / (S(a) * C(a)); }],
  "s+c": ["\\sin@+\\cos@", function (a) { return S(a) + C(a); }],
  "s-c": ["\\sin@-\\cos@", function (a) { return S(a) - C(a); }],
  "c-s": ["\\cos@-\\sin@", function (a) { return C(a) - S(a); }],
  "1+s": ["1+\\sin@", function (a) { return 1 + S(a); }],
  "1-s": ["1-\\sin@", function (a) { return 1 - S(a); }],
  "1+c": ["1+\\cos@", function (a) { return 1 + C(a); }],
  "1-c": ["1-\\cos@", function (a) { return 1 - C(a); }],
  "1+t": ["1+tg@", function (a) { return 1 + T(a); }],
  "1-t": ["1-tg@", function (a) { return 1 - T(a); }],
  "1+t2": ["1+tg^2@", function (a) { return 1 + T(a) * T(a); }],
  "1-t2": ["1-tg^2@", function (a) { return 1 - T(a) * T(a); }],
  S2: ["\\sin2@", function (a) { return S(2 * a); }],
  C2: ["\\cos2@", function (a) { return C(2 * a); }],
  T2: ["tg2@", function (a) { return T(2 * a); }],
  K2: ["ctg2@", function (a) { return K(2 * a); }],
  "-S2": ["-\\sin2@", function (a) { return -S(2 * a); }],
  "-C2": ["-\\cos2@", function (a) { return -C(2 * a); }],
  "2S2": ["2\\sin2@", function (a) { return 2 * S(2 * a); }],
  "2C2": ["2\\cos2@", function (a) { return 2 * C(2 * a); }],
  "-2C2": ["-2\\cos2@", function (a) { return -2 * C(2 * a); }],
  hS2: ["\\dfrac12\\sin2@", function (a) { return S(2 * a) / 2; }],
  hC2: ["\\dfrac12\\cos2@", function (a) { return C(2 * a) / 2; }],
  qS2: ["\\dfrac14\\sin2@", function (a) { return S(2 * a) / 4; }],
  "1+S2": ["1+\\sin2@", function (a) { return 1 + S(2 * a); }],
  "1-S2": ["1-\\sin2@", function (a) { return 1 - S(2 * a); }],
  "1+C2": ["1+\\cos2@", function (a) { return 1 + C(2 * a); }],
  "1-C2": ["1-\\cos2@", function (a) { return 1 - C(2 * a); }],
  iC2: ["\\dfrac{1}{\\cos2@}", function (a) { return 1 / C(2 * a); }],
  S4: ["\\sin4@", function (a) { return S(4 * a); }],
  C4: ["\\cos4@", function (a) { return C(4 * a); }],
  T4: ["tg4@", function (a) { return T(4 * a); }],
  hS4: ["\\dfrac12\\sin4@", function (a) { return S(4 * a) / 2; }],
  qS4: ["\\dfrac14\\sin4@", function (a) { return S(4 * a) / 4; }],
  Sh: ["\\sin\\dfrac{@}{2}", function (a) { return S(a / 2); }],
  Ch: ["\\cos\\dfrac{@}{2}", function (a) { return C(a / 2); }],
  Th: ["tg\\dfrac{@}{2}", function (a) { return T(a / 2); }],
  Kh: ["ctg\\dfrac{@}{2}", function (a) { return K(a / 2); }],
  Sh2: ["\\sin^2\\dfrac{@}{2}", function (a) { return S(a / 2) * S(a / 2); }],
  Ch2: ["\\cos^2\\dfrac{@}{2}", function (a) { return C(a / 2) * C(a / 2); }],
  Th2: ["tg^2\\dfrac{@}{2}", function (a) { return T(a / 2) * T(a / 2); }],
  "2Sh2": ["2\\sin^2\\dfrac{@}{2}", function (a) { return 2 * S(a / 2) * S(a / 2); }],
  "2Ch2": ["2\\cos^2\\dfrac{@}{2}", function (a) { return 2 * C(a / 2) * C(a / 2); }],
  /* two angles */
  "s(a+b)": ["\\sin(@+#)", function (a, b) { return S(a + b); }],
  "s(a-b)": ["\\sin(@-#)", function (a, b) { return S(a - b); }],
  "c(a+b)": ["\\cos(@+#)", function (a, b) { return C(a + b); }],
  "c(a-b)": ["\\cos(@-#)", function (a, b) { return C(a - b); }],
  "t(a+b)": ["tg(@+#)", function (a, b) { return T(a + b); }],
  "t(a-b)": ["tg(@-#)", function (a, b) { return T(a - b); }],
  "-s(a-b)": ["-\\sin(@-#)", function (a, b) { return -S(a - b); }],
  sasb: ["\\sin@\\sin#", function (a, b) { return S(a) * S(b); }],
  cacb: ["\\cos@\\cos#", function (a, b) { return C(a) * C(b); }],
  sacb: ["\\sin@\\cos#", function (a, b) { return S(a) * C(b); }],
  casb: ["\\cos@\\sin#", function (a, b) { return C(a) * S(b); }],
  "2sasb": ["2\\sin@\\sin#", function (a, b) { return 2 * S(a) * S(b); }],
  "2cacb": ["2\\cos@\\cos#", function (a, b) { return 2 * C(a) * C(b); }],
  "2sacb": ["2\\sin@\\cos#", function (a, b) { return 2 * S(a) * C(b); }],
  "2casb": ["2\\cos@\\sin#", function (a, b) { return 2 * C(a) * S(b); }],
  "-2sasb": ["-2\\sin@\\sin#", function (a, b) { return -2 * S(a) * S(b); }],
  tatb: ["tg@\\,tg#", function (a, b) { return T(a) * T(b); }],
  "ta+tb": ["tg@+tg#", function (a, b) { return T(a) + T(b); }],
  "ta-tb": ["tg@-tg#", function (a, b) { return T(a) - T(b); }],
  "s2a-s2b": ["\\sin^2@-\\sin^2#", function (a, b) { return S(a) * S(a) - S(b) * S(b); }],
  "c2a-s2b": ["\\cos^2@-\\sin^2#", function (a, b) { return C(a) * C(a) - S(b) * S(b); }],
  "c2a-c2b": ["\\cos^2@-\\cos^2#", function (a, b) { return C(a) * C(a) - C(b) * C(b); }],
  "c2a+s2b": ["\\cos^2@+\\sin^2#", function (a, b) { return C(a) * C(a) + S(b) * S(b); }]
};

/* ---------- identity banks ---------- *
 * simplify:  [level, expression, fn(α, β), right key, [3 distractor keys], note?]
 * findK:     [level, identity with k, left fn, right fn without k]          → k = left / right
 * truth:     [level, "left = right", left fn, right fn]                    → holds or not (computed)
 */
var SIMPLIFY = {
  c1s3: [
    [1, R`(1-\sin@)(1+\sin@)`, function (a) { return (1 - S(a)) * (1 + S(a)); }, "c2", ["s2", "1", "1-s"]],
    [1, R`(1-\cos@)(1+\cos@)`, function (a) { return (1 - C(a)) * (1 + C(a)); }, "s2", ["c2", "1", "1-c"]],
    [1, R`1-\cos^2@`, function (a) { return 1 - C(a) * C(a); }, "s2", ["c2", "-c2", "1-c"]],
    [1, R`1-\sin^2@`, function (a) { return 1 - S(a) * S(a); }, "c2", ["s2", "-s2", "1-s"]],
    [1, R`\sin^2@+\cos^2@+tg^2@`, function (a) { return 1 + T(a) * T(a); }, "ic2", ["is2", "t2", "2"]],
    [1, R`tg@\cdot\cos@`, function (a) { return T(a) * C(a); }, "s", ["c", "1", "t"]],
    [1, R`ctg@\cdot\sin@`, function (a) { return K(a) * S(a); }, "c", ["s", "1", "k"]],
    [1, R`tg@\cdot ctg@-\sin^2@`, function (a) { return 1 - S(a) * S(a); }, "c2", ["s2", "0", "-s2"]],
    [1, R`\dfrac{\sin@}{tg@}`, function (a) { return S(a) / T(a); }, "c", ["s", "t", "1"]],
    [1, R`\dfrac{\cos@}{ctg@}`, function (a) { return C(a) / K(a); }, "s", ["c", "k", "1"]],
    [1, R`(\sin@+\cos@)^2-2\sin@\cos@`, function (a) { var u = S(a) + C(a); return u * u - 2 * S(a) * C(a); }, "1", ["0", "2sc", "-1"]],
    [1, R`\dfrac{1-\sin^2@}{\cos@}`, function (a) { return (1 - S(a) * S(a)) / C(a); }, "c", ["s", "ic", "1"]],
    [2, R`(\sin@+\cos@)^2+(\sin@-\cos@)^2`, function (a) { var u = S(a) + C(a), w = S(a) - C(a); return u * u + w * w; }, "2", ["1", "4", "0"]],
    [2, R`(\sin@+\cos@)^2-(\sin@-\cos@)^2`, function (a) { var u = S(a) + C(a), w = S(a) - C(a); return u * u - w * w; }, "2S2", ["2", "0", "2sc"]],
    [2, R`\sin^4@-\cos^4@+\cos^2@`, function (a) { return Math.pow(S(a), 4) - Math.pow(C(a), 4) + C(a) * C(a); }, "s2", ["c2", "1", "-c2"]],
    [2, R`\sin^4@+\sin^2@\cos^2@`, function (a) { return Math.pow(S(a), 4) + S(a) * S(a) * C(a) * C(a); }, "s2", ["c2", "1", "s3"]],
    [2, R`\cos^4@+\sin^2@\cos^2@`, function (a) { return Math.pow(C(a), 4) + S(a) * S(a) * C(a) * C(a); }, "c2", ["s2", "1", "c3"]],
    [2, R`\dfrac{1}{1+tg^2@}`, function (a) { return 1 / (1 + T(a) * T(a)); }, "c2", ["s2", "ic2", "t2"]],
    [2, R`\dfrac{1}{1+ctg^2@}`, function (a) { return 1 / (1 + K(a) * K(a)); }, "s2", ["c2", "is2", "k2"]],
    [2, R`\dfrac{tg^2@}{1+tg^2@}`, function (a) { return (T(a) * T(a)) / (1 + T(a) * T(a)); }, "s2", ["c2", "t2", "1"]],
    [2, R`\dfrac{1}{\cos^2@}-1`, function (a) { return 1 / (C(a) * C(a)) - 1; }, "t2", ["k2", "s2", "1"]],
    [2, R`\dfrac{1}{\sin^2@}-1`, function (a) { return 1 / (S(a) * S(a)) - 1; }, "k2", ["t2", "c2", "1"]],
    [2, R`\dfrac{1}{\sin^2@}-ctg^2@`, function (a) { return 1 / (S(a) * S(a)) - K(a) * K(a); }, "1", ["0", "s2", "k2"]],
    [2, R`\dfrac{1}{\cos^2@}-tg^2@-\sin^2@`, function (a) { return 1 / (C(a) * C(a)) - T(a) * T(a) - S(a) * S(a); }, "c2", ["s2", "1", "0"]],
    [2, R`(1+tg^2@)\cos^2@`, function (a) { return (1 + T(a) * T(a)) * C(a) * C(a); }, "1", ["c2", "ic2", "s2"]],
    [2, R`(1+ctg^2@)\sin^2@`, function (a) { return (1 + K(a) * K(a)) * S(a) * S(a); }, "1", ["s2", "is2", "c2"]],
    [2, R`tg^2@\cos^2@+ctg^2@\sin^2@`, function (a) { return T(a) * T(a) * C(a) * C(a) + K(a) * K(a) * S(a) * S(a); }, "1", ["2", "0", "s2"]],
    [2, R`\dfrac{\sin@}{1+\cos@}+\dfrac{1+\cos@}{\sin@}`, function (a) { return S(a) / (1 + C(a)) + (1 + C(a)) / S(a); }, "2is", ["is", "2ic", "2"]],
    [2, R`\dfrac{\cos@}{1-\sin@}-\dfrac{\cos@}{1+\sin@}`, function (a) { return C(a) / (1 - S(a)) - C(a) / (1 + S(a)); }, "2t", ["t", "2k", "2ic"]],
    [2, R`\dfrac{\cos@}{1+\sin@}+\dfrac{\cos@}{1-\sin@}`, function (a) { return C(a) / (1 + S(a)) + C(a) / (1 - S(a)); }, "2ic", ["ic", "2is", "2c"]],
    [2, R`\dfrac{\sin@}{1-\cos@}+\dfrac{\sin@}{1+\cos@}`, function (a) { return S(a) / (1 - C(a)) + S(a) / (1 + C(a)); }, "2is", ["is", "2ic", "2s"]],
    [2, R`\dfrac{1-\cos@}{\sin@}`, function (a) { return (1 - C(a)) / S(a); }, "Th", ["Kh", "t", "s"]],
    [2, R`\dfrac{\sin^2@}{1-\cos@}`, function (a) { return (S(a) * S(a)) / (1 - C(a)); }, "1+c", ["1-c", "s", "1+s"]],
    [2, R`\dfrac{\cos^2@}{1+\sin@}`, function (a) { return (C(a) * C(a)) / (1 + S(a)); }, "1-s", ["1+s", "c", "1-c"]],
    [2, R`tg@+ctg@`, function (a) { return T(a) + K(a); }, "isc", ["1", "2", "sc"]],
    [2, R`\dfrac{tg@}{tg@+ctg@}`, function (a) { return T(a) / (T(a) + K(a)); }, "s2", ["c2", "t2", "sc"]],
    [3, R`\sin^4@+\cos^4@+2\sin^2@\cos^2@`, function (a) { var x = S(a) * S(a), y = C(a) * C(a); return x * x + y * y + 2 * x * y; }, "1", ["2", "0", "s2"]],
    [3, R`\sin^4@-\cos^4@`, function (a) { return Math.pow(S(a), 4) - Math.pow(C(a), 4); }, "-C2", ["C2", "1", "s2"]],
    [3, R`\sin^6@+\cos^6@+3\sin^2@\cos^2@`, function (a) { var x = S(a) * S(a), y = C(a) * C(a); return x * x * x + y * y * y + 3 * x * y; }, "1", ["0", "3", "2"]],
    [3, R`\dfrac{1-2\sin@\cos@}{\sin@-\cos@}`, function (a) { return (1 - 2 * S(a) * C(a)) / (S(a) - C(a)); }, "s-c", ["s+c", "c-s", "1"]],
    [3, R`\dfrac{1+2\sin@\cos@}{\sin@+\cos@}`, function (a) { return (1 + 2 * S(a) * C(a)) / (S(a) + C(a)); }, "s+c", ["s-c", "1", "2sc"]],
    [3, R`\dfrac{\sin@+tg@}{1+\cos@}`, function (a) { return (S(a) + T(a)) / (1 + C(a)); }, "t", ["k", "s", "ic"]],
    [3, R`\dfrac{\cos@+ctg@}{1+\sin@}`, function (a) { return (C(a) + K(a)) / (1 + S(a)); }, "k", ["t", "c", "is"]],
    [3, R`\dfrac{\sin^2@-tg^2@}{\cos^2@-ctg^2@}`, function (a) { return (S(a) * S(a) - T(a) * T(a)) / (C(a) * C(a) - K(a) * K(a)); }, "t6", ["t2", "t4", "1"]],
    [3, R`\dfrac{tg@-\sin@}{\sin^3@}\cdot\cos@`, function (a) { return ((T(a) - S(a)) / Math.pow(S(a), 3)) * C(a); }, "1/(1+c)", ["1", "c", "1+c"]]
  ],
  c1s4: [
    [1, R`\sin(-@)+\sin@`, function (a) { return S(-a) + S(a); }, "0", ["2s", "-2", "1"]],
    [1, R`\cos(-@)-\cos@`, function (a) { return C(-a) - C(a); }, "0", ["2c", "-2c", "1"]],
    [1, R`\dfrac{\sin(-@)}{\cos(-@)}`, function (a) { return S(-a) / C(-a); }, "-t", ["t", "k", "-k"]],
    [1, R`tg(-@)\cdot ctg@`, function (a) { return T(-a) * K(a); }, "-1", ["1", "0", "-t2"]],
    [1, R`\sin(@+2\pi)-\sin@`, function (a) { return S(a + 2 * PI) - S(a); }, "0", ["2s", "-2s", "1"]],
    [1, R`\cos(@-2\pi)+\cos(-@)`, function (a) { return C(a - 2 * PI) + C(-a); }, "2c", ["0", "-2c", "c"]],
    [2, R`\sin^2(-@)+\cos^2(-@)`, function (a) { return S(-a) * S(-a) + C(-a) * C(-a); }, "1", ["-1", "0", "C2"]],
    [2, R`\sin(-@)\cos(-@)tg(-@)`, function (a) { return S(-a) * C(-a) * T(-a); }, "s2", ["-s2", "c2", "-c2"]],
    [2, R`tg(@+\pi)\cdot ctg(-@)`, function (a) { return T(a + PI) * K(-a); }, "-1", ["1", "t2", "0"]],
    [2, R`\dfrac{\sin(-@)}{\sin(@+2\pi)}+\dfrac{\cos(@-2\pi)}{\cos(-@)}`, function (a) { return S(-a) / S(a + 2 * PI) + C(a - 2 * PI) / C(-a); }, "0", ["2", "-2", "1"]],
    [2, R`\cos^2(-@)-\sin^2(@+2\pi)`, function (a) { return C(-a) * C(-a) - S(a + 2 * PI) * S(a + 2 * PI); }, "C2", ["1", "-C2", "0"]],
    [2, R`\dfrac{tg(-@)}{\sin(-@)}`, function (a) { return T(-a) / S(-a); }, "ic", ["-ic", "c", "is"]],
    [3, R`\sin(-@)\,ctg(-@)+\cos(@+4\pi)`, function (a) { return S(-a) * K(-a) + C(a + 4 * PI); }, "2c", ["0", "-2c", "c"]],
    [3, R`tg(\pi+@)\,tg(-@)+\dfrac{1}{\cos^2(-@)}`, function (a) { return T(PI + a) * T(-a) + 1 / (C(-a) * C(-a)); }, "1", ["2t2", "ic2", "-1"]]
  ],
  c1s5: [
    [1, R`\sin@\cos#+\cos@\sin#`, function (a, b) { return S(a) * C(b) + C(a) * S(b); }, "s(a+b)", ["s(a-b)", "c(a+b)", "c(a-b)"]],
    [1, R`\sin@\cos#-\cos@\sin#`, function (a, b) { return S(a) * C(b) - C(a) * S(b); }, "s(a-b)", ["s(a+b)", "c(a-b)", "c(a+b)"]],
    [1, R`\cos@\cos#-\sin@\sin#`, function (a, b) { return C(a) * C(b) - S(a) * S(b); }, "c(a+b)", ["c(a-b)", "s(a+b)", "s(a-b)"]],
    [1, R`\cos@\cos#+\sin@\sin#`, function (a, b) { return C(a) * C(b) + S(a) * S(b); }, "c(a-b)", ["c(a+b)", "s(a-b)", "s(a+b)"]],
    [1, R`\dfrac{tg@+tg#}{1-tg@\,tg#}`, function (a, b) { return (T(a) + T(b)) / (1 - T(a) * T(b)); }, "t(a+b)", ["t(a-b)", "ta+tb", "tatb"]],
    [1, R`\dfrac{tg@-tg#}{1+tg@\,tg#}`, function (a, b) { return (T(a) - T(b)) / (1 + T(a) * T(b)); }, "t(a-b)", ["t(a+b)", "ta-tb", "tatb"]],
    [2, R`\sin(@+#)+\sin(@-#)`, function (a, b) { return S(a + b) + S(a - b); }, "2sacb", ["2casb", "2cacb", "2sasb"]],
    [2, R`\sin(@+#)-\sin(@-#)`, function (a, b) { return S(a + b) - S(a - b); }, "2casb", ["2sacb", "2sasb", "2cacb"]],
    [2, R`\cos(@+#)+\cos(@-#)`, function (a, b) { return C(a + b) + C(a - b); }, "2cacb", ["2sasb", "-2sasb", "2sacb"]],
    [2, R`\cos(@-#)-\cos(@+#)`, function (a, b) { return C(a - b) - C(a + b); }, "2sasb", ["2cacb", "-2sasb", "2casb"]],
    [2, R`\sin(@+#)-\sin@\cos#`, function (a, b) { return S(a + b) - S(a) * C(b); }, "casb", ["sacb", "sasb", "cacb"]],
    [2, R`\cos(@+#)+\sin@\sin#`, function (a, b) { return C(a + b) + S(a) * S(b); }, "cacb", ["sasb", "sacb", "casb"]],
    [2, R`\cos(@-#)-\cos@\cos#`, function (a, b) { return C(a - b) - C(a) * C(b); }, "sasb", ["cacb", "sacb", "casb"]],
    [2, R`\sin(@-#)+\cos@\sin#`, function (a, b) { return S(a - b) + C(a) * S(b); }, "sacb", ["casb", "sasb", "cacb"]],
    [2, R`\dfrac{\sin(@+#)}{\cos@\cos#}`, function (a, b) { return S(a + b) / (C(a) * C(b)); }, "ta+tb", ["ta-tb", "tatb", "t(a+b)"]],
    [2, R`\dfrac{\sin(@-#)}{\cos@\cos#}`, function (a, b) { return S(a - b) / (C(a) * C(b)); }, "ta-tb", ["ta+tb", "tatb", "t(a-b)"]],
    [2, R`\dfrac{\cos(@-#)}{\cos@\cos#}-tg@\,tg#`, function (a, b) { return C(a - b) / (C(a) * C(b)) - T(a) * T(b); }, "1", ["0", "2", "tatb"]],
    [2, R`\sin(@+#)\cos#-\cos(@+#)\sin#`, function (a, b) { return S(a + b) * C(b) - C(a + b) * S(b); }, "s", ["c", "s(a+b)", "s(a-b)"]],
    [2, R`\cos(@-#)\cos#-\sin(@-#)\sin#`, function (a, b) { return C(a - b) * C(b) - S(a - b) * S(b); }, "c", ["s", "c(a-b)", "c(a+b)"]],
    [2, R`\sin(30^\circ+@)+\sin(30^\circ-@)`, function (a) { return S(PI / 6 + a) + S(PI / 6 - a); }, "c", ["s", "2c", "1"]],
    [2, R`\cos(60^\circ-@)-\cos(60^\circ+@)`, function (a) { return C(PI / 3 - a) - C(PI / 3 + a); }, "r3s", ["s", "2s", "r3c"]],
    [3, R`\sin(@+#)\sin(@-#)`, function (a, b) { return S(a + b) * S(a - b); }, "s2a-s2b", ["c2a-s2b", "c2a-c2b", "c2a+s2b"]],
    [3, R`\cos(@+#)\cos(@-#)`, function (a, b) { return C(a + b) * C(a - b); }, "c2a-s2b", ["s2a-s2b", "c2a+s2b", "c2a-c2b"]],
    [3, R`\dfrac{\sin(@+#)+\sin(@-#)}{\cos(@+#)+\cos(@-#)}`, function (a, b) { return (S(a + b) + S(a - b)) / (C(a + b) + C(a - b)); }, "t", ["k", "ta+tb", "t(a+b)"]],
    [3, R`\dfrac{\sin(@+#)-\sin(@-#)}{\cos(@+#)+\cos(@-#)}`, function (a, b) { return (S(a + b) - S(a - b)) / (C(a + b) + C(a - b)); }, "tb", ["t", "tatb", "t(a-b)"]],
    [3, R`\sqrt2\cos(45^\circ-@)`, function (a) { return Math.SQRT2 * C(PI / 4 - a); }, "s+c", ["s-c", "c-s", "2c"]],
    [3, R`\sqrt2\sin(@-45^\circ)`, function (a) { return Math.SQRT2 * S(a - PI / 4); }, "s-c", ["s+c", "c-s", "2s"]],
    [3, R`2\sin(@+30^\circ)-\sqrt3\sin@`, function (a) { return 2 * S(a + PI / 6) - Math.sqrt(3) * S(a); }, "c", ["s", "2c", "-c"]],
    [3, R`tg(45^\circ+@)`, function (a) { return T(PI / 4 + a); }, "(1+t)/(1-t)", ["(1-t)/(1+t)", "1+t", "1-t"]]
  ],
  c1s6: [
    [1, R`\sin(\pi-@)`, function (a) { return S(PI - a); }, "s", ["-s", "c", "-c"]],
    [1, R`\cos(\pi-@)`, function (a) { return C(PI - a); }, "-c", ["c", "s", "-s"]],
    [1, R`\sin(\pi+@)`, function (a) { return S(PI + a); }, "-s", ["s", "-c", "c"]],
    [1, R`\cos(\pi+@)`, function (a) { return C(PI + a); }, "-c", ["c", "-s", "s"]],
    [1, R`\sin\left(\dfrac\pi2-@\right)`, function (a) { return S(PI / 2 - a); }, "c", ["-c", "s", "-s"]],
    [1, R`\cos\left(\dfrac\pi2-@\right)`, function (a) { return C(PI / 2 - a); }, "s", ["-s", "c", "-c"]],
    [1, R`\sin\left(\dfrac\pi2+@\right)`, function (a) { return S(PI / 2 + a); }, "c", ["-c", "s", "-s"]],
    [1, R`\cos\left(\dfrac\pi2+@\right)`, function (a) { return C(PI / 2 + a); }, "-s", ["s", "c", "-c"]],
    [1, R`\sin\left(\dfrac{3\pi}2-@\right)`, function (a) { return S((3 * PI) / 2 - a); }, "-c", ["c", "-s", "s"]],
    [1, R`\cos\left(\dfrac{3\pi}2-@\right)`, function (a) { return C((3 * PI) / 2 - a); }, "-s", ["s", "-c", "c"]],
    [1, R`\sin\left(\dfrac{3\pi}2+@\right)`, function (a) { return S((3 * PI) / 2 + a); }, "-c", ["c", "s", "-s"]],
    [1, R`\cos\left(\dfrac{3\pi}2+@\right)`, function (a) { return C((3 * PI) / 2 + a); }, "s", ["-s", "c", "-c"]],
    [1, R`\sin(2\pi-@)`, function (a) { return S(2 * PI - a); }, "-s", ["s", "-c", "c"]],
    [1, R`\cos(2\pi-@)`, function (a) { return C(2 * PI - a); }, "c", ["-c", "s", "-s"]],
    [1, R`tg(\pi-@)`, function (a) { return T(PI - a); }, "-t", ["t", "k", "-k"]],
    [1, R`tg\left(\dfrac\pi2-@\right)`, function (a) { return T(PI / 2 - a); }, "k", ["-k", "t", "-t"]],
    [1, R`tg\left(\dfrac\pi2+@\right)`, function (a) { return T(PI / 2 + a); }, "-k", ["k", "t", "-t"]],
    [1, R`ctg\left(\dfrac{3\pi}2-@\right)`, function (a) { return K((3 * PI) / 2 - a); }, "t", ["-t", "k", "-k"]],
    [1, R`tg(\pi+@)`, function (a) { return T(PI + a); }, "t", ["-t", "k", "-k"]],
    [1, R`ctg(2\pi-@)`, function (a) { return K(2 * PI - a); }, "-k", ["k", "t", "-t"]],
    [2, R`\sin(\pi-@)+\cos\left(\dfrac\pi2+@\right)`, function (a) { return S(PI - a) + C(PI / 2 + a); }, "0", ["2s", "-2s", "s-c"]],
    [2, R`\cos(\pi-@)+\sin\left(\dfrac\pi2-@\right)`, function (a) { return C(PI - a) + S(PI / 2 - a); }, "0", ["2c", "-2c", "1"]],
    [2, R`\sin(\pi+@)\cos\left(\dfrac\pi2-@\right)`, function (a) { return S(PI + a) * C(PI / 2 - a); }, "-s2", ["s2", "-c2", "sc"]],
    [2, R`\dfrac{\sin(\pi-@)}{\cos\left(\dfrac\pi2+@\right)}`, function (a) { return S(PI - a) / C(PI / 2 + a); }, "-1", ["1", "-t", "t"]],
    [2, R`\dfrac{\cos(\pi+@)}{\sin\left(\dfrac{3\pi}2-@\right)}`, function (a) { return C(PI + a) / S((3 * PI) / 2 - a); }, "1", ["-1", "t", "-k"]],
    [2, R`\sin^2(\pi-@)+\sin^2\left(\dfrac\pi2-@\right)`, function (a) { return Math.pow(S(PI - a), 2) + Math.pow(S(PI / 2 - a), 2); }, "1", ["2s2", "0", "-C2"]],
    [2, R`\cos^2(\pi+@)-\cos^2\left(\dfrac\pi2+@\right)`, function (a) { return Math.pow(C(PI + a), 2) - Math.pow(C(PI / 2 + a), 2); }, "C2", ["-C2", "1", "0"]],
    [2, R`tg(\pi-@)\cdot tg\left(\dfrac\pi2+@\right)`, function (a) { return T(PI - a) * T(PI / 2 + a); }, "1", ["-1", "t2", "-t2"]],
    [2, R`\dfrac{\sin(\pi-@)\,ctg\left(\dfrac\pi2-@\right)}{\cos(2\pi-@)}`, function (a) { return (S(PI - a) * K(PI / 2 - a)) / C(2 * PI - a); }, "t2", ["-t2", "1", "s2"]],
    [2, R`\sin(2\pi-@)\cos(\pi+@)`, function (a) { return S(2 * PI - a) * C(PI + a); }, "sc", ["2sc", "s2", "c2"]],
    [3, R`\dfrac{\sin(\pi+@)\cos(\pi-@)}{tg(\pi+@)}`, function (a) { return (S(PI + a) * C(PI - a)) / T(PI + a); }, "c2", ["-c2", "s2", "-s2"]],
    [3, R`\dfrac{\cos\left(\dfrac{3\pi}2+@\right)\cos(\pi+@)}{\sin\left(\dfrac\pi2-@\right)}`, function (a) { return (C((3 * PI) / 2 + a) * C(PI + a)) / S(PI / 2 - a); }, "-s", ["s", "-c", "c"]],
    [3, R`\sin(\pi-@)\cos\left(\dfrac\pi2-@\right)+\cos(\pi+@)\sin\left(\dfrac{3\pi}2-@\right)`, function (a) { return S(PI - a) * C(PI / 2 - a) + C(PI + a) * S((3 * PI) / 2 - a); }, "1", ["-1", "C2", "-C2"]],
    [3, R`\dfrac{tg(\pi-@)}{\cos(\pi+@)}\cdot\dfrac{\sin\left(\dfrac{3\pi}2+@\right)}{tg\left(\dfrac{3\pi}2+@\right)}`, function (a) { return (T(PI - a) / C(PI + a)) * (S((3 * PI) / 2 + a) / T((3 * PI) / 2 + a)); }, "t2", ["-t2", "1", "k2"]],
    [3, R`\sin(90^\circ+@)+\cos(180^\circ+@)+\sin(270^\circ+@)`, function (a) { return S(PI / 2 + a) + C(PI + a) + S((3 * PI) / 2 + a); }, "-c", ["c", "0", "2c"]],
    [3, R`\cos(180^\circ-@)\cos(360^\circ-@)+\sin(90^\circ+@)\sin(270^\circ-@)`, function (a) { return C(PI - a) * C(2 * PI - a) + S(PI / 2 + a) * S((3 * PI) / 2 - a); }, "-2c2", ["2c2", "0", "-1"]]
  ],
  c1s7: [
    [1, R`2\sin@\cos@`, function (a) { return 2 * S(a) * C(a); }, "S2", ["C2", "2s", "s2"]],
    [1, R`\cos^2@-\sin^2@`, function (a) { return C(a) * C(a) - S(a) * S(a); }, "C2", ["S2", "1", "-C2"]],
    [1, R`2\cos^2@-1`, function (a) { return 2 * C(a) * C(a) - 1; }, "C2", ["-C2", "S2", "c2"]],
    [1, R`1-2\sin^2@`, function (a) { return 1 - 2 * S(a) * S(a); }, "C2", ["-C2", "S2", "c2"]],
    [1, R`\dfrac{2tg@}{1-tg^2@}`, function (a) { return (2 * T(a)) / (1 - T(a) * T(a)); }, "T2", ["2t", "S2", "K2"]],
    [1, R`\dfrac{\sin2@}{2\sin@}`, function (a) { return S(2 * a) / (2 * S(a)); }, "c", ["s", "1", "2c"]],
    [1, R`\dfrac{\sin2@}{2\cos@}`, function (a) { return S(2 * a) / (2 * C(a)); }, "s", ["c", "1", "2s"]],
    [1, R`\dfrac{\sin2@}{\sin@}`, function (a) { return S(2 * a) / S(a); }, "2c", ["c", "2s", "2"]],
    [1, R`\sin@\cos@`, function (a) { return S(a) * C(a); }, "hS2", ["S2", "2S2", "hC2"]],
    [1, R`1+\cos2@`, function (a) { return 1 + C(2 * a); }, "2c2", ["2s2", "c2", "S2"]],
    [1, R`1-\cos2@`, function (a) { return 1 - C(2 * a); }, "2s2", ["2c2", "s2", "S2"]],
    [2, R`\dfrac{1-\cos2@}{1+\cos2@}`, function (a) { return (1 - C(2 * a)) / (1 + C(2 * a)); }, "t2", ["k2", "T2", "C2"]],
    [2, R`\dfrac{1-\cos2@}{\sin2@}`, function (a) { return (1 - C(2 * a)) / S(2 * a); }, "t", ["k", "T2", "s"]],
    [2, R`\dfrac{\sin2@}{1+\cos2@}`, function (a) { return S(2 * a) / (1 + C(2 * a)); }, "t", ["k", "T2", "c"]],
    [2, R`\dfrac{1+\cos2@}{\sin2@}`, function (a) { return (1 + C(2 * a)) / S(2 * a); }, "k", ["t", "K2", "c"]],
    [2, R`\cos^4@-\sin^4@`, function (a) { return Math.pow(C(a), 4) - Math.pow(S(a), 4); }, "C2", ["1", "-C2", "S2"]],
    [2, R`(\sin@+\cos@)^2`, function (a) { var u = S(a) + C(a); return u * u; }, "1+S2", ["1-S2", "1", "S2"]],
    [2, R`(\sin@-\cos@)^2`, function (a) { var u = S(a) - C(a); return u * u; }, "1-S2", ["1+S2", "1", "-S2"]],
    [2, R`\dfrac{\cos2@}{\cos@-\sin@}`, function (a) { return C(2 * a) / (C(a) - S(a)); }, "s+c", ["c-s", "1", "s-c"]],
    [2, R`\dfrac{\cos2@}{\cos@+\sin@}`, function (a) { return C(2 * a) / (C(a) + S(a)); }, "c-s", ["s+c", "s-c", "1"]],
    [2, R`\dfrac{\cos2@}{\sin@\cos@}`, function (a) { return C(2 * a) / (S(a) * C(a)); }, "2k2", ["K2", "T2", "2T2"]],
    [2, R`ctg@-tg@`, function (a) { return K(a) - T(a); }, "2k2", ["K2", "T2", "1"]],
    [2, R`4\sin@\cos@\cos2@`, function (a) { return 4 * S(a) * C(a) * C(2 * a); }, "S4", ["C4", "2S2", "hS4"]],
    [2, R`\sin@\cos@\cos2@`, function (a) { return S(a) * C(a) * C(2 * a); }, "qS4", ["hS4", "S4", "qS2"]],
    [2, R`\cos^22@-\sin^22@`, function (a) { return C(2 * a) * C(2 * a) - S(2 * a) * S(2 * a); }, "C4", ["S4", "C2", "1"]],
    [2, R`2\cos^2\dfrac{@}{2}-1`, function (a) { return 2 * C(a / 2) * C(a / 2) - 1; }, "c", ["-c", "s", "Ch"]],
    [2, R`1-2\sin^2\dfrac{@}{2}`, function (a) { return 1 - 2 * S(a / 2) * S(a / 2); }, "c", ["-c", "s", "Sh"]],
    [2, R`2\sin\dfrac{@}{2}\cos\dfrac{@}{2}`, function (a) { return 2 * S(a / 2) * C(a / 2); }, "s", ["c", "Sh", "S2"]],
    [2, R`\dfrac{1-\cos@}{2}`, function (a) { return (1 - C(a)) / 2; }, "Sh2", ["Ch2", "Th2", "Sh"]],
    [2, R`\dfrac{1+\cos@}{2}`, function (a) { return (1 + C(a)) / 2; }, "Ch2", ["Sh2", "Th2", "Ch"]],
    [2, R`\dfrac{1-\cos@}{1+\cos@}`, function (a) { return (1 - C(a)) / (1 + C(a)); }, "Th2", ["t2", "Sh2", "Th"]],
    [2, R`\dfrac{\sin@}{1+\cos@}`, function (a) { return S(a) / (1 + C(a)); }, "Th", ["Kh", "t", "Sh"]],
    [3, R`\dfrac{1+\sin2@}{\sin@+\cos@}`, function (a) { return (1 + S(2 * a)) / (S(a) + C(a)); }, "s+c", ["s-c", "1", "c-s"]],
    [3, R`\dfrac{1-\sin2@}{\cos@-\sin@}`, function (a) { return (1 - S(2 * a)) / (C(a) - S(a)); }, "c-s", ["s+c", "s-c", "1"]],
    [3, R`\dfrac{\sin2@}{1-\cos2@}\cdot\dfrac{1-\cos@}{\cos@}`, function (a) { return (S(2 * a) / (1 - C(2 * a))) * ((1 - C(a)) / C(a)); }, "Th", ["Kh", "t", "k"]],
    [3, R`\sin^4@+\cos^4@`, function (a) { return Math.pow(S(a), 4) + Math.pow(C(a), 4); }, "1-½s²2a", ["1-hS2", "1", "C2"]],
    [3, R`\dfrac{\sin2@-2\sin@}{\cos@-1}`, function (a) { return (S(2 * a) - 2 * S(a)) / (C(a) - 1); }, "2s", ["2c", "s", "-2s"]],
    [3, R`\dfrac{1+\sin2@+\cos2@}{1+\sin2@-\cos2@}`, function (a) { return (1 + S(2 * a) + C(2 * a)) / (1 + S(2 * a) - C(2 * a)); }, "k", ["t", "K2", "1"]],
    [3, R`\dfrac{2\sin@-\sin2@}{2\sin@+\sin2@}`, function (a) { return (2 * S(a) - S(2 * a)) / (2 * S(a) + S(2 * a)); }, "Th2", ["t2", "Kh", "Th"]],
    [3, R`8\sin@\cos@\cos2@\cos4@`, function (a) { return 8 * S(a) * C(a) * C(2 * a) * C(4 * a); }, "s8", ["S4", "C8", "2S4"]]
  ],
  c1s8: [
    [1, R`\sin@+\sin#`, function (a, b) { return S(a) + S(b); }, "2s(+)c(-)", ["2c(+)c(-)", "2s(+)s(-)", "2c(+)s(-)"]],
    [1, R`\sin@-\sin#`, function (a, b) { return S(a) - S(b); }, "2c(+)s(-)", ["2s(+)c(-)", "2s(+)s(-)", "2c(+)c(-)"]],
    [1, R`\cos@+\cos#`, function (a, b) { return C(a) + C(b); }, "2c(+)c(-)", ["2s(+)s(-)", "2s(+)c(-)", "-2s(+)s(-)"]],
    [1, R`\cos@-\cos#`, function (a, b) { return C(a) - C(b); }, "-2s(+)s(-)", ["2s(+)s(-)", "2c(+)c(-)", "2c(+)s(-)"]],
    [2, R`2\sin@\cos#`, function (a, b) { return 2 * S(a) * C(b); }, "s(a+b)+s(a-b)", ["s(a+b)-s(a-b)", "c(a-b)+c(a+b)", "c(a-b)-c(a+b)"]],
    [2, R`2\cos@\cos#`, function (a, b) { return 2 * C(a) * C(b); }, "c(a-b)+c(a+b)", ["c(a-b)-c(a+b)", "s(a+b)+s(a-b)", "s(a+b)-s(a-b)"]],
    [2, R`2\sin@\sin#`, function (a, b) { return 2 * S(a) * S(b); }, "c(a-b)-c(a+b)", ["c(a-b)+c(a+b)", "s(a+b)+s(a-b)", "c(a+b)-c(a-b)"]],
    [2, R`\sin(@+#)+\sin(@-#)`, function (a, b) { return S(a + b) + S(a - b); }, "2sacb", ["2casb", "2cacb", "2sasb"]],
    [2, R`\dfrac{\sin@+\sin#}{\cos@+\cos#}`, function (a, b) { return (S(a) + S(b)) / (C(a) + C(b)); }, "t(+)", ["t(-)", "k(+)", "k(-)"]],
    [2, R`\dfrac{\sin@-\sin#}{\cos@+\cos#}`, function (a, b) { return (S(a) - S(b)) / (C(a) + C(b)); }, "t(-)", ["t(+)", "k(-)", "k(+)"]],
    [2, R`\dfrac{\cos@-\cos#}{\sin@+\sin#}`, function (a, b) { return (C(a) - C(b)) / (S(a) + S(b)); }, "-t(-)", ["t(-)", "-t(+)", "k(+)"]],
    [2, R`\dfrac{\sin@+\sin#}{\sin@-\sin#}`, function (a, b) { return (S(a) + S(b)) / (S(a) - S(b)); }, "t(+)k(-)", ["t(-)k(+)", "t(+)", "k(-)"]],
    [2, R`\dfrac{\sin6@+\sin2@}{\cos6@+\cos2@}`, function (a) { return (S(6 * a) + S(2 * a)) / (C(6 * a) + C(2 * a)); }, "T4", ["T2", "t", "K2"]],
    [2, R`\dfrac{\sin6@-\sin2@}{\cos6@+\cos2@}`, function (a) { return (S(6 * a) - S(2 * a)) / (C(6 * a) + C(2 * a)); }, "T2", ["T4", "K2", "t"]],
    [2, R`\dfrac{\cos2@-\cos6@}{\sin6@-\sin2@}`, function (a) { return (C(2 * a) - C(6 * a)) / (S(6 * a) - S(2 * a)); }, "T4", ["T2", "K4", "-T4"]],
    [2, R`\sin\left(\dfrac\pi4+@\right)+\sin\left(\dfrac\pi4-@\right)`, function (a) { return S(PI / 4 + a) + S(PI / 4 - a); }, "r2c", ["r2s", "c", "2c"]],
    [2, R`\cos\left(\dfrac\pi3+@\right)+\cos\left(\dfrac\pi3-@\right)`, function (a) { return C(PI / 3 + a) + C(PI / 3 - a); }, "c", ["s", "2c", "r3c"]],
    [2, R`\cos\left(\dfrac\pi6-@\right)-\cos\left(\dfrac\pi6+@\right)`, function (a) { return C(PI / 6 - a) - C(PI / 6 + a); }, "s", ["c", "r3s", "2s"]],
    [3, R`\dfrac{\sin2@+\sin6@}{\sin4@}`, function (a) { return (S(2 * a) + S(6 * a)) / S(4 * a); }, "2C2", ["2c", "C2", "2S2"]],
    [3, R`\dfrac{\cos2@+\cos6@}{\cos4@}`, function (a) { return (C(2 * a) + C(6 * a)) / C(4 * a); }, "2C2", ["C2", "2c", "-2C2"]],
    [3, R`\dfrac{\sin2@+\sin4@+\sin6@}{\cos2@+\cos4@+\cos6@}`, function (a) { return (S(2 * a) + S(4 * a) + S(6 * a)) / (C(2 * a) + C(4 * a) + C(6 * a)); }, "T4", ["T2", "t", "1"]],
    [3, R`\sin^2@-\sin^2#`, function (a, b) { return S(a) * S(a) - S(b) * S(b); }, "s(a+b)s(a-b)", ["c(a+b)c(a-b)", "s(a+b)c(a-b)", "-s(a+b)s(a-b)"]],
    [3, R`\cos^2@-\sin^2#`, function (a, b) { return C(a) * C(a) - S(b) * S(b); }, "c(a+b)c(a-b)", ["s(a+b)s(a-b)", "c(a+b)s(a-b)", "-c(a+b)c(a-b)"]]
  ]
};

/* forms that only appear in a few items (defined here to keep the table above readable) */
(function () {
  var r2 = Math.SQRT2, r3 = Math.sqrt(3);
  function h(f) { return function (a, b) { return f((a + b) / 2, (a - b) / 2); }; }
  var extra = {
    "1/(1+c)": ["\\dfrac{1}{1+\\cos@}", function (a) { return 1 / (1 + C(a)); }],
    "-ic": ["-\\dfrac{1}{\\cos@}", function (a) { return -1 / C(a); }],
    "tb": ["tg#", function (a, b) { return T(b); }],
    "(1+t)/(1-t)": ["\\dfrac{1+tg@}{1-tg@}", function (a) { return (1 + T(a)) / (1 - T(a)); }],
    "(1-t)/(1+t)": ["\\dfrac{1-tg@}{1+tg@}", function (a) { return (1 - T(a)) / (1 + T(a)); }],
    "2k2": ["2ctg2@", function (a) { return 2 * K(2 * a); }],
    "1-½s²2a": ["1-\\dfrac12\\sin^22@", function (a) { var u = S(2 * a); return 1 - (u * u) / 2; }],
    "1-hS2": ["1-\\dfrac12\\sin2@", function (a) { return 1 - S(2 * a) / 2; }],
    "s8": ["\\sin8@", function (a) { return S(8 * a); }],
    "C8": ["\\cos8@", function (a) { return C(8 * a); }],
    "2S4": ["2\\sin4@", function (a) { return 2 * S(4 * a); }],
    "K4": ["ctg4@", function (a) { return K(4 * a); }],
    "-T4": ["-tg4@", function (a) { return -T(4 * a); }],
    "2T2": ["2tg2@", function (a) { return 2 * T(2 * a); }],
    "-2c2": ["-2\\cos^2@", function (a) { return -2 * C(a) * C(a); }],
    "r2c": ["\\sqrt2\\cos@", function (a) { return r2 * C(a); }],
    "r2s": ["\\sqrt2\\sin@", function (a) { return r2 * S(a); }],
    "r3c": ["\\sqrt3\\cos@", function (a) { return r3 * C(a); }],
    "r3s": ["\\sqrt3\\sin@", function (a) { return r3 * S(a); }],
    "2s(+)c(-)": ["2\\sin\\dfrac{@+#}{2}\\cos\\dfrac{@-#}{2}", h(function (p, m) { return 2 * S(p) * C(m); })],
    "2c(+)c(-)": ["2\\cos\\dfrac{@+#}{2}\\cos\\dfrac{@-#}{2}", h(function (p, m) { return 2 * C(p) * C(m); })],
    "2s(+)s(-)": ["2\\sin\\dfrac{@+#}{2}\\sin\\dfrac{@-#}{2}", h(function (p, m) { return 2 * S(p) * S(m); })],
    "-2s(+)s(-)": ["-2\\sin\\dfrac{@+#}{2}\\sin\\dfrac{@-#}{2}", h(function (p, m) { return -2 * S(p) * S(m); })],
    "2c(+)s(-)": ["2\\cos\\dfrac{@+#}{2}\\sin\\dfrac{@-#}{2}", h(function (p, m) { return 2 * C(p) * S(m); })],
    "t(+)": ["tg\\dfrac{@+#}{2}", h(function (p) { return T(p); })],
    "t(-)": ["tg\\dfrac{@-#}{2}", h(function (p, m) { return T(m); })],
    "-t(-)": ["-tg\\dfrac{@-#}{2}", h(function (p, m) { return -T(m); })],
    "-t(+)": ["-tg\\dfrac{@+#}{2}", h(function (p) { return -T(p); })],
    "k(+)": ["ctg\\dfrac{@+#}{2}", h(function (p) { return K(p); })],
    "k(-)": ["ctg\\dfrac{@-#}{2}", h(function (p, m) { return K(m); })],
    "t(+)k(-)": ["tg\\dfrac{@+#}{2}\\,ctg\\dfrac{@-#}{2}", h(function (p, m) { return T(p) * K(m); })],
    "t(-)k(+)": ["tg\\dfrac{@-#}{2}\\,ctg\\dfrac{@+#}{2}", h(function (p, m) { return T(m) * K(p); })],
    "s(a+b)+s(a-b)": ["\\sin(@+#)+\\sin(@-#)", function (a, b) { return S(a + b) + S(a - b); }],
    "s(a+b)-s(a-b)": ["\\sin(@+#)-\\sin(@-#)", function (a, b) { return S(a + b) - S(a - b); }],
    "c(a-b)+c(a+b)": ["\\cos(@-#)+\\cos(@+#)", function (a, b) { return C(a - b) + C(a + b); }],
    "c(a-b)-c(a+b)": ["\\cos(@-#)-\\cos(@+#)", function (a, b) { return C(a - b) - C(a + b); }],
    "c(a+b)-c(a-b)": ["\\cos(@+#)-\\cos(@-#)", function (a, b) { return C(a + b) - C(a - b); }],
    "s(a+b)s(a-b)": ["\\sin(@+#)\\sin(@-#)", function (a, b) { return S(a + b) * S(a - b); }],
    "-s(a+b)s(a-b)": ["-\\sin(@+#)\\sin(@-#)", function (a, b) { return -S(a + b) * S(a - b); }],
    "c(a+b)c(a-b)": ["\\cos(@+#)\\cos(@-#)", function (a, b) { return C(a + b) * C(a - b); }],
    "-c(a+b)c(a-b)": ["-\\cos(@+#)\\cos(@-#)", function (a, b) { return -C(a + b) * C(a - b); }],
    "s(a+b)c(a-b)": ["\\sin(@+#)\\cos(@-#)", function (a, b) { return S(a + b) * C(a - b); }],
    "c(a+b)s(a-b)": ["\\cos(@+#)\\sin(@-#)", function (a, b) { return C(a + b) * S(a - b); }]
  };
  for (var key in extra) RS[key] = extra[key];
})();

SIMPLIFY.c1s14 = [
  [2, R`\sin(\pi-@)\cos\left(\dfrac\pi2-@\right)+\cos^2(-@)`, function (a) { return S(PI - a) * C(PI / 2 - a) + C(-a) * C(-a); }, "1", ["C2", "-C2", "2s2"]],
  [2, R`\dfrac{\sin2@}{2\cos\left(\dfrac\pi2-@\right)}`, function (a) { return S(2 * a) / (2 * C(PI / 2 - a)); }, "c", ["s", "-c", "1"]],
  [2, R`\dfrac{1-\cos2@}{2\sin(\pi+@)}`, function (a) { return (1 - C(2 * a)) / (2 * S(PI + a)); }, "-s", ["s", "-c", "c"]],
  [2, R`2\,tg(\pi+@)\cos^2@`, function (a) { return 2 * T(PI + a) * C(a) * C(a); }, "S2", ["-S2", "C2", "2s"]],
  [2, R`\sin(@+#)-2\cos@\sin#`, function (a, b) { return S(a + b) - 2 * C(a) * S(b); }, "s(a-b)", ["s(a+b)", "c(a-b)", "-s(a-b)"]],
  [2, R`\dfrac{\cos^2@-\sin^2@}{\cos@+\sin@}+\sin@`, function (a) { return (C(a) * C(a) - S(a) * S(a)) / (C(a) + S(a)) + S(a); }, "c", ["s", "2s", "C2"]],
  [2, R`\sin2@\,ctg@-1`, function (a) { return S(2 * a) * K(a) - 1; }, "C2", ["-C2", "S2", "c2"]],
  [2, R`\dfrac{(1+tg^2@)\sin2@}{2}`, function (a) { return ((1 + T(a) * T(a)) * S(2 * a)) / 2; }, "t", ["k", "S2", "sc"]],
  [2, R`\cos^4@-\sin^4@+2\sin^2@`, function (a) { return Math.pow(C(a), 4) - Math.pow(S(a), 4) + 2 * S(a) * S(a); }, "1", ["C2", "c2", "2"]],
  [2, R`\sin\left(\dfrac\pi2+2@\right)+2\sin^2@`, function (a) { return S(PI / 2 + 2 * a) + 2 * S(a) * S(a); }, "1", ["C2", "-1", "2c2"]],
  [2, R`tg\dfrac{@}{2}\,(1+\cos@)`, function (a) { return T(a / 2) * (1 + C(a)); }, "s", ["c", "1-c", "t"]],
  [3, R`2\sin\left(\dfrac\pi4+@\right)\sin\left(\dfrac\pi4-@\right)`, function (a) { return 2 * S(PI / 4 + a) * S(PI / 4 - a); }, "C2", ["S2", "1", "-C2"]],
  [3, R`\dfrac{\sin2@-\sin@}{1-\cos@+\cos2@}`, function (a) { return (S(2 * a) - S(a)) / (1 - C(a) + C(2 * a)); }, "t", ["k", "s", "T2"]],
  [3, R`\dfrac{1+\cos@+\cos2@}{\sin@+\sin2@}`, function (a) { return (1 + C(a) + C(2 * a)) / (S(a) + S(2 * a)); }, "k", ["t", "c", "K2"]],
  [3, R`\dfrac{\cos(\pi-2@)}{\sin\left(\dfrac{3\pi}{2}+@\right)-\sin(\pi+@)}`, function (a) { return C(PI - 2 * a) / (S((3 * PI) / 2 + a) - S(PI + a)); }, "c+s", ["c-s", "s-c", "-1"]],
  [3, R`\dfrac{\sin(\pi+2@)}{1-\sin\left(\dfrac{3\pi}2-2@\right)}`, function (a) { return S(PI + 2 * a) / (1 - S((3 * PI) / 2 - 2 * a)); }, "-t", ["t", "-k", "k"]],
  [3, R`\cos^2\left(\dfrac\pi4-@\right)-\sin^2\left(\dfrac\pi4-@\right)`, function (a) { return Math.pow(C(PI / 4 - a), 2) - Math.pow(S(PI / 4 - a), 2); }, "S2", ["C2", "-S2", "1"]]
];
RS["c+s"] = ["\\cos@+\\sin@", function (a) { return C(a) + S(a); }];

/* identity L = k·B (+ off), find k */
var FINDK = {
  c1s3: [
    [1, R`(\sin@+\cos@)^2+(\sin@-\cos@)^2=k`, function (a) { var u = S(a) + C(a), w = S(a) - C(a); return u * u + w * w; }, function () { return 1; }],
    [1, R`5\sin^2@+5\cos^2@-2=k`, function (a) { return 5 * S(a) * S(a) + 5 * C(a) * C(a) - 2; }, function () { return 1; }],
    [2, R`(\sin@+\cos@)^2-(\sin@-\cos@)^2=k\sin@\cos@`, function (a) { var u = S(a) + C(a), w = S(a) - C(a); return u * u - w * w; }, function (a) { return S(a) * C(a); }],
    [2, R`(tg@+ctg@)^2-(tg@-ctg@)^2=k`, function (a) { var u = T(a) + K(a), w = T(a) - K(a); return u * u - w * w; }, function () { return 1; }],
    [2, R`\sin^2@\,(1+ctg^2@)+\cos^2@\,(1+tg^2@)=k`, function (a) { return S(a) * S(a) * (1 + K(a) * K(a)) + C(a) * C(a) * (1 + T(a) * T(a)); }, function () { return 1; }],
    [2, R`\dfrac{1}{1+\sin@}+\dfrac{1}{1-\sin@}=\dfrac{k}{\cos^2@}`, function (a) { return 1 / (1 + S(a)) + 1 / (1 - S(a)); }, function (a) { return 1 / (C(a) * C(a)); }],
    [2, R`\dfrac{1}{1-\cos@}-\dfrac{1}{1+\cos@}=\dfrac{k\cos@}{\sin^2@}`, function (a) { return 1 / (1 - C(a)) - 1 / (1 + C(a)); }, function (a) { return C(a) / (S(a) * S(a)); }],
    [3, R`2(\sin^6@+\cos^6@)-3(\sin^4@+\cos^4@)=k`, function (a) { var x = S(a) * S(a), y = C(a) * C(a); return 2 * (x * x * x + y * y * y) - 3 * (x * x + y * y); }, function () { return 1; }],
    [3, R`\sin^4@+\cos^4@=1-k\sin^2@\cos^2@`, function (a) { return 1 - (Math.pow(S(a), 4) + Math.pow(C(a), 4)); }, function (a) { return S(a) * S(a) * C(a) * C(a); }],
    [3, R`\sin^6@+\cos^6@=1-k\sin^2@\cos^2@`, function (a) { return 1 - (Math.pow(S(a), 6) + Math.pow(C(a), 6)); }, function (a) { return S(a) * S(a) * C(a) * C(a); }]
  ],
  c1s5: [
    [1, R`\sin(@+#)+\sin(@-#)=k\sin@\cos#`, function (a, b) { return S(a + b) + S(a - b); }, function (a, b) { return S(a) * C(b); }],
    [1, R`\cos(@-#)-\cos(@+#)=k\sin@\sin#`, function (a, b) { return C(a - b) - C(a + b); }, function (a, b) { return S(a) * S(b); }],
    [2, R`\sin(@+30^\circ)+\sin(@-30^\circ)=k\sin@`, function (a) { return S(a + PI / 6) + S(a - PI / 6); }, function (a) { return S(a); }],
    [2, R`\cos(@+45^\circ)+\cos(@-45^\circ)=k\cos@`, function (a) { return C(a + PI / 4) + C(a - PI / 4); }, function (a) { return C(a); }],
    [2, R`\sin(@+60^\circ)-\sin(@-60^\circ)=k\cos@`, function (a) { return S(a + PI / 3) - S(a - PI / 3); }, function (a) { return C(a); }],
    [2, R`\sin(@+45^\circ)-\cos(@+45^\circ)=k\sin@`, function (a) { return S(a + PI / 4) - C(a + PI / 4); }, function (a) { return S(a); }],
    [2, R`\cos(@+60^\circ)+\cos(@-60^\circ)=k\cos@`, function (a) { return C(a + PI / 3) + C(a - PI / 3); }, function (a) { return C(a); }],
    [3, R`\sin@+\sqrt3\cos@=k\sin(@+60^\circ)`, function (a) { return S(a) + Math.sqrt(3) * C(a); }, function (a) { return S(a + PI / 3); }],
    [3, R`\sin@+\cos@=k\sin(@+45^\circ)`, function (a) { return S(a) + C(a); }, function (a) { return S(a + PI / 4); }],
    [3, R`\sqrt3\cos@-\sin@=k\cos(@+30^\circ)`, function (a) { return Math.sqrt(3) * C(a) - S(a); }, function (a) { return C(a + PI / 6); }]
  ],
  c1s6: [
    [1, R`\sin(\pi-@)+\sin(\pi+@)+3\sin@=k\sin@`, function (a) { return S(PI - a) + S(PI + a) + 3 * S(a); }, function (a) { return S(a); }],
    [1, R`\cos(\pi-@)-\cos(2\pi-@)=k\cos@`, function (a) { return C(PI - a) - C(2 * PI - a); }, function (a) { return C(a); }],
    [2, R`\sin\left(\dfrac{3\pi}2-@\right)-\cos(\pi-@)-\sin\left(\dfrac\pi2+@\right)=k\cos@`, function (a) { return S((3 * PI) / 2 - a) - C(PI - a) - S(PI / 2 + a); }, function (a) { return C(a); }],
    [2, R`\cos\left(\dfrac\pi2+@\right)+\sin(\pi-@)+\sin(\pi+@)=k\sin@`, function (a) { return C(PI / 2 + a) + S(PI - a) + S(PI + a); }, function (a) { return S(a); }],
    [2, R`tg(\pi+@)-tg(\pi-@)+ctg\left(\dfrac\pi2-@\right)=k\,tg@`, function (a) { return T(PI + a) - T(PI - a) + K(PI / 2 - a); }, function (a) { return T(a); }],
    [3, R`\sin^2(\pi+@)+\cos^2\left(\dfrac{3\pi}2-@\right)+2\cos^2(\pi-@)=k`, function (a) { return Math.pow(S(PI + a), 2) + Math.pow(C((3 * PI) / 2 - a), 2) + 2 * Math.pow(C(PI - a), 2); }, function () { return 1; }]
  ],
  c1s7: [
    [1, R`\sin2@=k\sin@\cos@`, function (a) { return S(2 * a); }, function (a) { return S(a) * C(a); }],
    [1, R`1-\cos2@=k\sin^2@`, function (a) { return 1 - C(2 * a); }, function (a) { return S(a) * S(a); }],
    [1, R`1+\cos2@=k\cos^2@`, function (a) { return 1 + C(2 * a); }, function (a) { return C(a) * C(a); }],
    [2, R`\sin^4@-\cos^4@=k\cos2@`, function (a) { return Math.pow(S(a), 4) - Math.pow(C(a), 4); }, function (a) { return C(2 * a); }],
    [2, R`\sin@\cos@\cos2@=k\sin4@`, function (a) { return S(a) * C(a) * C(2 * a); }, function (a) { return S(4 * a); }],
    [2, R`\sin2@\cos2@=k\sin4@`, function (a) { return S(2 * a) * C(2 * a); }, function (a) { return S(4 * a); }],
    [2, R`ctg@-tg@=k\,ctg2@`, function (a) { return K(a) - T(a); }, function (a) { return K(2 * a); }],
    [2, R`tg@+ctg@=\dfrac{k}{\sin2@}`, function (a) { return T(a) + K(a); }, function (a) { return 1 / S(2 * a); }],
    [2, R`\dfrac{1}{1-tg@}-\dfrac{1}{1+tg@}=k\,tg2@`, function (a) { return 1 / (1 - T(a)) - 1 / (1 + T(a)); }, function (a) { return T(2 * a); }],
    [3, R`\sin^4@+\cos^4@=1+k\sin^22@`, function (a) { return Math.pow(S(a), 4) + Math.pow(C(a), 4) - 1; }, function (a) { return S(2 * a) * S(2 * a); }],
    [3, R`\sin^2@\cos^2@=k(1-\cos4@)`, function (a) { return S(a) * S(a) * C(a) * C(a); }, function (a) { return 1 - C(4 * a); }],
    [3, R`\cos^4@-\sin^4@-\cos^2@+\sin^2@=k`, function (a) { return Math.pow(C(a), 4) - Math.pow(S(a), 4) - C(a) * C(a) + S(a) * S(a); }, function () { return 1; }]
  ],
  c1s8: [
    [1, R`\sin6@+\sin2@=k\sin4@\cos2@`, function (a) { return S(6 * a) + S(2 * a); }, function (a) { return S(4 * a) * C(2 * a); }],
    [1, R`\cos6@+\cos2@=k\cos4@\cos2@`, function (a) { return C(6 * a) + C(2 * a); }, function (a) { return C(4 * a) * C(2 * a); }],
    [2, R`\cos2@-\cos6@=k\sin4@\sin2@`, function (a) { return C(2 * a) - C(6 * a); }, function (a) { return S(4 * a) * S(2 * a); }],
    [2, R`\sin(60^\circ+@)+\sin(60^\circ-@)=k\cos@`, function (a) { return S(PI / 3 + a) + S(PI / 3 - a); }, function (a) { return C(a); }],
    [2, R`\cos(30^\circ-@)-\cos(30^\circ+@)=k\sin@`, function (a) { return C(PI / 6 - a) - C(PI / 6 + a); }, function (a) { return S(a); }],
    [3, R`\sin^2(45^\circ+@)-\sin^2(45^\circ-@)=k\sin2@`, function (a) { return Math.pow(S(PI / 4 + a), 2) - Math.pow(S(PI / 4 - a), 2); }, function (a) { return S(2 * a); }],
    [3, R`\cos^2(@-#)-\cos^2(@+#)=k\sin2@\sin2#`, function (a, b) { return Math.pow(C(a - b), 2) - Math.pow(C(a + b), 2); }, function (a, b) { return S(2 * a) * S(2 * b); }]
  ]
};

/* "left = right": the program decides whether it is an identity */
var TRUTH = {
  c1s3: [
    [1, R`\sin^2@-\cos^2@=1-2\cos^2@`, function (a) { return S(a) * S(a) - C(a) * C(a); }, function (a) { return 1 - 2 * C(a) * C(a); }],
    [1, R`(\sin@+\cos@)^2=1`, function (a) { var u = S(a) + C(a); return u * u; }, function () { return 1; }],
    [1, R`1+tg^2@=\dfrac{1}{\sin^2@}`, function (a) { return 1 + T(a) * T(a); }, function (a) { return 1 / (S(a) * S(a)); }],
    [1, R`1+ctg^2@=\dfrac{1}{\sin^2@}`, function (a) { return 1 + K(a) * K(a); }, function (a) { return 1 / (S(a) * S(a)); }],
    [2, R`\sin^4@-\cos^4@=\sin^2@-\cos^2@`, function (a) { return Math.pow(S(a), 4) - Math.pow(C(a), 4); }, function (a) { return S(a) * S(a) - C(a) * C(a); }],
    [2, R`\dfrac{\sin@}{1+\cos@}=\dfrac{1-\cos@}{\sin@}`, function (a) { return S(a) / (1 + C(a)); }, function (a) { return (1 - C(a)) / S(a); }],
    [2, R`\dfrac{\cos@}{1-\sin@}=\dfrac{1-\sin@}{\cos@}`, function (a) { return C(a) / (1 - S(a)); }, function (a) { return (1 - S(a)) / C(a); }],
    [2, R`tg@+ctg@=\dfrac{1}{\sin@\cos@}`, function (a) { return T(a) + K(a); }, function (a) { return 1 / (S(a) * C(a)); }],
    [3, R`\dfrac{1+tg@}{1+ctg@}=tg@`, function (a) { return (1 + T(a)) / (1 + K(a)); }, function (a) { return T(a); }],
    [3, R`\dfrac{1-tg@}{1+ctg@}=-tg@`, function (a) { return (1 - T(a)) / (1 + K(a)); }, function (a) { return -T(a); }]
  ],
  c1s5: [
    [1, R`\sin(@+#)=\sin@+\sin#`, function (a, b) { return S(a + b); }, function (a, b) { return S(a) + S(b); }],
    [1, R`\cos(@-#)=\cos@\cos#-\sin@\sin#`, function (a, b) { return C(a - b); }, function (a, b) { return C(a) * C(b) - S(a) * S(b); }],
    [1, R`\sin(@-#)=\sin@\cos#-\cos@\sin#`, function (a, b) { return S(a - b); }, function (a, b) { return S(a) * C(b) - C(a) * S(b); }],
    [2, R`tg(@+#)=\dfrac{tg@+tg#}{1+tg@\,tg#}`, function (a, b) { return T(a + b); }, function (a, b) { return (T(a) + T(b)) / (1 + T(a) * T(b)); }],
    [2, R`\cos(@+#)\cos(@-#)=\cos^2@-\sin^2#`, function (a, b) { return C(a + b) * C(a - b); }, function (a, b) { return C(a) * C(a) - S(b) * S(b); }],
    [2, R`\sin(@+#)\sin(@-#)=\sin^2@-\cos^2#`, function (a, b) { return S(a + b) * S(a - b); }, function (a, b) { return S(a) * S(a) - C(b) * C(b); }]
  ],
  c1s6: [
    [1, R`\sin\left(\dfrac\pi2+@\right)=-\cos@`, function (a) { return S(PI / 2 + a); }, function (a) { return -C(a); }],
    [1, R`\cos(\pi+@)=-\cos@`, function (a) { return C(PI + a); }, function (a) { return -C(a); }],
    [1, R`tg(\pi-@)=tg@`, function (a) { return T(PI - a); }, function (a) { return T(a); }],
    [1, R`\sin\left(\dfrac{3\pi}2-@\right)=-\cos@`, function (a) { return S((3 * PI) / 2 - a); }, function (a) { return -C(a); }],
    [2, R`\cos\left(\dfrac{3\pi}2+@\right)=-\sin@`, function (a) { return C((3 * PI) / 2 + a); }, function (a) { return -S(a); }],
    [2, R`ctg\left(\dfrac\pi2+@\right)=-tg@`, function (a) { return K(PI / 2 + a); }, function (a) { return -T(a); }]
  ],
  c1s7: [
    [1, R`\sin2@=2\sin@`, function (a) { return S(2 * a); }, function (a) { return 2 * S(a); }],
    [1, R`\cos2@=2\cos^2@-1`, function (a) { return C(2 * a); }, function (a) { return 2 * C(a) * C(a) - 1; }],
    [1, R`\cos2@=1-2\cos^2@`, function (a) { return C(2 * a); }, function (a) { return 1 - 2 * C(a) * C(a); }],
    [2, R`tg2@=\dfrac{2tg@}{1+tg^2@}`, function (a) { return T(2 * a); }, function (a) { return (2 * T(a)) / (1 + T(a) * T(a)); }],
    [2, R`\sin2@=\dfrac{2tg@}{1+tg^2@}`, function (a) { return S(2 * a); }, function (a) { return (2 * T(a)) / (1 + T(a) * T(a)); }],
    [2, R`\cos2@=\dfrac{1-tg^2@}{1+tg^2@}`, function (a) { return C(2 * a); }, function (a) { return (1 - T(a) * T(a)) / (1 + T(a) * T(a)); }],
    [2, R`1+\sin2@=(\sin@+\cos@)^2`, function (a) { return 1 + S(2 * a); }, function (a) { var u = S(a) + C(a); return u * u; }],
    [3, R`\sin^2\dfrac{@}{2}=\dfrac{1+\cos@}{2}`, function (a) { return Math.pow(S(a / 2), 2); }, function (a) { return (1 + C(a)) / 2; }],
    [3, R`tg\dfrac{@}{2}=\dfrac{\sin@}{1+\cos@}`, function (a) { return T(a / 2); }, function (a) { return S(a) / (1 + C(a)); }]
  ],
  c1s8: [
    [1, R`\sin@+\sin#=\sin(@+#)`, function (a, b) { return S(a) + S(b); }, function (a, b) { return S(a + b); }],
    [1, R`\cos@+\cos#=2\cos\dfrac{@+#}{2}\cos\dfrac{@-#}{2}`, function (a, b) { return C(a) + C(b); }, function (a, b) { return 2 * C((a + b) / 2) * C((a - b) / 2); }],
    [2, R`\cos@-\cos#=2\sin\dfrac{@+#}{2}\sin\dfrac{@-#}{2}`, function (a, b) { return C(a) - C(b); }, function (a, b) { return 2 * S((a + b) / 2) * S((a - b) / 2); }],
    [2, R`2\sin@\sin#=\cos(@-#)-\cos(@+#)`, function (a, b) { return 2 * S(a) * S(b); }, function (a, b) { return C(a - b) - C(a + b); }],
    [2, R`2\cos@\sin#=\sin(@+#)+\sin(@-#)`, function (a, b) { return 2 * C(a) * S(b); }, function (a, b) { return S(a + b) + S(a - b); }]
  ]
};

/* ======================================================================= */
/*  generators                                                             */
/* ======================================================================= */
var TG = R`\operatorname{tg}`, CTG = R`\operatorname{ctg}`;
var HN = R` (ჩაწერე ზუსტი სახით — წილადით ან ფესვით, მაგ. 3/5, √3/2, -√2/2, 2-√3; ათწილადი არ მიიღება)`;
var HP = R` (ჩაწერე ზუსტი სახით π-ით, მაგ. π/6, 2π/3, -π/4; ათწილადი არ მიიღება)`;
var NOTE = {
  c1s3: R`გამოიყენე $\sin^2\alpha+\cos^2\alpha=1$, $${TG}\alpha=\dfrac{\sin\alpha}{\cos\alpha}$, $1+${TG}^2\alpha=\dfrac1{\cos^2\alpha}$, $1+${CTG}^2\alpha=\dfrac1{\sin^2\alpha}$.`,
  c1s4: R`$\sin(-\alpha)=-\sin\alpha$, $\cos(-\alpha)=\cos\alpha$, $${TG}(-\alpha)=-${TG}\alpha$; $\sin$ და $\cos$ პერიოდია $2\pi$, $${TG}$-ისა და $${CTG}$-ის — $\pi$.`,
  c1s5: R`შეკრების ფორმულები: $\sin(\alpha\pm\beta)=\sin\alpha\cos\beta\pm\cos\alpha\sin\beta$, $\cos(\alpha\pm\beta)=\cos\alpha\cos\beta\mp\sin\alpha\sin\beta$.`,
  c1s6: R`დაყვანის ფორმულები: $\pi\pm\alpha$ და $2\pi-\alpha$ — ფუნქცია არ იცვლება; $\dfrac\pi2\pm\alpha$ და $\dfrac{3\pi}2\pm\alpha$ — იცვლება კოფუნქციით. ნიშანს იღებს საწყისი ფუნქციის ნიშანი შესაბამის მეოთხედში.`,
  c1s7: R`ორმაგი კუთხე: $\sin2\alpha=2\sin\alpha\cos\alpha$, $\cos2\alpha=\cos^2\alpha-\sin^2\alpha=2\cos^2\alpha-1=1-2\sin^2\alpha$; ნახევარი კუთხე: $\sin^2\dfrac\alpha2=\dfrac{1-\cos\alpha}2$, $\cos^2\dfrac\alpha2=\dfrac{1+\cos\alpha}2$.`,
  c1s8: R`$\sin\alpha\pm\sin\beta=2\sin\dfrac{\alpha\pm\beta}2\cos\dfrac{\alpha\mp\beta}2$, $\cos\alpha+\cos\beta=2\cos\dfrac{\alpha+\beta}2\cos\dfrac{\alpha-\beta}2$, $\cos\alpha-\cos\beta=-2\sin\dfrac{\alpha+\beta}2\sin\dfrac{\alpha-\beta}2$.`,
  c1s14: R`გამოიყენე დაყვანის ფორმულები, ორმაგი კუთხის ფორმულები და ძირითადი იგივეობა.`
};

function at(list, v) { return list[v % list.length]; }
function deg(d) { return d + "^\\circ"; }
var TRP = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37]];
var FN = {
  sin: [R`\sin`, S],
  cos: [R`\cos`, C],
  tg: [TG, T],
  ctg: [CTG, K]
};
/* value of a trig function at d degrees; null when undefined */
function fv(name, d) {
  var x = rad(d), v = FN[name][1](x);
  if (name === "tg" && Math.abs(C(x)) < 1e-9) return null;
  if (name === "ctg" && Math.abs(S(x)) < 1e-9) return null;
  if (Math.abs(v) < 1e-12) v = 0;
  return v;
}
/* checks the shown form once more; 1e-9 is far below anything a student could type */
function keyOf(v, tex) { return { t: "num", v: v, exact: true, show: "$" + tex + "$" }; }

function registerTrig11(GEN) {
  var G = GEN.G, Q = GEN.Q, CH = GEN.CH, IV = GEN.IV;

  /* exact number answer; hint only when the answer is not an integer */
  function QE(q, v, sol) {
    if (Math.abs(v) < 1e-12) v = 0;
    var t = ex(v), hint = /^-?\d+$/.test(t) ? "" : HN;
    return Q(q + hint, keyOf(v, t), null, typeof sol === "function" ? sol(t) : sol);
  }
  /* answer that is a multiple of π */
  function QP(q, v, sol) {
    var t = exPi(v);
    return Q(q + HP, keyOf(v, t), null, typeof sol === "function" ? sol(t) : sol);
  }
  function QN(q, n, sol) { return Q(q, keyOf(n, String(n)), null, sol); }
  /* simplification / identity problems are marked as the chapter test's focus */
  function focus(res) { if (res) res[4] = { f: 1 }; return res; }

  /* ---------- identity bank → problems ---------- */
  function twoVar(item) { return /#/.test(item[1]); }
  function simplifyQ(lid, item, v) {
    var lhs = tx(item[1]), res = RS[item[3]];
    var opts = [res].concat(item[4].map(function (k) { return RS[k]; })).map(function (o) { return "$" + tx(o[0]) + "$"; });
    var stem = [R`გაამარტივე გამოსახულება: $${lhs}$.`, R`რისი იგივურად ტოლია $${lhs}$?`, R`შეავსე იგივეობა: $${lhs}=\;?$`][v % 3];
    return focus(Q(stem, CH(opts, 0), null, [(item[5] || NOTE[lid]), R`$${lhs}=${tx(res[0])}$.`]));
  }
  function findKQ(item) {
    var f = item[2], b = item[3], k = null;
    [[0.37, 0.21], [0.83, 0.52], [1.21, 0.33], [0.61, 1.07]].forEach(function (pt) {
      var x = f(pt[0], pt[1]) / b(pt[0], pt[1]);
      if (k === null) k = x;
      else if (Math.abs(k - x) > 1e-7) throw new Error("not an identity: " + item[1]);
    });
    var eq = tx(item[1]);
    return focus(QE(R`იპოვე $k$, რომლისთვისაც სრულდება იგივეობა: $${eq}$.`, k, function (t) { return [R`გარდაქმენი მარცხენა მხარე და შეადარე მარჯვენას.`, R`$k=${t}$.`]; }));
  }
  function holds(f, g) {
    var pts = [[0.37, 0.21], [0.83, 0.52], [1.21, 0.33], [0.61, 1.07], [2.3, 0.9], [-0.7, 1.4]];
    return pts.every(function (pt) { var x = f(pt[0], pt[1]), y = g(pt[0], pt[1]); return !isFinite(x) || !isFinite(y) || Math.abs(x - y) < 1e-9 * Math.max(1, Math.abs(y)); });
  }
  function truthQ(item) {
    var ok = holds(item[2], item[3]), eq = tx(item[1]);
    return focus(Q(R`ჭეშმარიტია თუ არა იგივეობა (ყველა დასაშვები მნიშვნელობისთვის)? $${eq}$`, CH([R`ჭეშმარიტია`, R`მცდარია`], ok ? 0 : 1), null,
      ok ? R`ტოლობა იგივეობაა: გარდაქმენი ერთი მხარე და მიიღებ მეორეს.` : R`ტოლობა იგივეობა არ არის: საკმარისია ერთი მნიშვნელობა, სადაც მხარეები განსხვავდება (მაგ., სცადე $\alpha=\dfrac\pi3$${/#/.test(item[1]) ? R`, $\beta=\dfrac\pi6$` : ""}).`));
  }
  var EVAL_AT = [30, 45, 60, 120, 135, 150, 210, 240, 300, 330];
  function evalQ(lid, bank, r) {
    var item = r.pick(bank.filter(function (x) { return !twoVar(x) && !/^-?\d|^1\/2$/.test(x[3]); }));
    var d = r.pick(EVAL_AT), a = rad(d), v = item[2](a), w = RS[item[3]][1](a);
    if (!isFinite(v) || Math.abs(v) > 50 || Math.abs(v - w) > 1e-9) return null;
    var lhs = tx(item[1]), res = tx(RS[item[3]][0]);
    return focus(QE(R`გაამარტივე და გამოთვალე, როცა $\alpha=${piFr(d)}$: $${lhs}$.`, v, function (t) { return [NOTE[lid], R`$${lhs}=${res}$; $\alpha=${piFr(d)}$-ისთვის მივიღებთ $${t}$.`]; }));
  }
  /* bank templates for one lesson: every item becomes exactly one problem */
  function bankTemplates(lid, evalCount) {
    var out = [];
    var bank = SIMPLIFY[lid] || [];
    [1, 2, 3].forEach(function (lvl) {
      var items = bank.filter(function (x) { return x[0] === lvl; });
      if (items.length) out.push([lvl, items.length, function (r, v) { return simplifyQ(lid, items[v], v); }]);
      var ks = (FINDK[lid] || []).filter(function (x) { return x[0] === lvl; });
      if (ks.length) out.push([lvl, ks.length, function (r, v) { return findKQ(ks[v]); }]);
      var ts = (TRUTH[lid] || []).filter(function (x) { return x[0] === lvl; });
      if (ts.length) out.push([lvl, ts.length, function (r, v) { return truthQ(ts[v]); }]);
    });
    if (evalCount && bank.length) out.push([3, evalCount, function (r) { return evalQ(lid, bank, r); }]);
    return out;
  }

  /* ================= c1s1 · radian measure ================= */
  var D2R = [15, 18, 20, 30, 36, 40, 45, 54, 60, 72, 75, 80, 90, 100, 105, 108, 120, 135, 140, 150, 165, 180, 210, 225, 240, 270, 300, 315, 330, 360, 390, 405, 450, 540, 720];
  var R2D = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 36, 72, 18, 20, 15, 75, 105, 160, 200, 252, 400, 450, 600];
  var KM = [[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6], [5, 4], [4, 3], [3, 2], [5, 3], [7, 4], [11, 6], [2, 5], [3, 5]];
  G("c1s1", [
    [1, 14, function (r, v) { var d = at(D2R, v * 3); return QP(R`გადაიყვანე რადიანებში: $${deg(d)}$.`, rad(d), function (t) { return R`$${deg(d)}=${d}\cdot\dfrac{\pi}{180}=${t}$.`; }); }],
    [1, 12, function (r, v) { var d = at(R2D, v * 5); return QN(R`გადაიყვანე გრადუსებში: $${piFr(d)}$ რადიანი.`, d, R`$${piFr(d)}\cdot\dfrac{180^\circ}{\pi}=${deg(d)}$.`); }],
    [2, 6, function (r) { var R0 = r.i(2, 12), k = r.pick(KM), a = (k[0] * PI) / k[1]; return QP(R`წრის რადიუსია $${R0}$. იპოვე რკალის სიგრძე, რომლის ცენტრალური კუთხეა $${exPi(a)}$ რადიანი.`, R0 * a, function (t) { return R`$l=R\alpha=${R0}\cdot${exPi(a)}=${t}$.`; }); }],
    [2, 6, function (r) { var R0 = r.i(2, 10), k = r.pick(KM), a = (k[0] * PI) / k[1]; return QP(R`წრის რადიუსია $${R0}$. იპოვე სექტორის ფართობი, რომლის ცენტრალური კუთხეა $${exPi(a)}$ რადიანი.`, (R0 * R0 * a) / 2, function (t) { return R`$S=\dfrac{R^2\alpha}{2}=\dfrac{${R0 * R0}}{2}\cdot${exPi(a)}=${t}$.`; }); }],
    [2, 5, function (r) { var R0 = r.i(3, 12), l = r.i(2, 20); if (l % R0 === 0) return null; return QE(R`რკალის სიგრძეა $${l}$, წრის რადიუსი — $${R0}$. იპოვე ცენტრალური კუთხე რადიანებში.`, l / R0, function (t) { return R`$\alpha=\dfrac lR=\dfrac{${l}}{${R0}}=${t}$.`; }); }],
    [2, 2, function (r, v) { var R0 = [2, 3][v], S0 = [3, 6][v]; return QE(R`სექტორის რადიუსია $${R0}$, ფართობი — $${S0}$. იპოვე ცენტრალური კუთხე რადიანებში.`, (2 * S0) / (R0 * R0), function (t) { return R`$S=\dfrac{R^2\alpha}2\Rightarrow\alpha=\dfrac{2S}{R^2}=${t}$.`; }); }],
    [2, 5, function (r, v) { var m = [5, 10, 15, 20, 40, 45, 50][v]; return QP(R`რა კუთხით (რადიანებში) მობრუნდება საათის წუთების ისარი $${m}$ წუთში?`, (2 * PI * m) / 60, function (t) { return R`$60$ წუთი $=2\pi$, ამიტომ $\dfrac{${m}}{60}\cdot2\pi=${t}$.`; }); }],
    [3, 6, function (r) { var k = r.pick(KM), n = r.i(1, 3), base = (k[0] * PI) / k[1]; if (base >= 2 * PI) return null; var big = base + 2 * PI * n; return QP(R`იპოვე $[0;\ 2\pi)$ შუალედის ის კუთხე, რომელსაც ერთეულოვან წრეწირზე იგივე წერტილი შეესაბამება, რაც $${exPi(big)}$ კუთხეს.`, base, function (t) { return R`$${exPi(big)}=${t}+${2 * n}\pi$, ანუ $${n}$ სრული ბრუნი მოვაკლოთ: $${t}$.`; }); }],
    [3, 4, function (r, v) { var n = v + 1, q = [[1, 4], [1, 2], [3, 4], [1, 3]][v]; var turns = n + q[0] / q[1]; return QP(R`ბორბალმა $${n}$ სრული ბრუნი და კიდევ $${fracTex(q[0], q[1])}$ ბრუნი შეასრულა. რა კუთხით მობრუნდა იგი (რადიანებში)?`, 2 * PI * turns, function (t) { return R`ერთი ბრუნი $2\pi$-ია: $2\pi\cdot${fracTex(n * q[1] + q[0], q[1])}=${t}$.`; }); }]
  ]);

  /* ================= c1s2 · unit circle ================= */
  var ANG = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
  var RADK = [[1, 6], [1, 4], [1, 3], [2, 3], [3, 4], [5, 6], [7, 6], [5, 4], [4, 3], [5, 3], [7, 4], [11, 6], [3, 2], [1, 1], [2, 1]];
  function qn(d) { d = ((d % 360) + 360) % 360; return d < 90 ? 1 : d < 180 ? 2 : d < 270 ? 3 : 4; }
  G("c1s2", [
    [1, 12, function (r, v) { var d = at(ANG, v * 7 + 1), w = v % 2 ? "cos" : "sin"; return QE(R`იპოვე $${FN[w][0]}\,${deg(d)}$.`, fv(w, d), function (t) { return R`ერთეულოვან წრეწირზე $P(${deg(d)})=(\cos${deg(d)};\ \sin${deg(d)})$. $${FN[w][0]}\,${deg(d)}=${t}$.`; }); }],
    [1, 7, function (r, v) { var d = at([0, 30, 45, 60, 120, 135, 150, 180, 210, 225, 240, 300, 315, 330], v * 3); return QE(R`იპოვე $${TG}\,${deg(d)}$.`, fv("tg", d), function (t) { return R`$${TG}\alpha=\dfrac{\sin\alpha}{\cos\alpha}$: $${TG}\,${deg(d)}=${t}$.`; }); }],
    [2, 6, function (r, v) { var d = at([30, 45, 60, 90, 120, 135, 150, 210, 225, 240, 270, 300, 315, 330], v * 5 + 2); return QE(R`იპოვე $${CTG}\,${deg(d)}$.`, fv("ctg", d), function (t) { return R`$${CTG}\alpha=\dfrac{\cos\alpha}{\sin\alpha}$: $${CTG}\,${deg(d)}=${t}$.`; }); }],
    [2, 9, function (r, v) { var k = at(RADK, v * 4 + 1), w = ["sin", "cos", "tg"][v % 3], d = (180 * k[0]) / k[1], val = fv(w, d); if (val === null) return null; return QE(R`გამოთვალე $${FN[w][0]}\,${exPi(rad(d))}$.`, val, function (t) { return R`$${exPi(rad(d))}=${deg(d)}$, ამიტომ $${FN[w][0]}\,${exPi(rad(d))}=${t}$.`; }); }],
    [1, 6, function (r, v) { var d = at([40, 100, 170, 200, 250, 290, 340, 400, 500, -30, -100, 610], v * 5); var n = qn(d); return QN(R`რომელ მეოთხედშია $${deg(d)}$ კუთხე? (ჩაწერე ნომერი $1$–$4$)`, n, R`$${deg(d)}$ ერთეულოვან წრეწირზე ${["I", "II", "III", "IV"][n - 1]} მეოთხედშია.`); }],
    [2, 6, function (r) { var d = r.pick([100, 160, 200, 250, 290, 340, 110, 220, 310]), w = r.pick(["sin", "cos", "tg"]); var pos = fv(w, d) > 0; return Q(R`დადებითია თუ უარყოფითი $${FN[w][0]}\,${deg(d)}$?`, CH([R`დადებითია`, R`უარყოფითია`], pos ? 0 : 1), null, R`$${deg(d)}$ ${["I", "II", "III", "IV"][qn(d) - 1]} მეოთხედშია, სადაც $${FN[w][0]}$ ${pos ? "დადებითია" : "უარყოფითია"}.`); }],
    [2, 6, function (r) { var d = r.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]), sg = r.pick([1, -1]); return QE(R`გამოთვალე $\sin${deg(d)}${sg > 0 ? "+" : "-"}\cos${deg(d)}$.`, fv("sin", d) + sg * fv("cos", d), function (t) { return R`$\sin${deg(d)}=${ex(fv("sin", d))}$, $\cos${deg(d)}=${ex(fv("cos", d))}$; შედეგი $${t}$.`; }); }],
    [3, 6, function (r) { var d = r.pick([30, 45, 60, 120, 135, 150, 210, 240, 300, 330]), e = r.pick([30, 45, 60, 120, 135, 150, 210, 240, 300, 330]); return QE(R`გამოთვალე $\sin${deg(d)}\cdot\cos${deg(e)}$.`, fv("sin", d) * fv("cos", e), function (t) { return R`$${ex(fv("sin", d))}\cdot\left(${ex(fv("cos", e))}\right)=${t}$.`; }); }],
    [3, 6, function (r) { var a = r.pick([2, 3, 4, 6, 8]), b = r.pick([2, 4, 6]), d = r.pick([30, 45, 60]), e = r.pick([30, 45, 60]), w1 = r.pick(["sin", "cos"]), w2 = r.pick(["sin", "cos", "tg"]); var v = a * Math.pow(fv(w1, d), 2) - b * Math.pow(fv(w2, e), 2); return QE(R`გამოთვალე $${a}${FN[w1][0]}^2${deg(d)}-${b}${FN[w2][0]}^2${deg(e)}$.`, v, function (t) { return R`$${a}\cdot\left(${ex(fv(w1, d))}\right)^2-${b}\cdot\left(${ex(fv(w2, e))}\right)^2=${t}$.`; }); }],
    [3, 6, function (r) { var t3 = r.pick(TRP), sx = r.pick([1, -1]), sy = r.pick([1, -1]), w = r.pick(["sin", "cos", "tg", "ctg"]); var x = (sx * t3[0]) / t3[2], y = (sy * t3[1]) / t3[2]; var val = { sin: y, cos: x, tg: y / x, ctg: x / y }[w]; return QE(R`ერთეულოვან წრეწირზე $P(\alpha)$ წერტილია $\left(${fracTex(sx * t3[0], t3[2])};\ ${fracTex(sy * t3[1], t3[2])}\right)$. იპოვე $${FN[w][0]}\alpha$.`, val, function (t) { return R`$\cos\alpha=x$, $\sin\alpha=y$; $${FN[w][0]}\alpha=${t}$.`; }); }],
    [1, 4, function (r, v) { var e = [[R`\sin90^\circ+\cos180^\circ`, 0], [R`\cos0^\circ-\sin270^\circ`, 2], [R`2\sin90^\circ-3\cos360^\circ`, -1], [R`\sin180^\circ+\cos270^\circ+\sin270^\circ`, -1]][v]; return QN(R`გამოთვალე $${e[0]}$.`, e[1], R`$\sin0^\circ=0$, $\sin90^\circ=1$, $\cos180^\circ=-1$, $\sin270^\circ=-1$, $\cos270^\circ=0$, $\cos360^\circ=1$. შედეგი $${e[1]}$.`); }]
  ]);

  /* ================= c1s3 · basic identities ================= */
  var QS = [R`I`, R`II`, R`III`, R`IV`];
  var SGN = [[1, 1], [1, -1], [-1, -1], [-1, 1]]; /* [sin, cos] signs by quadrant */
  G("c1s3", [
    [1, 8, function (r) { var t3 = r.pick(TRP), q = r.i(0, 3), s0 = SGN[q][0] * t3[0], c0 = SGN[q][1] * t3[1]; return QE(R`$\sin\alpha=${fracTex(s0, t3[2])}$ და $\alpha$ ${QS[q]} მეოთხედის კუთხეა. იპოვე $\cos\alpha$.`, c0 / t3[2], function (t) { return R`$\cos^2\alpha=1-\sin^2\alpha=1-\dfrac{${t3[0] * t3[0]}}{${t3[2] * t3[2]}}=\dfrac{${t3[1] * t3[1]}}{${t3[2] * t3[2]}}$. ${QS[q]} მეოთხედში $\cos\alpha${SGN[q][1] > 0 ? ">" : "<"}0$: $\cos\alpha=${t}$.`; }); }],
    [1, 8, function (r) { var t3 = r.pick(TRP), q = r.i(0, 3), s0 = SGN[q][0] * t3[1], c0 = SGN[q][1] * t3[0]; return QE(R`$\cos\alpha=${fracTex(c0, t3[2])}$ და $\alpha$ ${QS[q]} მეოთხედის კუთხეა. იპოვე $\sin\alpha$.`, s0 / t3[2], function (t) { return R`$\sin^2\alpha=1-\cos^2\alpha=\dfrac{${t3[1] * t3[1]}}{${t3[2] * t3[2]}}$. ${QS[q]} მეოთხედში $\sin\alpha${SGN[q][0] > 0 ? ">" : "<"}0$: $\sin\alpha=${t}$.`; }); }],
    [2, 6, function (r) { var t3 = r.pick(TRP), q = r.i(0, 3), w = r.pick(["tg", "ctg"]), s0 = SGN[q][0] * t3[0], c0 = SGN[q][1] * t3[1]; return QE(R`$\sin\alpha=${fracTex(s0, t3[2])}$ და $\alpha$ ${QS[q]} მეოთხედის კუთხეა. იპოვე $${FN[w][0]}\alpha$.`, w === "tg" ? s0 / c0 : c0 / s0, function (t) { return R`$\cos\alpha=${fracTex(c0, t3[2])}$; $${FN[w][0]}\alpha=${t}$.`; }); }],
    [2, 6, function (r) { var t3 = r.pick(TRP), q = r.pick([0, 2]), w = r.pick(["sin", "cos"]), s0 = SGN[q][0] * t3[0], c0 = SGN[q][1] * t3[1]; return QE(R`$${TG}\alpha=${fracTex(t3[0], t3[1])}$ და $\alpha$ ${QS[q]} მეოთხედის კუთხეა. იპოვე $${FN[w][0]}\alpha$.`, (w === "sin" ? s0 : c0) / t3[2], function (t) { return R`$\dfrac1{\cos^2\alpha}=1+${TG}^2\alpha=\dfrac{${t3[2] * t3[2]}}{${t3[1] * t3[1]}}$, ამიტომ $|\cos\alpha|=\dfrac{${t3[1]}}{${t3[2]}}$; ნიშანს მეოთხედი გვკარნახობს: $${FN[w][0]}\alpha=${t}$.`; }); }],
    [2, 8, function (r) { var p = r.pick([[2, 1], [3, 1], [1, 2], [1, 3], [3, 4], [4, 3], [-2, 1], [2, 3], [5, 2]]), tt = p[0] / p[1]; var A = r.nz(-4, 4), B = r.nz(-4, 4), Cc = r.nz(-4, 4), D = r.nz(-4, 4); var den = Cc * tt + D; if (Math.abs(den) < 1e-9 || A * D === B * Cc) return null; var num = A * tt + B; var top = A + R`\sin\alpha` + (B < 0 ? "-" : "+") + Math.abs(B) + R`\cos\alpha`, bot = Cc + R`\sin\alpha` + (D < 0 ? "-" : "+") + Math.abs(D) + R`\cos\alpha`; top = top.replace(/^1\\/, "\\").replace(/^-1\\/, "-\\").replace(/([+-])1\\/, "$1\\"); bot = bot.replace(/^1\\/, "\\").replace(/^-1\\/, "-\\").replace(/([+-])1\\/, "$1\\"); return QE(R`$${TG}\alpha=${fracTex(p[0], p[1])}$. იპოვე $\dfrac{${top}}{${bot}}$.`, num / den, function (t) { return R`მრიცხველი და მნიშვნელი გავყოთ $\cos\alpha$-ზე: $\dfrac{${A}${TG}\alpha${B < 0 ? "-" : "+"}${Math.abs(B)}}{${Cc}${TG}\alpha${D < 0 ? "-" : "+"}${Math.abs(D)}}=${t}$.`; }); }],
    [3, 5, function (r, v) { var m = [[1, 2], [1, 3], [2, 3], [3, 4], [1, 5], [6, 5], [7, 5], [5, 4]][v]; var x = m[0] / m[1]; return QE(R`$\sin\alpha+\cos\alpha=${fracTex(m[0], m[1])}$. იპოვე $\sin\alpha\cos\alpha$.`, (x * x - 1) / 2, function (t) { return R`კვადრატში აყვანით: $1+2\sin\alpha\cos\alpha=${fracTex(m[0] * m[0], m[1] * m[1])}$, საიდანაც $\sin\alpha\cos\alpha=${t}$.`; }); }],
    [3, 4, function (r, v) { var m = [[1, 2], [1, 3], [3, 5], [1, 4]][v]; var x = m[0] / m[1]; return QE(R`$\sin\alpha-\cos\alpha=${fracTex(m[0], m[1])}$. იპოვე $\sin\alpha\cos\alpha$.`, (1 - x * x) / 2, function (t) { return R`კვადრატში აყვანით: $1-2\sin\alpha\cos\alpha=${fracTex(m[0] * m[0], m[1] * m[1])}$, საიდანაც $\sin\alpha\cos\alpha=${t}$.`; }); }],
    [2, 4, function (r, v) { var k = v + 3; return QN(R`$${TG}\alpha+${CTG}\alpha=${k}$. იპოვე $${TG}^2\alpha+${CTG}^2\alpha$.`, k * k - 2, R`$(${TG}\alpha+${CTG}\alpha)^2=${TG}^2\alpha+2+${CTG}^2\alpha$, რადგან $${TG}\alpha\cdot${CTG}\alpha=1$. ამიტომ $${k * k}-2=${k * k - 2}$.`); }],
    [2, 5, function (r, v) { var k = [[2, 1], [3, 1], [1, 2], [3, 4], [1, 3]][v], w = v % 2; var t = k[0] / k[1]; return QE(w ? R`$${TG}\alpha=${fracTex(k[0], k[1])}$. იპოვე $\sin^2\alpha$.` : R`$${TG}\alpha=${fracTex(k[0], k[1])}$. იპოვე $\cos^2\alpha$.`, w ? (t * t) / (1 + t * t) : 1 / (1 + t * t), function (x) { return R`$\cos^2\alpha=\dfrac1{1+${TG}^2\alpha}$${w ? R`, $\sin^2\alpha=1-\cos^2\alpha$` : ""}; პასუხი $${x}$.`; }); }],
    [3, 4, function (r, v) { var p = [[1, 4], [1, 3], [-1, 4], [2, 5]][v], x = p[0] / p[1], w = v % 2; return QE(w ? R`$\sin\alpha\cos\alpha=${fracTex(p[0], p[1])}$. იპოვე $\sin^4\alpha+\cos^4\alpha$.` : R`$\sin\alpha\cos\alpha=${fracTex(p[0], p[1])}$. იპოვე $(\sin\alpha+\cos\alpha)^2$.`, w ? 1 - 2 * x * x : 1 + 2 * x, function (t) { return w ? R`$\sin^4\alpha+\cos^4\alpha=(\sin^2\alpha+\cos^2\alpha)^2-2\sin^2\alpha\cos^2\alpha=${t}$.` : R`$(\sin\alpha+\cos\alpha)^2=1+2\sin\alpha\cos\alpha=${t}$.`; }); }]
  ].concat(bankTemplates("c1s3", 10)));

  /* ================= c1s4 · parity and periodicity ================= */
  var PD = [30, 45, 60, 120, 135, 150];
  var PERIODS = [
    [R`y=\sin(${"K"}x)`, function (k) { return (2 * PI) / k; }, R`T=\dfrac{2\pi}{k}`],
    [R`y=\cos(${"K"}x)`, function (k) { return (2 * PI) / k; }, R`T=\dfrac{2\pi}{k}`],
    [R`y=${TG}(${"K"}x)`, function (k) { return PI / k; }, R`T=\dfrac{\pi}{k}`],
    [R`y=\cos\dfrac{x}{${"K"}}`, function (k) { return 2 * PI * k; }, R`T=\dfrac{2\pi}{1/k}=2\pi k`],
    [R`y=3\sin\left(${"K"}x-\dfrac\pi4\right)+1`, function (k) { return (2 * PI) / k; }, R`ამპლიტუდა და წანაცვლება პერიოდს არ ცვლის: $T=\dfrac{2\pi}{k}$`],
    [R`y=${CTG}\dfrac{x}{${"K"}}`, function (k) { return PI * k; }, R`T=\pi k`]
  ];
  var PARITY = [[R`y=x^2+\cos x`, 0], [R`y=x\sin x`, 0], [R`y=x+\sin x`, 1], [R`y=\sin x\cos x`, 1], [R`y=\cos x-x^2`, 0], [R`y=x^3\cos x`, 1], [R`y=\sin x+\cos x`, 2], [R`y=${TG}x+x`, 1], [R`y=\sin^2x`, 0], [R`y=\cos x+x`, 2], [R`y=\dfrac{\sin x}{x}`, 0], [R`y=x^2\,${TG}x`, 1], [R`y=|\sin x|`, 0], [R`y=\sin x+1`, 2]];
  G("c1s4", [
    [1, 8, function (r, v) { var d = at(PD, v), w = ["sin", "cos", "tg", "ctg"][v % 4]; return QE(R`იპოვე $${FN[w][0]}(${"-" + deg(d)})$.`, fv(w, -d), function (t) { return R`${w === "cos" ? R`კოსინუსი ლუწია: $\cos(-\alpha)=\cos\alpha$.` : R`$${FN[w][0]}$ კენტია: $${FN[w][0]}(-\alpha)=-${FN[w][0]}\alpha$.`} პასუხი $${t}$.`; }); }],
    [1, 8, function (r, v) { var d = at([30, 45, 60, 120, 135, 150, 210, 240], v + 3), w = ["sin", "cos", "tg"][v % 3], k = r.i(1, 3), per = w === "tg" ? 180 : 360; return QE(R`იპოვე $${FN[w][0]}\,${deg(d + per * k)}$.`, fv(w, d), function (t) { return R`პერიოდი $${deg(per)}$: $${FN[w][0]}\,${deg(d + per * k)}=${FN[w][0]}\,${deg(d)}=${t}$.`; }); }],
    [2, 8, function (r) { var j = r.pick([1, 2, 4, 5, 7, 8, 10, 11]), n = r.i(1, 3), w = r.pick(["sin", "cos", "tg"]), m = r.pick([6, 3, 4]); if (m === 3) j = r.pick([1, 2, 4, 5]); if (m === 4) j = r.pick([1, 3, 5, 7]); var top = j + 2 * m * n, d = (180 * j) / m, val = fv(w, d); if (val === null) return null; return QE(R`გამოთვალე $${FN[w][0]}\dfrac{${top}\pi}{${m}}$.`, val, function (t) { return R`$\dfrac{${top}\pi}{${m}}=${exPi(rad(d))}+${2 * n}\pi$; პერიოდის გამო $${FN[w][0]}\,${exPi(rad(d))}=${t}$.`; }); }],
    [2, 10, function (r, v) { var P = at(PERIODS, v), k = r.i(2, 6); return QP(R`იპოვე $${P[0].replace("K", k)}$ ფუნქციის უმცირესი დადებითი პერიოდი.`, P[1](k), function (t) { return R`${P[2].indexOf("$") < 0 ? "$" + P[2] + "$" : P[2]}; $T=${t}$.`; }); }],
    [2, 3, function (r, v) { var f = [[R`y=\sin^2x`, PI, R`$\sin^2x=\dfrac{1-\cos2x}2$, პერიოდი $\dfrac{2\pi}2=\pi$.`], [R`y=|\cos x|`, PI, R`მოდულით უარყოფითი ნაწილი აირეკლება, პერიოდი განახევრდება: $\pi$.`], [R`y=\sin x\cos x`, PI, R`$\sin x\cos x=\dfrac12\sin2x$, პერიოდი $\pi$.`]][v]; return QP(R`იპოვე $${f[0]}$ ფუნქციის უმცირესი დადებითი პერიოდი.`, f[1], f[2]); }],
    [3, 14, function (r, v) { var w = PARITY[v]; return Q(R`ფუნქცია ლუწია, კენტია თუ არც ერთი? $${w[0]}$`, CH([R`ლუწია`, R`კენტია`, R`არც ლუწია, არც კენტი`], w[1]), null, w[1] === 1 ? R`$f(-x)=-f(x)$, ამიტომ ფუნქცია კენტია.` : w[1] === 0 ? R`$f(-x)=f(x)$, ამიტომ ფუნქცია ლუწია.` : R`$f(-x)$ არ უდრის არც $f(x)$-ს, არც $-f(x)$-ს.`); }],
    [3, 5, function (r) { var d = r.pick([30, 45, 60]), e = r.pick([30, 45, 60]); return QE(R`გამოთვალე $\sin(-${deg(d)})+\cos(-${deg(e)})$.`, -fv("sin", d) + fv("cos", e), function (t) { return R`$-\sin${deg(d)}+\cos${deg(e)}=${t}$.`; }); }]
  ].concat(bankTemplates("c1s4", 4)));

  /* ================= c1s5 · addition formulas ================= */
  var ADD = [15, 75, 105, 165, 195, 255, 285, 345, -15, -75];
  var SUMS = [[70, 40], [50, 10], [80, 20], [100, 40], [25, 20], [35, 25], [110, 20], [40, 5], [65, 20], [130, 20], [100, 10], [160, 20], [55, 35], [140, 10]];
  G("c1s5", [
    [1, 12, function (r, v) { var d = at(ADD, v * 3), w = ["sin", "cos", "tg"][v % 3]; return QE(R`გამოთვალე $${FN[w][0]}(${deg(d)})$.`, fv(w, d), function (t) { return R`$${deg(d)}$ ჩაწერე ორი „ცხრილის" კუთხის ჯამად ან სხვაობად (მაგ. $${deg(d)}=${deg(d - 45)}+45^\circ$) და გამოიყენე შეკრების ფორმულა: $${t}$.`; }); }],
    [2, 8, function (r) { var a = r.pick(TRP), b = r.pick(TRP), w = r.pick(["s+", "s-", "c+", "c-"]); var sa = a[0] / a[2], ca = a[1] / a[2], sb = b[0] / b[2], cb = b[1] / b[2]; var val = { "s+": sa * cb + ca * sb, "s-": sa * cb - ca * sb, "c+": ca * cb - sa * sb, "c-": ca * cb + sa * sb }[w]; var f = w[0] === "s" ? R`\sin` : R`\cos`; return QE(R`$\sin\alpha=${fracTex(a[0], a[2])}$, $\sin\beta=${fracTex(b[0], b[2])}$, $\alpha$ და $\beta$ მახვილი კუთხეებია. იპოვე $${f}(\alpha${w[1]}\beta)$.`, val, function (t) { return R`$\cos\alpha=${fracTex(a[1], a[2])}$, $\cos\beta=${fracTex(b[1], b[2])}$. შეკრების ფორმულით მივიღებთ $${t}$.`; }); }],
    [2, 6, function (r) { var a = r.pick([[1, 2], [1, 3], [2, 1], [3, 1], [3, 4], [1, 4], [2, 3], [1, 5]]), b = r.pick([[1, 2], [1, 3], [2, 1], [1, 4], [1, 5], [3, 2]]), plus = r.i(0, 1); var ta = a[0] / a[1], tb = b[0] / b[1]; var den = plus ? 1 - ta * tb : 1 + ta * tb; if (Math.abs(den) < 1e-9) return null; return QE(R`$${TG}\alpha=${fracTex(a[0], a[1])}$, $${TG}\beta=${fracTex(b[0], b[1])}$. იპოვე $${TG}(\alpha${plus ? "+" : "-"}\beta)$.`, plus ? (ta + tb) / den : (ta - tb) / den, function (t) { return R`$${TG}(\alpha\pm\beta)=\dfrac{${TG}\alpha\pm${TG}\beta}{1\mp${TG}\alpha\,${TG}\beta}=${t}$.`; }); }],
    [2, 6, function (r) { var a = r.pick(TRP.slice(0, 4)), b = r.pick([30, 45, 60]), w = r.pick(["sin", "cos"]), sg = r.pick([1, -1]); var sa = a[0] / a[2], ca = a[1] / a[2], sb = fv("sin", b), cb = fv("cos", b); var val = w === "sin" ? sa * cb + sg * ca * sb : ca * cb - sg * sa * sb; return QE(R`$\sin\alpha=${fracTex(a[0], a[2])}$ ($\alpha$ მახვილია). იპოვე $${FN[w][0]}(\alpha${sg > 0 ? "+" : "-"}${deg(b)})$.`, val, function (t) { return R`$\cos\alpha=${fracTex(a[1], a[2])}$; შეკრების ფორმულით: $${t}$.`; }); }],
    [1, 8, function (r, v) { var p = at(SUMS, v), plus = (p[0] + p[1]) % 15 === 0 && v % 2 === 0; var res = plus ? p[0] + p[1] : p[0] - p[1]; if (res % 15) { plus = !plus; res = plus ? p[0] + p[1] : p[0] - p[1]; } if (res % 15) return null; return QE(R`გამოთვალე $\sin${deg(p[0])}\cos${deg(p[1])}${plus ? "+" : "-"}\cos${deg(p[0])}\sin${deg(p[1])}$.`, fv("sin", res), function (t) { return R`ეს $\sin(${deg(p[0])}${plus ? "+" : "-"}${deg(p[1])})=\sin${deg(res)}=${t}$.`; }); }],
    [1, 8, function (r, v) { var p = at(SUMS, v + 5), plus = v % 2 === 1; var res = plus ? p[0] + p[1] : p[0] - p[1]; if (res % 15) { plus = !plus; res = plus ? p[0] + p[1] : p[0] - p[1]; } if (res % 15) return null; return QE(R`გამოთვალე $\cos${deg(p[0])}\cos${deg(p[1])}${plus ? "-" : "+"}\sin${deg(p[0])}\sin${deg(p[1])}$.`, fv("cos", res), function (t) { return R`ეს $\cos(${deg(p[0])}${plus ? "+" : "-"}${deg(p[1])})=\cos${deg(res)}=${t}$.`; }); }],
    [2, 5, function (r, v) { var p = [[20, 25], [10, 35], [70, 50], [40, 20], [35, 25]][v]; var res = p[0] + p[1]; return QE(R`გამოთვალე $\dfrac{${TG}${deg(p[0])}+${TG}${deg(p[1])}}{1-${TG}${deg(p[0])}\,${TG}${deg(p[1])}}$.`, fv("tg", res), function (t) { return R`ეს $${TG}(${deg(p[0])}+${deg(p[1])})=${TG}${deg(res)}=${t}$.`; }); }],
    [3, 5, function (r, v) { var p = [[[1, 2], [1, 3]], [[2, 1], [3, 1]], [[1, 4], [3, 5]], [[1, 7], [3, 4]], [[2, 3], [1, 5]]][v]; var ta = p[0][0] / p[0][1], tb = p[1][0] / p[1][1], sum = Math.atan(ta) + Math.atan(tb); return QP(R`$${TG}\alpha=${fracTex(p[0][0], p[0][1])}$, $${TG}\beta=${fracTex(p[1][0], p[1][1])}$, $\alpha$ და $\beta$ მახვილი კუთხეებია. იპოვე $\alpha+\beta$.`, sum, function (t) { return R`$${TG}(\alpha+\beta)=\dfrac{${TG}\alpha+${TG}\beta}{1-${TG}\alpha\,${TG}\beta}=${ex(Math.tan(sum))}$, და $0<\alpha+\beta<\pi$, ამიტომ $\alpha+\beta=${t}$.`; }); }]
  ].concat(bankTemplates("c1s5", 6)));

  /* ================= c1s6 · reduction formulas ================= */
  var RED = [120, 135, 150, 210, 225, 240, 300, 315, 330, 390, 405, 480, 510, 570, 600, 690, -120, -135, -210, -300];
  var REDF = [
    [R`\sin\left(\dfrac\pi2+\alpha\right)`, "c"], [R`\cos\left(\dfrac\pi2+\alpha\right)`, "-s"], [R`\sin(\pi-\alpha)`, "s"], [R`\cos(\pi-\alpha)`, "-c"],
    [R`\sin(\pi+\alpha)`, "-s"], [R`\cos(\pi+\alpha)`, "-c"], [R`\sin\left(\dfrac{3\pi}2-\alpha\right)`, "-c"], [R`\cos\left(\dfrac{3\pi}2+\alpha\right)`, "s"],
    [R`${TG}(\pi-\alpha)`, "-t"], [R`${TG}\left(\dfrac\pi2+\alpha\right)`, "-k"], [R`${CTG}\left(\dfrac{3\pi}2-\alpha\right)`, "t"], [R`\cos(2\pi-\alpha)`, "c"], [R`\sin(2\pi-\alpha)`, "-s"], [R`${CTG}(\pi+\alpha)`, "k"]
  ];
  G("c1s6", [
    [1, 14, function (r, v) { var d = at(RED, v * 3), w = ["sin", "cos", "tg", "ctg"][v % 4], val = fv(w, d); if (val === null) return null; return QE(R`იპოვე $${FN[w][0]}(${deg(d)})$.`, val, function (t) { return R`დაყვანის ფორმულებით მივიყვანოთ მახვილ კუთხეზე და ნიშანი ავიღოთ მეოთხედის მიხედვით: $${t}$.`; }); }],
    [2, 6, function (r) { var k = r.pick([[7, 6], [5, 4], [4, 3], [5, 3], [7, 4], [11, 6], [2, 3], [3, 4], [5, 6]]), w = r.pick(["sin", "cos", "tg", "ctg"]), d = (180 * k[0]) / k[1], val = fv(w, d); return QE(R`გამოთვალე $${FN[w][0]}\dfrac{${k[0]}\pi}{${k[1]}}$.`, val, function (t) { return R`$\dfrac{${k[0]}\pi}{${k[1]}}=${deg(d)}$; დაყვანის ფორმულით $${t}$.`; }); }],
    [2, 12, function (r, v) { var f = at(REDF, v), t3 = r.pick(TRP), sa = t3[0] / t3[2], ca = t3[1] / t3[2]; var val = { c: ca, "-c": -ca, s: sa, "-s": -sa, t: sa / ca, "-t": -sa / ca, k: ca / sa, "-k": -ca / sa }[f[1]]; return QE(R`$\sin\alpha=${fracTex(t3[0], t3[2])}$, $\alpha$ მახვილი კუთხეა. იპოვე $${f[0]}$.`, val, function (t) { return R`$\cos\alpha=${fracTex(t3[1], t3[2])}$. დაყვანის ფორმულით $${f[0]}=${tx(RS[f[1]][0])}=${t}$.`; }); }],
    [2, 5, function (r) { var d = r.pick([30, 45, 60]), e = r.pick([30, 45, 60]); return QE(R`გამოთვალე $\sin${deg(180 - d)}+\cos${deg(180 + e)}$.`, fv("sin", d) - fv("cos", e), function (t) { return R`$\sin(180^\circ-\alpha)=\sin\alpha$, $\cos(180^\circ+\beta)=-\cos\beta$: $\sin${deg(d)}-\cos${deg(e)}=${t}$.`; }); }],
    [3, 6, function (r) { var a = r.pick([150, 210, 240, 300, 330, 135]), b = r.pick([120, 225, 300, 315, 330]), c = r.pick([135, 225, 315, 120, 240]); var val = fv("sin", a) * fv("cos", b) + fv("tg", c); return QE(R`გამოთვალე $\sin${deg(a)}\cos${deg(b)}+${TG}\,${deg(c)}$.`, val, function (t) { return R`$\sin${deg(a)}=${ex(fv("sin", a))}$, $\cos${deg(b)}=${ex(fv("cos", b))}$, $${TG}\,${deg(c)}=${ex(fv("tg", c))}$. შედეგი $${t}$.`; }); }]
  ].concat(bankTemplates("c1s6", 8)));

  /* ================= c1s7 · double and half angle (no triple angle) ================= */
  var HALF = [[R`\sin^2\dfrac{\pi}{8}`, Math.pow(S(PI / 8), 2), R`\dfrac{1-\cos\frac\pi4}{2}`], [R`\cos^2\dfrac{\pi}{8}`, Math.pow(C(PI / 8), 2), R`\dfrac{1+\cos\frac\pi4}{2}`], [R`${TG}\dfrac{\pi}{8}`, T(PI / 8), R`\dfrac{1-\cos\frac\pi4}{\sin\frac\pi4}`], [R`\sin^2\dfrac{\pi}{12}`, Math.pow(S(PI / 12), 2), R`\dfrac{1-\cos\frac\pi6}{2}`], [R`\cos^2\dfrac{\pi}{12}`, Math.pow(C(PI / 12), 2), R`\dfrac{1+\cos\frac\pi6}{2}`], [R`${TG}\dfrac{\pi}{12}`, T(PI / 12), R`\dfrac{1-\cos\frac\pi6}{\sin\frac\pi6}`], [R`${TG}\dfrac{5\pi}{12}`, T((5 * PI) / 12), R`\dfrac{1-\cos\frac{5\pi}6}{\sin\frac{5\pi}6}`], [R`${CTG}\dfrac{\pi}{8}`, K(PI / 8), R`\dfrac{1+\cos\frac\pi4}{\sin\frac\pi4}`]];
  G("c1s7", [
    [1, 8, function (r) { var t3 = r.pick(TRP), q = r.pick([0, 1]), s0 = t3[0], c0 = (q ? -1 : 1) * t3[1]; return QE(R`$\sin\alpha=${fracTex(s0, t3[2])}$, $\alpha$ ${QS[q]} მეოთხედის კუთხეა. იპოვე $\sin2\alpha$.`, (2 * s0 * c0) / (t3[2] * t3[2]), function (t) { return R`$\cos\alpha=${fracTex(c0, t3[2])}$, $\sin2\alpha=2\sin\alpha\cos\alpha=${t}$.`; }); }],
    [1, 6, function (r) { var t3 = r.pick(TRP), w = r.i(0, 1); var x = t3[0] / t3[2]; return QE(R`$${w ? R`\cos` : R`\sin`}\alpha=${fracTex(t3[0], t3[2])}$. იპოვე $\cos2\alpha$.`, w ? 2 * x * x - 1 : 1 - 2 * x * x, function (t) { return w ? R`$\cos2\alpha=2\cos^2\alpha-1=${t}$.` : R`$\cos2\alpha=1-2\sin^2\alpha=${t}$.`; }); }],
    [2, 6, function (r) { var k = r.pick([[1, 2], [1, 3], [2, 1], [3, 1], [3, 4], [2, 3], [1, 4], [-1, 2], [-2, 1]]); var t0 = k[0] / k[1]; if (Math.abs(1 - t0 * t0) < 1e-9) return null; return QE(R`$${TG}\alpha=${fracTex(k[0], k[1])}$. იპოვე $${TG}2\alpha$.`, (2 * t0) / (1 - t0 * t0), function (t) { return R`$${TG}2\alpha=\dfrac{2${TG}\alpha}{1-${TG}^2\alpha}=${t}$.`; }); }],
    [1, 10, function (r, v) { var d = at([15, 75, 105, 165, 30, 60, 120, 150], v), f = v % 5, d2 = deg(2 * d); var forms = [[R`2\sin${deg(d)}\cos${deg(d)}`, fv("sin", 2 * d), R`\sin2\alpha`, R`\sin${d2}`], [R`\cos^2${deg(d)}-\sin^2${deg(d)}`, fv("cos", 2 * d), R`\cos2\alpha`, R`\cos${d2}`], [R`2\cos^2${deg(d)}-1`, fv("cos", 2 * d), R`\cos2\alpha`, R`\cos${d2}`], [R`1-2\sin^2${deg(d)}`, fv("cos", 2 * d), R`\cos2\alpha`, R`\cos${d2}`], [R`\dfrac{2${TG}${deg(d)}}{1-${TG}^2${deg(d)}}`, fv("tg", 2 * d), R`${TG}2\alpha`, R`${TG}${d2}`]]; var F0 = forms[f]; if (F0[1] === null) return null; return QE(R`გამოთვალე $${F0[0]}$.`, F0[1], function (t) { return R`ეს $${F0[2]}$-ის ფორმულაა $\alpha=${deg(d)}$-ისთვის: $${F0[3]}=${t}$.`; }); }],
    [2, 4, function (r, v) { var d = [15, 75, 105, 165][v]; return QE(R`გამოთვალე $\sin${deg(d)}\cos${deg(d)}$.`, fv("sin", d) * fv("cos", d), function (t) { return R`$\sin\alpha\cos\alpha=\dfrac12\sin2\alpha=\dfrac12\sin${deg(2 * d)}=${t}$.`; }); }],
    [2, 6, function (r) { var c0 = r.pick([[7, 25], [1, 2], [1, 3], [1, 9], [-7, 25], [119, 169], [1, 8], [-1, 8]]), w = r.pick(["sin", "cos", "tg"]); var c = c0[0] / c0[1]; var val = { sin: Math.sqrt((1 - c) / 2), cos: Math.sqrt((1 + c) / 2), tg: Math.sqrt((1 - c) / (1 + c)) }[w]; return QE(R`$\cos\alpha=${fracTex(c0[0], c0[1])}$ და $0<\alpha<\pi$. იპოვე $${FN[w][0]}\dfrac{\alpha}{2}$.`, val, function (t) { return R`$0<\dfrac\alpha2<\dfrac\pi2$, ამიტომ ნიშანი დადებითია. ${w === "sin" ? R`$\sin\dfrac\alpha2=\sqrt{\dfrac{1-\cos\alpha}2}$` : w === "cos" ? R`$\cos\dfrac\alpha2=\sqrt{\dfrac{1+\cos\alpha}2}$` : R`$${TG}\dfrac\alpha2=\sqrt{\dfrac{1-\cos\alpha}{1+\cos\alpha}}$`}$=${t}$.`; }); }],
    [2, 4, function (r) { var t3 = r.pick(TRP); return QE(R`$\sin\alpha=${fracTex(t3[0], t3[2])}$, $\cos\alpha=${fracTex(t3[1], t3[2])}$. იპოვე $${TG}\dfrac{\alpha}{2}$.`, t3[0] / (t3[2] + t3[1]), function (t) { return R`$${TG}\dfrac\alpha2=\dfrac{\sin\alpha}{1+\cos\alpha}=${t}$.`; }); }],
    [3, 4, function (r, v) { var m = [[1, 2], [1, 3], [7, 5], [6, 5]][v], x = m[0] / m[1]; return QE(R`$\sin\alpha+\cos\alpha=${fracTex(m[0], m[1])}$. იპოვე $\sin2\alpha$.`, x * x - 1, function (t) { return R`$(\sin\alpha+\cos\alpha)^2=1+\sin2\alpha$, ამიტომ $\sin2\alpha=${fracTex(m[0] * m[0], m[1] * m[1])}-1=${t}$.`; }); }],
    [3, 6, function (r) { var k = r.pick([[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [1, 5]]), w = r.i(0, 1), t0 = k[0] / k[1]; return QE(R`$${TG}\alpha=${fracTex(k[0], k[1])}$. იპოვე $${w ? R`\cos2\alpha` : R`\sin2\alpha`}$.`, w ? (1 - t0 * t0) / (1 + t0 * t0) : (2 * t0) / (1 + t0 * t0), function (t) { return w ? R`$\cos2\alpha=\dfrac{1-${TG}^2\alpha}{1+${TG}^2\alpha}=${t}$.` : R`$\sin2\alpha=\dfrac{2${TG}\alpha}{1+${TG}^2\alpha}=${t}$.`; }); }],
    [3, 8, function (r, v) { var h = HALF[v]; return QE(R`გამოთვალე $${h[0]}$.`, h[1], function (t) { return R`ნახევარი კუთხის ფორმულით: $${h[0]}=${h[2]}=${t}$.`; }); }]
  ].concat(bankTemplates("c1s7", 10)));

  /* ================= c1s8 · sum ↔ product ================= */
  var SP = [[75, 15], [105, 15], [105, 75], [165, 15], [165, 75], [165, 105], [135, 15], [135, 75], [105, 45], [75, 45], [165, 45], [195, 15]];
  var RATIO = [[50, 10], [70, 50], [80, 10], [100, 20], [110, 10], [40, 20], [130, 20], [100, 50], [25, 5], [35, 25]];
  G("c1s8", [
    [1, 12, function (r, v) { var p = at(SP, v), w = v % 4; var forms = [[R`\sin${deg(p[0])}+\sin${deg(p[1])}`, fv("sin", p[0]) + fv("sin", p[1]), R`2\sin${deg((p[0] + p[1]) / 2)}\cos${deg((p[0] - p[1]) / 2)}`], [R`\sin${deg(p[0])}-\sin${deg(p[1])}`, fv("sin", p[0]) - fv("sin", p[1]), R`2\cos${deg((p[0] + p[1]) / 2)}\sin${deg((p[0] - p[1]) / 2)}`], [R`\cos${deg(p[0])}+\cos${deg(p[1])}`, fv("cos", p[0]) + fv("cos", p[1]), R`2\cos${deg((p[0] + p[1]) / 2)}\cos${deg((p[0] - p[1]) / 2)}`], [R`\cos${deg(p[1])}-\cos${deg(p[0])}`, fv("cos", p[1]) - fv("cos", p[0]), R`2\sin${deg((p[0] + p[1]) / 2)}\sin${deg((p[0] - p[1]) / 2)}`]]; var f = forms[w]; return QE(R`გამოთვალე ნამრავლად გარდაქმნით: $${f[0]}$.`, f[1], function (t) { return R`$${f[0]}=${f[2]}=${t}$.`; }); }],
    [2, 9, function (r, v) { var p = at(SP, v + 3), w = v % 3; var forms = [[R`\sin${deg(p[0])}\cos${deg(p[1])}`, fv("sin", p[0]) * fv("cos", p[1]), R`\dfrac12\left(\sin${deg(p[0] + p[1])}+\sin${deg(p[0] - p[1])}\right)`], [R`\cos${deg(p[0])}\cos${deg(p[1])}`, fv("cos", p[0]) * fv("cos", p[1]), R`\dfrac12\left(\cos${deg(p[0] - p[1])}+\cos${deg(p[0] + p[1])}\right)`], [R`\sin${deg(p[0])}\sin${deg(p[1])}`, fv("sin", p[0]) * fv("sin", p[1]), R`\dfrac12\left(\cos${deg(p[0] - p[1])}-\cos${deg(p[0] + p[1])}\right)`]]; var f = forms[w]; return QE(R`გამოთვალე ჯამად გარდაქმნით: $${f[0]}$.`, f[1], function (t) { return R`$${f[0]}=${f[2]}=${t}$.`; }); }],
    [2, 6, function (r, v) { var p = at(RATIO, v * 3); return QE(R`გამოთვალე $\dfrac{\sin${deg(p[0])}+\sin${deg(p[1])}}{\cos${deg(p[0])}+\cos${deg(p[1])}}$.`, fv("tg", (p[0] + p[1]) / 2), function (t) { return R`შეფარდება $=\dfrac{2\sin\frac{A+B}2\cos\frac{A-B}2}{2\cos\frac{A+B}2\cos\frac{A-B}2}=${TG}${deg((p[0] + p[1]) / 2)}=${t}$.`; }); }],
    [3, 6, function (r, v) { var e = [[R`\cos${deg(80)}+\cos${deg(40)}-\cos${deg(20)}`, R`2\cos60^\circ\cos20^\circ-\cos20^\circ=0`], [R`\sin${deg(20)}+\sin${deg(40)}-\sin${deg(80)}`, R`2\sin30^\circ\cos10^\circ-\cos10^\circ=0`], [R`\cos${deg(20)}+\cos${deg(100)}+\cos${deg(140)}`, R`\cos100^\circ+\cos140^\circ=2\cos120^\circ\cos20^\circ=-\cos20^\circ`], [R`\sin${deg(10)}+\sin${deg(50)}-\sin${deg(70)}`, R`\sin50^\circ-\sin10^\circ=2\cos30^\circ\sin20^\circ`], [R`\cos${deg(70)}+\cos${deg(50)}-\cos${deg(10)}`, R`2\cos60^\circ\cos10^\circ-\cos10^\circ=0`], [R`\sin${deg(80)}-\sin${deg(20)}-\sin${deg(40)}`, R`\sin80^\circ-\sin20^\circ=2\cos50^\circ\sin30^\circ=\sin40^\circ`]][v]; var vals = [C(rad(80)) + C(rad(40)) - C(rad(20)), S(rad(20)) + S(rad(40)) - S(rad(80)), C(rad(20)) + C(rad(100)) + C(rad(140)), S(rad(10)) + S(rad(50)) - S(rad(70)), C(rad(70)) + C(rad(50)) - C(rad(10)), S(rad(80)) - S(rad(20)) - S(rad(40))]; var val = vals[v]; if (Math.abs(val) > 1e-9) return null; return QN(R`გამოთვალე $${e[0]}$.`, 0, R`$${e[1]}$, ამიტომ პასუხია $0$.`); }]
  ].concat(bankTemplates("c1s8", 0)));

  /* ================= c1s9 · graphs and properties ================= */
  G("c1s9", [
    [1, 5, function (r) { var a = r.i(2, 6), c = r.nz(-4, 4); return QN(R`იპოვე $y=${a}\sin x${c < 0 ? "-" : "+"}${Math.abs(c)}$ ფუნქციის უდიდესი მნიშვნელობა.`, a + c, R`$\sin x$-ის უდიდესი მნიშვნელობა $1$-ია: $${a}${c < 0 ? "-" : "+"}${Math.abs(c)}=${a + c}$.`); }],
    [1, 5, function (r) { var a = r.i(2, 6), c = r.nz(-4, 4); return QN(R`იპოვე $y=${a}\cos x${c < 0 ? "-" : "+"}${Math.abs(c)}$ ფუნქციის უმცირესი მნიშვნელობა.`, c - a, R`$\cos x$-ის უმცირესი მნიშვნელობა $-1$-ია: $-${a}${c < 0 ? "-" : "+"}${Math.abs(c)}=${c - a}$.`); }],
    [2, 6, function (r, v) { var k = v + 2, w = v % 2; return QP(R`იპოვე $y=${w ? R`\cos` : R`\sin`}(${k}x)$ ფუნქციის უმცირესი დადებითი პერიოდი.`, (2 * PI) / k, function (t) { return R`$T=\dfrac{2\pi}{${k}}=${t}$.`; }); }],
    [2, 5, function (r) { var a = r.i(2, 7), c = r.i(-3, 5); return Q(R`იპოვე $y=${a}\cos x${c < 0 ? "-" : c > 0 ? "+" : ""}${c ? Math.abs(c) : ""}$ ფუნქციის მნიშვნელობათა სიმრავლე.`, IV("[" + (c - a) + ";" + (c + a) + "]"), R`$[${c - a};\ ${c + a}]$`, R`$-1\le\cos x\le1$, ამიტომ $${c - a}\le y\le${c + a}$.`); }],
    [2, 4, function (r, v) { var k = v + 1; return QN(R`რამდენი ნული აქვს $y=\sin(${k}x)$ ფუნქციას $[0;\ 2\pi]$ მონაკვეთზე (ბოლოების ჩათვლით)?`, 2 * k + 1, R`$${k}x=\pi n$, $x=\dfrac{\pi n}{${k}}$, $n=0,1,\dots,${2 * k}$ — სულ $${2 * k + 1}$.`); }],
    [2, 4, function (r, v) { var k = v + 1; return QN(R`რამდენი ნული აქვს $y=\cos(${k}x)$ ფუნქციას $[0;\ 2\pi]$ მონაკვეთზე?`, 2 * k, R`$${k}x=\dfrac\pi2+\pi n$, $x=\dfrac{\pi(2n+1)}{${2 * k}}$, $n=0,\dots,${2 * k - 1}$ — სულ $${2 * k}$.`); }],
    [3, 4, function (r, v) { var d = [3, 4, 6, 3][v], right = v % 2 === 0; return Q(R`$y=\sin\left(x${right ? "-" : "+"}\dfrac\pi${d}\right)$ ფუნქციის გრაფიკი $y=\sin x$-ის გრაფიკიდან მიიღება:`, CH([R`$\dfrac\pi${d}$-ით მარჯვნივ გადატანით`, R`$\dfrac\pi${d}$-ით მარცხნივ გადატანით`, R`$\dfrac\pi${d}$-ით ზევით გადატანით`, R`$\dfrac\pi${d}$-ით ქვევით გადატანით`], right ? 0 : 1), null, right ? R`$f(x-a)$ გრაფიკი $a$-თი მარჯვნივ გადაინაცვლებს.` : R`$f(x+a)$ გრაფიკი $a$-თი მარცხნივ გადაინაცვლებს.`); }],
    [3, 6, function (r, v) { var w = [[R`$y=\sin x$ ზრდადია $\left[0;\ \dfrac\pi2\right]$-ზე`, 0], [R`$y=\cos x$ ზრდადია $[0;\ \pi]$-ზე`, 1], [R`$y=\cos x$ კლებადია $[0;\ \pi]$-ზე`, 0], [R`$y=\sin x$ კლებადია $\left[\dfrac\pi2;\ \dfrac{3\pi}2\right]$-ზე`, 0], [R`$y=\sin x$ ზრდადია $\left[\dfrac\pi2;\ \pi\right]$-ზე`, 1], [R`$y=${TG}x$ ზრდადია $\left(-\dfrac\pi2;\ \dfrac\pi2\right)$-ზე`, 0]][v]; return Q(R`ჭეშმარიტია თუ არა: ${w[0]}?`, CH([R`ჭეშმარიტია`, R`მცდარია`], w[1]), null, w[1] ? R`მტკიცება მცდარია — შეხედე გრაფიკს ერთეულოვან წრეწირზე.` : R`მტკიცება ჭეშმარიტია.`); }],
    [3, 6, function (r, v) { var ab = [[3, 4], [1, 1], [5, 12], [1, 2], [2, 3], [6, 8]][v]; return QE(R`იპოვე $y=${ab[0] === 1 ? "" : ab[0]}\sin x+${ab[1] === 1 ? "" : ab[1]}\cos x$ ფუნქციის უდიდესი მნიშვნელობა.`, Math.hypot(ab[0], ab[1]), function (t) { return R`$a\sin x+b\cos x=\sqrt{a^2+b^2}\,\sin(x+\varphi)$, ამიტომ უდიდესი მნიშვნელობაა $\sqrt{${ab[0] * ab[0]}+${ab[1] * ab[1]}}=${t}$.`; }); }],
    [2, 6, function (r) { var a = r.i(2, 4), ph = r.pick([[1, 6], [1, 3], [1, 4]]), x0 = r.pick([[1, 2], [1, 1], [1, 3], [2, 3], [5, 6]]); var arg = (x0[0] / x0[1] - ph[0] / ph[1]) * PI; return QE(R`გამოთვალე $y=${a}\sin\left(x-${exPi((ph[0] / ph[1]) * PI)}\right)$ ფუნქციის მნიშვნელობა $x=${exPi((x0[0] / x0[1]) * PI)}$ წერტილში.`, a * S(arg), function (t) { return R`$y=${a}\sin${exPi(arg)}=${t}$.`; }); }],
    [3, 3, function (r, v) { var f = [[R`y=\sin x\cos x`, 0.5, R`$\sin x\cos x=\dfrac12\sin2x\le\dfrac12$.`], [R`y=\sin^2x-\cos^2x`, 1, R`$\sin^2x-\cos^2x=-\cos2x\le1$.`], [R`y=\sqrt3\sin x+\cos x`, 2, R`$\sqrt3\sin x+\cos x=2\sin\left(x+\dfrac\pi6\right)\le2$.`]][v]; return QE(R`იპოვე $${f[0]}$ ფუნქციის უდიდესი მნიშვნელობა.`, f[1], f[2]); }]
  ]);

  /* ================= c1s10 · inverse functions ================= */
  var AS = [[R`\dfrac12`, 30], [R`\dfrac{\sqrt2}2`, 45], [R`\dfrac{\sqrt3}2`, 60], [R`0`, 0], [R`1`, 90], [R`-\dfrac12`, -30], [R`-\dfrac{\sqrt2}2`, -45], [R`-\dfrac{\sqrt3}2`, -60], [R`-1`, -90]];
  var AC = [[R`\dfrac12`, 60], [R`\dfrac{\sqrt2}2`, 45], [R`\dfrac{\sqrt3}2`, 30], [R`0`, 90], [R`1`, 0], [R`-\dfrac12`, 120], [R`-\dfrac{\sqrt2}2`, 135], [R`-\dfrac{\sqrt3}2`, 150], [R`-1`, 180]];
  var AT = [[R`1`, 45], [R`\sqrt3`, 60], [R`\dfrac{\sqrt3}3`, 30], [R`-1`, -45], [R`-\sqrt3`, -60], [R`-\dfrac{\sqrt3}3`, -30]];
  G("c1s10", [
    [1, 8, function (r, v) { var a = AS[v]; return QP(R`გამოთვალე $\arcsin\left(${a[0]}\right)$.`, rad(a[1]), function (t) { return R`$\sin\left(${t}\right)=${a[0]}$ და $${t}\in\left[-\dfrac\pi2;\ \dfrac\pi2\right]$.`; }); }],
    [1, 8, function (r, v) { var a = AC[v]; return QP(R`გამოთვალე $\arccos\left(${a[0]}\right)$.`, rad(a[1]), function (t) { return R`$\cos\left(${t}\right)=${a[0]}$ და $${t}\in[0;\ \pi]$.`; }); }],
    [2, 6, function (r, v) { var a = AT[v]; return QP(R`გამოთვალე $\operatorname{arctg}\left(${a[0]}\right)$.`, rad(a[1]), function (t) { return R`$${TG}\left(${t}\right)=${a[0]}$ და $${t}\in\left(-\dfrac\pi2;\ \dfrac\pi2\right)$.`; }); }],
    [2, 10, function (r, v) { var t3 = at(TRP, v), forms = [[R`\sin\left(\arccos${fracTex(t3[0], t3[2])}\right)`, t3[1] / t3[2]], [R`\cos\left(\arcsin${fracTex(t3[0], t3[2])}\right)`, t3[1] / t3[2]], [R`${TG}\left(\arcsin${fracTex(t3[0], t3[2])}\right)`, t3[0] / t3[1]], [R`${TG}\left(\arccos${fracTex(t3[0], t3[2])}\right)`, t3[1] / t3[0]], [R`${CTG}\left(\arcsin${fracTex(t3[1], t3[2])}\right)`, t3[0] / t3[1]]]; var f = forms[v % 5]; return QE(R`გამოთვალე $${f[0]}$.`, f[1], function (t) { return R`აღვნიშნოთ კუთხე $\varphi$-თი (ის მახვილია); მეორე ფუნქცია ვიპოვოთ $\sin^2\varphi+\cos^2\varphi=1$-დან: $${t}$.`; }); }],
    [2, 4, function (r, v) { var t3 = at(TRP, v + 1), w = v % 2; var s0 = t3[0] / t3[2]; return QE(w ? R`გამოთვალე $\cos\left(2\arccos${fracTex(t3[0], t3[2])}\right)$.` : R`გამოთვალე $\sin\left(2\arcsin${fracTex(t3[0], t3[2])}\right)$.`, w ? 2 * s0 * s0 - 1 : 2 * s0 * (t3[1] / t3[2]), function (t) { return w ? R`$\cos2\varphi=2\cos^2\varphi-1=${t}$.` : R`$\sin2\varphi=2\sin\varphi\cos\varphi=2\cdot${fracTex(t3[0], t3[2])}\cdot${fracTex(t3[1], t3[2])}=${t}$.`; }); }],
    [3, 5, function (r, v) { var d = [[150, 30], [120, 60], [135, 45], [210, -30], [240, -60]][v]; return QP(R`გამოთვალე $\arcsin\left(\sin${deg(d[0])}\right)$.`, rad(d[1]), function (t) { return R`$\sin${deg(d[0])}=\sin${d[1] < 0 ? "(" + deg(d[1]) + ")" : deg(d[1])}$ და $${deg(d[1])}\in[-90^\circ;\ 90^\circ]$, ამიტომ $${t}$.`; }); }],
    [3, 3, function (r, v) { var x = [R`\dfrac12`, R`\dfrac{\sqrt2}2`, R`\dfrac35`][v]; return QP(R`გამოთვალე $\arcsin${x}+\arccos${x}$.`, PI / 2, R`ნებისმიერი $x\in[-1;1]$-ისთვის $\arcsin x+\arccos x=\dfrac\pi2$.`); }],
    [3, 5, function (r, v) { var e = [[R`\arcsin\dfrac12+\arccos\dfrac12`, PI / 2], [R`\arcsin\left(-\dfrac12\right)+\arccos\dfrac{\sqrt3}2`, 0], [R`\arccos\left(-\dfrac12\right)-\arcsin\dfrac{\sqrt3}2`, PI / 3], [R`\operatorname{arctg}1+\operatorname{arctg}\sqrt3`, (7 * PI) / 12], [R`2\arcsin\dfrac{\sqrt2}2-\arccos0`, 0]][v]; var q = R`გამოთვალე $${e[0]}$.`; if (e[1] === 0) return QN(q, 0, R`თითოეული შესაკრები ცხრილის მნიშვნელობაა; შედეგი $0$.`); return QP(q, e[1], function (t) { return R`თითოეული შესაკრები ცხრილიდან ვიპოვოთ; შედეგი $${t}$.`; }); }]
  ]);

  /* ================= c1s11 · simplest equations ================= */
  var VALS = [[R`\dfrac12`, 0.5], [R`-\dfrac12`, -0.5], [R`\dfrac{\sqrt2}2`, Math.SQRT1_2], [R`-\dfrac{\sqrt2}2`, -Math.SQRT1_2], [R`\dfrac{\sqrt3}2`, Math.sqrt(3) / 2], [R`-\dfrac{\sqrt3}2`, -Math.sqrt(3) / 2], [R`0`, 0], [R`1`, 1], [R`-1`, -1], [R`\dfrac32`, 1.5], [R`-2`, -2]];
  function nSol(a) { return Math.abs(a) > 1 + 1e-9 ? 0 : Math.abs(Math.abs(a) - 1) < 1e-9 ? 1 : 2; }
  G("c1s11", [
    [1, 11, function (r, v) { var a = VALS[v], w = v % 2 ? "cos" : "sin"; var n = w === "cos" && Math.abs(a[1]) < 1e-9 ? 2 : nSol(a[1]); return QN(R`რამდენი ამონახსნი აქვს $${FN[w][0]} x=${a[0]}$ განტოლებას $[0;\ 2\pi)$ შუალედში?`, n, n === 0 ? R`$|${FN[w][0]} x|\le1$, ამიტომ ამონახსნი არ არსებობს.` : n === 1 ? R`ერთეულოვან წრეწირზე მხოლოდ ერთი შესაბამისი წერტილია.` : R`ერთეულოვან წრეწირზე ორი შესაბამისი წერტილია.`); }],
    [2, 6, function (r, v) { var a = [[R`\dfrac12`, 30], [R`\dfrac{\sqrt2}2`, 45], [R`\dfrac{\sqrt3}2`, 60], [R`-\dfrac12`, 210], [R`-\dfrac{\sqrt2}2`, 225], [R`1`, 90]][v]; return QP(R`იპოვე $\sin x=${a[0]}$ განტოლების უმცირესი დადებითი ამონახსნი.`, rad(a[1]), function (t) { return R`ერთეულოვან წრეწირზე პირველი დადებითი კუთხე, რომლის ორდინატია $${a[0]}$: $x=${t}$.`; }); }],
    [2, 6, function (r, v) { var a = [[R`\dfrac12`, 60], [R`-\dfrac12`, 120], [R`\dfrac{\sqrt2}2`, 45], [R`-\dfrac{\sqrt2}2`, 135], [R`\dfrac{\sqrt3}2`, 30], [R`-\dfrac{\sqrt3}2`, 150]][v]; return QP(R`იპოვე $\cos x=${a[0]}$ განტოლების უმცირესი დადებითი ამონახსნი.`, rad(a[1]), function (t) { return R`$x=\arccos\left(${a[0]}\right)=${t}$.`; }); }],
    [2, 5, function (r, v) { var a = [[R`1`, 45], [R`\sqrt3`, 60], [R`\dfrac{\sqrt3}3`, 30], [R`-1`, 135], [R`-\sqrt3`, 120]][v]; return QP(R`იპოვე $${TG}x=${a[0]}$ განტოლების უმცირესი დადებითი ამონახსნი.`, rad(a[1]), function (t) { return R`$x=\operatorname{arctg}\left(${a[0]}\right)+\pi n$; უმცირესი დადებითია $${t}$.`; }); }],
    [2, 4, function (r, v) { var a = [[R`\sin x=\dfrac12`, PI], [R`\sin x=-\dfrac{\sqrt2}2`, 3 * PI], [R`\cos x=\dfrac{\sqrt3}2`, 2 * PI], [R`\cos x=-\dfrac12`, 2 * PI]][v]; return QP(R`იპოვე $${a[0]}$ განტოლების ყველა ამონახსნის ჯამი $[0;\ 2\pi)$ შუალედში.`, a[1], function (t) { return R`ორი ამონახსნი სიმეტრიულია ${v < 2 ? R`$y$ ღერძის` : R`$x$ ღერძის`} მიმართ; ჯამი $${t}$.`; }); }],
    [3, 5, function (r, v) { var pr = [[0, 1], [1, 2], [2, 3], [0, 2], [2, 1]][v], th = [[30, R`\dfrac\pi6`], [45, R`\dfrac\pi4`], [60, R`\dfrac\pi3`]][pr[0]], n = pr[1]; var x = (n % 2 ? -1 : 1) * rad(th[0]) + PI * n; return QP(R`$\sin x=\sin${deg(th[0])}$ განტოლების ზოგადი ამონახსნია $x=(-1)^n${th[1]}+\pi n$. იპოვე $x$, როცა $n=${n}$.`, x, function (t) { return R`$x=(-1)^{${n}}\cdot${th[1]}+${n === 1 ? "" : n}\pi=${t}$.`; }); }],
    [3, 5, function (r, v) { var pr = [[0, 1, 1], [1, 1, -1], [2, 2, 1], [0, 2, -1], [1, 3, 1]][v], th = [[30, R`\dfrac\pi6`], [45, R`\dfrac\pi4`], [60, R`\dfrac\pi3`]][pr[0]], n = pr[1], sg = pr[2]; var x = sg * rad(th[0]) + 2 * PI * n; return QP(R`$\cos x=\cos${deg(th[0])}$ განტოლების ზოგადი ამონახსნია $x=\pm${th[1]}+2\pi n$. იპოვე $x$, როცა $n=${n}$ და ნიშანი „${sg > 0 ? "+" : "−"}".`, x, function (t) { return R`$x=${sg > 0 ? "" : "-"}${th[1]}+${2 * n}\pi=${t}$.`; }); }],
    [3, 4, function (r, v) { var k = v + 2, a = [[R`\dfrac12`, 0.5], [R`\dfrac{\sqrt2}2`, 0], [R`-\dfrac{\sqrt3}2`, 0], [R`\dfrac{\sqrt3}2`, 0]][v]; return QN(R`რამდენი ამონახსნი აქვს $\sin(${k}x)=${a[0]}$ განტოლებას $[0;\ 2\pi)$ შუალედში?`, 2 * k, R`$${k}x\in[0;\ ${2 * k}\pi)$ — ეს $${k}$ სრული პერიოდია, თითოში $2$ ამონახსნი: სულ $${2 * k}$.`); }],
    [3, 3, function (r, v) { var a = [[R`\sin x=\dfrac12`, -(7 * PI) / 6], [R`\cos x=0`, -PI / 2], [R`${TG}x=1`, -(3 * PI) / 4]][v]; return QP(R`იპოვე $${a[0]}$ განტოლების უდიდესი უარყოფითი ამონახსნი.`, a[1], function (t) { return R`ჩამოვწეროთ ამონახსნები და ავირჩიოთ უარყოფითებიდან უდიდესი: $${t}$.`; }); }]
  ]);

  /* ================= c1s12 · solving methods ================= */
  var SS = { "0": [0, 180], "1": [90], "-1": [270], "0.5": [30, 150], "-0.5": [210, 330] };
  var CC = { "0": [90, 270], "1": [0], "-1": [180], "0.5": [60, 300], "-0.5": [120, 240] };
  var VT = { "0": R`0`, "1": R`1`, "-1": R`-1`, "0.5": R`\dfrac12`, "-0.5": R`-\dfrac12` };
  var VK = ["0", "1", "-1", "0.5", "-0.5"];
  function uni(a, b) { var o = a.slice(); b.forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); return o; }
  var ROOTS = [[1, 2], [-1, 2], [1, 1], [-1, 1], [0, 1]];
  function quadQ(r, w) {
    var R1 = r.pick(ROOTS), R2 = r.pick(ROOTS); if (R1[0] * R2[1] === R2[0] * R1[1]) return null;
    var p1 = R1[1], q1 = R1[0], p2 = R2[1], q2 = R2[0], a = p1 * p2, b = -(p1 * q2 + p2 * q1), c = q1 * q2;
    var map = w === "sin" ? SS : CC, k1 = String(q1 / p1), k2 = String(q2 / p2), sols = uni(map[k1], map[k2]);
    var f = w === "sin" ? R`\sin` : R`\cos`;
    var poly = (a === 1 ? "" : a) + f + "^2x" + (b === 0 ? "" : (b < 0 ? "-" : "+") + (Math.abs(b) === 1 ? "" : Math.abs(b)) + f + " x") + (c === 0 ? "" : (c < 0 ? "-" : "+") + Math.abs(c));
    return [poly, sols, VT[k1], VT[k2], f];
  }
  G("c1s12", [
    [1, 3, function (r, v) { var a = [[R`\sin x=1`, 90], [R`\sin x=-1`, 270], [R`\cos x=-1`, 180]][v]; return QP(R`იპოვე $${a[0]}$ განტოლების ამონახსნი $[0;\ 2\pi)$-ზე.`, rad(a[1]), function (t) { return R`ერთეულოვან წრეწირზე ერთადერთი შესაბამისი წერტილია: $x=${t}$.`; }); }],
    [1, 4, function (r, v) { var a = [[R`\sin^2x=\dfrac14`, 4], [R`\sin x\cos x=0`, 4], [R`\cos^2x=\dfrac34`, 4], [R`${TG}^2x=3`, 4]][v]; return QN(R`რამდენი ამონახსნი აქვს $${a[0]}$ განტოლებას $[0;\ 2\pi)$-ზე?`, a[1], R`განტოლება იშლება ორ უმარტივეს განტოლებად, თითოეულს $[0;\ 2\pi)$-ზე ორი ამონახსნი აქვს: სულ $4$.`); }],
    [2, 5, function (r) { var z = quadQ(r, "sin"); if (!z) return null; return QN(R`რამდენი ამონახსნი აქვს $${z[0]}=0$ განტოლებას $[0;\ 2\pi)$ შუალედში?`, z[1].length, R`$t=\sin x$ ჩასმით ფესვებია $t=${z[2]}$ და $t=${z[3]}$; ამონახსნები (გრადუსებში): $${z[1].sort(function (a, b) { return a - b; }).join(",\\ ")}$ — სულ $${z[1].length}$.`); }],
    [2, 5, function (r) { var z = quadQ(r, "cos"); if (!z) return null; return QN(R`რამდენი ამონახსნი აქვს $${z[0]}=0$ განტოლებას $[0;\ 2\pi)$ შუალედში?`, z[1].length, R`$t=\cos x$ ჩასმით ფესვებია $t=${z[2]}$ და $t=${z[3]}$; ამონახსნები (გრადუსებში): $${z[1].sort(function (a, b) { return a - b; }).join(",\\ ")}$ — სულ $${z[1].length}$.`); }],
    [3, 5, function (r) { var z = quadQ(r, r.pick(["sin", "cos"])); if (!z) return null; var sum = z[1].reduce(function (s, x) { return s + x; }, 0); return QP(R`იპოვე $${z[0]}=0$ განტოლების ყველა ამონახსნის ჯამი $[0;\ 2\pi)$ შუალედში.`, rad(sum), function (t) { return R`$t=${z[4]} x$: $t=${z[2]}$ ან $t=${z[3]}$. ამონახსნები (გრადუსებში): $${z[1].sort(function (a, b) { return a - b; }).join(",\\ ")}$; ჯამი $${t}$.`; }); }],
    [2, 1, function (r) { return QP(R`იპოვე $\sin x=\cos x$ განტოლების ორი ამონახსნის ჯამი $[0;\ 2\pi)$ შუალედში.`, (3 * PI) / 2, R`$${TG}x=1$: $x=\dfrac\pi4$ და $x=\dfrac{5\pi}4$. ჯამი $\dfrac{3\pi}2$.`); }],
    [2, 5, function (r, v) { var e = [[R`\sin x=\sqrt3\cos x`, 60], [R`\sqrt3\sin x=\cos x`, 30], [R`\sin x+\cos x=0`, 135], [R`\sin x-\sqrt3\cos x=0`, 60], [R`\sqrt3\sin x+\cos x=0`, 150]][v]; return QP(R`იპოვე $${e[0]}$ განტოლების უმცირესი დადებითი ამონახსნი.`, rad(e[1]), function (t) { return R`ორივე მხარე გავყოთ $\cos x$-ზე ($\cos x\ne0$) და მივიღებთ $${TG}x$-ის განტოლებას: $x=${t}$.`; }); }],
    [3, 1, function (r) { return QN(R`რამდენი ამონახსნი აქვს $\sin^2x=\cos^2x$ განტოლებას $[0;\ 2\pi)$-ზე?`, 4, R`$${TG}^2x=1$, $${TG}x=\pm1$: $x=\dfrac\pi4,\dfrac{3\pi}4,\dfrac{5\pi}4,\dfrac{7\pi}4$.`); }],
    [3, 1, function (r) { return QP(R`იპოვე $2\sin x\cos x=1$ განტოლების უმცირესი დადებითი ამონახსნი.`, PI / 4, R`$\sin2x=1$, $2x=\dfrac\pi2+2\pi n$, $x=\dfrac\pi4+\pi n$.`); }],
    [3, 4, function (r, v) { var k = v + 2; return QN(R`რამდენი ამონახსნი აქვს $\cos(${k}x)=1$ განტოლებას $[0;\ 2\pi)$-ზე?`, k, R`$${k}x=2\pi n$, $x=\dfrac{2\pi n}{${k}}$, $n=0,\dots,${k - 1}$.`); }],
    [3, 1, function (r) { return QP(R`იპოვე $\cos2x=\dfrac12$ განტოლების ორი ამონახსნის ჯამი $[0;\ \pi]$ შუალედში.`, PI, R`$2x=\pm\dfrac\pi3+2\pi n$, $x=\dfrac\pi6$ და $x=\dfrac{5\pi}6$. ჯამი $\pi$.`); }],
    [3, 4, function (r, v) { var e = [[R`\cos2x+\sin x=0`, 3, R`$1-2\sin^2x+\sin x=0$, $\sin x=1$ ან $\sin x=-\dfrac12$`], [R`\cos2x=\cos x`, 3, R`$2\cos^2x-\cos x-1=0$, $\cos x=1$ ან $\cos x=-\dfrac12$`], [R`\cos2x+3\sin x=2`, 3, R`$2\sin^2x-3\sin x+1=0$, $\sin x=1$ ან $\sin x=\dfrac12$`], [R`\sin2x=\sin x`, 4, R`$\sin x(2\cos x-1)=0$: $\sin x=0$ ან $\cos x=\dfrac12$`]][v]; return QN(R`რამდენი ამონახსნი აქვს $${e[0]}$ განტოლებას $[0;\ 2\pi)$-ზე?`, e[1], R`${e[2]}. სულ $${e[1]}$ ამონახსნი.`); }],
    [2, 6, function (r) { var p = r.pick(VK), q = r.pick(VK), u = uni(SS[p], CC[q]); return QN(R`რამდენი ამონახსნი აქვს $\left(\sin x-${VT[p] === "0" ? "0" : "\\left(" + VT[p] + "\\right)"}\right)\left(\cos x-${VT[q] === "0" ? "0" : "\\left(" + VT[q] + "\\right)"}\right)=0$ განტოლებას $[0;\ 2\pi)$ შუალედში?`, u.length, R`$\sin x=${VT[p]}$ იძლევა $${SS[p].length}$ ამონახსნს, $\cos x=${VT[q]}$ — $${CC[q].length}$-ს${u.length < SS[p].length + CC[q].length ? ", საერთოს ერთხელ ვთვლით" : ""}. სულ $${u.length}$.`); }],
    [3, 5, function (r) { var p = r.pick(VK), q = r.pick(VK), u = uni(SS[p], CC[q]), tot = u.reduce(function (a, b) { return a + b; }, 0); return QN(R`იპოვე $\left(\sin x-${VT[p] === "0" ? "0" : "\\left(" + VT[p] + "\\right)"}\right)\left(\cos x-${VT[q] === "0" ? "0" : "\\left(" + VT[q] + "\\right)"}\right)=0$ განტოლების ყველა ამონახსნის ჯამი $[0^\circ;\ 360^\circ)$-ზე (გრადუსებში).`, tot, R`ამონახსნებია $${u.sort(function (a, b) { return a - b; }).join("^\\circ,\\ ")}^\circ$. ჯამი $${deg(tot)}$.`); }]
  ]);

  /* ================= c1s14 · summary ================= */
  G("c1s14", [
    [1, 6, function (r, v) { var k = at([[1, 6], [1, 4], [1, 3], [2, 3], [3, 4], [5, 6], [7, 6], [5, 4], [4, 3], [5, 3], [7, 4], [11, 6]], v * 5), d = (180 * k[0]) / k[1]; return QE(R`გამოთვალე $\sin\dfrac{${k[0] === 1 ? "" : k[0]}\pi}{${k[1]}}$.`, fv("sin", d), function (t) { return R`$\dfrac{${k[0] === 1 ? "" : k[0]}\pi}{${k[1]}}=${deg(d)}$, $\sin${deg(d)}=${t}$.`; }); }],
    [1, 5, function (r, v) { var k = at([[1, 6], [1, 4], [2, 3], [3, 4], [5, 6], [7, 6], [5, 4], [4, 3], [5, 3], [7, 4], [11, 6]], v * 4 + 1), d = (180 * k[0]) / k[1]; return QE(R`გამოთვალე $\cos\dfrac{${k[0] === 1 ? "" : k[0]}\pi}{${k[1]}}$.`, fv("cos", d), function (t) { return R`$\dfrac{${k[0] === 1 ? "" : k[0]}\pi}{${k[1]}}=${deg(d)}$, $\cos${deg(d)}=${t}$.`; }); }],
    [2, 4, function (r) { var t3 = r.pick(TRP); return QE(R`$\sin\alpha=${fracTex(t3[0], t3[2])}$ ($\alpha$ მახვილია). იპოვე $\sin2\alpha$.`, (2 * t3[0] * t3[1]) / (t3[2] * t3[2]), function (t) { return R`$\cos\alpha=${fracTex(t3[1], t3[2])}$, $\sin2\alpha=2\sin\alpha\cos\alpha=${t}$.`; }); }],
    [2, 4, function (r, v) { var a = [[75, 15], [105, 15], [80, 40], [50, 10]][v]; return QE(R`გამოთვალე $\sin${deg(a[0])}\cos${deg(a[1])}+\cos${deg(a[0])}\sin${deg(a[1])}$.`, fv("sin", a[0] + a[1]), function (t) { return R`$\sin(${deg(a[0])}+${deg(a[1])})=\sin${deg(a[0] + a[1])}=${t}$.`; }); }],
    [2, 4, function (r, v) { var d = [210, 300, 135, 330][v]; return QE(R`გამოთვალე $\sin^2${deg(d)}-\cos^2${deg(d)}$.`, -fv("cos", 2 * d), function (t) { return R`$\sin^2\alpha-\cos^2\alpha=-\cos2\alpha=-\cos${deg(2 * d)}=${t}$.`; }); }],
    [3, 3, function (r, v) { var k = v + 2; return QP(R`იპოვე $y=\cos(${k}x)$ ფუნქციის უმცირესი დადებითი პერიოდი.`, (2 * PI) / k, function (t) { return R`$T=\dfrac{2\pi}{${k}}=${t}$.`; }); }],
    [3, 3, function (r, v) { var a = [R`\dfrac12`, R`\dfrac{\sqrt2}2`, R`\dfrac{\sqrt3}2`][v]; return QN(R`რამდენი ამონახსნი აქვს $\sin x=${a}$ განტოლებას $[0;\ 2\pi)$-ზე?`, 2, R`ერთეულოვან წრეწირზე ორი წერტილია ამ ორდინატით: $2$ ამონახსნი.`); }]
  ].concat(bankTemplates("c1s14", 8)));
}

/* problems that must never be drawn into a chapter test: triple angle, sine/cosine theorems */
var NOT_IN_TEST = /3\\alpha|3x\b|\\(?:sin|cos)\s*3[a-z\\]|\\operatorname\{c?tg\}\s*3[a-z\\]|სამმაგ|სინუსთა|კოსინუსთა|შემოხაზულ/;

export { registerTrig11, ex, exPi, tx, RS, SIMPLIFY, FINDK, TRUTH, NOT_IN_TEST };
