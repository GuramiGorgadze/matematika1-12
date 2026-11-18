/**
 * Light metadata: safe to import anywhere (the home page renders before the curriculum loads).
 * `chapters` / `lessons` are checked against the curriculum by client/test/content.test.js.
 */
export const GRADES = [
  { n: 1, expr: "3 + 2 = 5", chapters: 3, lessons: 6, topics: ["რიცხვები 20-მდე", "შეკრება და გამოკლება", "ფიგურები და გაზომვა"] },
  { n: 2, expr: "12 − 7 = 5", chapters: 3, lessons: 6, topics: ["რიცხვები 100-მდე", "გამრავლება და გაყოფა", "დრო და ფული"] },
  { n: 3, expr: "6 × 4 = 24", chapters: 3, lessons: 6, topics: ["სამნიშნა რიცხვები", "გამრავლების ტაბულა", "პერიმეტრი"] },
  { n: 4, expr: "36 ÷ 6 = 6", chapters: 3, lessons: 6, topics: ["მრავალნიშნა რიცხვები", "წერითი გამრავლება და გაყოფა", "ფართობი"] },
  { n: 5, expr: "¾ + ¼ = 1", chapters: 3, lessons: 6, topics: ["გაყოფადობა", "ჩვეულებრივი წილადები", "ათწილადები"] },
  { n: 6, expr: "−3 + 8 = 5", chapters: 3, lessons: 6, topics: ["უსგ და უსჯ", "წილადები", "პროპორცია და პროცენტი"] },
  { n: 7, expr: "2x + 3 = 11", chapters: 7, lessons: 35, topics: ["რაციონალური რიცხვები", "ცვლადიანი გამოსახულება", "განტოლებები", "კოორდინატები", "სამკუთხედები"] },
  { n: 8, expr: "x² − 9 = 0", chapters: 8, lessons: 47, topics: ["ალბათობა", "გარდაქმნები", "განტოლებათა სისტემები", "პითაგორას თეორემა", "უტოლობები"] },
  { n: 9, expr: "√144 = 12", chapters: 3, lessons: 7, topics: ["კვადრატული განტოლება", "კვადრატული ფუნქცია", "მსგავსება და ტრიგონომეტრია"] },
  { n: 10, expr: "sin 30° = ½", chapters: 3, lessons: 6, topics: ["პროგრესიები", "ფესვი და ხარისხი", "კომბინატორიკა"] },
  { n: 11, expr: "log₂ 8 = 3", chapters: 6, lessons: 43, topics: ["ტრიგონომეტრია", "ვექტორები", "სტერეომეტრია", "ლოგარითმები", "ალბათობა"] },
  { n: 12, expr: "∫ 2x dx = x²", chapters: 3, lessons: 6, topics: ["წარმოებული", "ინტეგრალი", "სტატისტიკა", "ეროვნული გამოცდები"] },
];

/** totals shown on the cover (checked against the curriculum by the content tests) */
export const CATALOG = { grades: 12, lessons: 180, problems: 6423, exams: 9 };

/** grades whose material comes from the original app (the rest is general sample material) */
export const ORIGINAL_GRADES = new Set([7, 8, 11]);

export const TOOLS = {
  "tool-geo": { title: "გრაფიკები და გეომეტრია", desc: "ფუნქციების გრაფიკები, წერტილები, მონაკვეთები, წრეწირები და მრავალკუთხედები.", icon: "geo" },
  "tool-trig": { title: "ტრიგონომეტრიული ფუნქციების დაფა", desc: "x ღერძზე რადიანები, y ღერძზე ცხრილის მნიშვნელობები.", icon: "trig" },
  "tool-vec": { title: "ვექტორების დაფა", desc: "ვექტორების ჯამი, სხვაობა, სკალარული ნამრავლი და კუთხე.", icon: "vec" },
  "tool-3d": { title: "სივრცითი ფიგურების დაფა", desc: "პრიზმა, პირამიდა, ცილინდრი, კონუსი, ბირთვი: ბრუნვა, ჭრილი, საკუთარი წერტილები.", icon: "3d" },
};

export const GRADE_TOOLS = {
  5: ["tool-geo"],
  6: ["tool-geo"],
  7: ["tool-geo"],
  8: ["tool-geo", "tool-3d"],
  9: ["tool-geo"],
  10: ["tool-geo", "tool-trig"],
  11: ["tool-trig", "tool-geo", "tool-vec", "tool-3d"],
  12: ["tool-geo", "tool-trig", "tool-3d"],
};

export const gradeMeta = (n) => GRADES[n - 1] || null;
