# Performance evidence

This report summarizes existing artifacts; no performance test was run in the 23 October 2026 continuation.

Source: [performance-production.json](../../artifacts/performance-production.json). Environment recorded there: isolated local production build, Pixel 5 emulation, 150 ms RTT, 1.6 Mbps download, 750 Kbps upload, 4× CPU slowdown, three cold contexts.

| Run | LCP (ms) | CLS | Initial compressed first-party JS (bytes) |
|---|---:|---:|---:|
| 1 | 816 | 0.0007834 | 137508 |
| 2 | 844 | 0.0008169 | 137508 |
| 3 | 744 | 0.0008169 | 137508 |

The recorded welcome route meets the proposed 180 KB initial JS budget in these runs. All three records indicate no heavy guest imports. Camera/recorder/editor are loaded separately; server processing uses FFmpeg rather than a browser WASM bundle. INP is explicitly not established because representative interaction/RUM evidence is insufficient.

These are localhost lab results for an earlier build, not field percentiles or a fresh performance certification. Physical devices, hosted latency, concurrent media/transcoding throughput, maximum archive size, peak memory and provider cost remain unmeasured. Development-mode resource artifacts are retained separately and should not be compared directly with compressed production bundle budgets.
