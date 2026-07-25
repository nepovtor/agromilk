import fastify from "fastify";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../lib/errors.js";
import { errorHandlerPlugin } from "./error-handler.plugin.js";

describe("error handler", () => {
  it("serializes validation, upload and unexpected errors without a stack trace", async () => {
    const app = fastify();
    await app.register(errorHandlerPlugin);
    app.get("/validation", () => {
      throw new ValidationError("Invalid input", { name: ["Required"] });
    });
    app.get("/upload", () => {
      throw Object.assign(new Error("large"), { code: "FST_REQ_FILE_TOO_LARGE" });
    });
    app.get("/request", () => {
      throw Object.assign(new Error("Bad request"), { statusCode: 422 });
    });
    app.get("/unexpected", () => {
      throw new Error("secret stack detail");
    });

    expect((await app.inject("/validation")).json()).toEqual({
      error: "VALIDATION_ERROR",
      message: "Invalid input",
      fields: { name: ["Required"] },
    });
    expect((await app.inject("/upload")).statusCode).toBe(413);
    expect((await app.inject("/request")).json()).toEqual({
      error: "REQUEST_ERROR",
      message: "Bad request",
    });
    const unexpected = await app.inject("/unexpected");
    expect(unexpected.statusCode).toBe(500);
    expect(unexpected.body).not.toContain("secret stack detail");
    await app.close();
  });
});
