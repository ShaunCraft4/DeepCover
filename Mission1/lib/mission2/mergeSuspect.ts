import type { Mission2Secrets, PublicSuspectProfile, SuspectProfile } from "./types";

export function mergePublicWithSecrets(
  pub: PublicSuspectProfile,
  secrets: Mission2Secrets,
): SuspectProfile {
  return {
    ...pub,
    hidden_truth: secrets.hidden_truth,
    launch_code: secrets.launch_code,
  };
}
