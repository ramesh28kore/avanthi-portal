import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getCheatSheetBySlug } from "@/lib/portal.functions";

export const Route = createFileRoute("/_authenticated/cheat-sheets/$slug")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["cheat-sheet", params.slug],
      queryFn: () => getCheatSheetBySlug({ data: { slug: params.slug } }),
    });
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Cheat sheet"} — CRT Learning Portal` },
      { name: "description", content: "Study this Python cheat sheet." },
    ],
  }),
  component: CheatSheetDetailPage,
});

function CheatSheetDetailPage() {
  const { slug } = Route.useParams();
  const getSheet = useServerFn(getCheatSheetBySlug);
  const { data: sheet } = useSuspenseQuery({
    queryKey: ["cheat-sheet", slug],
    queryFn: () => getSheet({ data: { slug } }),
  });

  const content = sheet.content as Array<{ heading?: string; body?: string; code?: string }>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/cheat-sheets"
        className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to cheat sheets
      </Link>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#d4a042]">{sheet.topic}</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {sheet.title}
            </h1>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {content.map((section, i) => (
            <section key={i} className="space-y-3">
              {section.heading && (
                <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
              )}
              {section.body && (
                <p className="text-muted-foreground leading-relaxed">{section.body}</p>
              )}
              {section.code && (
                <pre className="overflow-x-auto rounded-lg bg-[#1a2744] p-4 text-sm text-white">
                  <code>{section.code}</code>
                </pre>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
