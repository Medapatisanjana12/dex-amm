# DEX AMM Project

## Overview

This project implements a **simple Automated Market Maker (AMM) based Decentralized Exchange (DEX)** inspired by Uniswap v2 principles.  
It allows users to provide liquidity, remove liquidity, and swap between two ERC-20 tokens using a **constant product formula (x × y = k)** with a **0.3% trading fee** distributed to liquidity providers.

The project is built using **Solidity, Hardhat, OpenZeppelin, Docker**, and includes a **comprehensive automated test suite**.

---

## Features

- Initial and subsequent liquidity provision
- Liquidity removal with proportional share calculation
- Token swaps using constant product formula (x × y = k)
- 0.3% trading fee for liquidity providers
- LP share tracking via internal accounting
- Event emission for liquidity and swap operations
- Extensive test coverage including edge cases
- Dockerized environment for reproducible testing

---

## Architecture

### Contracts

- **DEX.sol**
  - Core AMM logic
  - Manages reserves, swaps, fees, and liquidity accounting
  - Implements constant product invariant
  - Emits events for all state-changing actions

- **MockERC20.sol**
  - Simple ERC-20 token used for testing
  - Allows minting tokens for local and test environments
  - Based on OpenZeppelin ERC-20 implementation

### Design Decisions

- LP tokens are represented via an internal mapping instead of a separate ERC-20 LP token to keep the implementation minimal and focused.
- Solidity `^0.8.0` is used to leverage built-in overflow checks.
- Optimizer is enabled for realistic gas behavior.
- Fee accumulation happens naturally through reserve imbalance after swaps.

---

## Mathematical Implementation

### Constant Product Formula

The AMM enforces the invariant:

reserveA × reserveB = k
```

During swaps, the output amount is calculated such that the invariant is preserved (except for fee accumulation):

```
amountOut = (amountInWithFee × reserveOut) / (reserveIn × 1000 + amountInWithFee)
```

---

### Fee Calculation

- A **0.3% fee** is applied on each swap.
- Implemented by multiplying input amount by **997 / 1000**.
- Fees remain in the pool, increasing the total value of liquidity.
- Liquidity providers benefit proportionally when removing liquidity.

---

### LP Token Minting

- **Initial Liquidity**
  - LP tokens minted = `sqrt(amountA × amountB)`

- **Subsequent Liquidity**
  - LP tokens minted proportional to existing reserves:
    ```
    min(
      amountA × totalLiquidity / reserveA,
      amountB × totalLiquidity / reserveB
    )
    ```

- LP balances are tracked internally using a mapping.

---

## Setup Instructions

### Prerequisites

- Node.js (v18 recommended)
- Docker & Docker Compose
- Git

---

### Installation

### 1. Clone the repository

```
git clone <your-repo-url>
cd dex-amm

----

### 2. Start Docker environment

```
docker-compose up -d
``` 
### 3. Compile contracts

```
docker-compose exec app npm run compile
```

### 4. Run tests
```
docker-compose exec app npm test
```
### 5. Check coverage

```
docker-compose exec app npm run coverage
```
### 6. Stop Docker
```
docker-compose down
```
---
## Running Tests Locally
```
npm install
npm run compile
npm test
```
---
## Test Suite

Built using Hardhat + Chai

Covers:
- Liquidity management
- Swaps and fee behavior
- Reserve updates
- Event emission
- Edge cases and failure scenarios
- Includes 25+ test cases
- All tests pass locally and in Docker
---
## Known Limitations
- Supports only two tokens per DEX instance
- No price oracle integration
- No slippage protection parameters
- No ERC-20 LP token contract
- Not audited for production use
---
## Security Considerations
- Uses Solidity ^0.8.0 overflow protection
- Checks for invalid inputs (zero amounts, insufficient liquidity)
- Prevents unauthorized liquidity removal
- Uses OpenZeppelin ERC-20 implementation
- Designed for educational and evaluation purposes, not mainnet deployment
---
### Author: **Sanjana Medapati**

