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
## algo_registry
Deployed at: CDN6JU5OYBNGB7U3CVXTUGRL3O7ADSW32XZT4VO3W5L267TAQP6XGSUP

## algo_history
Deployed at: CANN57N463HX3ANR6DBJI3NJ7WRBPFHRWVT3AHZSAFZBVQKWW3D3JE4D

## vault
Deployed at: CAZF6PAHZ3VBX5KOCLTLZ7UQ4SKBPW2WUH7VLMLJG2N7YYIDTFNY5J5R


owner = "GBOQA7EK4NYZNQU2OQVTZ4VBOW6ZTHO4IICW5KREIHGORBJASQDHILBR"
token = "CAPVTLRAREBH6TQVKAYQALCHQCDOPLY3WUYOKK26RTF5NPSBXGHM2C6W"
history = "CANN57N463HX3ANR6DBJI3NJ7WRBPFHRWVT3AHZSAFZBVQKWW3D3JE4D"
executor = "GBOQA7EK4NYZNQU2OQVTZ4VBOW6ZTHO4IICW5KREIHGORBJASQDHILBR"