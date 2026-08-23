import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ArrowRight, Clock } from "lucide-react";
import { listExams } from "@/lib/portal.functions";

export const Route = createFileRoute("/_authenticated/exams/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["exams"],
      queryFn: () => listExams(),
    });
  },
  head: () => ({
    meta: [
      { title: "Exams — CRT Learning Portal" },
      { name: "description", content: "Take timed MCQ exams." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const getExams = useServerFn(listExams);
  const { data } = useSuspenseQuery({
    queryKey: ["exams"],
    queryFn: getExams,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Exams</h1>
        <p className="mt-2 text-muted-foreground">
          Timed multiple-choice assessments to test your knowledge.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((exam) => (
          <Link
            key={exam.id}
            to="/exams/$id"
            params={{ id: exam.id }}
            className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {exam.time_limit_minutes} minutes
            </div>
            <h3 className="mt-2 text-lg font-semibold text-foreground">{exam.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{exam.description}</p>
            <div className="mt-4 flex items-center text-sm font-medium text-foreground">
              Start exam <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
