/* ---------- TeX → readable Unicode text (for the teacher's sheet and dashboard) ---------- */
const SUP = {
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
  "+": "⁺",
  "-": "⁻",
  "−": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  n: "ⁿ",
  i: "ⁱ",
  x: "ˣ",
  k: "ᵏ",
  m: "ᵐ",
  "∘": "°",
  "°": "°",
};
const SUB = {
  0: "₀",
  1: "₁",
  2: "₂",
  3: "₃",
  4: "₄",
  5: "₅",
  6: "₆",
  7: "₇",
  8: "₈",
  9: "₉",
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
  a: "ₐ",
  e: "ₑ",
  o: "ₒ",
  x: "ₓ",
  h: "ₕ",
  k: "ₖ",
  l: "ₗ",
  m: "ₘ",
  n: "ₙ",
  p: "ₚ",
  s: "ₛ",
  t: "ₜ",
  i: "ᵢ",
  j: "ⱼ",
};
const SYM = {
  cdot: "·",
  times: "×",
  div: ":",
  pm: "±",
  mp: "∓",
  ne: "≠",
  neq: "≠",
  le: "≤",
  leq: "≤",
  ge: "≥",
  geq: "≥",
  approx: "≈",
  infty: "∞",
  pi: "π",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  Delta: "Δ",
  theta: "θ",
  varphi: "φ",
  phi: "φ",
  omega: "ω",
  lambda: "λ",
  mu: "μ",
  sigma: "σ",
  Sigma: "Σ",
  tau: "τ",
  varepsilon: "ε",
  epsilon: "ε",
  circ: "°",
  angle: "∠",
  triangle: "△",
  perp: "⊥",
  parallel: "∥",
  in: "∈",
  notin: "∉",
  cup: "∪",
  cap: "∩",
  subset: "⊂",
  subseteq: "⊆",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  Leftrightarrow: "⇔",
  iff: "⇔",
  to: "→",
  rightarrow: "→",
  leftrightarrow: "↔",
  dots: "…",
  ldots: "…",
  cdots: "⋯",
  varnothing: "∅",
  setminus: "∖",
  sim: "∼",
  equiv: "≡",
  mid: "|",
  ast: "∗",
  sum: "∑",
  nabla: "∇",
  ll: "≪",
  uparrow: "↑",
  downarrow: "↓",
  quad: " ",
  qquad: " ",
};
const BB = { R: "ℝ", N: "ℕ", Z: "ℤ", Q: "ℚ" };
const DROP = new Set(["left", "right", "big", "Big", "bigl", "bigr", "Bigl", "Bigr", "displaystyle", "limits", "nolimits"]);

export function texToText(tex) {
  const s = String(tex ?? "");
  let i = 0;
  const simple = (x) => /^[\p{L}\p{N}.,·πα-ω√⁰-⁹₀-₉′]+$/u.test(x);
  const wrap = (x) => (simple(x) ? x : `(${x})`);
  const map = (x, table, mark) => {
    const t = x.trim();
    if (!t) return mark;
    return [...t].every((ch) => table[ch]) ? [...t].map((ch) => table[ch]).join("") : `${mark}${wrap(t)}`;
  };
  const space = () => {
    while (s[i] === " ") i++;
  };
  function group(stop) {
    i++;
    const out = expr(stop);
    i++;
    return out;
  }
  function arg() {
    space();
    if (s[i] === "{") return group("}");
    if (s[i] === "\\") return command();
    return s[i++] ?? "";
  }
  function command() {
    i++;
    const c = s[i];
    if (c === undefined) return "";
    if (!/[a-zA-Z]/.test(c)) {
      i++;
      return { ",": " ", ";": " ", ":": " ", "!": "", " ": " ", "\\": "; " }[c] ?? c;
    }
    let name = "";
    while (i < s.length && /[a-zA-Z]/.test(s[i])) name += s[i++];
    switch (name) {
      case "frac":
      case "dfrac":
      case "tfrac": {
        const a = arg();
        const b = arg();
        /* a denominator like 2b is bracketed: 1/(2b), never 1/2b */
        return `${wrap(a)}/${/^\p{N}+$|^.$/u.test(b) ? b : `(${b})`}`;
      }
      case "sqrt": {
        space();
        const n = s[i] === "[" ? group("]") : null;
        const a = arg();
        return `${n ? map(n, SUP, "") : ""}√${wrap(a)}`;
      }
      case "text":
      case "mathrm":
      case "textbf":
      case "mathbf":
      case "mathit":
      case "operatorname":
      case "overline":
        return arg();
      case "mathbb": {
        const a = arg();
        return BB[a] || a;
      }
      case "vec":
      case "overrightarrow":
        return `${arg()}⃗`;
      default:
        if (DROP.has(name)) {
          if (s[i] === ".") i++;
          return "";
        }
        return SYM[name] ?? name;
    }
  }
  function expr(stop) {
    let out = "";
    while (i < s.length && s[i] !== stop) {
      const c = s[i];
      if (c === "\\") out += command();
      else if (c === "{") out += group("}");
      else if (c === "^") {
        i++;
        out += map(arg(), SUP, "^");
      } else if (c === "_") {
        i++;
        out += map(arg(), SUB, "_");
      } else if (c === "$" || c === "&" || c === "~") {
        i++;
        if (c !== "$") out += " ";
      } else {
        out += c;
        i++;
      }
    }
    return out;
  }
  return expr(undefined).replace(/\s+/g, " ").trim();
}

/**
 * Readable plain text from lesson/problem HTML, for the teacher's sheet: tags dropped, TeX turned
 * into Unicode ($x^2+\dfrac12$ → x²+1/2), entities decoded, whitespace collapsed.
 */
export function htmlToText(html, max = 500) {
  if (html == null) return "";
  let s = String(html)
    .replace(/<figure[\s\S]*?<\/figure>/gi, " [ნახაზი] ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " [ნახაზი] ")
    .replace(/<img[^>]*>/gi, " [ნახაზი] ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|tr|h\d)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
  s = s.replace(/\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g, (_, a, b) => texToText(a ?? b));
  s = s.replace(/&#36;/g, "$").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/** random id for attempts (idempotent saves) */
export function newId(prefix = "run") {
  const r = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "").slice(0, 20) : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}-${r}`;
}
