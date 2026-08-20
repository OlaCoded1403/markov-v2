// Turns results.json into the statistics the write-up should actually quote.
//
// Under the null hypothesis "rank is independent of recency", Spearman's rho over n
// records has mean 0 and standard deviation 1/sqrt(n-1). That gives every observed rho a
// z-score, so we can say whether any recency signal was detected at all rather than
// eyeballing whether a number "looks small".
import { readFileSync } from "node:fs";
const st = JSON.parse(readFileSync("results.json", "utf8"));
const BOOT = "current task checkpoint goal status";

// two-tailed normal p-value
const erf = (x) => {
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
};
const p2 = (z) => 1 - erf(Math.abs(z) / Math.SQRT2);

console.log("PER-CELL: is there any recency signal at all?\n");
console.log("  N   arm       query                    rho      nullSD    z       p");
console.log("  --- --------- ------------------------ -------- --------- ------- -----");
const allZ = [];
for (const s of st.stages) {
  for (const o of s.observations) {
    const n = o.matched ?? o.returned;
    const sd = 1 / Math.sqrt(n - 1);
    const z = o.recencyRankCorrelation / sd;
    allZ.push({ n: s.n, arm: o.arm, z, rho: o.recencyRankCorrelation });
    console.log(
      `  ${String(s.n).padEnd(3)} ${o.arm.padEnd(9)} ${o.query.slice(0, 24).padEnd(24)} ` +
      `${o.recencyRankCorrelation.toFixed(3).padStart(7)}  ${sd.toFixed(3).padStart(7)}  ` +
      `${z.toFixed(2).padStart(6)}  ${p2(z).toFixed(3)}`,
    );
  }
}
const sig = allZ.filter((a) => p2(a.z) < 0.05);
console.log(`\n  Cells reaching p < 0.05: ${sig.length} of ${allZ.length}`);

console.log("\n\nRANK OF THE NEWEST CHECKPOINT (boot query), as a fraction of N\n");
console.log("  N    rigid rank  frac    distinct rank  frac");
console.log("  ---- ----------- ------- -------------- -------");
const fracs = [];
for (const s of st.stages) {
  const r = s.observations.find((o) => o.arm === "rigid" && o.query === BOOT);
  const d = s.observations.find((o) => o.arm === "distinct" && o.query === BOOT);
  fracs.push([r.rankOfNewest / s.n, d.rankOfNewest / s.n]);
  console.log(
    `  ${String(s.n).padEnd(4)} ${String(r.rankOfNewest).padEnd(11)} ${(r.rankOfNewest / s.n).toFixed(2).padEnd(7)} ` +
    `${String(d.rankOfNewest).padEnd(14)} ${(d.rankOfNewest / s.n).toFixed(2)}`,
  );
}
const wins = fracs.filter(([r, d]) => d < r).length;
console.log(`\n  Rounds where the distinct arm ranked the newest higher: ${wins} of ${fracs.length}`);
console.log(`  Sign test one-tailed p = ${(0.5 ** fracs.length).toFixed(3)} (n=${fracs.length}: suggestive at best)`);

console.log("\n\nWHAT MARKOV'S limit:3 WOULD HAVE DONE, all cells\n");
let hit = 0, tot = 0, expected = 0;
for (const s of st.stages) for (const o of s.observations) {
  tot++; if (o.foundWithinMarkovLimit) hit++; expected += 3 / s.n;
}
console.log(`  Found the newest checkpoint in ${hit} of ${tot} cells (${((hit / tot) * 100).toFixed(0)}%)`);
console.log(`  Expected under pure chance (sum of 3/N): ${expected.toFixed(1)} of ${tot} (${((expected / tot) * 100).toFixed(0)}%)`);
