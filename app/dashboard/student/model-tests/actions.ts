"use server"

import type { ModelTestAttemptDto, ModelTestSubmitResponse } from "@/lib/types"
import { authenticatedApiFetch } from "@/lib/api-client"

/** Starts (or resumes an unexpired, unsubmitted) attempt. Questions carry no correct answers. */
export async function startModelTestAttemptAction(testId: string) {
  return authenticatedApiFetch<ModelTestAttemptDto>(
    `/model-tests/${testId}/attempts`,
    { method: "POST" }
  )
}

/**
 * Late submissions are scored as-is by the backend and flagged
 * submittedLate. This action never rejects a late submit on the client.
 */
export async function submitModelTestAttemptAction(
  testId: string,
  attemptId: string,
  answers: Record<string, string[]>
) {
  return authenticatedApiFetch<ModelTestSubmitResponse>(
    `/model-tests/${testId}/attempts/${attemptId}/submit`,
    {
      body: JSON.stringify({ answers }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  )
}
