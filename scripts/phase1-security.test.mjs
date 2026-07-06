import assert from "node:assert/strict";
import test from "node:test";

function decision(row) {
  if (row.isLifetimeFree || ["lifetime_free", "admin"].includes(row.accessType))
    return { allowed: true, code: "LIFETIME_ACCESS", consumed: false };
  if (row.subscriptionStatus === "active" && row.subscriptionEndsAt > Date.now())
    return { allowed: true, code: "SUBSCRIPTION_ACTIVE", consumed: false };
  if (row.usedCount < row.freeLimit) {
    row.usedCount += 1;
    return { allowed: true, code: "TRIAL_CREDIT_RESERVED", consumed: true };
  }
  return { allowed: false, code: "TRIAL_LIMIT_REACHED", consumed: false };
}

function serializedAuthorizer(row) {
  let queue = Promise.resolve();
  const reservations = new Map();
  return (authenticatedUserId, requestId, untrustedBody = {}) => {
    const run = queue.then(() => {
      if (reservations.has(requestId)) return reservations.get(requestId);
      void untrustedBody;
      const result = { userId: authenticatedUserId, ...decision(row) };
      reservations.set(requestId, result);
      return result;
    });
    queue = run.catch(() => undefined);
    return run;
  };
}

const row = (overrides = {}) => ({ usedCount: 0, freeLimit: 5, subscriptionStatus: "inactive", subscriptionEndsAt: 0, accessType: "free_trial", isLifetimeFree: false, ...overrides });

test("user with credit consumes exactly one server-side credit", async () => {
  const state = row({ usedCount: 3 });
  assert.equal((await serializedAuthorizer(state)("auth-user", "request-1")).code, "TRIAL_CREDIT_RESERVED");
  assert.equal(state.usedCount, 4);
});

test("exhausted user is denied", async () => {
  assert.equal((await serializedAuthorizer(row({ usedCount: 5 }))("auth-user", "request-2")).code, "TRIAL_LIMIT_REACHED");
});

test("lifetime user is allowed without consuming credit", async () => {
  const state = row({ usedCount: 5, accessType: "lifetime_free", isLifetimeFree: true });
  assert.equal((await serializedAuthorizer(state)("auth-user", "request-3")).code, "LIFETIME_ACCESS");
  assert.equal(state.usedCount, 5);
});

test("active subscription is allowed without consuming credit", async () => {
  const state = row({ usedCount: 5, subscriptionStatus: "active", subscriptionEndsAt: Date.now() + 60_000, accessType: "paid_monthly" });
  assert.equal((await serializedAuthorizer(state)("auth-user", "request-4")).code, "SUBSCRIPTION_ACTIVE");
  assert.equal(state.usedCount, 5);
});

test("two concurrent requests cannot consume the same final credit", async () => {
  const state = row({ usedCount: 4 });
  const authorize = serializedAuthorizer(state);
  const results = await Promise.all([authorize("auth-user", "request-5a"), authorize("auth-user", "request-5b")]);
  assert.deepEqual(results.map((item) => item.code), ["TRIAL_CREDIT_RESERVED", "TRIAL_LIMIT_REACHED"]);
  assert.equal(state.usedCount, 5);
});

test("duplicate request is idempotent and spoofed fields are ignored", async () => {
  const state = row({ usedCount: 4 });
  const authorize = serializedAuthorizer(state);
  const spoof = { user_id: "victim", subscription_status: "active", is_lifetime_free: true };
  const first = await authorize("auth-user", "request-6", spoof);
  const retry = await authorize("auth-user", "request-6", spoof);
  assert.equal(first.userId, "auth-user");
  assert.deepEqual(retry, first);
  assert.equal(state.usedCount, 5);
});
