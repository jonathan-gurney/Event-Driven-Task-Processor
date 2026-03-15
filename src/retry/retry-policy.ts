export type RetryDecision = {
  shouldRetry: boolean;
  nextAttemptInMs: number;
};

export function getRetryDecision(attempts: number, maxAttempts = 3): RetryDecision {
  if (attempts >= maxAttempts) {
    return {
      shouldRetry: false,
      nextAttemptInMs: 0
    };
  }

  return {
    shouldRetry: true,
    nextAttemptInMs: attempts * 1000
  };
}
