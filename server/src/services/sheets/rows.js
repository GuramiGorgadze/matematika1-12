import {
  ANSWER_LABEL,
  awayDetails,
  dateTime,
  duration,
  KIND_LABEL,
  minutes,
  questionList,
  STATUS_LABEL,
} from "../format.js";

/**
 * The three tabs of the teacher's spreadsheet. Column A is always the row key used for upserts,
 * so a row is updated in place when a test is re-scored or a student's activity changes.
 */
export const SHEETS = {
  students: {
    name: "მოსწავლეები",
    headers: [
      "ID", "სახელი", "გვარი", "კლასი", "სკოლა", "რეგისტრაცია", "ბოლო აქტივობა", "ვიზიტები", "აქტიური დღეები",
      "დრო საიტზე (წთ)", "ამოხსნილი ამოცანები", "პირველივე ცდით", "ცდები სულ", "დასრულებული გაკვეთილები",
      "დასრულებული ტესტები", "საუკეთესო %", "საშუალო %", "ჩანართიდან გასვლები (ტესტებში)", "ჩანართს გარეთ (წთ)",
    ],
  },
  tests: {
    name: "ტესტები",
    headers: [
      "ID", "სტატუსი", "დაწყება", "დასრულება", "მოსწავლის ID", "მოსწავლე", "კლასი", "სკოლა", "ტიპი", "ტესტი",
      "ამოცანები", "ქულა", "მაქს. ქულა", "%", "სწორი", "არასწორი", "უპასუხო", "ნაწილობრივ", "შესაფასებელი",
      "დახარჯული დრო", "დროის ლიმიტი", "დრო ამოიწურა", "ჩანართიდან გასვლები", "ჩანართს გარეთ (სულ)",
      "ყველაზე ხანგრძლივი გასვლა", "გასვლების დეტალები", "სწორი ამოცანები", "არასწორი ამოცანები", "უპასუხო ამოცანები",
    ],
  },
  answers: {
    name: "პასუხები",
    headers: [
      "გასაღები", "ტესტის ID", "დასრულება", "მოსწავლე", "კლასი", "ტესტი", "№", "ტიპი", "ამოცანა",
      "მოსწავლის პასუხი", "სწორი პასუხი", "შედეგი", "ქულა", "მაქს. ქულა",
    ],
  },
};

export function studentRow(s, agg, tz) {
  const a = agg || {};
  return [
    s.id,
    s.firstName,
    s.lastName,
    s.grade,
    s.school,
    dateTime(s.createdAt || s.activity?.firstSeenAt, tz),
    dateTime(s.activity?.lastSeenAt, tz),
    s.activity?.visits || 0,
    Object.keys(s.activity?.days || {}).length,
    minutes(s.activity?.seconds),
    s.stats?.solved || 0,
    s.stats?.firstTry || 0,
    s.stats?.tries || 0,
    s.stats?.lessonsDone || 0,
    a.tests || 0,
    a.best ?? "",
    a.avg ?? "",
    a.leaves || 0,
    minutes((a.awayMs || 0) / 1000),
  ];
}

export function testRow(a, tz) {
  const done = a.status === "submitted";
  const f = a.focus || {};
  const c = a.counts || {};
  return [
    a.id,
    STATUS_LABEL[a.status] || a.status,
    dateTime(a.startedAt, tz),
    dateTime(a.finishedAt, tz),
    a.student,
    a.studentName,
    a.studentGrade,
    a.school || "",
    KIND_LABEL[a.kind] || a.kind,
    a.title,
    a.questionCount || 0,
    done ? a.score : "",
    done ? a.maxScore : "",
    done ? a.percent : "",
    done ? c.correct || 0 : "",
    done ? c.wrong || 0 : "",
    done ? c.unanswered || 0 : "",
    done ? c.partial || 0 : "",
    done ? c.pending || 0 : "",
    done ? duration((a.durationSec || 0) * 1000) : "",
    a.timeLimitSec ? duration(a.timeLimitSec * 1000) : "",
    done ? (a.autoSubmitted ? "კი" : "არა") : "",
    f.leaves || 0,
    duration(f.awayMs || 0),
    duration(f.longestMs || 0),
    awayDetails(f.events, tz),
    questionList(a.answers, "correct"),
    questionList(a.answers, "wrong"),
    questionList(a.answers, "unanswered"),
  ];
}

export function answerRows(a, tz) {
  return (a.answers || []).map((x) => [
    `${a.id}#${x.n}`,
    a.id,
    dateTime(a.finishedAt, tz),
    a.studentName,
    a.studentGrade,
    a.title,
    x.n,
    x.type === "choice" ? "შემოხაზვა" : "ჩაწერა",
    x.prompt || "",
    x.given ?? "",
    x.correct || "",
    ANSWER_LABEL[x.status] || x.status,
    x.points,
    x.maxPoints,
  ]);
}
