# Romulus: Sequencer-Resistant Randomness Oracle for Base L2

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.30-363636.svg)](https://soliditylang.org/)
[![Base Network](https://img.shields.io/badge/Base-L2-0052FF.svg)](https://base.org)

## Table of Contents
- [Overview](#overview)
- [The L2 Sequencer Problem](#the-l2-sequencer-problem)
- [Architecture](#architecture)
- [Security Model](#security-model)
- [Attack Analysis](#attack-analysis)
- [Implementation Guide](#implementation-guide)
- [Technical Specifications](#technical-specifications)
- [Development](#development)
- [Security Considerations](#security-considerations)

## Overview

Romulus is a cryptographically secure randomness oracle designed specifically for Base L2 network, providing on-chain random number generation without external dependencies or fees. It addresses the fundamental challenge of generating unbiased randomness on Layer 2 networks where a single sequencer controls block production.

### Key Features
- **Dual-mode operation**: Secure mode for high-stakes applications, Instant mode for casual use
- **No external dependencies**: Fully on-chain, no oracles or off-chain components required
- **Fee-free operation**: No payment required for randomness generation
- **Sequencer-resistant**: Secure mode eliminates sequencer bias through economic disincentives
- **Gas-efficient**: Predictable, low gas costs

## The L2 Sequencer Problem

On Base (and other OP Stack L2s), a single sequencer has near-absolute control over:
- Block contents and ordering
- Block timestamps
- Transaction inclusion/exclusion
- Block hash generation

This creates a critical vulnerability: any randomness derived from block data can be manipulated by the sequencer. The sequencer can:
- **Influence block hashes** by tweaking transactions or including dummy txs
- **Re-roll blocks** by delaying or altering them until the hash meets desired conditions
- **Cherry-pick transactions** to include in favorable blocks

## Architecture

### Dual-Mode Design

Romulus operates in two distinct modes, each optimized for different security requirements:

#### 1. Secure Mode (Commit-Reveal)
- **Purpose**: High-stakes applications requiring unbiased randomness
- **Process**: Two-phase commit-reveal using multiple historical block hashes
- **Security**: Makes sequencer manipulation economically irrational
- **Latency**: User-configurable span (8-4000 blocks)
- **Use Cases**: Lotteries, NFT mints, DeFi applications, gambling

#### 2. Instant Mode (Ring Buffer)
- **Purpose**: Low-stakes applications requiring immediate randomness
- **Process**: Single transaction using pre-generated seed ring
- **Security**: Vulnerable to sequencer bias (by design)
- **Latency**: None (immediate)
- **Use Cases**: UI randomization, visual effects, casual gaming

### Core Components

```solidity
struct Request {
    address clientContract;  // Requesting contract
    uint256 commitBlock;     // Block where request was made
    uint16 span;            // Number of blocks to aggregate
    bytes data;             // Optional callback data
}
```

## Security Model

### Secure Mode: Eliminating Sequencer Bias

The core innovation is making sequencer manipulation economically irrational through temporal separation and multi-block aggregation:

#### How It Works

1. **Request Phase**: 
   - User requests randomness
   - Contract records `commitBlock = block.number`
   - Span of future blocks is determined (e.g., 64 blocks)

2. **Waiting Period**:
   - All blocks in the span must be mined
   - Plus 1 block grace period
   - Total wait: ~(span + 1) × 2 seconds

3. **Reveal Phase**:
   - Anyone can trigger the reveal
   - Contract aggregates block hashes from the span
   - Generates random number via Keccak-256

#### The Mathematics of Security

Randomness is computed as:
```
R = keccak256(
    blockhash(commitBlock + 1),
    blockhash(commitBlock + 2),
    ...,
    blockhash(commitBlock + span)
)
```

To bias even a single bit, the sequencer must:
1. Stall the entire L2 network
2. Re-mine the entire span of blocks
3. Repeat until desired outcome is achieved

**Expected time to bias k bits = 2^k × span × block_time**

| Span | 1-bit bias | 8-bit bias | 16-bit bias |
|------|------------|------------|-------------|
| 32   | ~64s       | ~4.5 hours | ~35 hours   |
| 64   | ~128s      | ~9 hours   | ~70 hours   |
| 128  | ~256s      | ~18 hours  | ~6 days     |

### Why This Works

1. **Past Hashes Are Immutable**: Once blocks are published to L1, they cannot be reorganized without attacking the entire network
2. **No Incremental Steering**: The entire span must be rebuilt for each manipulation attempt
3. **Visible Network Stall**: Any significant delay is immediately noticeable to users and monitoring systems
4. **Economic Irrationality**: Lost sequencing fees and reputation damage far exceed potential gains

### Instant Mode: Speed vs Security Trade-off

Instant Mode explicitly trades security for speed:
- Uses pre-generated seeds from a 24-slot ring buffer
- Each seed derived from 50 consecutive block hashes
- Seeds refresh every 1,800 blocks (~1 hour)
- Vulnerable to sequencer timing manipulation
- **NOT suitable for financial applications**

## Attack Analysis

### Secure Mode Attack Vectors

| Attack | Description | Mitigation | Impact |
|--------|-------------|------------|---------|
| **Sequencer Block Manipulation** | Attempt to craft favorable block hashes | Requires reorganizing entire span | Not viable |
| **Timing Manipulation** | Delay reveal to influence outcome | Outcome predetermined by historical blocks | No effect |
| **Front-Running** | MEV bots front-run reveal transaction | Result already determined by past blocks | Cannot influence |
| **Denial of Service** | Spam network to prevent reveals | Anyone can trigger reveal; long validity window | Delay only |
| **Block Hash Unavailability** | Wait until EIP-2935 window expires | Contract checks availability; apps must ensure timely reveals | Request failure |

### Instant Mode Vulnerabilities

| Attack | Description | Severity | Mitigation |
|--------|-------------|----------|------------|
| **Sequencer Seed Selection** | Time transaction for favorable seed | HIGH | Do not use for value |
| **Transaction Ordering** | Reorder txs to influence outcomes | HIGH | Documentation warnings |
| **Timestamp Manipulation** | Adjust block timestamp within drift | MEDIUM | Not mitigated by design |
| **Entropy Starvation** | Low activity reduces entropy quality | MEDIUM | Regular seed refresh |

## Implementation Guide

### Using Secure Mode

```solidity
// 1. Choose span based on value at risk
uint16 span = 64; // ~130 seconds on Base

// 2. Request randomness
uint256 requestId = romulus.requestRandomNumber(
    abi.encode(userId, gameId), // optional data
    span
);

// 3. Implement callback
contract MyContract is IRandomNumberConsumer {
    function receiveRandomNumber(
        uint256 requestId,
        uint256 randomNumber,
        bytes memory data
    ) external {
        require(msg.sender == address(romulus));
        processResult(requestId, randomNumber);
    }
}

// 4. Monitor and reveal (after span + grace period)
(uint256 canRevealAt, ) = romulus.getRevealTime(requestId);
if (block.number > canRevealAt) {
    romulus.revealRandomNumber(requestId);
}
```

### Using Instant Mode

```solidity
// ⚠️ WARNING: Only for non-financial applications
uint256 randomValue = romulus.getInstantRandom(
    abi.encode(userId, action)
);

// Use for UI, visual effects, etc.
uint256 colorIndex = randomValue % colors.length;
```

### Span Selection Guide

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
- **Callback Gas Limit**: 10k-200k (configurable)

### Error Conditions
- `InvalidSpan`: Span outside allowed range
- `TooEarlyToReveal`: Attempting reveal before span + grace complete
- `BlockHashNotAvailable`: Historical blocks outside EIP-2935 window
- `NoValidSeedsAvailable`: Ring buffer exhausted (Instant Mode)
- `InvalidCallbackGasLimit`: Gas limit outside safe bounds

## Development

### Prerequisites
- Node.js 18+
- pnpm
- Foundry

### Setup
```bash
# Clone repository
git clone https://github.com/yourusername/romulus
cd romulus

# Install dependencies
pnpm install

# Run tests
forge test

# Deploy to Base
forge script script/Deploy.s.sol --rpc-url base --broadcast
```

### Frontend Demo
```bash
cd romulus-frontend
pnpm install
pnpm dev
```

## Security Considerations

### For Developers

1. **Choose the Right Mode**
   - Secure Mode: Any application involving value transfer
   - Instant Mode: UI, visual effects, non-competitive gaming only

2. **Handle Failures Gracefully**
   - Implement fallback mechanisms for failed reveals
   - Monitor callback failures via events
   - Set appropriate timeouts for reveal attempts

3. **Optimize Callback Functions**
   - Keep callbacks under 50k gas
   - Avoid external calls in callbacks
   - Store results for later processing if needed

### For Protocol Designers

1. **Integration Patterns**
   - Use request IDs to track randomness lifecycle
   - Implement reveal incentives if needed
   - Consider batch reveals for efficiency

2. **Risk Management**
   - Set maximum values based on chosen span
   - Implement circuit breakers for suspicious patterns
   - Monitor sequencer behavior metrics

### Warning Signs of Manipulation

Monitor for these patterns that might indicate manipulation attempts:
- Unusual block production delays
- Repeated failed reveal attempts
- Abnormal gas price spikes during reveals
- Pattern irregularities in random outputs

## Cryptographic Foundations

### Hash Function
- **Algorithm**: Keccak-256 (SHA-3)
- **Purpose**: Combines multiple entropy sources into uniform randomness
- **Properties**: One-way, collision-resistant, avalanche effect

### Entropy Sources
1. **Block hashes**: Primary source (immutable in Secure Mode)
2. **Block timestamps**: Additional entropy (limited by sequencer)
3. **Transaction data**: Gas usage, sender address
4. **Accumulated entropy**: Historical interactions
5. **Request-specific data**: User-provided input

### Why Not Use External Oracles?

While Chainlink VRF and similar oracles provide excellent randomness, Romulus offers:
- **No fees**: External oracles charge per request
- **No dependencies**: Fully self-contained on Base
- **Lower latency**: No need to wait for oracle responses
- **Simplicity**: No oracle integration complexity

The trade-off is accepting the theoretical risk of sequencer manipulation, which Romulus makes economically irrational through its design.

## Future Improvements

### Decentralized Sequencer Support
When Base implements decentralized sequencing, Romulus will automatically become more secure as no single entity will control block production.

### L1 Beacon Integration
Future versions could incorporate Ethereum L1 beacon values for additional entropy, though this would increase complexity and gas costs.

### VDF Integration
Verifiable Delay Functions could provide additional time-based security guarantees.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Built on the shoulders of giants:
- Ethereum Foundation for EIP-2935
- Optimism team for the OP Stack
- Base team for L2 infrastructure
- Security researchers who identified L2 randomness vulnerabilities

---

**⚠️ IMPORTANT**: Never use Instant Mode for applications involving real value. When in doubt, use Secure Mode with an appropriate span for your use case.

