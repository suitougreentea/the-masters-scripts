import { assertEquals } from "@std/assert";
import {
  grades,
  GradeString,
  gradeToString,
  stringToGrade,
  tryStringToGrade,
} from "./grade.ts";

Deno.test("gradeToString() works for all grades", () => {
  Object.entries(grades).forEach((e) => {
    const [gradeStr, grade] = e;
    assertEquals(gradeToString(grade), gradeStr);
  });
});
Deno.test("stringToGrade() works for all grades", () => {
  Object.entries(grades).forEach((e) => {
    const [gradeStr, grade] = e;
    assertEquals(stringToGrade(gradeStr as GradeString), grade);
  });
});
Deno.test("tryStringToGrade() works for all grades", () => {
  Object.entries(grades).forEach((e) => {
    const [gradeStr, grade] = e;
    assertEquals(tryStringToGrade(gradeStr), grade);
  });
});
Deno.test("tryStringToGrade() returns undefined for invalid grade string", () => {
  assertEquals(tryStringToGrade("Foo"), undefined);
});
