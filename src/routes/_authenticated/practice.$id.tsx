import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getPracticeProblem, submitPracticeSolution } from "@/lib/portal.functions";
import { runPython } from "@/lib/code-judge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/practice/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["practice-problem", params.id],
      queryFn: () => getPracticeProblem({ data: { id: params.id } }),
    });
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Practice"} — CRT Learning Portal` },
      { name: "description", content: "Solve this coding practice problem." },
    ],
  }),
  component: PracticeProblemPage,
});

function PracticeProblemPage() {
  const { id } = Route.useParams();
  const getProblem = useServerFn(getPracticeProblem);
  const submitSolution = useServerFn(submitPracticeSolution);

  const { data: problem } = useSuspenseQuery({
    queryKey: ["practice-problem", id],
    queryFn: () => getProblem({ data: { id } }),
  });

  const [code, setCode] = useState(problem.starter_code);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof runPython> | null>(null);

  const testCases = (problem.test_cases ?? []) as {
    input: string;
    expected_output: string;
    hidden?: boolean;
  }[];

  async function handleRun() {
    setIsRunning(true);
    try {
      const runResults = runPython(code, testCases);
      setResults(runResults);
      const allPassed = runResults.every((r) => r.passed);
      const output = runResults
        .map((r) => `Input: ${r.input}\nOutput: ${r.output}\nExpected: ${r.expected}`)
        .join("\n---\n");

      await submitSolution({
        data: {
          problem_id: problem.id,
          code,
          passed: allPassed,
          output,
        },
      });

      if (allPassed) {
        toast.success("All test cases passed!");
      } else {
        toast.info("Some test cases failed. Keep trying!");
      }
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/practice"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to practice
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground capitalize">
                {problem.difficulty}
              </span>
              <span className="text-sm text-muted-foreground">{problem.topic}</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              {problem.title}
            </h1>
            <p className="mt-3 whitespace-pre-line text-muted-foreground leading-relaxed">
              {problem.description}
            </p>
          </div>

          {results && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Results</h2>
              <div className="space-y-3">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-lg p-3 ${
                      r.passed
                        ? "bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100"
                        : "bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100"
                    }`}
                  >
                    {r.passed ? <CheckCircle className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                    <div className="text-sm">
                      <p className="font-medium">Test case {i + 1}</p>
                      <p className="mt-1 opacity-90">Input: {r.input}</p>
                      <p className="opacity-90">Output: {r.output || "(empty)"}</p>
                      <p className="opacity-90">Expected: {r.expected}</p>
                      {r.error && <p className="mt-1 text-red-600">{r.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your solution</h2>
            <Button onClick={handleRun} disabled={isRunning}>
              {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Run tests
            </Button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-[400px] w-full rounded-lg border border-input bg-[#1a2744] p-4 font-mono text-sm text-white focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
