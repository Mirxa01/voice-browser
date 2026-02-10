import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-create the boolean transform used in the planner schema to test in isolation
// without pulling in the full dependency chain (e.g. @extension/storage)
const booleanStringSchema = z.union([
  z.boolean(),
  z.string().transform(val => {
    const lower = val.toLowerCase().trim();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    throw new Error(`Invalid boolean string: "${val}"`);
  }),
]);

const testPlannerOutputSchema = z.object({
  observation: z.string(),
  challenges: z.string(),
  done: booleanStringSchema,
  next_steps: z.string(),
  final_answer: z.string(),
  reasoning: z.string(),
  web_task: booleanStringSchema,
});

describe('Planner output schema - boolean parsing', () => {
  const validBase = {
    observation: 'test observation',
    challenges: 'none',
    next_steps: 'next step',
    final_answer: 'answer',
    reasoning: 'reasoning',
  };

  it('parses boolean true for done field', () => {
    const result = testPlannerOutputSchema.parse({ ...validBase, done: true, web_task: false });
    expect(result.done).toBe(true);
  });

  it('parses boolean false for done field', () => {
    const result = testPlannerOutputSchema.parse({ ...validBase, done: false, web_task: true });
    expect(result.done).toBe(false);
  });

  it('parses string "true" for done field', () => {
    const result = testPlannerOutputSchema.parse({ ...validBase, done: 'true', web_task: 'false' });
    expect(result.done).toBe(true);
  });

  it('parses string "false" for done field', () => {
    const result = testPlannerOutputSchema.parse({ ...validBase, done: 'false', web_task: 'true' });
    expect(result.done).toBe(false);
  });

  it('parses "True" (capitalized) for done field', () => {
    const result = testPlannerOutputSchema.parse({ ...validBase, done: 'True', web_task: 'False' });
    expect(result.done).toBe(true);
    expect(result.web_task).toBe(false);
  });

  it('parses "TRUE" (all caps) for done field', () => {
    const result = testPlannerOutputSchema.parse({ ...validBase, done: 'TRUE', web_task: 'FALSE' });
    expect(result.done).toBe(true);
    expect(result.web_task).toBe(false);
  });

  it('parses " true " (with whitespace) for done field', () => {
    const result = testPlannerOutputSchema.parse({ ...validBase, done: ' true ', web_task: ' false ' });
    expect(result.done).toBe(true);
    expect(result.web_task).toBe(false);
  });

  it('rejects invalid boolean string with descriptive error', () => {
    expect(() => {
      testPlannerOutputSchema.parse({ ...validBase, done: 'maybe', web_task: false });
    }).toThrow();
  });

  it('handles web_task boolean string parsing', () => {
    const result = testPlannerOutputSchema.parse({ ...validBase, done: false, web_task: 'True' });
    expect(result.web_task).toBe(true);
  });
});
