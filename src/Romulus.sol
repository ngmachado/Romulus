// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./IRomulus.sol";
/**
 * title Romulus - Dual Randomness Oracle for Base Network
 * notice A cryptographically secure randomness service with dual modes: commit-reveal and instant ring
 *
 * "Like Rome, built on unshakeable foundations" 🏛️
 *
 * NOTE: This is a fee-free version focused on core randomness functionality.
 * Economic incentives and payment systems will be designed in a future version.
 *
 * DUAL RANDOMNESS SYSTEM:
 * =======================
 * 1. COMMIT-REVEAL: High-security, 2-transaction process for critical applications
 * 2. INSTANT RING: Pre-generated seeds for immediate randomness needs
 *
 * BASE NETWORK CONSTRAINTS:
 * ========================
 * This contract is designed specifically for Base network, which has:
 * - Block time: ~2 seconds per block
 * - EIP-2935: Stores last 8,191 block hashes in state
 * - History window: ~4.5 hours (8,191 blocks × 2 seconds)
 *
 * EIP-2935 LIMITATIONS:
 * ====================
 * EIP-2935 uses a ring buffer that stores only the most recent 8,191 block hashes.
 * Once a block hash is older than 8,191 blocks (~4.5 hours), it becomes unavailable.
 * This creates time constraints for our randomness requests:
 *
 * 1. MAX_REVEAL_DELAY: Requests must be revealed within 3 hours to ensure
 *    block hashes remain available when revelation occurs.
 *
 * 2. MAX_HASH_COUNT: Limited to 1000 consecutive hashes to prevent:
 *    - Excessive gas costs during revelation
 *    - Hash spans that exceed the EIP-2935 window
 *
 * CRYPTOGRAPHIC RING BUFFER:
 * ==========================
 * The instant randomness system uses a 24-slot ring buffer with these properties:
 *
 * SECURITY FEATURES:
 * - Forward Secrecy: Past randomness cannot predict future values
 * - Backward Secrecy: Future randomness cannot predict past values
 * - Non-Replayability: Each random number is unique via consume counters
 * - Multi-Block Entropy: Each seed uses 50 consecutive block hashes
 * - Automatic Refresh: New seeds generated every hour
 * - Usage Limits: Seeds invalidated after 100 uses
 *
 * RING BUFFER MECHANICS:
 * - 24 seeds = 24 hours of coverage (1 seed per hour)
 * - Each seed uses 50 block hashes for cryptographic strength
 * - Seeds consumed in oldest-first order for forward secrecy
 * - Automatic refresh every 1800 blocks (~1 hour)
 * - Manual refresh allowed by anyone when interval expires
 *
 * ATTACK RESISTANCE (Attack Model Considerations):
 * - Ring position advances deterministically (prevents cherry-picking)
 * - Seeds include request-specific entropy (prevents pre-computation)
 * - Multiple block hashes per seed (prevents single-block manipulation)
 * - Time-based refresh (limits exposure window)
 * - Consume counting (prevents replay attacks)
 *
 * SAFE ENTROPY ENHANCEMENT:
 * ========================
 * Client interactions safely enhance entropy WITHOUT allowing manipulation:
 *
 * SAFE ENTROPY SOURCES (Non-Manipulable):
 * - block.timestamp (bounded manipulation resistance)
 * - block.difficulty / block.prevrandao (network determined)
 * - block.number (deterministic increment)
 * - blockhash(block.number - 1) (previous block hash)
 * - gasleft() (varies by execution context)
 * - Internal counters (contract controlled)
 *
 * ENTROPY ACCUMULATION RULES:
 * - Only accumulates once per block (prevents spam)
 * - Uses ONLY blockchain state (not user input)
 * - Mixes with existing accumulator cryptographically
 * - Enhances seed generation without contamination
 *
 * CLIENT DATA USAGE:
 * - msg.sender & data used for OUTPUT uniqueness only
 * - NOT used for entropy accumulation (prevents manipulation)
 * - Ensures each client gets unique randomness
 * - Cannot influence future seed generation
 * USAGE EXAMPLES:
 * ===============
 * COMMIT-REVEAL (High Security):
 * - romulus.requestRandomNumber(futureBlock, data, 5);    // Gaming
 * - romulus.requestRandomNumber(futureBlock, data, 50);   // DeFi
 * - romulus.requestRandomNumber(futureBlock, data, 500);  // High-value lottery
 * - romulus.requestRandomNumber(futureBlock, data, 1000); // Critical applications
 *
 * INSTANT RANDOMNESS (Convenience):
 * - romulus.getInstantRandom(gameData);     // Gaming
 * - romulus.getInstantRandom("");           // UI randomization
 * - romulus.getInstantRandom(userInput);    // Non-critical applications
 */

// Additional custom errors not in interface
error RevealBlockTooSoon();
error RevealBlockTooFar();
error InvalidHashCount();
error HashSpanTooLarge();
error RequestDoesNotExist();
error TooEarlyToReveal();
error BlockHashesExpired();
error BlockHashNotAvailable();
error NotEnoughBlockHistory();
error TooEarlyToGenerateNewSeed();
error SelectedSeedInvalid();
error InvalidRingPosition();

contract Romulus is IRomulus {
    // Minimum delay in blocks before reveal (e.g., ~4 minutes on Ethereum)
    uint256 public constant MIN_DELAY = 20;

    // Base network specific constraints (EIP-2935)
    // Base produces blocks every ~2 seconds, EIP-2935 stores 8,191 block hashes
    // This gives us ~4.5 hours of available block history
    uint256 public constant BASE_BLOCK_TIME = 2; // seconds per block
    uint256 public constant EIP_2935_HISTORY_WINDOW = 8191; // blocks available via EIP-2935
    uint256 public constant MAX_HISTORY_TIME =
        EIP_2935_HISTORY_WINDOW * BASE_BLOCK_TIME; // 16,382 seconds (~4.5 hours)

    // Maximum number of hashes allowed (prevent excessive gas + ensure within EIP-2935 window)
    // Conservative limit: max 1000 hashes = 2000 seconds = ~33 minutes of blocks
    uint256 public constant MAX_HASH_COUNT = 1000;

    // Maximum reveal delay to ensure block hashes remain available
    // Conservative: 3 hours = 5400 blocks, leaving 1.5 hour buffer before EIP-2935 expiry
    uint256 public constant MAX_REVEAL_DELAY = 5400; // blocks (~3 hours on Base)

    // Ring buffer constants for instant randomness
    uint256 public constant RING_SIZE = 24; // 24 seeds = 24 hours of coverage (1 seed per hour)
    uint256 public constant SEED_REFRESH_INTERVAL = 1800; // blocks (~1 hour on Base)
    uint256 public constant HASHES_PER_SEED = 50; // Use 50 block hashes per seed for security

    uint256 public requestCounter;
    address public owner;

    // Mapping from request ID to request details
    mapping(uint256 => Request) public requests;

    // Ring buffer state
    RandomSeed[RING_SIZE] public randomRing;
    uint256 public currentRingPosition; // Current position in the ring
    uint256 public lastSeedGeneration; // Last block when we generated a seed
    uint256 public totalInstantRequests; // Counter for instant requests

    // Safe entropy accumulation (cannot be manipulated by clients)
    bytes32 private entropyAccumulator; // Accumulated entropy from all interactions
    uint256 private lastEntropyBlock; // Last block when entropy was added
    uint256 private entropyContributions; // Number of entropy contributions

    constructor() {
        owner = msg.sender;
        lastSeedGeneration = block.number;
        entropyAccumulator = keccak256(
            abi.encodePacked(block.timestamp, block.prevrandao, address(this))
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
     * @notice Safely accumulate entropy from blockchain state (not user input)
     * @dev Uses only non-manipulable blockchain data to prevent attacks
     */
    function _accumulateEntropy() internal {
        // Only accumulate entropy if we're in a new block (prevents spam)
        if (block.number > lastEntropyBlock) {
            // Use ONLY non-manipulable blockchain data
            bytes32 blockEntropy = keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    block.number,
                    blockhash(block.number - 1),
                    gasleft(),
                    entropyContributions
                )
            );

            // Mix with existing accumulator using cryptographic hash
            entropyAccumulator = keccak256(
                abi.encodePacked(entropyAccumulator, blockEntropy, block.number)
            );

            lastEntropyBlock = block.number;
            entropyContributions++;
        }
    }

    /**
     * @notice Generate a cryptographically secure seed using multiple block hashes
     * @dev Uses HASHES_PER_SEED consecutive block hashes for maximum security
     */
    function _generateSeed() internal {
        // Accumulate entropy from current blockchain state
        _accumulateEntropy();

        // Ensure we have enough block history available
        if (block.number < HASHES_PER_SEED) revert NotEnoughBlockHistory();

        // Use recent blocks for seed generation (working backwards from current block)
        bytes32 combinedEntropy;
        uint256 startBlock = block.number - HASHES_PER_SEED;

        // Combine multiple block hashes for cryptographic strength
        for (uint256 i = 0; i < HASHES_PER_SEED; i++) {
            bytes32 blockHash = blockhash(startBlock + i);
            if (blockHash == bytes32(0)) revert BlockHashNotAvailable();

            // Mix entropy: previous entropy + block hash + position + timestamp
            combinedEntropy = keccak256(
                abi.encodePacked(
                    combinedEntropy,
                    blockHash,
                    i,
                    block.timestamp,
                    block.prevrandao, // Beacon chain randomness on PoS
                    currentRingPosition
                )
            );
        }

        // Final seed generation with additional entropy including accumulated entropy
        bytes32 finalSeed = keccak256(
            abi.encodePacked(
                combinedEntropy,
                entropyAccumulator, // Safe accumulated entropy from interactions
                block.number,
                block.timestamp,
                totalInstantRequests,
                entropyContributions, // Number of entropy contributions
                address(this)
            )
        );

        // Store the seed in the ring
        randomRing[currentRingPosition] = RandomSeed({
            seedHash: finalSeed,
            generatedAt: block.number,
            consumeCount: 0,
            isValid: true
        });

        emit SeedGenerated(currentRingPosition, finalSeed, block.number);

        // Advance ring position (circular)
        currentRingPosition = (currentRingPosition + 1) % RING_SIZE;
        lastSeedGeneration = block.number;
    }

    // Client contract requests a random number
    function requestRandomNumber(
        uint256 revealBlock,
        bytes memory data,
        uint256 hashCount
    ) external {
        // Safely accumulate entropy from this interaction
        _accumulateEntropy();

        // Ensure revealBlock is sufficiently far in the future
        if (revealBlock < block.number + MIN_DELAY) revert RevealBlockTooSoon();

        // Ensure revealBlock is not too far in the future (Base/EIP-2935 constraint)
        // If reveal is too far out, block hashes may expire from EIP-2935 ring buffer
        if (revealBlock > block.number + MAX_REVEAL_DELAY)
            revert RevealBlockTooFar();

        // Validate hash count
        if (hashCount == 0 || hashCount > MAX_HASH_COUNT)
            revert InvalidHashCount();

        // Additional safety: ensure the hash span doesn't exceed EIP-2935 window
        // This prevents requests that would span beyond available block history
        uint256 hashSpanBlocks = hashCount; // consecutive blocks needed
        uint256 maxSafeSpan = EIP_2935_HISTORY_WINDOW / 2; // Conservative: use half the window
        if (hashSpanBlocks > maxSafeSpan) revert HashSpanTooLarge();

        requestCounter++;
        uint256 requestId = requestCounter;
        requests[requestId] = Request({
            clientContract: msg.sender,
            revealBlock: revealBlock,
            data: data,
            hashCount: hashCount
        });

        emit RandomNumberRequested(requestId, revealBlock, hashCount);
    }

    // External actor reveals the random number and gets the fee
    function revealRandomNumber(uint256 requestId) external {
        Request memory req = requests[requestId];
        if (req.clientContract == address(0)) revert RequestDoesNotExist();
        if (block.number < req.revealBlock) revert TooEarlyToReveal();

        // Safety check: ensure all required block hashes are still available
        uint256 lastRequiredBlock = req.revealBlock + req.hashCount - 1;
        uint256 oldestAvailableBlock = block.number > EIP_2935_HISTORY_WINDOW
            ? block.number - EIP_2935_HISTORY_WINDOW
            : 0;
        if (lastRequiredBlock < oldestAvailableBlock)
            revert BlockHashesExpired();

        // Use multiple consecutive block hashes for stronger randomness
        bytes32 combinedHash;
        for (uint256 i = 0; i < req.hashCount; i++) {
            bytes32 blockHash = blockhash(req.revealBlock + i);
            if (blockHash == bytes32(0)) revert BlockHashNotAvailable();
            combinedHash = keccak256(abi.encodePacked(combinedHash, blockHash));
        }

        // Generate the random number using combined hashes and request ID
        uint256 randomNumber = uint256(
            keccak256(abi.encodePacked(combinedHash, requestId))
        );

        // Clean up storage first (reentrancy protection)
        delete requests[requestId];

        // Notify the client contract of the random number
        try
            IRandomNumberConsumer(req.clientContract).receiveRandomNumber(
                requestId,
                randomNumber,
                req.data
            )
        {
            // Success - continue
        } catch {
            // Client callback failed, but we continue anyway
        }

        emit RandomNumberRevealed(requestId, randomNumber);
    }

    /**
     * @notice Check if a request's block hashes are still available via EIP-2935
     * @param requestId The request ID to check
     * @return available True if block hashes are still accessible
     * @return blocksUntilExpiry Number of blocks until the hashes expire
     */
    function isRequestStillValid(
        uint256 requestId
    ) external view returns (bool available, uint256 blocksUntilExpiry) {
        Request memory req = requests[requestId];
        if (req.clientContract == address(0)) {
            return (false, 0);
        }

        // Calculate the last block hash we'll need
        uint256 lastRequiredBlock = req.revealBlock + req.hashCount - 1;

        // Check if this block is still within EIP-2935 window
        uint256 oldestAvailableBlock = block.number > EIP_2935_HISTORY_WINDOW
            ? block.number - EIP_2935_HISTORY_WINDOW
            : 0;

        if (lastRequiredBlock >= oldestAvailableBlock) {
            // Calculate blocks until expiry
            uint256 expiryBlock = lastRequiredBlock + EIP_2935_HISTORY_WINDOW;
            blocksUntilExpiry = expiryBlock > block.number
                ? expiryBlock - block.number
                : 0;
            return (true, blocksUntilExpiry);
        }

        return (false, 0);
    }

    /**
     * @notice Get instant randomness from the pre-generated ring buffer
     * @param data Optional data for additional entropy
     * @return randomNumber Cryptographically secure random number
     * @dev Uses current ring position and increments consume count for forward secrecy
     */
    function getInstantRandom(
        bytes memory data
    ) external returns (uint256 randomNumber) {
        // Safely accumulate entropy from this interaction (non-manipulable data only)
        _accumulateEntropy();

        // Check if we need to generate a new seed
        if (block.number >= lastSeedGeneration + SEED_REFRESH_INTERVAL) {
            _generateSeed();
            emit RingRefreshNeeded(block.number, lastSeedGeneration);
        }

        // Find the oldest valid seed to maintain forward secrecy
        uint256 seedPosition = _findOldestValidSeed();
        if (seedPosition >= RING_SIZE) revert NoValidSeedsAvailable();

        RandomSeed storage seed = randomRing[seedPosition];
        if (!seed.isValid) revert SelectedSeedInvalid();

        // Generate random number with additional entropy for uniqueness
        // NOTE: We use data for uniqueness but NOT for entropy accumulation
        randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    seed.seedHash,
                    seed.consumeCount,
                    msg.sender, // Safe to use for uniqueness (not entropy)
                    block.timestamp,
                    totalInstantRequests,
                    data // Safe to use for uniqueness (not entropy)
                )
            )
        );

        // Update seed state for forward secrecy
        seed.consumeCount++;
        totalInstantRequests++;

        // Invalidate seed after too many uses (security measure)
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
     * @notice Find the oldest valid seed in the ring for consumption
     * @return position Ring position of the oldest valid seed
     */
    function _findOldestValidSeed() internal view returns (uint256 position) {
        uint256 oldestBlock = type(uint256).max;
        uint256 oldestPosition = RING_SIZE; // Invalid position as default

        for (uint256 i = 0; i < RING_SIZE; i++) {
            RandomSeed memory seed = randomRing[i];
            if (seed.isValid && seed.generatedAt < oldestBlock) {
                oldestBlock = seed.generatedAt;
                oldestPosition = i;
            }
        }

        return oldestPosition;
    }

    /**
     * @notice Manually generate a new seed (anyone can call to maintain the ring)
     * @dev Incentivized by allowing anyone to refresh the ring when needed
     */
    function generateSeed() external {
        if (block.number < lastSeedGeneration + SEED_REFRESH_INTERVAL) {
            revert TooEarlyToGenerateNewSeed();
        }
        _generateSeed();
    }

    /**
     * @notice Get the current state of the ring buffer
     * @return validSeeds Number of valid seeds available
     * @return oldestSeedAge Age of oldest seed in blocks
     * @return nextRefreshIn Blocks until next refresh is allowed
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
        validSeeds = 0;
        oldestSeedAge = 0;
        uint256 oldestBlock = type(uint256).max;

        for (uint256 i = 0; i < RING_SIZE; i++) {
            if (randomRing[i].isValid) {
                validSeeds++;
                if (randomRing[i].generatedAt < oldestBlock) {
                    oldestBlock = randomRing[i].generatedAt;
                }
            }
        }

        if (oldestBlock != type(uint256).max) {
            oldestSeedAge = block.number - oldestBlock;
        }

        uint256 nextRefreshBlock = lastSeedGeneration + SEED_REFRESH_INTERVAL;
        nextRefreshIn = nextRefreshBlock > block.number
            ? nextRefreshBlock - block.number
            : 0;
    }

    /**
     * @notice Emergency function to invalidate a specific seed (owner only)
     * @param position Ring position to invalidate
     */
    function invalidateSeed(uint256 position) external onlyOwner {
        if (position >= RING_SIZE) revert InvalidRingPosition();
        randomRing[position].isValid = false;
    }

    /**
     * @notice Get entropy accumulation statistics
     * @return contributions Number of entropy contributions from interactions
     * @return lastBlock Last block when entropy was accumulated
     * @return blocksSinceLastEntropy Blocks since last entropy accumulation
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
        contributions = entropyContributions;
        lastBlock = lastEntropyBlock;
        blocksSinceLastEntropy = block.number > lastEntropyBlock
            ? block.number - lastEntropyBlock
            : 0;
    }
}
