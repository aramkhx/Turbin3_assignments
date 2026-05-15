# 🔐 Assignment 3: Anchor Vault

A non-custodial SOL vault program built with the [Anchor](https://www.anchor-lang.com/) framework on Solana. Each user gets their own isolated vault — a PDA-controlled account — where they can deposit, withdraw, and close at will.

## 📖 Overview

The program uses two PDAs per user:

- **`vault_state`** — stores the bump seeds for both PDAs; derived from `["state", user_pubkey]`
- **`vault`** — the system account that holds the SOL; derived from `["vault", vault_state_pubkey]`

This two-account design means the vault address is unique per user and the program can sign withdrawals on behalf of the vault using its PDA signer seeds — no private key required.

## ⚙️ Instructions

### 🚀 `initialize`

Creates the `vault_state` account and derives the `vault` PDA. Stores the bump seeds on-chain so subsequent instructions can reconstruct the PDA signer without `find_program_address`.

**Accounts:**
| Account | Writable | Signer | Description |
|---|---|---|---|
| `user` | yes | yes | Pays for account creation |
| `vault_state` | yes | no | PDA initialized by this instruction |
| `vault` | no | no | PDA for the SOL vault (derived, not created here) |
| `system_program` | no | no | Required for account creation |

---

### 📥 `deposit(amount: u64)`

Transfers `amount` lamports from the user's wallet to the vault via a CPI to the System Program.

**Accounts:**
| Account | Writable | Signer | Description |
|---|---|---|---|
| `user` | yes | yes | Source of funds |
| `vault_state` | yes | no | Used to derive the vault PDA bump |
| `vault` | yes | no | Destination |
| `system_program` | no | no | Required for transfer |

---

### 📤 `withdraw(amount: u64)`

Transfers `amount` lamports from the vault back to the user. The vault PDA signs the CPI using stored bump seeds.

**Accounts:**
| Account | Writable | Signer | Description |
|---|---|---|---|
| `user` | yes | yes | Destination and authority |
| `vault_state` | yes | no | Provides PDA signer seeds |
| `vault` | yes | no | Source of funds |
| `system_program` | no | no | Required for transfer |

---

### 🗑️ `close`

Drains all remaining lamports from the vault to the user, then closes the `vault_state` account and returns its rent to the user. After this instruction both PDAs are gone from the ledger.

**Accounts:**
| Account | Writable | Signer | Description |
|---|---|---|---|
| `user` | yes | yes | Receives all remaining funds |
| `vault_state` | yes | no | Closed by Anchor (`close = user`) |
| `vault` | yes | no | Drained via CPI |
| `system_program` | no | no | Required for transfer |

---

## 🗂️ Account Structure

```
VaultState {
    vault_bump: u8,   // bump for the vault PDA
    state_bump: u8,   // bump for the vault_state PDA
}
```

Total on-chain size: `8` (discriminator) + `2` bytes = `10` bytes.

## 🔑 PDA Derivation

```
vault_state = PDA(["state", user_pubkey],       program_id)
vault        = PDA(["vault", vault_state_pubkey], program_id)
```

## 🛠️ Getting Started

### 📦 Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- [Yarn](https://yarnpkg.com/)

### 🔨 Build

```bash
anchor build
```

### 🧪 Test

Tests are written in Rust using [LiteSVM](https://github.com/LiteSVM/litesvm) — a fast, in-process SVM that runs without a validator. The single integration test covers the full lifecycle: initialize → deposit → withdraw → close.

```bash
anchor test
```

## 🛡️ Security Properties

- **Owner-only access** — all instructions require the user to sign; the PDA seeds bind the vault to that specific public key.
- **PDA signing** — the vault holds no private key; the program signs withdrawals using `CpiContext::new_with_signer` with the stored bump, so no external party can drain the vault.
- **Clean teardown** — `close` uses Anchor's `close = user` constraint on `vault_state`, guaranteeing the account is zeroed and its rent is returned atomically.
