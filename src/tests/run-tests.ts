import { runScientificValidation } from './scientific-validation';

declare const process: { exit: (code: number) => void };

console.log('================================================================');
console.log('WORLD ENGINE — SCIENTIFIC & MATHEMATICAL VALIDATION SUITE');
console.log('================================================================\n');

const results = runScientificValidation();
let passedCount = 0;

results.forEach((r) => {
  const status = r.passed ? '✓ PASS' : '✗ FAIL';
  if (r.passed) passedCount++;
  console.log(`[${status}] ${r.name}`);
  console.log(`       Details: ${r.details}\n`);
});

console.log('================================================================');
console.log(`RESULTS: ${passedCount} / ${results.length} Tests Passed (${((passedCount / results.length) * 100).toFixed(0)}%)`);
console.log('================================================================');

if (passedCount < results.length) {
  process.exit(1);
} else {
  process.exit(0);
}
