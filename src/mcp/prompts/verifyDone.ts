import { z } from "zod";

export const verifyDonePrompt = {
  name: "verify_done",
  title: "Verify Done",
  description: "Determine whether work is complete using verification checks.",
  schema: {
    session_id: z.string(),
    artifact_ref: z.string(),
    verification_checks: z.string()
  },
  text: (args: Record<string, unknown>) => `Verify completion for ${args.artifact_ref} in workflow session ${args.session_id}.

Verification checks:
${args.verification_checks}

Decide whether evidence is sufficient to mark the workflow verified.`
};
