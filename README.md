# scoob

_**S**e**C**rets **O**rchestrati**O**n for node **B**ackends_


## Deprecated: Use the Rust port of scoob instead.

Scoob was originally written in Node, but has been rewritten in Rust.
Scoob is designed to ship alongside your production code, as the CLI is used to decrypt secrets into environment variables. As such, it has the following goals:

- Must work on most development / deployment platforms.
- Must have a very small runtime memory overhead.
  - `scoob-node` currently has ~55mb of memory overhead.
  - `scoob-rs` currently has ~380kb of memory overhead to start, and has **0** runtime overhead on Unix systems.
- Must start quickly.
  - `scoob-node` currently has ~500ms of start time overhead.
  - `scoob-rs` currently has ~0ms of start time overhead.
- The binary should be small enough to build into a Docker image.
  - `scoob-node` is currently ~60mb (including node runtime).
  - `scoob-rs` is currently ~1-2mb.
- Must work with projects that are not written in Node.js and do not have `npm` or `node` installed.
