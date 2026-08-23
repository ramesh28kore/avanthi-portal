import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Code, FileText, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CRT — Your Learning Space" },
      { name: "description", content: "Learn Python with focused cheat sheets, in-browser coding practice, and timed MCQ exams." },
      { property: "og:title", content: "CRT — Your Learning Space" },
      { property: "og:description", content: "Learn Python with focused cheat sheets, in-browser coding practice, and timed MCQ exams." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground">CRT</span>
              <span className="ml-2 text-sm text-muted-foreground hidden sm:inline">Learning Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-sm font-medium text-foreground hover:text-foreground/80"
            >
              Sign in
            </Link>
            <Button asChild>
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#d4a042]">
              Your learning space
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Learn with focus. Build with confidence.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              A clean, focused workspace for Python learners. Study topic-wise cheat sheets, practice
              coding in your browser, and test your knowledge with timed MCQ exams.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Open your workspace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">Join with a code</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 sm:grid-cols-3">
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="Cheat sheets"
                description="Topic-wise Python references with worked examples you can review anytime."
              />
              <FeatureCard
                icon={<Code className="h-6 w-6" />}
                title="Coding practice"
                description="In-browser editor with instant verdicts against hidden test cases."
              />
              <FeatureCard
                icon={<BookOpen className="h-6 w-6" />}
                title="Timed exams"
                description="MCQ assessments with full answer review and scoring."
              />
            </div>
          </div>
        </section>

        <section className="px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Ready to start learning?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Sign in to access your personal workspace, track progress, and join your class.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link to="/auth">Sign in to CRT</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          CRT Learning Portal — Built for focused learners.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
