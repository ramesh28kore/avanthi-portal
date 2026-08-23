import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { getExamById, getExamQuestions, startExamAttempt, submitExamAttempt } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/exams/$id/attempt")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["exam", params.id],
      queryFn: () => getExamById({ id: params.id }),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["exam-questions", params.id],
      queryFn: () => getExamQuestions({ exam_id: params.id }),
    });
  },
  head: () => ({
    meta: [
      { title: "Exam attempt — CRT Learning Portal" },
      { name: "description", content: "Answer the exam questions." },
    ],
  }),
  component: ExamAttemptPage,
});

function ExamAttemptPage() {
  const { id } = Route.useParams();
  const getExam = useServerFn(getExamById);
  const getQuestions = useServerFn(getExamQuestions);
  const startAttempt = useServerFn(startExamAttempt);
  const submitAttempt = useServerFn(submitExamAttempt);

  const { data: exam } = useSuspenseQuery({
    queryKey: ["exam", id],
    queryFn: () => getExam({ id }),
  });
  const { data: questions } = useSuspenseQuery({
    queryKey: ["exam-questions", id],
    queryFn: () => getQuestions({ exam_id: id }),
  });

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [timeLeft, setTimeLeft] = useState(exam.time_limit_minutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    startAttempt({ exam_id: id }).then((res) => setAttemptId(res.attempt_id));
  }, [id, startAttempt]);

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  async function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    const answerList = questions.map((q) => ({
      question_id: q.id,
      selected_option_index: answers[q.id] ?? null,
    }));
    const res = await submitAttempt({
      attempt_id: attemptId ?? "",
      exam_id: id,
      answers: answerList,
    });
    setResult(res);
    toast.success(`Exam submitted! Score: ${res.score}/${res.total}`);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (submitted && result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          to="/exams"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to exams
        </Link>
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-100">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Exam submitted</h1>
          <p className="mt-2 text-muted-foreground">
            You scored {result.score} out of {result.total}.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/exams">Back to exams</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">Answer all questions before time runs out.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-accent-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-mono font-medium">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {!attemptId && (
        <div className="rounded-lg bg-accent p-4 text-accent-foreground">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          Starting your attempt...
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Question {index + 1}</p>
            <p className="mt-1 text-lg font-medium text-foreground">{q.question}</p>
            <div className="mt-4 space-y-2">
              {q.options.map((option, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    answers[q.id] === i
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={i}
                    checked={answers[q.id] === i}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                    className="h-4 w-4 text-primary"
                  />
                  <span className="text-foreground">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={!attemptId}>
          Submit exam
        </Button>
      </div>
    </div>
  );
}
