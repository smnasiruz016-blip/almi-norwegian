// Stub for @/lib/auth, used ONLY by scripts/verify-no-grade-task.mts (RR-399 A2).
// A FREE account inside its 48 hours, email verified: exactly the caller who could have chosen which free use (Writing or
// Speaking) an AI scoring counted as, when the route took the task type from the body.
export async function getCurrentUser() {
  return {
    id: "rr399-free-user",
    email: "rr399@example.test",
    emailVerified: new Date(Date.now() - 60_000),
    createdAt: new Date(Date.now() - 3_600_000),
    subscriptionStatus: null,
    stripeSubscriptionId: null,
    subscriptionCurrentPeriodEnd: null,
    compProUntil: null,
  };
}

export async function requireUser() {
  return getCurrentUser();
}
