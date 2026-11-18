/**
 * Helpers for the general (placeholder) material of grades that had no content in the original
 * app. Lessons use the same HTML vocabulary as the real lessons (def / key / ex / note boxes,
 * $…$ TeX) and the same seeded problem generators, so tests, progress and checking all work.
 * Replace a placeholder chapter by adding real lessons and removing `placeholder: true`.
 */
export const R = String.raw;

export function lessonHtml({ intro = [], def, key, keyTitle = "მთავარი წესი", ex = [], note, noteTitle = "რჩევა" }) {
  let h = "";
  for (const p of [].concat(intro)) h += `<p>${p}</p>`;
  if (def) h += `<div class="def"><div class="dl">განმარტება</div><p>${def}</p></div>`;
  if (key) h += `<div class="key"><div class="kl">${keyTitle}</div>${key}</div>`;
  ex.forEach((e, i) => {
    h += `<div class="ex"><div class="el">მაგალითი${ex.length > 1 ? " " + (i + 1) : ""}</div><p>${e}</p></div>`;
  });
  if (note) h += `<div class="note"><div class="nl">${noteTitle}</div><p>${note}</p></div>`;
  return h;
}

/**
 * chapter({ id, no, title, intro, short, lessons: [{ id, title, html, gen }] }, GEN)
 * registers every lesson's generators and returns a curriculum chapter.
 */
export function chapter(GEN, ch) {
  for (const l of ch.lessons) if (l.gen) GEN.G(l.id, l.gen);
  return {
    id: ch.id,
    no: String(ch.no),
    num: ch.num ?? Number(ch.no),
    title: ch.title,
    intro: ch.intro,
    short: ch.short,
    placeholder: true,
    tools: ch.tools,
    lessons: ch.lessons.map(({ id, title, html }) => ({ id, title, html, placeholder: true })),
    groups: [{ t: "გაკვეთილები", from: 1, to: ch.lessons.length }],
  };
}

export const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
export const lcm = (a, b) => (a / gcd(a, b)) * b;
export const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
export const isPrime = (n) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
