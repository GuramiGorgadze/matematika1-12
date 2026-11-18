/**
 * Students sign in without passwords (as in the original app): the same first name, last name,
 * school and grade always lead back to the same profile, on any device.
 */
export function cleanText(s) {
  return String(s ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
}

export function studentKey({ firstName, lastName, school, grade }) {
  const norm = (s) => cleanText(s).toLocaleLowerCase("ka").replace(/[„“"'`«»]/g, "").replace(/\s*№\s*/g, "№");
  return [norm(firstName), norm(lastName), norm(school), Number(grade)].join("|");
}

export function fullName(s) {
  return `${s.firstName} ${s.lastName}`.trim();
}
