import { createRequire } from "node:module";
import { describe, it, expect } from "vitest";
const require = createRequire(import.meta.url);
describe("security override compatibility", () => {
  it("keeps query-string CommonJS decoding functional for Unicode and malformed large links", () => {
    const query = require("query-string");
    expect(query.parse("x=%D1%82%D0%B5%D1%81%D1%82").x).toBe("тест");
    expect(query.parse("x=" + "%FF".repeat(10000)).x).toHaveLength(30000);
  });
  it("keeps Xcode project UUID generation working", () => {
    const p = require("xcode").project("test.pbxproj");
    p.hash = { project: { objects: {} } };
    expect(p.generateUuid()).toMatch(/^[A-F0-9]{24}$/);
  });
});
