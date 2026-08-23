import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Code, ArrowRight } from "lucide-react";
import { listPracticeProblems } from "@/lib/portal.functions";

export const Route = createFileRoute("/_authenticated/practice/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["practice-problems"],
      queryFn: () => listPracticeProblems(),
    });
  },
  head: () => ({
    meta: [
      { title: "Practice — CRT Learning Portal" },
      { name: "description", content: "Practice coding problems." },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const getProblems = useServerFn(listPracticeProblems);
  const { data } = useSuspenseQuery({
    queryKey: ["practice-problems"],
    queryFn: getProblems,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Practice problems</h1>
        <p className="mt-2 text-muted-foreground">
          Solve problems in the browser and get instant feedback.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((problem) => (
          <Link
            key={problem.id}
            to="/practice/$id"
            params={{ id: problem.id }}
            className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Code className="h-6 w-6" />
              </div>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{problem.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{problem.topic}</p>
            <div className="mt-4 flex items-center text-sm font-medium text-foreground">
              Solve <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
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
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles}`}>
      {difficulty}
    </span>
  );
}
