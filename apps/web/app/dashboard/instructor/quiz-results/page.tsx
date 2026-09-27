import type { InstructorAnalyticsOverviewResponse, InstructorQuizResultsResponse } from "@workspace/types"

import { authenticatedApiFetch } from "@/lib/api-client"
import { Card, CardContent } from "@workspace/ui/components/card"
import { PageHeader } from "@workspace/ui/components/page-header"

export const dynamic = "force-dynamic"

export default async function InstructorQuizResultsPage() {
  const overview = await authenticatedApiFetch<InstructorAnalyticsOverviewResponse>("/instructor/overview", { cache: "no-store" })
  const responses = await Promise.all(overview.courses.map((course) => authenticatedApiFetch<InstructorQuizResultsResponse>(`/instructor/courses/${course.id}/quiz-results`, { cache: "no-store" })))
  const results = responses.flatMap((response) => response.results)
  return <div className="space-y-8"><PageHeader eyebrow="Instructor dashboard" lede="Review every quiz attempt across your courses." title="Quiz results" /><Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="p-4">Student</th><th className="p-4">Course</th><th className="p-4">Quiz</th><th className="p-4">Score</th><th className="p-4">Completed</th></tr></thead><tbody className="divide-y divide-border">{results.map((result) => <tr key={result.attemptId}><td className="p-4"><p>{result.studentName ?? "Student"}</p><p className="text-xs text-muted-foreground">{result.studentEmail}</p></td><td className="p-4">{result.courseTitle}</td><td className="p-4">{result.quizTitle}</td><td className="p-4 font-mono text-primary">{result.score}/{result.totalQuestions} ({result.percentage}%)</td><td className="p-4 text-muted-foreground">{new Date(result.completedAt).toLocaleDateString()}</td></tr>)}</tbody></table>{results.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No quiz attempts yet.</p> : null}</CardContent></Card></div>
}
