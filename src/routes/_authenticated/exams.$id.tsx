import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { getExamById } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/exams/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["exam", params.id],
      queryFn: () => getExamById({ data: { id: params.id } }),
    });
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Exam"} — CRT Learning Portal` },
      { name: "description", content: "Start this exam." },
    ],
  }),
  component: ExamDetailPage,
});

function ExamDetailPage() {
  const { id } = Route.useParams();
  const getExam = useServerFn(getExamById);
  const { data: exam } = useSuspenseQuery({
    queryKey: ["exam", id],
    queryFn: () => getExam({ data: { id } }),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/exams"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to exams
      </Link>

      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#d4a042]">Timed exam</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{exam.title}</h1>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-muted-foreground">{exam.description}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {exam.time_limit_minutes} minutes · Pass score: {exam.pass_score}%
            </span>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-accent p-4 text-sm text-accent-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Before you start</p>
              <p className="mt-1">
                Once you begin the timer will start. You can submit early, but you cannot pause the
                exam.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Button size="lg" asChild>
            <Link to="/exams/$id/attempt" params={{ id }}>
              Start exam
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
