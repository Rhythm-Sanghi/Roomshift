import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const output = mkdtempSync(join(tmpdir(), 'roomshift-tests-'));
const require = createRequire(import.meta.url);
let evaluateRoom;
let evaluationCases;

try {
  // Compile with the existing TypeScript dependency for Node versions that cannot load TS directly.
  writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
  execFileSync(process.execPath, [
    join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--target', 'ES2022',
    '--module', 'CommonJS',
    '--strict',
    '--outDir', output,
    'src/evaluation/evaluateRoom.ts',
    'tests/evaluationCases.ts',
  ], { cwd: projectRoot, stdio: 'inherit' });

  ({ evaluateRoom } = require(join(output, 'src', 'evaluation', 'evaluateRoom.js')));
  ({ evaluationCases } = require(join(output, 'tests', 'evaluationCases.js')));
} finally {
  rmSync(output, { recursive: true, force: true });
}

for (const { name, input, expected, survivingRoute } of evaluationCases) {
  test(name, () => {
    assert.equal(typeof evaluateRoom, 'function', 'evaluateRoom must export a function');
    const result = evaluateRoom(...input);
    assert.equal(result.status, expected.status);
    assert.equal(result.evidence.length, expected.evidence.length, 'Return one check per active requirement');

    for (const expectedCheck of expected.evidence) {
      const check = result.evidence.find(item => item.requirement === expectedCheck.requirement);
      assert.ok(check, 'Missing check for ' + expectedCheck.requirement);
      assert.equal(check.status, expectedCheck.status, expectedCheck.requirement);
      assert.ok(check.explanation.trim(), 'Explain ' + expectedCheck.requirement);

      if (survivingRoute && check.requirement === 'step-free') {
        for (const id of expectedCheck.observationIds) {
          assert.ok(check.observationIds.includes(id), 'Missing surviving route evidence: ' + id);
        }
        assert.ok(check.explanation.toLowerCase().includes(survivingRoute.toLowerCase()),
          'Name the surviving route in the inspector explanation');
      } else {
        assert.deepEqual([...check.observationIds].sort(), [...expectedCheck.observationIds].sort(),
          'Citations for ' + expectedCheck.requirement);
      }
    }
  });
}
