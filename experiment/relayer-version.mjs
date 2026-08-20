// Prints the relayer version metadata. The write-up has to report which embedding stack
// produced the distances, because they are not comparable across model versions.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { MemWal } from "@mysten-incubation/memwal";

const c = JSON.parse(readFileSync(join(homedir(), ".memwal", "credentials.json"), "utf8"));
const memwal = MemWal.create({
  key: c.delegatePrivateKey,
  accountId: c.accountId,
  serverUrl: c.relayerUrl,
  namespace: "mk.exp2.rigid",
});
for (const fn of ["compatibility", "health"]) {
  if (typeof memwal[fn] !== "function") { console.log(`${fn}: not exposed`); continue; }
  try {
    console.log(`${fn}:`, JSON.stringify(await memwal[fn](), null, 2));
  } catch (e) {
    console.log(`${fn}: failed — ${e.message}`);
  }
}
