import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, Code, FileText, ArrowRight } from "lucide-react";
import { listCheatSheets, listPracticeProblems, listExams } from "@/lib/portal.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["dashboard"],
      queryFn: async () => {
        const [cheatSheets, problems, exams] = await Promise.all([
          listCheatSheets(),
          listPracticeProblems(),
          listExams(),
        ]);
        return { cheatSheets, problems, exams };
      },
    });
  },
  head: () => ({
    meta: [
      { title: "Dashboard — CRT Learning Portal" },
      { name: "description", content: "Your personal CRT learning dashboard." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const getDashboard = useServerFn(async () => {
    const [cheatSheets, problems, exams] = await Promise.all([
      listCheatSheets(),
      listPracticeProblems(),
      listExams(),
    ]);
    return { cheatSheets, problems, exams };
  });

  const { data } = useSuspenseQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Your dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Pick up where you left off. Study, practice, and assess your progress.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Cheat sheets</h2>
          <Link
            to="/cheat-sheets"
            className="flex items-center text-sm font-medium text-foreground hover:underline"
          >
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.cheatSheets.slice(0, 3).map((sheet) => (
            <Link
              key={sheet.id}
              to="/cheat-sheets/$slug"
              params={{ slug: sheet.slug }}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                  {sheet.topic}
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-foreground group-hover:underline">
                {sheet.title}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Practice problems</h2>
          <Link
            to="/practice"
            className="flex items-center text-sm font-medium text-foreground hover:underline"
          >
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.problems.slice(0, 3).map((problem) => (
            <Link
              key={problem.id}
              to="/practice/$id"
              params={{ id: problem.id }}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Code className="h-5 w-5" />
                </div>
                <DifficultyBadge difficulty={problem.difficulty} />
              </div>
              <h3 className="mt-4 font-semibold text-foreground group-hover:underline">
                {problem.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{problem.topic}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Exams</h2>
          <Link
            to="/exams"
            className="flex items-center text-sm font-medium text-foreground hover:underline"
          >
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.exams.map((exam) => (
            <Link
              key={exam.id}
              to="/exams/$id"
              params={{ id: exam.id }}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                  {exam.time_limit_minutes} min
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-foreground group-hover:underline">
                {exam.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{exam.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles =
    difficulty === "easy"
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      : difficulty === "medium"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${styles}`}>
      {difficulty}
    </span>
  );
}
