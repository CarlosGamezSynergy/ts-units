import { assertEquals } from "@std/assert";
import { substitute, substituteMultiple } from "./string.ts";

Deno.test("substitute correctly replaces all occurrences of a substring", () => {
    const original = "Hello world, world!";
    const result = substitute(original, "world", "there");
    const expected = "Hello there, there!";
    assertEquals(result, expected);
});

Deno.test("substitute returns the original string if the substring is not found", () => {
    const original = "Hello world!";
    const result = substitute(original, "notfound", "there");
    assertEquals(result, original);
});

Deno.test("substitute handles replacing with the same string", () => {
    const original = "Hello world!";
    const result = substitute(original, "world", "world");
    assertEquals(result, original);
});

Deno.test("substituteMultiple correctly applies multiple substitutions", () => {
    const original = "Hello world!";
    const result = substituteMultiple(original, [
        ["Hello", "Hi"],
        ["world", "there"],
    ]);
    const expected = "Hi there!";
    assertEquals(result, expected);
});