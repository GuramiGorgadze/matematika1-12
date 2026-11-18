# მათემატიკა — Brand Guidelines v2.0 · “Textbook”

The platform looks and reads like a beautifully printed modern Georgian mathematics textbook, one that
also checks your answers. Paper and ink, one spot colour, a yellow highlighter for what must be
remembered, generous margins, thin rules instead of boxes, and serif headings.

## Quick Reference

| | |
|---|---|
| Name | **მათემატიკა** (never translated in the UI) |
| Mark | „მ." monogram: Noto Serif Georgian Bold **მ** + vermilion full stop on an ink plate |
| Paper | `#F9F6F0` light · `#15130F` dark |
| Ink | `#1D1A16` light · `#EEE8DD` dark |
| Spot colour (vermilion) | `#B83D19` light · `#F08559` dark |
| Highlighter | `#FCE38A` light · `#4A3C0C` dark |
| Headings & reading text | Noto Serif Georgian |
| Interface | Noto Sans Georgian |
| Large numerals | Noto Serif Display |
| Formulas | STIX Two Math (MathML) |
| Voice | a patient, precise teacher: „შენ" with students, „თქვენ" with teachers |

---

## 1. Colour Palette

Colour is used the way a textbook printer uses it: almost everything is ink on paper, and one spot
colour marks what is important. Colour never carries meaning alone — every state also has an icon and
a word.

### Primary

| Name | Light | Dark | Use |
|---|---|---|---|
| Paper | `#F9F6F0` | `#15130F` | page background |
| Paper raised | `#FFFDF9` | `#1D1A16` | inputs, panels, dialogs |
| Paper sunken | `#F2EDE3` | `#242019` | sidebar, table heads, code-like blocks |
| Ink | `#1D1A16` | `#EEE8DD` | text, primary buttons |
| Vermilion | `#B83D19` | `#F08559` | links, chapter numerals, active marks, focus ring, main call to action |
| Highlighter | `#FCE38A` | `#4A3C0C` | key formulas, search hits — text stays ink |

### Secondary — school stages (“the series”)

Each stage of school is a volume of the series with its own cloth colour, used for spines, numerals
and small tags. Never for body text on a coloured fill.

| Stage | Grades | Light (text) | Fill | Dark (text) |
|---|---|---|---|---|
| დაწყებითი | 1–6 | ochre `#8C5A0E` | `#C9922E` | `#E2B15B` |
| საბაზო | 7–9 | cobalt `#2B4E96` | `#3D63B8` | `#8EA8E8` |
| საშუალო | 10–12 | plum `#7A2E5C` | `#93407A` | `#D88BBE` |

### Feedback (reserved — never decorative)

| State | Light text / soft | Dark text / soft | Always with |
|---|---|---|---|
| Correct | `#2E7A4C` / `#E3F0E6` | `#74C493` / `#17291E` | ✓ icon + „სწორია" |
| Wrong | `#B4233E` / `#F8E1E5` | `#F08A9C` / `#331A1F` | ✕ icon + „არასწორია" |
| Warning (timer, tab leave) | `#A15C07` / `#FBEDD3` | `#E8B45A` / `#33260F` | icon + text |

Wrong (crimson, hue ≈ 350°) is kept visibly apart from the vermilion spot colour (hue ≈ 15°).

### Neutral palette

| Token | Light | Dark |
|---|---|---|
| Rule (hairline) | `#E3DBCD` | `#36312A` |
| Rule strong | `#CDC2AF` | `#4A443A` |
| Secondary text | `#57514A` | `#BDB4A6` |
| Tertiary text | `#6B645A` | `#9C9385` |

### Accessibility

All text pairs meet WCAG 2.2 AA (most meet AAA): ink on paper 16.1:1, secondary 7.3:1, tertiary 5.4:1,
vermilion links 5.2:1 on paper and 4.8:1 on the sunken sidebar, white on a vermilion button 5.7:1.
Dark theme: ink 15.2:1, vermilion 7.3:1. Focus is a 2 px vermilion outline with a 2 px offset.

---

## 2. Typography

### Font stack (self-hosted, no external requests)

```css
--typeface-serif:   "Noto Serif Georgian Variable", "STIX Two Text Variable", Georgia, serif;
--typeface-sans:    "Noto Sans Georgian Variable", system-ui, sans-serif;
--typeface-display: "Noto Serif Display Variable", "Noto Serif Georgian Variable", Georgia, serif;
--typeface-math:    "STIX Two Math", math;
```

Noto Serif/Sans Georgian are the only Georgian families on Google Fonts (self-hosted here through
Fontsource). Small labels ("eyebrows", `.eyebrow`) are letter-spaced Mkhedruli: Chromium does not map
Georgian to Mtavruli with `text-transform: uppercase`, so labels are never set in capitals.
Noto Serif Display is used only for large Latin numerals (grade numbers, chapter numbers, scores).

### Type scale

| Role | Family | Size / line height | Weight |
|---|---|---|---|
| Display numeral | Serif Display | 4.5–7.5 rem / 0.9 | 500 |
| Page title (h1) | Serif Georgian | 2.25–2.75 rem / 1.15 | 600 |
| Section (h2) | Serif Georgian | 1.625–1.875 rem / 1.2 | 600 |
| Sub-section (h3) | Serif Georgian | 1.25 rem / 1.3 | 600 |
| Reading text | Serif Georgian | 1.125 rem / 1.75, measure ≤ 70 ch | 400 |
| Interface text | Sans Georgian | 0.9375–1 rem / 1.55 | 400–600 |
| Label (eyebrow) | Sans Georgian | 0.78 rem / 1.35, tracking 0.045 em | 600 |
| Caption | Sans Georgian | 0.8125 rem / 1.45 | 400 |

Numbers in tables and timers use tabular lining figures.

---

## 3. Logo Usage

### Variants
- **Mark** (`docs/brand/mark.svg`): ink plate, paper **მ**, vermilion dot. Dark theme: paper plate, ink **მ**, vermilion dot (`mark-dark.svg`); the in-app mark follows the theme automatically.
- **Lock-up**: mark + wordmark „მათემატიკა" in Noto Serif Georgian SemiBold, optical size of the wordmark = 55 % of the mark height.

### Clear space
The width of the dot on every side.

### Minimum size
16 px for the mark (favicon), 24 px in the interface; the lock-up needs at least 112 px.

### Don'ts
Don't recolour the dot, put the mark on a gradient or photo, add shadows or outlines, set the
wordmark in another font, or separate the dot from the letter.

---

## 4. Voice & Tone

### Personality
A patient, precise teacher: clear before clever, encouraging without exaggeration, never childish.

| We are | We are not |
|---|---|
| precise („ფესვი არ შეიძლება იყოს უარყოფითი") | vague („რაღაც არასწორია") |
| warm („კარგია! შემდეგი ამოცანა უფრო რთულია") | over-excited („სუპერ!!! 🎉") |
| direct („ჩაწერე პასუხი") | bureaucratic („გთხოვთ, შეიყვანოთ მონაცემები") |

### Tone by context
- **Students:** „შენ", short sentences, imperative verbs (ამოხსენი, შეამოწმე, გააგრძელე).
- **Teachers:** „თქვენ", neutral and factual.
- **Feedback:** „სწორია" · „ჯერ არა — სცადე ხელახლა" · after a test, name what to revise.
- **Tab leaves:** factual, not accusatory: „ტესტის ჩანართი დატოვე 0:12-ით. ეს ფიქსირდება."
- **Errors:** what happened + what to do: „კავშირი დროებით არ არის — პასუხი შენახულია და გაიგზავნება."

### Words
Prefer ამოცანა (problem), სავარჯიშო (exercise section), გაკვეთილი, თავი, შემაჯამებელი ტესტი,
დაფა (interactive board). Avoid anglicisms (ქვიზი, დაშბორდი) in student-facing text.

---

## 5. Imagery

- **Illustrations:** line drawings like textbook figures — 1.5 px ink strokes, compass arcs,
  constructions, a few vermilion points. No stock photos, no 3D, no emoji.
- **Motifs:** hairline rules, double rules for chapter openers, § and ¶ marks, running heads, hanging
  exercise numbers, highlighter bands, dotted leaders in tables of contents.
- **Icons:** Lucide (2 px stroke), 16–20 px, always paired with text or an `aria-label`.

## Extractable Fields

```json
{
  "name": "მათემატიკა",
  "colors": { "paper": "#F9F6F0", "ink": "#1D1A16", "accent": "#B83D19", "highlight": "#FCE38A" },
  "fonts": { "serif": "Noto Serif Georgian", "sans": "Noto Sans Georgian", "display": "Noto Serif Display", "math": "STIX Two Math" },
  "voice": ["precise", "warm", "direct"]
}
```
