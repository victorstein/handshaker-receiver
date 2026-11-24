# HandShaker Receiver (Web Bluetooth)

A single-page Web Bluetooth receiver for the **Send over BLE** feature of the
HandShaker Flipper Zero app. Open it in Chrome on Android, tap **Receive
capture**, pick your Flipper, approve the one-time pairing, then start **Send
over BLE** on the Flipper. The pushed `.pcap` downloads to the device.

Web Bluetooth needs an https context and Chrome (Android or desktop); it is not
supported in Safari/iOS.

- `index.html` — the page + Web Bluetooth glue.
- `receiver-core.js` — the HSHK1 stream parser (shared logic, testable in node).
- `receiver-core.test.js` — `node receiver-core.test.js`.

Captures are WPA handshakes from your own / authorized networks only.
