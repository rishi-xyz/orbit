# Soroban Contracts

This folder contains three Soroban smart contracts:

- `algo_registry`: stores trading algorithm metadata on-chain.
- `vault`: holds USDC (or any Soroban token contract) and allows an authorized executor to spend.
- `algo_history`: append-only execution history (stores tx hash strings and notes per algo id).

## Build

From `contracts/`:

```bash
cargo build --release --target wasm32-unknown-unknown
```

## Test

```bash
cargo test
```
