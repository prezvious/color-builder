export const COMPLIANCE_ERROR_MESSAGE =
  "Your text does not match the template; please correct it.";

export class ComplianceError extends Error {
  constructor(message: string = COMPLIANCE_ERROR_MESSAGE) {
    super(message);
    this.name = "ComplianceError";
  }
}

export function isComplianceError(error: unknown): error is ComplianceError {
  return error instanceof ComplianceError;
}
