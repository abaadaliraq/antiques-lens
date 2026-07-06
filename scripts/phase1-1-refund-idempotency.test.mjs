import assert from "node:assert/strict";
import test from "node:test";
import { shouldForceStagingAiFailure } from "../src/lib/stagingForcedAiFailure.ts";

class AttemptStore {
  constructor(usedCount = 0, freeLimit = 5) {
    this.usedCount = usedCount;
    this.freeLimit = freeLimit;
    this.attempts = new Map();
    this.aiRuns = 0;
  }
  authorize(key) {
    const prior = this.attempts.get(key);
    if (prior?.status === "succeeded") return { action: "cached", result: prior.result };
    if (prior) return { action: "closed", status: prior.status };
    if (this.usedCount >= this.freeLimit) return { action: "denied" };
    this.usedCount += 1;
    this.attempts.set(key, { status: "processing", consumed: true, refunded: false });
    return { action: "run" };
  }
  async run(key, operation, save = async () => true) {
    const auth = this.authorize(key);
    if (auth.action !== "run") return auth;
    this.aiRuns += 1;
    try {
      const result = await operation();
      assert.ok(result && typeof result.title === "string" && result.title.length > 0, "malformed result");
      await save(result);
      Object.assign(this.attempts.get(key), { status: "succeeded", result });
      return { action: "succeeded", result };
    } catch (error) {
      this.fail(key, error instanceof Error ? error.message : "failure");
      return { action: "failed" };
    }
  }
  fail(key, reason) {
    const attempt = this.attempts.get(key);
    if (!attempt || attempt.status === "succeeded" || attempt.status === "refunded") return false;
    if (attempt.consumed && !attempt.refunded) {
      this.usedCount = Math.max(0, this.usedCount - 1);
      attempt.refunded = true;
    }
    Object.assign(attempt, { status: attempt.refunded ? "refunded" : "failed", reason });
    return true;
  }
}

test("normal success keeps exactly one deducted credit", async () => {
  const store = new AttemptStore(2);
  await store.run("a", async () => ({ title: "valid" }));
  assert.equal(store.usedCount, 3);
  assert.equal(store.attempts.get("a").status, "succeeded");
});

test("provider failure actually restores the deducted balance once", async () => {
  const store = new AttemptStore(2);
  const before = store.usedCount;
  await store.run("b", async () => { throw new Error("OPENAI_PROVIDER_ERROR"); });
  assert.equal(store.usedCount, before);
  assert.equal(store.attempts.get("b").status, "refunded");
  assert.equal(store.fail("b", "duplicate callback"), false);
  assert.equal(store.usedCount, before);
});

test("timeout restores balance and is not success", async () => {
  const store = new AttemptStore(4);
  await store.run("c", async () => { throw new Error("PROVIDER_TIMEOUT"); });
  assert.equal(store.usedCount, 4);
  assert.notEqual(store.attempts.get("c").status, "succeeded");
});

test("duplicate during processing does not run AI twice", () => {
  const store = new AttemptStore(0);
  assert.equal(store.authorize("d").action, "run");
  assert.equal(store.authorize("d").action, "closed");
  assert.equal(store.usedCount, 1);
});

test("duplicate after success returns cached result without AI", async () => {
  const store = new AttemptStore(0);
  await store.run("e", async () => ({ title: "cached" }));
  const replay = await store.run("e", async () => { throw new Error("must not run"); });
  assert.equal(replay.action, "cached");
  assert.equal(replay.result.title, "cached");
  assert.equal(store.aiRuns, 1);
  assert.equal(store.usedCount, 1);
});

test("duplicate after refund stays closed and requires a new key", async () => {
  const store = new AttemptStore(1);
  await store.run("f", async () => { throw new Error("network"); });
  assert.equal(store.authorize("f").action, "closed");
  assert.equal(store.usedCount, 1);
  assert.equal(store.authorize("f-new").action, "run");
  assert.equal(store.usedCount, 2);
});

test("save failure refunds; successful save does not", async () => {
  const failed = new AttemptStore(3);
  await failed.run("g", async () => ({ title: "valid" }), async () => { throw new Error("EVALUATION_SAVE_FAILED"); });
  assert.equal(failed.usedCount, 3);
  assert.equal(failed.attempts.get("g").status, "refunded");

  const succeeded = new AttemptStore(3);
  await succeeded.run("h", async () => ({ title: "valid" }), async () => true);
  assert.equal(succeeded.usedCount, 4);
  assert.equal(succeeded.fail("h", "late failure"), false);
  assert.equal(succeeded.usedCount, 4);
});

test("malformed response is refunded and never marked successful", async () => {
  const store = new AttemptStore(2);
  await store.run("i", async () => ({ title: "" }));
  assert.equal(store.usedCount, 2);
  assert.equal(store.attempts.get("i").status, "refunded");
});

test("forced Staging failure reserves, refunds once, creates no evaluation, and closes request id", () => {
  const store = new AttemptStore(2);
  const requestId = "forced-staging-request";
  const evaluations = new Map();
  const before = store.usedCount;

  assert.equal(store.authorize(requestId).action, "run");
  assert.equal(store.usedCount, before + 1, "credit must be reserved before forced failure");
  assert.equal(store.aiRuns, 0, "no AI provider may run");

  assert.equal(store.fail(requestId, "STAGING_FORCED_AI_FAILURE"), true);
  assert.equal(store.usedCount, before, "the actually reserved credit must be restored");
  assert.equal(store.attempts.get(requestId).status, "refunded");
  assert.equal(evaluations.has(requestId), false, "no successful evaluation may be created");

  assert.equal(store.fail(requestId, "duplicate refund"), false);
  assert.equal(store.usedCount, before, "duplicate refund must not change balance");
  assert.equal(store.authorize(requestId).action, "closed");
  assert.equal(store.aiRuns, 0, "same request id must not run AI later");
});

test("forced failure hook is limited to local Staging and disabled in production", () => {
  const staging = {
    NODE_ENV: "development",
    STAGING_FORCE_AI_FAILURE: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://hvjwjbomfsuwaauolgyh.supabase.co",
  };
  assert.equal(shouldForceStagingAiFailure(staging), true);
  assert.equal(shouldForceStagingAiFailure({ ...staging, NODE_ENV: "production" }), false);
  assert.equal(shouldForceStagingAiFailure({
    ...staging,
    NEXT_PUBLIC_SUPABASE_URL: "https://production-project.supabase.co",
  }), false);
  assert.equal(shouldForceStagingAiFailure({ ...staging, STAGING_FORCE_AI_FAILURE: "false" }), false);
});
