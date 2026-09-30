import type { AuthFormState } from "./actions"

export const initialAuthFormState: AuthFormState = {
  fieldErrors: {},
  formError: null,
  unverifiedEmail: null,
}
