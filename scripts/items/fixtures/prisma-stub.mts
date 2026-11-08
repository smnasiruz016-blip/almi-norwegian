// Stub for @/lib/prisma, used ONLY by scripts/items/grade-integrity-proof.mts.
//
// The proof runs with no database and no DATABASE_URL. The single prisma call on the
// grading path is the attempt write (since RR-399 A1 it saves in production: the FK to
// the never-filled NorwegianItem table is gone). This stub rejects rather than resolving,
// so the proof asserts something worth asserting — that a failed persist (a database
// outage) never changes the score the learner is given.

export const prisma = {
  norwegianAttempt: {
    create: async (): Promise<never> => {
      throw new Error("stubbed: no database in the proof harness");
    },
  },
};
