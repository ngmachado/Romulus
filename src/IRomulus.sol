// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title IRomulus
 * @notice Interface for the Romulus randomness oracle on Base L2
 * @dev Provides two modes of operation:
 *      - Secure Mode: Commit-reveal pattern for high-stakes applications
 *      - Instant Mode: Pre-generated randomness for low-stakes applications
 */
interface IRomulus {
    // ============ Structs ============

    /**
     * @notice Structure for tracking randomness requests
     * @param clientContract Address of the contract requesting randomness
     * @param revealBlock Block number for reveal
     * @param data Optional data to pass back to the client
     * @param hashCount Number of block hashes to use for this request
     */
    struct Request {
        address clientContract;
        uint256 revealBlock;
        bytes data;
        uint256 hashCount;
    }

    /**
     * @notice Ring buffer seed structure
     * @param seedHash The actual random seed
     * @param generatedAt Block number when generated
     * @param consumeCount Number of times this seed has been used
     * @param isValid Whether this seed is valid for use
     */
    struct RandomSeed {
        bytes32 seedHash;
        uint256 generatedAt;
        uint256 consumeCount;
        bool isValid;
    }

    // ============ Events ============

    /**
     * @notice Emitted when a new randomness request is created
     * @param requestId Unique identifier for the request
     * @param revealBlock Block number for reveal
     * @param hashCount Number of block hashes to use
     */
    event RandomNumberRequested(
        uint256 requestId,
        uint256 revealBlock,
        uint256 hashCount
    );

    /**
     * @notice Emitted when randomness is revealed and delivered
     * @param requestId Unique identifier for the request
     * @param randomNumber The generated random number
     */
    event RandomNumberRevealed(uint256 requestId, uint256 randomNumber);

    /**
     * @notice Emitted when a new seed is generated for the ring buffer
     * @param ringPosition Index in the ring buffer
     * @param seedHash The generated seed value
     * @param blockNumber Block when seed was generated
     */
    event SeedGenerated(
        uint256 ringPosition,
        bytes32 seedHash,
        uint256 blockNumber
    );

    /**
     * @notice Emitted when instant randomness is delivered
     * @param client Address consuming the randomness
     * @param randomNumber The generated random value
     * @param ringPosition Position in the ring buffer
     * @param consumeCount Number of times seed has been consumed
     */
    event InstantRandomDelivered(
        address indexed client,
        uint256 randomNumber,
        uint256 ringPosition,
        uint256 consumeCount
    );

    /**
     * @notice Emitted when ring refresh is needed
     * @param currentBlock Current block number
     * @param lastGeneration Last seed generation block
     */
    event RingRefreshNeeded(uint256 currentBlock, uint256 lastGeneration);

    // ============ Errors ============

    error InvalidSpan();
    error TooEarlyToReveal();
    error RequestNotFound();
    error BlockHashNotAvailable();
    error CallbackFailed();
    error InvalidCallbackGasLimit();
    error NoValidSeedsAvailable();
    error SeedRefreshTooEarly();
    error InsufficientFee();
    error TransferFailed();
    error NotOwner();

    // ============ Secure Mode Functions ============

    /**
     * @notice Request a random number using the commit-reveal pattern
     * @param revealBlock The future block when the random number can be revealed
     * @param data Optional data to pass to the callback function
     * @param hashCount Number of consecutive block hashes to use
     */
    function requestRandomNumber(
        uint256 revealBlock,
        bytes memory data,
        uint256 hashCount
    ) external;

    /**
     * @notice Reveal and deliver a previously requested random number
     * @param requestId The ID of the request to reveal
     * @dev Can be called by anyone after the reveal delay has passed
     */
    function revealRandomNumber(uint256 requestId) external;

    /**
     * @notice Check if a request's block hashes are still available
     * @param requestId The ID of the request to check
     * @return available True if block hashes are still accessible
     * @return blocksUntilExpiry Number of blocks until the hashes expire
     */
    function isRequestStillValid(
        uint256 requestId
    ) external view returns (bool available, uint256 blocksUntilExpiry);

    // ============ Instant Mode Functions ============

    /**
     * @notice Get instant randomness from the pre-generated ring buffer
     * @param data Optional data for randomness generation
     * @return randomNumber The generated random number
     * @dev Warning: This mode is vulnerable to sequencer bias. Do not use for high-value applications.
     */
    function getInstantRandom(
        bytes memory data
    ) external returns (uint256 randomNumber);

    /**
     * @notice Generate a new seed for the ring buffer
     * @dev Can be called by anyone when SEED_REFRESH_INTERVAL has passed
     */
    function generateSeed() external;

    /**
     * @notice Invalidate a specific seed in the ring buffer
     * @param position The ring position of the seed to invalidate
     * @dev Only callable by owner for emergency situations
     */
    function invalidateSeed(uint256 position) external;

    // ============ View Functions ============

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
        );

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
        );

    // ============ State Variables ============

    /**
     * @notice Get the current request counter
     * @return The total number of randomness requests made
     */
    function requestCounter() external view returns (uint256);

    /**
     * @notice Get the mapping of request details
     * @param requestId The ID of the request
     * @return clientContract Address of the requesting contract
     * @return revealBlock Block number for reveal
     * @return data Optional data to pass back
     * @return hashCount Number of block hashes
     */
    function requests(
        uint256 requestId
    )
        external
        view
        returns (
            address clientContract,
            uint256 revealBlock,
            bytes memory data,
            uint256 hashCount
        );

    /**
     * @notice Get a specific seed from the ring buffer
     * @param index The index in the ring buffer
     * @return seedHash The random seed hash
     * @return generatedAt Block number when generated
     * @return consumeCount Number of times consumed
     * @return isValid Whether the seed is valid
     */
    function randomRing(
        uint256 index
    )
        external
        view
        returns (
            bytes32 seedHash,
            uint256 generatedAt,
            uint256 consumeCount,
            bool isValid
        );

    /**
     * @notice Current position in the ring buffer
     */
    function currentRingPosition() external view returns (uint256);

    /**
     * @notice Last block when a seed was generated
     */
    function lastSeedGeneration() external view returns (uint256);

    /**
     * @notice Total number of instant random requests
     */
    function totalInstantRequests() external view returns (uint256);

    /**
     * @notice Contract owner address
     */
    function owner() external view returns (address);
}

/**
 * @title IRandomNumberConsumer
 * @notice Interface that must be implemented by contracts requesting randomness
 */
interface IRandomNumberConsumer {
    /**
     * @notice Called by Romulus to deliver the random number
     * @param requestId The ID of the request being fulfilled
     * @param randomNumber The generated random number
     * @param data The optional data provided during the request
     * @dev Implement this function to handle the random number delivery
     *      Must complete execution within the callback gas limit
     */
    function receiveRandomNumber(
        uint256 requestId,
        uint256 randomNumber,
        bytes memory data
    ) external;
}
