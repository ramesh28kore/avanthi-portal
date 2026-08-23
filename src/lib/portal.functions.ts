import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const publicCheatSheetSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  topic: z.string(),
  ordering: z.number(),
  content: z.any(),
});

export const listCheatSheets = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("cheat_sheets")
    .select("id, title, slug, topic, ordering, content")
    .eq("published", true)
    .order("ordering", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => publicCheatSheetSchema.parse(item));
});

export const getCheatSheetBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const { data: item, error } = await supabaseAdmin
      .from("cheat_sheets")
      .select("id, title, slug, topic, ordering, content")
      .eq("slug", data.slug)
      .eq("published", true)
      .single();

    if (error) throw new Error(error.message);
    return publicCheatSheetSchema.parse(item);
  });

const publicProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
  difficulty: z.string(),
  ordering: z.number(),
  description: z.string(),
  starter_code: z.string(),
  test_cases: z.array(z.record(z.any())).nullable().default([]),
});

export const listPracticeProblems = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("practice_problems")
    .select("id, title, topic, difficulty, ordering, description, starter_code, test_cases")
    .eq("published", true)
    .order("ordering", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => publicProblemSchema.parse(item));
});

export const getPracticeProblem = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { data: item, error } = await supabaseAdmin
      .from("practice_problems")
      .select("id, title, topic, difficulty, ordering, description, starter_code, test_cases")
      .eq("id", data.id)
      .eq("published", true)
      .single();

    if (error) throw new Error(error.message);
    return publicProblemSchema.parse(item);
  });

export const submitPracticeSolution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      problem_id: z.string(),
      code: z.string(),
      passed: z.boolean(),
      output: z.string().optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("practice_submissions").insert({
      problem_id: data.problem_id,
      user_id: context.userId,
      code: data.code,
      passed: data.passed,
      output: data.output ?? null,
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });

const publicExamSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  time_limit_minutes: z.number(),
  pass_score: z.number(),
  published: z.boolean(),
});

export const listExams = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("exams")
    .select("id, title, description, time_limit_minutes, pass_score, published")
    .eq("published", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => publicExamSchema.parse(item));
});

export const getExamById = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { data: item, error } = await supabaseAdmin
      .from("exams")
      .select("id, title, description, time_limit_minutes, pass_score, published")
      .eq("id", data.id)
      .eq("published", true)
      .single();

    if (error) throw new Error(error.message);
    return publicExamSchema.parse(item);
  });

export const getExamQuestions = createServerFn({ method: "GET" })
  .validator(z.object({ exam_id: z.string() }))
  .handler(async ({ data }) => {
    const { data: items, error } = await supabaseAdmin
      .from("exam_questions")
      .select("id, exam_id, question, options, ordering, correct_option_index, explanation")
      .eq("exam_id", data.exam_id)
      .order("ordering", { ascending: true });

    if (error) throw new Error(error.message);
    return (items ?? []).map((q) => ({
      id: q.id,
      exam_id: q.exam_id,
      question: q.question,
      options: q.options as string[],
      ordering: q.ordering,
      correct_option_index: q.correct_option_index,
      explanation: q.explanation,
    }));
  });

export const startExamAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ exam_id: z.string() }))
  .handler(async ({ data, context }) => {
    const { data: existing, error: existingError } = await context.supabase
      .from("exam_attempts")
      .select("id, submitted_at")
      .eq("exam_id", data.exam_id)
      .eq("user_id", context.userId)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (!existingError && existing && !existing.submitted_at) {
      return { attempt_id: existing.id };
    }

    const { data: attempt, error } = await context.supabase
      .from("exam_attempts")
      .insert({ exam_id: data.exam_id, user_id: context.userId })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { attempt_id: attempt.id };
  });

export const submitExamAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      attempt_id: z.string(),
      exam_id: z.string(),
      answers: z.array(
        z.object({
          question_id: z.string(),
          selected_option_index: z.number().nullable(),
        })
      ),
    })
  )
  .handler(async ({ data, context }) => {
    const { data: questions, error: qError } = await context.supabase
      .from("exam_questions")
      .select("id, correct_option_index")
      .eq("exam_id", data.exam_id);

    if (qError) throw new Error(qError.message);

    let score = 0;
    for (const answer of data.answers) {
      const question = questions?.find((q) => q.id === answer.question_id);
      if (question && answer.selected_option_index === question.correct_option_index) {
        score += 1;
      }
    }

    const { error: answersError } = await context.supabase
      .from("exam_answers")
      .insert(
        data.answers.map((a) => ({
          attempt_id: data.attempt_id,
          question_id: a.question_id,
          selected_option_index: a.selected_option_index,
        }))
      );

    if (answersError) throw new Error(answersError.message);

    const { error: updateError } = await context.supabase
      .from("exam_attempts")
      .update({ submitted_at: new Date().toISOString(), score })
      .eq("id", data.attempt_id)
      .eq("user_id", context.userId);

    if (updateError) throw new Error(updateError.message);

    return { score, total: questions?.length ?? 0 };
  });

export const getUserSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("practice_submissions")
      .select("id, problem_id, code, passed, created_at, practice_problems!inner(title)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return (data ?? []).map((s) => ({
      id: s.id,
      problem_id: s.problem_id,
      code: s.code,
      passed: s.passed,
      created_at: s.created_at,
      title: (s.practice_problems as unknown as { title: string }).title,
    }));
  });

export const getUserExamAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exam_attempts")
      .select("id, exam_id, score, started_at, submitted_at, exams!inner(title)")
      .eq("user_id", context.userId)
      .order("started_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return (data ?? []).map((a) => ({
      id: a.id,
      exam_id: a.exam_id,
      score: a.score,
      started_at: a.started_at,
      submitted_at: a.submitted_at,
      title: (a.exams as unknown as { title: string }).title,
    }));
  });

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .limit(1);
    return (data?.length ?? 0) > 0;
  });
