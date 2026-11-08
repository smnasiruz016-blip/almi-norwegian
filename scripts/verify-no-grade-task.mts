// RR-399 A2 · /api/no/grade: the SERVER decides the task type from the item it loads, never from the request body. A body that says
// SPEAKING for a Writing item is refused (400), and the item alone decides Writing or Speaking. Offline: auth, prisma and the AI
// client are stubbed at resolve time and ANTHROPIC_API_KEY is removed from this process, so no database and no AI ($0). The REAL
// route handler is what is tested. Run: npx tsx scripts/verify-no-grade-task.mts
import * as nodeModule from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

delete process.env.ANTHROPIC_API_KEY;

type ResolveResult = { url: string; format?: string; shortCircuit?: boolean };
type NextResolve = (specifier: string, context: unknown) => ResolveResult;
const registerHooks = (nodeModule as unknown as {
  registerHooks: (hooks: { resolve?: (s: string, c: unknown, n: NextResolve) => ResolveResult }) => void;
}).registerHooks;
const FIX = path.join(import.meta.dirname, "items", "fixtures");
const STUBS: Record<string, string> = {
  "@/lib/auth": path.join(FIX, "rr399-auth-stub.mts"),
  "@/lib/prisma": path.join(FIX, "prisma-stub.mts"),
  "@/lib/ai/anthropic-client": path.join(FIX, "rr399-ai-stub.mts"),
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = STUBS[specifier];
    if (stub) return { url: pathToFileURL(stub).href, format: "module", shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

let failed = 0;
const t = async (name: string, fn: () => unknown | Promise<unknown>) => {
  try { await fn(); console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}\n       ${(e as Error).message.split("\n")[0]}`); }
};
const must = (cond: boolean, msg: string) => { if (!cond) throw new Error(msg); };

const { getItems, stableItemId } = await import("../src/lib/no/items");
const { resolveGradeTask, buildGradePrompt } = await import("../src/lib/no/grade-task");
const { POST } = await import("../src/app/api/no/grade/route");

const writing = getItems({ skill: "WRITING" }).find((it) => it.taskType === "WRITING_PROMPT");
const speaking = getItems({ skill: "SPEAKING" }).find((it) => it.taskType === "SPEAKING_PROMPT");
if (!writing || !speaking) { console.log("  FAIL no Writing or Speaking item in the bundles"); process.exit(1); }
const wId = stableItemId(writing), sId = stableItemId(speaking);
const answer = "Jeg skriver et svar som er lenger enn tjue tegn, for testen.";
const post = (body: unknown) => POST(new Request("http://localhost/api/no/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));

console.log(`RR-399 A2 · Writing item ${wId} ("${writing.title}"), Speaking item ${sId}`);
await t("the route refuses (400) a body that says SPEAKING for a Writing item", async () => {
  const r = await post({ itemId: wId, taskType: "SPEAKING_PROMPT", skill: "SPEAKING", response: answer });
  must(r.status === 400, `HTTP ${r.status} ${JSON.stringify(await r.json())}`);
});
await t("the route refuses (400) when only the body's taskType disagrees", async () => {
  const r = await post({ itemId: wId, taskType: "SPEAKING_PROMPT", response: answer });
  must(r.status === 400, `HTTP ${r.status}`);
});
await t("a Writing item is never graded as Speaking, whatever the body says", () => {
  const r = resolveGradeTask({ itemId: wId, taskType: "SPEAKING_PROMPT", skill: "SPEAKING" });
  must(!r.ok || r.kind === "WRITING", `resolved as ${r.ok ? r.kind : "refused"}`);
  const plain = resolveGradeTask({ itemId: wId });
  must(plain.ok && plain.kind === "WRITING" && !plain.isSpeaking, "a Writing item did not resolve as WRITING");
  if (plain.ok) {
    const p = buildGradePrompt(plain, answer);
    must(/This is a WRITING task/.test(p.system) && !/SPEAKING task/.test(p.system), "the prompt is not the Writing prompt");
    must(p.user.includes(writing.title), "the prompt does not carry the server item's own title");
  }
});
await t("control: a Speaking item resolves as SPEAKING; an unknown id is 404; no id is 400", () => {
  const s = resolveGradeTask({ itemId: sId, taskType: "SPEAKING_PROMPT", skill: "SPEAKING" });
  must(s.ok && s.kind === "SPEAKING", "the Speaking item did not resolve as SPEAKING");
  const u = resolveGradeTask({ itemId: "0000000000000000" });
  must(!u.ok && u.status === 404, "an unknown id was not a 404");
  const n = resolveGradeTask({});
  must(!n.ok && n.status === 400, "a missing id was not a 400");
});
await t("control: a matching request is accepted (no AI key here, so it falls back to self-rating, HTTP 200)", async () => {
  const r = await post({ itemId: wId, taskType: "WRITING_PROMPT", skill: "WRITING", response: answer });
  const j = (await r.json()) as { ok?: boolean; available?: boolean };
  must(r.status === 200 && j.ok === true && j.available === false, `HTTP ${r.status} ${JSON.stringify(j)}`);
});
await t("the route reads no task fact from the body (no body.taskType/skill/title/prompt/criteria/cefr/exam)", () => {
  const src = readFileSync(path.join(process.cwd(), "src/app/api/no/grade/route.ts"), "utf8").replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
  must(!/body\.(taskType|skill|title|prompt|criteria|cefr|exam)\b/.test(src), "the route still reads a task fact from the body");
  must(/resolveGradeTask\(body\)/.test(src), "the route does not resolve the task from the item");
});

console.log(failed ? `\nA2 GRADE-TASK TEST FAIL (${failed})` : "\nA2 GRADE-TASK TEST PASS");
process.exit(failed ? 1 : 0);
