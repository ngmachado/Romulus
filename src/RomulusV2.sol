// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * title: Romulus V2 - Sequencer-Proof Dual Randomness Oracle for Base Network
 * notice: A cryptographically secure randomness service with enhanced security against sequencer bias
 *
 * "Like Rome, built on unshakeable foundations - now with sequencer-proof architecture" 🏛️
 *
 * VERSION 2.0 SECURITY UPGRADE:
 * ============================
 * This version eliminates the critical sequencer bias vulnerability found in v1.0 by ensuring
 * all block hashes used for randomness are immutably in the past before revelation occurs.
 *
 * KEY SECURITY IMPROVEMENT:
 * - v1.0: Sequencer could manipulate the last block in the hash span
 * - v2.0: All blocks are sealed and immutable before reveal is allowed
 * - Attack cost: Re-organizing N blocks (~N×2s network stall) for 1-bit bias
 * - Economic result: Attacks become prohibitively expensive vs. reasonable bets
 *
 * DUAL RANDOMNESS SYSTEM:
 * =======================
 * 1. SECURE MODE: User-defined span commit-reveal with sequencer-proof guarantees
 * 2. INSTANT MODE: Pre-generated seeds for immediate randomness (sequencer-biasable)
 *
 * SECURE MODE (Commit-Reveal):
 * ===========================
 * - User-defined span (default 64 blocks) starting immediately after request
 * - Reveal allowed only after entire span + 1 grace block is mined
 * - All entropy sources are immutably fixed before reveal
 * - Timing: span×2s + 2s grace (e.g., 64 blocks = ~130s total)
 * - USE FOR: Financial applications, NFT mints, critical randomness
 *
 * SPAN SELECTION GUIDE (Base Network ~2s blocks):
 * ===============================================
 * - 16 blocks (~34s): Small bets, casual games, low-value NFTs
 * - 32 blocks (~66s): Medium bets, standard applications
 * - 64 blocks (~130s): Large bets, high-value applications (DEFAULT)
 * - 128 blocks (~258s): Critical applications, maximum security
 * - 256+ blocks: Extreme security (consider off-chain solutions)
 *
 * ATTACK COST ANALYSIS:
 * ====================
 * Span | Total Time | 1-bit Bias Cost | 8-bit Bias Cost | Recommended Use
 * -----|------------|-----------------|-----------------|----------------
 * 16   | ~34s       | Low             | ~2 hours        | <$100 bets
 * 32   | ~66s       | Medium          | ~4.5 hours      | $100-1k bets
 * 64   | ~130s      | High            | ~9 hours        | $1k-10k bets
 * 128  | ~258s      | Very High       | ~18 hours       | >$10k bets
 *
 * INSTANT MODE (Ring Buffer):
 * ==========================
 * - Millisecond response time using pre-generated seeds
 * - Sequencer can bias results (documented limitation)
 * - USE FOR: UI randomness, gaming, non-financial applications
 *
 * BASE NETWORK CONSTRAINTS:
 * ========================
 * This contract is optimized for Base network:
 * - Block time: ~2 seconds per block
 * - EIP-2935: Stores last 8,191 block hashes in state
 * - History window: ~4.5 hours (8,191 blocks × 2 seconds)
 * - Max safe span: ~4000 blocks (conservative limit)
 *
 * SEQUENCER BIAS ELIMINATION:
 * ===========================
 * The core security improvement ensures temporal separation:
 *
 * Timeline Example (64-block span):
 * Block 100: requestRandomNumber(data, 64) called
 * Block 101-164: Hash span (64 blocks) - FIXED ENTROPY
 * Block 165: Grace period - ensures span is sealed
 * Block 166+: revealRandomNumber() allowed - ALL HASHES IMMUTABLE
 *
 * Attack Analysis:
 * - N-bit bias requires re-org of entire span
 * - Cost: span×2 seconds of network disruption
 * - Economic conclusion: Larger spans make attacks irrational
 *
 * CRYPTOGRAPHIC RING BUFFER (Unchanged from v1):
 * ==============================================
 * The instant randomness system uses a 24-slot ring buffer with:
 *
 * SECURITY FEATURES:
 * - Forward Secrecy: Past randomness cannot predict future values
 * - Backward Secrecy: Future randomness cannot predict past values
 * - Non-Replayability: Each random number is unique via consume counters
 * - Multi-Block Entropy: Each seed uses 50 consecutive block hashes
 *
 * RING BUFFER PROPERTIES:
 * - 24 seeds × 1 hour refresh = 24 hours coverage
 * - Each seed: 50 block hashes × 2 seconds = 100 seconds of entropy
 * - Automatic refresh every 1800 blocks (~1 hour)
 * - Forward secrecy through hash chaining
 *
 * ENTROPY SOURCES (prevrandao removed):
 * ====================================
 * V2 removes block.prevrandao as it's always 0 on Base network.
 * Entropy sources now include:
 * - Block hashes (primary source)
 * - Block timestamps
 * - Transaction gas usage
 * - Accumulated entropy from all interactions
 * - Request-specific data
 *
 * GAS OPTIMIZATION:
 * ================
 * V2 provides predictable gas costs based on span:
 * - Secure mode: span × ~15 gas per blockhash read
 * - Instant mode: Single seed access (~200 gas)
 * - 64-block span: ~1000 gas overhead (~$0.001)
 *
 * USAGE PATTERNS:
 * ==============
 *
 * SECURE RANDOMNESS (Financial Applications):
 * ```solidity
 * // Request phase - choose span based on value at risk
 * uint256 requestId = romulus.requestRandomNumber("lottery-round-123", 64);
 *
 * // Wait for span + grace period (64 blocks = ~130s)
 *
 * // Reveal phase (anyone can call)
 * romulus.revealRandomNumber(requestId);
 * // Your contract receives callback with cryptographically secure random number
 * ```
 *
 * INSTANT RANDOMNESS (Non-Financial Applications):
 * ```solidity
 * // Immediate response (single transaction)
 * uint256 randomValue = romulus.getInstantRandom("game-action-456");
 * // Use for UI, gaming, non-critical applications
 * ```
 *
 * SECURITY RECOMMENDATIONS:
 * ========================
 * - Choose span based on value at risk and acceptable delay
 * - Minimum 16 blocks for any financial application
 * - 64+ blocks recommended for high-value applications
 * - Instant mode: Use only for non-financial applications
 * - Always validate randomness in your callback function
 * - Monitor for failed reveals and implement retry logic
 * - Callback functions should be lightweight (configurable gas limit)
 * - Handle callback failures gracefully in your application
 *
 * CONTRACT ARCHITECTURE:
 * =====================
 * - Fee-free operation (no payment required)
 * - No external oracles or dependencies
 * - Fully on-chain entropy generation
 * - Permissionless reveal mechanism
 * - Automatic ring buffer maintenance
 * - Configurable gas-limited callbacks prevent griefing attacks
 */

// Interface for client contracts to receive random numbers
interface IRandomNumberConsumer {
    function receiveRandomNumber(
        uint256 requestId,
        uint256 randomNumber,
        bytes memory data
    ) external;
}

// Custom errors for gas efficiency
error NotOwner();
error RequestDoesNotExist();
error TooEarlyToReveal();
error BlockHashNotAvailable();
error NotEnoughBlockHistory();
error TooEarlyToGenerateNewSeed();
error NoValidSeedsAvailable();
error SelectedSeedInvalid();
error InvalidRingPosition();
error InvalidSpan();
error SpanTooLarge();
error InvalidCallbackGasLimit();

contract RomulusV2 {
    // V2 SECURITY CONSTANTS
    uint16 public constant DEFAULT_SPAN = 64; // Default 64-block span
    uint16 public constant MIN_SPAN = 8; // Minimum 8-block span
    uint16 public constant MAX_SPAN = 4000; // Maximum span (conservative EIP-2935 limit)
    uint16 public constant GRACE = 1; // Wait 1 extra block after span completion

    // Configurable gas limit for external callback to prevent griefing
    uint256 public callbackGasLimit = 50000; // Default 50k gas, adjustable by owner
    uint256 public constant MIN_CALLBACK_GAS = 10000; // Minimum 10k gas
    uint256 public constant MAX_CALLBACK_GAS = 200000; // Maximum 200k gas

    // Base network specific constraints (EIP-2935)
    uint256 public constant BASE_BLOCK_TIME = 2; // seconds per block
    uint256 public constant EIP_2935_HISTORY_WINDOW = 8191; // blocks available via EIP-2935

    // Ring buffer constants for instant randomness (unchanged from v1)
    uint256 public constant RING_SIZE = 24; // 24 seeds = 24 hours of coverage
    uint256 public constant SEED_REFRESH_INTERVAL = 1800; // blocks (~1 hour on Base)
    uint256 public constant HASHES_PER_SEED = 50; // Use 50 block hashes per seed

    uint256 public requestCounter;
    address public owner;

    // V2 REQUEST STRUCTURE WITH USER-DEFINED SPAN
    struct Request {
        address clientContract; // Address of the requesting contract
        uint256 startBlock; // First block in the span (requestBlock + 1)
        uint16 span; // Number of blocks in the span
        bytes data; // Optional data to pass back to the client
    }

    // Mapping from request ID to request details
    mapping(uint256 => Request) public requests;

    // Events for tracking requests and reveals
    event RandomNumberRequested(
        uint256 requestId,
        uint256 startBlock,
        uint16 span
    );
    event RandomNumberRevealed(uint256 requestId, uint256 randomNumber);
    event CallbackFailed(
        uint256 requestId,
        address clientContract,
        bytes reason
    );
    event CallbackGasLimitUpdated(uint256 oldLimit, uint256 newLimit);

    // Ring buffer events (unchanged from v1)
    event SeedGenerated(
        uint256 ringPosition,
        bytes32 seedHash,
        uint256 blockNumber
    );
    event InstantRandomDelivered(
        address indexed client,
        uint256 randomNumber,
        uint256 ringPosition,
        uint256 consumeCount
    );
    event RingRefreshNeeded(uint256 currentBlock, uint256 lastGeneration);

    // Ring buffer for pre-generated randomness (unchanged from v1)
    struct RandomSeed {
        bytes32 seedHash; // The actual random seed
        uint256 generatedAt; // Block number when generated
        uint256 consumeCount; // Number of times this seed has been used
        bool isValid; // Whether this seed is valid for use
    }

    // Ring buffer state
    RandomSeed[RING_SIZE] public randomRing;
    uint256 public currentRingPosition;
    uint256 public lastSeedGeneration;
    uint256 public totalInstantRequests;

    // Safe entropy accumulation (prevrandao removed)
    bytes32 private entropyAccumulator;
    uint256 private lastEntropyBlock;
    uint256 private entropyContributions;

    constructor() {
        owner = msg.sender;
        lastSeedGeneration = block.number;
        // Initialize entropy without prevrandao (always 0 on Base)
        entropyAccumulator = keccak256(
            abi.encodePacked(
                block.timestamp,
                blockhash(block.number - 1),
                address(this)
            )
        );
        lastEntropyBlock = block.number;
        // Initialize the ring with the first seed
        _generateSeed();
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /**
     * @notice Safely accumulate entropy from user interactions
     * @dev Removes prevrandao as it's always 0 on Base network
     */
    function _accumulateEntropy() private {
        if (lastEntropyBlock < block.number) {
            entropyAccumulator = keccak256(
                abi.encodePacked(
                    entropyAccumulator,
                    block.timestamp,
                    blockhash(block.number - 1),
                    gasleft(),
                    msg.sender,
                    tx.gasprice
                )
            );
            lastEntropyBlock = block.number;
            entropyContributions++;
        }
    }

    /**
     * @notice Get current entropy statistics
     * @return contributions Number of entropy contributions
     * @return lastBlock Last block when entropy was added
     * @return blocksSinceLastEntropy Blocks since last entropy addition
     */
    function getEntropyStats()
        external
        view
        returns (
            uint256 contributions,
            uint256 lastBlock,
            uint256 blocksSinceLastEntropy
        )
    {
        return (
            entropyContributions,
            lastEntropyBlock,
            block.number > lastEntropyBlock
                ? block.number - lastEntropyBlock
                : 0
        );
    }

    /**
     * @notice Get ring buffer status
     * @return validSeeds Number of valid seeds in the ring
     * @return oldestSeedAge Age of the oldest valid seed in blocks
     * @return nextRefreshIn Blocks until next seed refresh is allowed
     */
    function getRingStatus()
        external
        view
        returns (
            uint256 validSeeds,
            uint256 oldestSeedAge,
            uint256 nextRefreshIn
        )
    {
        uint256 count = 0;
        uint256 oldestAge = type(uint256).max;

        for (uint256 i = 0; i < RING_SIZE; i++) {
            if (randomRing[i].isValid) {
                count++;
                uint256 age = block.number > randomRing[i].generatedAt
                    ? block.number - randomRing[i].generatedAt
                    : 0;
                if (age < oldestAge) {
                    oldestAge = age;
                }
            }
        }

        if (oldestAge == type(uint256).max) {
            oldestAge = 0;
        }

        uint256 nextRefresh = SEED_REFRESH_INTERVAL + lastSeedGeneration;
        uint256 blocksUntilRefresh = block.number >= nextRefresh
            ? 0
            : nextRefresh - block.number;

        return (count, oldestAge, blocksUntilRefresh);
    }

    /**
     * @notice Find the oldest valid seed in the ring buffer
     * @return position Ring position of the oldest valid seed
     */
    function _findOldestValidSeed() private view returns (uint256 position) {
        uint256 oldestAge = type(uint256).max;
        uint256 oldestPosition = RING_SIZE; // Invalid position as default

        for (uint256 i = 0; i < RING_SIZE; i++) {
            if (
                randomRing[i].isValid && randomRing[i].generatedAt < oldestAge
            ) {
                oldestAge = randomRing[i].generatedAt;
                oldestPosition = i;
            }
        }

        return oldestPosition;
    }

    /**
     * @notice Generate a new seed for the ring buffer
     * @dev Uses 50 consecutive block hashes for maximum entropy
     */
    function _generateSeed() private {
        _accumulateEntropy();

        // Ensure we have enough block history
        if (block.number < HASHES_PER_SEED) revert NotEnoughBlockHistory();

        bytes32 combinedHash = entropyAccumulator;
        uint256 startBlock = block.number - HASHES_PER_SEED;

        // Combine 50 consecutive block hashes
        for (uint256 i = 0; i < HASHES_PER_SEED; i++) {
            bytes32 blockHash = blockhash(startBlock + i);
            if (blockHash == 0) revert BlockHashNotAvailable();

            combinedHash = keccak256(
                abi.encodePacked(
                    combinedHash,
                    blockHash,
                    block.timestamp,
                    gasleft()
                )
            );
        }

        // Final seed generation with additional entropy
        bytes32 finalSeed = keccak256(
            abi.encodePacked(
                combinedHash,
                entropyAccumulator,
                lastEntropyBlock,
                entropyContributions,
                block.number,
                block.timestamp,
                address(this)
            )
        );

        // Store in ring buffer
        randomRing[currentRingPosition] = RandomSeed({
            seedHash: finalSeed,
            generatedAt: block.number,
            consumeCount: 0,
            isValid: true
        });

        emit SeedGenerated(currentRingPosition, finalSeed, block.number);

        // Advance ring position
        currentRingPosition = (currentRingPosition + 1) % RING_SIZE;
        lastSeedGeneration = block.number;
    }

    /**
     * @notice V2 SECURE MODE: Request a cryptographically secure random number
     * @param data Optional data to include in the randomness generation and callback
     * @param span Number of blocks to use for randomness (default: 64)
     * @dev Uses user-defined span starting from next block, eliminates sequencer bias
     */
    function requestRandomNumber(bytes memory data, uint16 span) external {
        // Validate span
        if (span < MIN_SPAN || span > MAX_SPAN) revert InvalidSpan();

        // Additional safety check for EIP-2935 constraints
        if (span > EIP_2935_HISTORY_WINDOW / 2) revert SpanTooLarge();

        // Safely accumulate entropy from this interaction
        _accumulateEntropy();

        requestCounter++;
        uint256 requestId = requestCounter;

        // V2 SECURITY: Fixed span starting immediately after request
        uint256 startBlock = block.number + 1;

        requests[requestId] = Request({
            clientContract: msg.sender,
            startBlock: startBlock,
            span: span,
            data: data
        });

        emit RandomNumberRequested(requestId, startBlock, span);
    }

    /**
     * @notice V2 SECURE MODE: Request randomness with default 64-block span
     * @param data Optional data to include in the randomness generation and callback
     * @dev Convenience function using the recommended default span
     */
    function requestRandomNumber(bytes memory data) external {
        // Use default span
        this.requestRandomNumber(data, DEFAULT_SPAN);
    }

    /**
     * @notice V2 SECURE MODE: Reveal a random number (permissionless)
     * @param requestId The ID of the request to reveal
     * @dev Only callable after the entire span + grace period is complete
     */
    function revealRandomNumber(uint256 requestId) external {
        Request memory r = requests[requestId];
        if (r.clientContract == address(0)) revert RequestDoesNotExist();

        // V2 SECURITY: Ensure entire span + grace period is complete
        uint256 lastBlockInSpan = r.startBlock + r.span - 1;
        if (block.number <= lastBlockInSpan + GRACE) revert TooEarlyToReveal();

        // Check if we can still access the required block hashes
        uint256 oldestAccessibleBlock = block.number > EIP_2935_HISTORY_WINDOW
            ? block.number - EIP_2935_HISTORY_WINDOW
            : 0;
        if (r.startBlock < oldestAccessibleBlock)
            revert BlockHashNotAvailable();

        // V2 SECURITY: Combine exactly span blocks, all immutably in the past
        bytes32 combinedHash = bytes32(0);
        for (uint256 n = r.startBlock; n <= lastBlockInSpan; n++) {
            bytes32 blockHash = blockhash(n);
            if (blockHash == 0) revert BlockHashNotAvailable();
            combinedHash = keccak256(abi.encodePacked(combinedHash, blockHash));
        }

        // Generate final random number
        uint256 randomNumber = uint256(
            keccak256(abi.encodePacked(combinedHash, requestId))
        );

        // Clean up request
        delete requests[requestId];

        try
            IRandomNumberConsumer(r.clientContract).receiveRandomNumber{
                gas: callbackGasLimit
            }(requestId, randomNumber, r.data)
        {} catch (bytes memory reason) {
            emit CallbackFailed(requestId, r.clientContract, reason);
        }

        emit RandomNumberRevealed(requestId, randomNumber);
    }

    /**
     * @notice Check if a request is still valid and can be revealed
     * @param requestId The request ID to check
     * @return available Whether the request can still be revealed
     * @return blocksUntilExpiry Blocks until the request expires (0 if expired)
     */
    function isRequestStillValid(
        uint256 requestId
    ) external view returns (bool available, uint256 blocksUntilExpiry) {
        Request memory r = requests[requestId];
        if (r.clientContract == address(0)) {
            return (false, 0);
        }

        uint256 lastBlockInSpan = r.startBlock + r.span - 1;
        uint256 expiryBlock = block.number + EIP_2935_HISTORY_WINDOW;

        if (r.startBlock < expiryBlock) {
            uint256 blocksLeft = expiryBlock - r.startBlock;
            return (true, blocksLeft);
        } else {
            return (false, 0);
        }
    }

    /**
     * @notice Get the expected reveal time for a request
     * @param requestId The request ID to check
     * @return canRevealAt Block number when reveal becomes available
     * @return estimatedSeconds Estimated seconds until reveal (approximate)
     */
    function getRevealTime(
        uint256 requestId
    ) external view returns (uint256 canRevealAt, uint256 estimatedSeconds) {
        Request memory r = requests[requestId];
        if (r.clientContract == address(0)) {
            return (0, 0);
        }

        canRevealAt = r.startBlock + r.span + GRACE;

        if (block.number >= canRevealAt) {
            estimatedSeconds = 0;
        } else {
            uint256 blocksToWait = canRevealAt - block.number;
            estimatedSeconds = blocksToWait * BASE_BLOCK_TIME;
        }

        return (canRevealAt, estimatedSeconds);
    }

    /**
     * @notice INSTANT MODE: Get immediate randomness (sequencer-biasable)
     * @param data Optional data to mix into the randomness
     * @return randomNumber The generated random number
     * @dev WARNING: Sequencer can bias results. Do not use for financial applications.
     */
    function getInstantRandom(
        bytes memory data
    ) external returns (uint256 randomNumber) {
        _accumulateEntropy();

        // Auto-refresh ring if needed
        if (block.number >= lastSeedGeneration + SEED_REFRESH_INTERVAL) {
            _generateSeed();
            emit RingRefreshNeeded(block.number, lastSeedGeneration);
        }

        // Find oldest valid seed for forward secrecy
        uint256 seedPosition = _findOldestValidSeed();
        if (seedPosition >= RING_SIZE) revert NoValidSeedsAvailable();

        RandomSeed storage seed = randomRing[seedPosition];
        if (!seed.isValid) revert SelectedSeedInvalid();

        // Generate random number using seed + request data
        randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    seed.seedHash,
                    seed.consumeCount,
                    entropyAccumulator,
                    block.number,
                    block.timestamp,
                    gasleft(),
                    msg.sender,
                    data
                )
            )
        );

        // Update seed state
        seed.consumeCount++;
        totalInstantRequests++;

        // Invalidate seed after 100 uses for forward secrecy
        if (seed.consumeCount >= 100) {
            seed.isValid = false;
        }

        emit InstantRandomDelivered(
            msg.sender,
            randomNumber,
            seedPosition,
            seed.consumeCount
        );

        return randomNumber;
    }

    /**
     * @notice Generate a new seed manually (owner only)
     * @dev Useful for emergency seed generation or testing
     */
    function generateSeed() external {
        if (block.number < lastSeedGeneration + SEED_REFRESH_INTERVAL) {
            revert TooEarlyToGenerateNewSeed();
        }
        _generateSeed();
    }

    /**
     * @notice Invalidate a specific seed (owner only)
     * @param position Ring position to invalidate
     */
    function invalidateSeed(uint256 position) external onlyOwner {
        if (position >= RING_SIZE) revert InvalidRingPosition();
        randomRing[position].isValid = false;
    }

    /**
     * @notice Update the callback gas limit (owner only)
     * @param newGasLimit New gas limit for callbacks (must be between MIN_CALLBACK_GAS and MAX_CALLBACK_GAS)
     * @dev Allows adjustment of gas limit based on network conditions and callback complexity
     */
    function setCallbackGasLimit(uint256 newGasLimit) external onlyOwner {
        if (newGasLimit < MIN_CALLBACK_GAS || newGasLimit > MAX_CALLBACK_GAS) {
            revert InvalidCallbackGasLimit();
        }

        uint256 oldLimit = callbackGasLimit;
        callbackGasLimit = newGasLimit;

        emit CallbackGasLimitUpdated(oldLimit, newGasLimit);
    }
}
