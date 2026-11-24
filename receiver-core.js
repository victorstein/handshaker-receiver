// HSHK1 stream parser: reassembles a file pushed by the HandShaker Flipper app.
// Pure (no Web Bluetooth), so it runs under node for the self-test.
// Wire format: "HSHK1\n<name>\n<size>\n" then <size> raw body bytes.
(function (root) {
  const MAGIC = "HSHK1";
  const NL = 10;

  function createHshkParser({ onProgress, onComplete, onError } = {}) {
    let headerBytes = [];
    let haveHeader = false;
    let done = false;
    let name = null;
    let size = 0;
    let body = new Uint8Array(0);

    const fail = (msg) => {
      done = true;
      if (onError) onError(msg);
    };
    const concat = (a, b) => {
      const out = new Uint8Array(a.length + b.length);
      out.set(a, 0);
      out.set(b, a.length);
      return out;
    };
    const decode = (arr) => new TextDecoder().decode(Uint8Array.from(arr));

    return {
      push(chunk) {
        if (done) return;
        if (!haveHeader) {
          for (const b of chunk) headerBytes.push(b);
          const nl = [];
          for (let i = 0; i < headerBytes.length && nl.length < 3; i++) {
            if (headerBytes[i] === NL) nl.push(i);
          }
          if (nl.length < 3) return; // header still arriving
          if (decode(headerBytes.slice(0, nl[0])) !== MAGIC) return fail("bad header");
          name = decode(headerBytes.slice(nl[0] + 1, nl[1]));
          size = parseInt(decode(headerBytes.slice(nl[1] + 1, nl[2])), 10);
          if (!Number.isFinite(size) || size < 0) return fail("bad size");
          body = Uint8Array.from(headerBytes.slice(nl[2] + 1));
          headerBytes = [];
          haveHeader = true;
        } else {
          body = concat(body, chunk);
        }
        if (onProgress) onProgress(Math.min(body.length, size), size, name);
        if (body.length >= size) {
          done = true;
          if (onComplete) onComplete(name, body.slice(0, size));
        }
      },
    };
  }

  root.createHshkParser = createHshkParser;
  if (typeof module !== "undefined" && module.exports) module.exports = { createHshkParser };
})(typeof window !== "undefined" ? window : globalThis);
