# Romulus V2: Sequencer-Proof Randomness Oracle for Base Network

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Security Model](#security-model)
4. [Attack Analysis](#attack-analysis)
5. [What Romulus Can and Cannot Do](#what-romulus-can-and-cannot-do)
6. [Usage Guide](#usage-guide)
7. [Technical Specifications](#technical-specifications)
8. [Best Practices](#best-practices)

## Overview

Romulus V2 is a dual-mode randomness oracle designed specifically for Base L2 network, providing cryptographically secure random numbers without external dependencies or fees. It addresses the critical challenge of generating unbiased randomness on Layer 2 networks where a single sequencer controls block production.

### Key Features
- **Dual-mode operation**: Secure mode for high-stakes applications, Instant mode for casual use
- **No external dependencies**: Fully on-chain, no oracles or off-chain components
- **Fee-free**: No payment required for randomness generation
- **Sequencer-resistant**: Secure mode eliminates sequencer bias through economic disincentives
- **Gas-efficient**: Predictable, low gas costs

### The L2 Sequencer Problem

On Base (and other L2 networks), a single sequencer has near-absolute control over:
- Block contents and ordering
- Block timestamps
- Transaction inclusion/exclusion
- Block hash generation

This creates a fundamental challenge: any randomness derived from block data can potentially be manipulated by the sequencer. Traditional approaches like using `block.prevrandao` or simple block hashes are vulnerable to sequencer bias.

## Architecture

### Dual-Mode Design

Romulus V2 operates in two distinct modes, each optimized for different use cases:

#### 1. Secure Mode (Commit-Reveal)
- **Purpose**: High-stakes applications requiring unbiased randomness
- **Delay**: User-configurable span (8-4000 blocks, default 64)
- **Security**: Sequencer-proof through economic disincentives
- **Gas Cost**: ~15 gas per block in span
- **Use Cases**: Lotteries, NFT mints, financial applications

#### 2. Instant Mode (Ring Buffer)
- **Purpose**: Low-stakes applications requiring immediate randomness
- **Delay**: None (single transaction)
- **Security**: Vulnerable to sequencer bias
- **Gas Cost**: ~200 gas
- **Use Cases**: UI randomization, casual gaming, non-financial applications

### Core Components

#### Request Structure
```solidity
struct Request {
    address clientContract;  // Requesting contract
    uint256 startBlock;     // First block in span (requestBlock + 1)
    uint16 span;           // Number of blocks to use
    bytes data;            // Optional callback data
}
```

#### Ring Buffer System
- 24 pre-generated seeds (24-hour coverage)
- Each seed uses 50 consecutive block hashes
- Seeds refresh every 1800 blocks (~1 hour)
- Forward secrecy through consumption limits

## Security Model

### Secure Mode: Eliminating Sequencer Bias

The core innovation of Romulus V2's Secure Mode is making sequencer manipulation economically irrational through the following mechanism:

#### 1. Temporal Separation
```
Block N:     requestRandomNumber() called
Block N+1:   Start of hash span (startBlock)
...
Block N+64:  End of hash span (default)
Block N+65:  Grace period
Block N+66+: revealRandomNumber() allowed
```

#### 2. Immutable Past Principle
- All block hashes used for randomness are **already finalized** when reveal occurs
- Sequencer cannot manipulate these historical blocks without reorganizing the chain
- Any manipulation attempt requires stalling the entire L2 network

#### 3. Economic Disincentives

| Span | Time to Re-org | 1-bit Bias Cost | 8-bit Bias Cost | Recommended Use |
|------|----------------|-----------------|-----------------|-----------------|
| 16   | ~34s          | Low             | ~2 hours        | <$100 bets      |
| 32   | ~66s          | Medium          | ~4.5 hours      | $100-1k bets    |
| 64   | ~130s         | High            | ~9 hours        | $1k-10k bets    |
| 128  | ~258s         | Very High       | ~18 hours       | >$10k bets      |

To bias even a single bit with a 64-block span, the sequencer must:
1. Stall the entire Base network for ~2 minutes
2. Forfeit all sequencing fees during this period
3. Risk reputation damage and potential slashing
4. Trigger immediate alerts from monitoring systems

### Instant Mode: Speed vs Security Trade-off

Instant Mode explicitly trades security for speed:
- **Vulnerability**: Sequencer can influence seed selection through timing manipulation
- **Mitigation**: Clear documentation and warnings against financial use
- **Purpose**: Provides fast randomness for applications where bias is acceptable

### Cryptographic Primitives

#### Hash Function
- **Algorithm**: Keccak-256 (SHA-3)
- **Purpose**: Combines multiple entropy sources into uniform randomness
- **Properties**: One-way, collision-resistant, avalanche effect

#### Entropy Sources
1. **Block hashes**: Primary source (immutable in Secure Mode)
2. **Block timestamps**: Additional entropy
3. **Transaction data**: Gas usage, sender address
4. **Accumulated entropy**: Historical interactions
5. **Request-specific data**: User-provided input

#### Why block.prevrandao is Not Used
- Always returns 0 on Base network
- L2 sequencers don't implement beacon randomness
- Removed from V2 to avoid confusion

## Attack Analysis

### Secure Mode Attacks and Mitigations

#### 1. Sequencer Block Manipulation
- **Attack**: Sequencer attempts to craft favorable block hashes
- **Mitigation**: All hashes are historical and immutable by reveal time
- **Cost**: Requires reorganizing span blocks (economically infeasible)
- **Result**: **Not viable**

#### 2. Timing Manipulation
- **Attack**: Sequencer delays reveal to influence outcome
- **Mitigation**: Random value depends only on fixed historical blocks
- **Impact**: **No effect on randomness**

#### 3. Front-Running
- **Attack**: MEV bots or sequencer front-run reveal transaction
- **Mitigation**: Outcome predetermined by historical blocks
- **Impact**: **Cannot influence result**

#### 4. Denial of Service
- **Attack**: Spam network to prevent reveals
- **Mitigation**: 
  - Anyone can trigger reveal (permissionless)
  - Long validity window (thousands of blocks)
- **Impact**: **Operational delay only**

#### 5. Block Hash Unavailability
- **Attack**: Wait until EIP-2935 window expires (8191 blocks)
- **Mitigation**: 
  - Contract checks hash availability
  - Applications must ensure timely reveals
- **Impact**: **Request failure, not manipulation**

### Instant Mode Vulnerabilities

#### 1. Sequencer Seed Selection
- **Attack**: Sequencer times transaction to select favorable seed
- **Severity**: **High for financial applications**
- **Mitigation**: Do not use for value-bearing operations

#### 2. Transaction Ordering
- **Attack**: Sequencer reorders transactions to influence outcomes
- **Severity**: **High**
- **Mitigation**: Documentation and warnings

#### 3. Timestamp Manipulation
- **Attack**: Sequencer adjusts block timestamp within allowed drift
- **Impact**: Can influence random output
- **Mitigation**: Not mitigated - by design for speed

## What Romulus Can and Cannot Do

### ✅ What Romulus CAN Do

#### Secure Mode
- **Provide unbiased randomness** for high-stakes applications
- **Eliminate sequencer manipulation** through economic disincentives
- **Generate cryptographically secure** random numbers
- **Operate without external dependencies** or oracles
- **Offer predictable gas costs** based on chosen span
- **Support financial applications** (lotteries, auctions, NFT mints)

#### Instant Mode
- **Deliver immediate randomness** in a single transaction
- **Provide sufficient randomness** for UI and casual gaming
- **Operate with minimal gas costs** (~200 gas)
- **Support high-throughput** non-critical applications

### ❌ What Romulus CANNOT Do

#### Fundamental Limitations
- **Cannot provide instant unbiased randomness** (this is theoretically impossible on L2)
- **Cannot prevent sequencer from stalling the network** (but makes it economically irrational)
- **Cannot generate randomness without some delay** in Secure Mode
- **Cannot prevent all forms of manipulation** in Instant Mode
- **Cannot work without historical block hash access** (requires EIP-2935)

#### Secure Mode Limitations
- **Cannot eliminate latency** (minimum ~16 blocks delay)
- **Cannot reduce gas costs** below span requirements
- **Cannot prevent reveal censorship** (though anyone can reveal)
- **Cannot work with spans larger than ~4000 blocks** (EIP-2935 limit)

#### Instant Mode Limitations
- **Cannot prevent sequencer bias** (by design)
- **Cannot be used for financial applications** safely
- **Cannot guarantee fairness** in competitive scenarios
- **Cannot provide cryptographic security** against motivated attackers

## Usage Guide

### Secure Mode Implementation

#### 1. Request Randomness
```solidity
// Choose span based on value at risk
uint16 span = 64; // ~130 seconds on Base

// Request with custom span
uint256 requestId = romulus.requestRandomNumber(
    abi.encode(userId, gameId), // optional data
    span
);

// Or use default span (64 blocks)
uint256 requestId = romulus.requestRandomNumber(data);
```

#### 2. Implement Callback
```solidity
contract MyContract is IRandomNumberConsumer {
    function receiveRandomNumber(
        uint256 requestId,
        uint256 randomNumber,
        bytes memory data
    ) external {
        // Verify caller is Romulus
        require(msg.sender == address(romulus));
        
        // Process random number (you have ~50k gas)
        processResult(requestId, randomNumber);
        emit RandomnessReceived(requestId, randomNumber);
    }
}
```

#### 3. Monitor and Reveal
```solidity
// Check when reveal is available
(uint256 canRevealAt, uint256 estimatedSeconds) = romulus.getRevealTime(requestId);

// Anyone can trigger reveal after span + grace period
if (block.number > canRevealAt) {
    romulus.revealRandomNumber(requestId);
}
```

### Instant Mode Implementation

```solidity
// ⚠️ WARNING: Only for non-financial applications
uint256 randomValue = romulus.getInstantRandom(
    abi.encode(userId, action)
);

// Use for UI randomization, visual effects, etc.
uint256 colorIndex = randomValue % colors.length;
```

### Span Selection Guide

Choose span based on the value at risk and acceptable delay:

| Value at Risk | Recommended Span | Total Delay | Security Level |
|--------------|------------------|-------------|----------------|
| <$100        | 16 blocks       | ~34s        | Basic          |
| $100-$1k     | 32 blocks       | ~66s        | Medium         |
| $1k-$10k     | 64 blocks       | ~130s       | High (default) |
| $10k-$100k   | 128 blocks      | ~258s       | Very High      |
| >$100k       | 256+ blocks     | ~8+ min     | Maximum        |

## Technical Specifications

### Constants
```solidity
uint16 constant DEFAULT_SPAN = 64;          // Default security level
uint16 constant MIN_SPAN = 8;               // Minimum allowed span
uint16 constant MAX_SPAN = 4000;            // Conservative EIP-2935 limit
uint16 constant GRACE = 1;                  // Grace period after span

uint256 constant RING_SIZE = 24;            // Ring buffer slots
uint256 constant SEED_REFRESH_INTERVAL = 1800; // ~1 hour
uint256 constant HASHES_PER_SEED = 50;      // Entropy per seed
```

### Gas Costs
- **Secure Mode Request**: ~50k gas
- **Secure Mode Reveal**: ~20k + (span × 15) gas
- **Instant Mode**: ~30k gas
- **Callback Gas Limit**: Configurable (10k-200k, default 50k)

### Error Conditions
- `InvalidSpan`: Span outside allowed range
- `TooEarlyToReveal`: Attempting reveal before span + grace complete
- `BlockHashNotAvailable`: Historical blocks outside EIP-2935 window
- `NoValidSeedsAvailable`: Ring buffer exhausted (Instant Mode)
- `InvalidCallbackGasLimit`: Gas limit outside safe bounds

## Best Practices

### For Developers

1. **Choose the Right Mode**
   - Secure Mode: Any application involving value transfer
   - Instant Mode: UI, visual effects, non-competitive gaming only

2. **Handle Failures Gracefully**
   - Implement fallback mechanisms for failed reveals
   - Monitor callback failures via events
   - Set appropriate timeouts for reveal attempts

3. **Optimize Callback Functions**
   - Keep callbacks lightweight (< 50k gas)
   - Avoid external calls in callbacks
   - Store results for later processing if needed

4. **Security Considerations**
   - Never use Instant Mode for financial decisions
   - Choose span based on value at risk
   - Implement additional randomness sources for extreme values
   - Monitor for unusual network behavior during reveals

### For Protocol Designers

1. **Integration Patterns**
   - Use request IDs to track randomness lifecycle
   - Implement reveal incentives if needed
   - Consider batch reveals for efficiency

2. **Risk Management**
   - Set maximum values based on chosen span
   - Implement circuit breakers for suspicious patterns
   - Monitor sequencer behavior metrics

3. **User Experience**
   - Clearly communicate delays to users
   - Show progress during waiting periods
   - Provide clear mode selection guidance

### Warning Signs of Sequencer Manipulation

Monitor for these patterns that might indicate manipulation attempts:
- Unusual block production delays
- Repeated failed reveal attempts
- Abnormal gas price spikes during reveals
- Pattern irregularities in random outputs

## Conclusion

Romulus V2 provides a practical solution to the challenging problem of on-chain randomness generation on L2 networks. By offering two distinct modes, it allows developers to choose the appropriate trade-off between security and speed for their specific use case.

**Secure Mode** makes sequencer manipulation economically irrational through its innovative use of historical block hashes and enforced delays, suitable for any application where fairness matters.

**Instant Mode** explicitly trades security for speed, providing immediate randomness for casual applications where bias is acceptable.

The key to using Romulus safely is understanding these trade-offs and choosing the appropriate mode and parameters for your application's security requirements. 