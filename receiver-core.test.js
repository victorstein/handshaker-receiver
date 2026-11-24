const assert = require("assert");
const { createHshkParser } = require("./receiver-core.js");

const enc = new TextEncoder();
function feed(header, body, chunkSize) {
  const full = new Uint8Array(header.length + body.length);
  full.set(header, 0); full.set(body, header.length);
  let result = null, errored = null, lastGot = 0;
  const p = createHshkParser({
    onProgress: (got) => { lastGot = got; },
    onComplete: (name, bytes) => { result = { name, bytes }; },
    onError: (m) => { errored = m; },
  });
  for (let i = 0; i < full.length; i += chunkSize) p.push(full.slice(i, i + chunkSize));
  return { result, errored, lastGot };
}

// body with a newline inside, to prove body parsing isn't confused by \n after the header
const body = Uint8Array.from([1, 2, 10, 3, 4, 5, 0, 255, 10, 7]);
const header = enc.encode("HSHK1\nPenelope-20261123-1420.pcap\n" + body.length + "\n");

// Chunk boundaries that split the magic, the newlines, and the body mid-stream.
for (const cs of [1, 3, 7, 1000]) {
  const { result, errored } = feed(header, body, cs);
  assert.strictEqual(errored, null, "chunk " + cs + ": unexpected error " + errored);
  assert.ok(result, "chunk " + cs + ": never completed");
  assert.strictEqual(result.name, "Penelope-20261123-1420.pcap", "chunk " + cs + ": name");
  assert.deepStrictEqual(Array.from(result.bytes), Array.from(body), "chunk " + cs + ": body bytes");
}

// Trailing bytes past the declared size must be ignored (no overrun, fires once).
{
  let completes = 0, got = null;
  const p = createHshkParser({ onComplete: (n, b) => { completes++; got = b; } });
  p.push(enc.encode("HSHK1\nx\n3\n"));
  p.push(Uint8Array.from([9, 9, 9]));
  p.push(Uint8Array.from([9, 9])); // extra after done
  assert.strictEqual(completes, 1, "onComplete must fire exactly once");
  assert.deepStrictEqual(Array.from(got), [9, 9, 9], "must truncate to size");
}

// Bad magic is rejected.
{
  let err = null;
  const p = createHshkParser({ onError: (m) => { err = m; } });
  p.push(enc.encode("NOPE1\nx\n1\n"));
  assert.strictEqual(err, "bad header", "bad magic must error");
}

console.log("receiver-core: all tests passed");
