# 🔐 Assignment 3: Anchor Escrow

A trustless, on-chain token escrow program built with the Anchor framework on Solana. Two parties can atomically swap SPL tokens without needing to trust each other or a third-party intermediary.

---

## 💡 How It Works

The escrow acts as a locked vault: the **maker** deposits tokens they want to trade and specifies how many tokens they want in return. A **taker** can then fulfill the trade by sending the requested tokens, after which both parties receive their tokens simultaneously. If no taker appears, the maker can cancel at any time and recover their deposit.

## 🏗️ Architecture

### Account Layout

**Escrow State Account** — stores the trade configuration:

| Field     | Type     | Description                                  |
|-----------|----------|----------------------------------------------|
| `seed`    | `u64`    | Random seed chosen by maker, used in PDA derivation |
| `maker`   | `Pubkey` | The account that created and funded the escrow |
| `mint_a`  | `Pubkey` | Mint of the token the maker is offering      |
| `mint_b`  | `Pubkey` | Mint of the token the maker wants in return  |
| `receive` | `u64`    | Amount of `mint_b` the maker expects         |
| `bump`    | `u8`     | Canonical bump for the escrow PDA            |

**Vault** — an Associated Token Account (ATA) owned by the escrow PDA that holds the deposited `mint_a` tokens during the trade.

### PDA Derivation

The escrow account is a Program Derived Address seeded with:

```
["escrow", maker_pubkey, seed_u64]
```

Using a user-supplied `seed` allows the same maker to run multiple concurrent escrows. The PDA itself is the authority over the vault, so no private key is ever needed to sign vault transfers — the program signs on behalf of the PDA.

---

## 📜 Instructions

### `make(seed, receive, deposit)`

Creates a new escrow and deposits tokens into the vault.

| Parameter | Type  | Description                                    |
|-----------|-------|------------------------------------------------|
| `seed`    | `u64` | Unique seed for PDA derivation                 |
| `receive` | `u64` | Amount of `mint_b` tokens expected in return   |
| `deposit` | `u64` | Amount of `mint_a` tokens to lock in the vault |

**What happens:**
1. Initializes the `Escrow` state account at the PDA.
2. Transfers `deposit` amount of `mint_a` from the maker's ATA to the vault via `TransferChecked`.

---

### `take()`

Called by a taker to fulfill the trade. Atomically swaps both sides.

**What happens:**
1. Transfers `escrow.receive` of `mint_b` from the taker's ATA to the maker's `mint_b` ATA.
2. Signs with the escrow PDA to transfer `escrow.receive` amount of `mint_a` from the vault to the taker's `mint_a` ATA.
3. Closes the vault account, returning rent to the maker.
4. Closes the escrow account, returning rent to the maker.

The entire swap is atomic — either all transfers succeed or none do.

---

### `refund()`

Called by the maker to cancel an open escrow and recover their tokens.

**What happens:**
1. Signs with the escrow PDA to transfer the full vault balance back to the maker's `mint_a` ATA.
2. Closes the vault account, returning rent to the maker.
3. Closes the escrow account, returning rent to the maker.

---

## 🔒 Security Properties

- **Trustless** — no counterparty risk; the program enforces the swap atomically.
- **Non-custodial** — the maker retains the ability to cancel at any time via `refund`.
- **PDA-signed transfers** — the vault can only be drained by the program itself using the escrow PDA as a signer; no external key can move the tokens.
- **`TransferChecked`** — all token transfers include the mint and decimal precision to prevent token substitution attacks.
- **Concurrent escrows** — each escrow is uniquely keyed by `(maker, seed)`, so a maker can run many escrows in parallel.

---

## 📁 Project Structure

```
programs/anchor-escrow/src/
├── lib.rs                  # Program entry point, instruction routing
├── state.rs                # Escrow account struct
├── error.rs                # Custom program errors
├── constants.rs            # Seed constants
└── instructions/
    ├── make.rs             # Create escrow & deposit tokens
    ├── take.rs             # Complete the trade
    └── refund.rs           # Cancel and recover tokens
```

---

## ⚙️ Prerequisites

- [Rust](https://rustup.rs/) (toolchain pinned to `1.89.0` via `rust-toolchain.toml`)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (`>= 2.x`)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (`1.0.1`)
- [Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/)

---

## 🔨 Build

```bash
anchor build
```

---

## 🧪 Test

Tests use the Anchor TypeScript test suite running against a local validator. The suite covers the full lifecycle: `make → take` and `make → refund`.

```bash
anchor test
```

The test suite:
1. Airdrops SOL to maker and taker wallets.
2. Creates two SPL token mints (`mintA` and `mintB`) with 6 decimal places.
3. Mints tokens to maker and taker ATAs.
4. **Make** — maker deposits 1 `mintA` token into a new escrow requesting 1 `mintB`.
5. **Take** — taker fulfills the swap; both parties receive their tokens and the vault is closed.
6. **Make (second)** — maker opens a second escrow.
7. **Refund** — maker cancels the second escrow and recovers their tokens.
