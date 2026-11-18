import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ord } from "@/lib/format";
import { session } from "./session";

const clean = (s) =>
  String(s || "")
    .replace(/\s+/g, " ")
    .trim();

function validate(d) {
  const e = {};
  if (clean(d.firstName).length < 2) e.firstName = "ჩაწერე სახელი (მინიმუმ 2 ასო).";
  if (clean(d.lastName).length < 2) e.lastName = "ჩაწერე გვარი (მინიმუმ 2 ასო).";
  if (!d.grade) e.grade = "აირჩიე კლასი.";
  if (clean(d.school).length < 2) e.school = "ჩაწერე სკოლის სახელი.";
  return e;
}

/**
 * Sign-in / registration form (first name, last name, grade, school). The same details always
 * open the same profile, so a student can continue on any device.
 */
export function RegistrationForm({ edit = false, initial, onDone, onCancel }) {
  const [d, setD] = useState(() => ({
    firstName: initial?.firstName || "",
    lastName: initial?.lastName || "",
    grade: initial?.grade ? String(initial.grade) : "",
    school: initial?.school || "",
  }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const up = (k) => (e) => {
    setD((x) => ({ ...x, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    const errs = validate(d);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      e.currentTarget.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    setBusy(true);
    setServerError("");
    const body = { firstName: clean(d.firstName), lastName: clean(d.lastName), school: clean(d.school), grade: Number(d.grade) };
    try {
      if (edit) {
        const s = await session.update(body);
        toast.success("მონაცემები განახლდა");
        onDone?.(s);
      } else {
        const { student, created } = await session.register(body);
        toast.success(created ? `გამარჯობა, ${student.firstName}! პროფილი შეიქმნა.` : `კეთილი იყოს შენი დაბრუნება, ${student.firstName}!`);
        onDone?.(student);
      }
    } catch (err) {
      setServerError(err.message || "ვერ მოხერხდა. სცადე თავიდან.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="სახელი" error={errors.firstName}>
          {(p) => <Input {...p} name="firstName" autoComplete="given-name" maxLength={40} value={d.firstName} onChange={up("firstName")} />}
        </Field>
        <Field label="გვარი" error={errors.lastName}>
          {(p) => <Input {...p} name="lastName" autoComplete="family-name" maxLength={40} value={d.lastName} onChange={up("lastName")} />}
        </Field>
      </div>
      <Field label="კლასი" error={errors.grade}>
        {(p) => (
          <Select {...p} name="grade" value={d.grade} onChange={up("grade")}>
            <option value="">აირჩიე კლასი</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {ord(i + 1)} კლასი
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="სკოლა" error={errors.school} hint="მაგ.: თბილისის №1 საჯარო სკოლა">
        {(p) => <Input {...p} name="school" autoComplete="organization" maxLength={80} value={d.school} onChange={up("school")} />}
      </Field>

      {serverError && (
        <p role="alert" className="rounded-[var(--control-radius)] bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger-foreground">
          {serverError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            გაუქმება
          </Button>
        )}
        <Button type="submit" size="lg" disabled={busy} className="sm:min-w-44">
          {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          {edit ? "შენახვა" : "დაწყება"}
          {!busy && !edit && <ArrowRight aria-hidden="true" />}
        </Button>
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-subtle-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        შენი სახელი, კლასი, სკოლა, ვიზიტები, ამოცანების პროგრესი და ტესტების შედეგები ინახება და ჩანს მასწავლებლისთვის. იგივე მონაცემებით შესვლისას ნებისმიერ მოწყობილობაზე შენი შედეგები დაგიბრუნდება.
      </p>
    </form>
  );
}
