import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { jwtSubject } from "../data/early-reads";

const jwt = (claims: unknown) =>
  `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.sig`;

describe("the token subject used to start an early read", () => {
  it("reads the sub claim of a JWT", () => {
    assert.equal(jwtSubject(jwt({ sub: "9b1f0c52-3d7e-4a55-8c10-2f6a7d9e4b01", role: "authenticated" })), "9b1f0c52-3d7e-4a55-8c10-2f6a7d9e4b01");
  });

  it("returns null, so nothing is started early, for anything that is not a usable JWT", () => {
    assert.equal(jwtSubject("stub"), null);
    assert.equal(jwtSubject(""), null);
    assert.equal(jwtSubject("a.b"), null);
    assert.equal(jwtSubject("a.%%%.c"), null);
    assert.equal(jwtSubject(jwt({})), null);
    assert.equal(jwtSubject(jwt({ sub: 42 })), null);
    assert.equal(jwtSubject(jwt({ sub: "" })), null);
  });
});
