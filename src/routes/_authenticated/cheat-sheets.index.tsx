import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, ArrowRight } from "lucide-react";
import { listCheatSheets } from "@/lib/portal.functions";

export const Route = createFileRoute("/_authenticated/cheat-sheets/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["cheat-sheets"],
      queryFn: () => listCheatSheets(),
    });
  },
  head: () => ({
    meta: [
      { title: "Cheat sheets — CRT Learning Portal" },
      { name: "description", content: "Browse Python cheat sheets." },
    ],
  }),
  component: CheatSheetsPage,
});

function CheatSheetsPage() {
  const getCheatSheets = useServerFn(listCheatSheets);
  const { data } = useSuspenseQuery({
    queryKey: ["cheat-sheets"],
    queryFn: getCheatSheets,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Cheat sheets</h1>
        <p className="mt-2 text-muted-foreground">Quick topic-wise references for Python.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((sheet) => (
          <Link
            key={sheet.id}
            to="/cheat-sheets/$slug"
            params={{ slug: sheet.slug }}
            className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {sheet.topic}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-foreground">{sheet.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
