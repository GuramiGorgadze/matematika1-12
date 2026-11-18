import { useEffect, useState } from "react";

/** grade 12 exams (≈220 KB with scanned figures) load only when needed */
let cache = null;
let promise = null;
export function loadExams() {
  return (promise ||= import("./pack/exams.js").then((m) => (cache = m)));
}
export function useExams() {
  const [m, setM] = useState(cache);
  useEffect(() => {
    if (!cache) loadExams().then(setM);
  }, []);
  return m;
}

export const EXAM_GROUPS = [
  { key: "nat", title: "ერთიანი ეროვნული გამოცდები", desc: "წინა წლების ოფიციალური ტესტები (I ვარიანტი) ისე, როგორც გამოცდაზე იყო: 37 დახურული და 4 ღია ამოცანა." },
  { key: "prac", title: "სავარჯიშო ტესტები", desc: "ეროვნული გამოცდის მსგავსი ახალი ტესტები: იგივე სტრუქტურა და თემები, ახალი რიცხვები." },
];
