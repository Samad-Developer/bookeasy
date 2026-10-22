import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError, getErrorMessage } from '@/lib/api-client';

// Puts an error from the API onto the form:
//  - VALIDATION_ERROR lists the fields that failed -> shown under those inputs
//  - EMAIL_TAKEN                                    -> shown under the email input
//  - everything else (wrong password, too many attempts, server down) -> one message at the top of the form
export function applyServerError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  formFields: Path<T>[],
) {
  if (error instanceof ApiError) {
    if (error.code === 'EMAIL_TAKEN') {
      setError('email' as Path<T>, { message: error.message });
      return;
    }

    let shownUnderAField = false;
    for (const [field, message] of Object.entries(error.fieldErrors)) {
      if ((formFields as string[]).includes(field)) {
        setError(field as Path<T>, { message });
        shownUnderAField = true;
      }
    }
    if (shownUnderAField) return;
  }

  setError('root', { message: getErrorMessage(error) });
}