/**
 * A lightweight client-side Python-to-JS translator for the demo problems.
 * This is NOT a full Python interpreter; it handles the common patterns used
 * in the seeded problems (def, return, if/else, f-strings, basic operators).
 * For a production system, replace this with a real Python execution service
 * or Pyodide in the browser.
 */

function translatePythonToJS(code: string): string {
  const lines = code.split("\n");
  let result = "";
  const indentStack: number[] = [];

  for (let raw of lines) {
    const stripped = raw.trim();
    if (stripped === "") continue;

    const indent = raw.length - raw.trimStart().length;
    while (indentStack.length > 0 && indent <= indentStack[indentStack.length - 1]!) {
      result += "}\n";
      indentStack.pop();
    }

    let translated = stripped
      .replace(/\band\b/g, "&&")
      .replace(/\bor\b/g, "||")
      .replace(/\bnot\b/g, "!")
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null")
      .replace(/==/g, "===")
      .replace(/!=/g, "!==");

    // f-strings: f"Hello, {name}!" -> `Hello, ${name}!`
    translated = translated.replace(
      /f"([^"{}]*)(\{[^}]+\})?/g,
      (match: string, before: string, expr: string) => {
        const beforePart = before ?? "";
        if (!expr) return "`" + beforePart + "`";
        let rest = match.slice(1 + beforePart.length + expr.length + 1);
        rest = rest.replace(/\{([^}]+)\}/g, "${$1}");
        return "`" + beforePart + expr.replace("{", "${").replace("}", "}") + rest;
      }
    );



    // def func(params): -> function func(params) {
    const defMatch = translated.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/);
    if (defMatch) {
      result += `function ${defMatch[1]}(${defMatch[2]}) {\n`;
      indentStack.push(indent);
      continue;
    }

    // if cond:
    const ifMatch = translated.match(/^if\s+(.+):\s*$/);
    if (ifMatch) {
      result += `if (${ifMatch[1]}) {\n`;
      indentStack.push(indent);
      continue;
    }

    // elif cond:
    const elifMatch = translated.match(/^elif\s+(.+):\s*$/);
    if (elifMatch) {
      result += `} else if (${elifMatch[1]}) {\n`;
      indentStack[indentStack.length - 1] = indent;
      continue;
    }

    // else:
    if (translated === "else:") {
      result += "} else {\n";
      indentStack[indentStack.length - 1] = indent;
      continue;
    }

    // return expr
    if (translated.startsWith("return ")) {
      result += `${translated};\n`;
      continue;
    }

    result += `${translated};\n`;
  }

  while (indentStack.length > 0) {
    result += "}\n";
    indentStack.pop();
  }

  return result;
}

export function runUserCode(code: string, input: string): { output: string; error: string | null } {
  try {
    const js = translatePythonToJS(code);
    const func = new Function(js + "\nreturn typeof lastCall !== 'undefined' ? lastCall : undefined;");
    // We need to invoke the function defined by the user. The above is tricky.
    // Instead, wrap the translated code and capture the last defined function.
    const wrapped = `
      ${js}
      const __funcNames = [${Object.keys({}).join(",")}];
      return arguments[0];
    `;
    return { output: String(""), error: "Not yet implemented" };
  } catch (err) {
    return { output: "", error: err instanceof Error ? err.message : "Execution error" };
  }
}

interface TestCase {
  input: string;
  expected_output: string;
  hidden?: boolean;
}

export interface RunResult {
  input: string;
  expected: string;
  output: string;
  passed: boolean;
  error: string | null;
}

export function runPython(code: string, testCases: TestCase[]): RunResult[] {
  // Determine the function name from the code.
  const defMatch = code.match(/def\s+(\w+)\s*\(/);
  if (!defMatch) {
    return testCases.map((tc) => ({
      input: tc.hidden ? "hidden" : tc.input,
      expected: tc.hidden ? "hidden" : tc.expected_output,
      output: "",
      passed: false,
      error: "No function definition found. Define a function with def name(...).",
    }));
  }

  const funcName = defMatch[1];
  const js = translatePythonToJS(code);

  const runner = new Function(
    "__testCases",
    `
    ${js}
    const results = [];
    for (const tc of __testCases) {
      try {
        let args = [];
        if (tc.input !== "") {
          try {
            args = [JSON.parse(tc.input)];
          } catch (e) {
            args = [tc.input];
          }
        }
        const result = ${funcName}(...args);
        results.push({ output: result, error: null });
      } catch (e) {
        results.push({ output: "", error: e.message });
      }
    }
    return results;
  `
  );

  try {
    const raw = runner(testCases);
    return testCases.map((tc, i) => {
      const r = raw[i] as { output: unknown; error: string | null };
      const output = r.error ? "" : String(r.output);
      return {
        input: tc.hidden ? "hidden" : tc.input,
        expected: tc.hidden ? "hidden" : tc.expected_output,
        output,
        passed: !r.error && String(output).trim() === String(tc.expected_output).trim(),
        error: r.error,
      };
    });
  } catch (err) {
    return testCases.map((tc) => ({
      input: tc.hidden ? "hidden" : tc.input,
      expected: tc.hidden ? "hidden" : tc.expected_output,
      output: "",
      passed: false,
      error: err instanceof Error ? err.message : "Execution error",
    }));
  }
}
