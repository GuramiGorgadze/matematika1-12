import { useEffect } from "react";
import { Container, PageHeader } from "@/components/layout/Container";
import { GradeIndex } from "@/features/book/GradeIndex";
import { useSession } from "@/features/student/session";

export default function GradesPage() {
  const { student } = useSession();
  useEffect(() => {
    document.title = "კლასები · მათემატიკა";
  }, []);
  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        overline="სარჩევი"
        title="კლასები"
        lead="თორმეტი კლასი, სამი საფეხური. თითოეულში — თავები, გაკვეთილები, ამოცანები ავტომატური შემოწმებით და შემაჯამებელი ტესტები."
        className="mb-12 border-b-[1.5px] border-rule-ink pb-8"
      />
      <GradeIndex mine={student?.grade} level={2} />
    </Container>
  );
}
