// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Romulus.sol";

contract MockRandomConsumer {
    uint256 public lastRequestId;
    uint256 public lastRandomNumber;
    bytes public lastData;
    bool public shouldRevert;

    function receiveRandomNumber(
        uint256 requestId,
        uint256 randomNumber,
        bytes memory data
    ) external {
        if (shouldRevert) {
            revert("Mock revert");
        }
        lastRequestId = requestId;
        lastRandomNumber = randomNumber;
        lastData = data;
    }

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }

    function requestRandomNumber(
        address romulusContract,
        uint256 revealBlock,
        bytes memory data,
        uint256 hashCount
    ) external {
        Romulus(romulusContract).requestRandomNumber(
            revealBlock,
            data,
            hashCount
        );
    }
}

contract RomulusTest is Test {
    Romulus public romulus;
    MockRandomConsumer public mockConsumer;

    // Test constants
    uint256 constant FUTURE_BLOCK = 100;
    uint256 constant HASH_COUNT_SMALL = 5;
    uint256 constant HASH_COUNT_MEDIUM = 50;
    uint256 constant HASH_COUNT_LARGE = 500;
    bytes constant TEST_DATA = "test data";

    event RandomNumberRequested(
        uint256 requestId,
        uint256 revealBlock,
        uint256 hashCount
    );
    event RandomNumberRevealed(uint256 requestId, uint256 randomNumber);
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

    function _setupEIP2935MockHistory(
        uint256 startBlock,
        uint256 endBlock
    ) internal {
        for (uint256 i = startBlock; i <= endBlock; i++) {
            bytes32 mockHash = keccak256(
                abi.encodePacked("block", i, block.timestamp)
            );
            vm.setBlockhash(i, mockHash);
        }
    }

    function _setupSufficientHistory() internal {
        uint256 currentBlock = block.number;
        uint256 historyStart = currentBlock > 8191 ? currentBlock - 8191 : 0;
        _setupEIP2935MockHistory(historyStart, currentBlock);
    }

    function _advanceBlockWithHistory(uint256 targetBlock) internal {
        vm.roll(targetBlock);
        uint256 historyStart = targetBlock > 8191 ? targetBlock - 8191 : 0;
        _setupEIP2935MockHistory(historyStart, targetBlock);

        uint256 futureEnd = targetBlock + 1000;
        for (uint256 i = targetBlock + 1; i <= futureEnd; i++) {
            vm.roll(i);
            bytes32 mockHash = keccak256(
                abi.encodePacked("block", i, block.timestamp)
            );
            vm.setBlockhash(i, mockHash);
        }
        vm.roll(targetBlock);
    }

    function setUp() public {
        vm.roll(8300);
        _setupSufficientHistory();
        romulus = new Romulus();
        mockConsumer = new MockRandomConsumer();
    }

    function testRequestRandomNumber_Basic() public {
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;

        vm.expectEmit(true, true, true, true);
        emit RandomNumberRequested(1, revealBlock, HASH_COUNT_SMALL);

        romulus.requestRandomNumber(revealBlock, TEST_DATA, HASH_COUNT_SMALL);

        (
            address clientContract,
            uint256 storedRevealBlock,
            bytes memory storedData,
            uint256 storedHashCount
        ) = romulus.requests(1);

        assertEq(clientContract, address(this));
        assertEq(storedRevealBlock, revealBlock);
        assertEq(storedData, TEST_DATA);
        assertEq(storedHashCount, HASH_COUNT_SMALL);
        assertEq(romulus.requestCounter(), 1);
    }

    function testRequestRandomNumber_RevertTooSoon() public {
        uint256 tooSoonBlock = block.number + romulus.MIN_DELAY() - 1;

        vm.expectRevert(RevealBlockTooSoon.selector);
        romulus.requestRandomNumber(tooSoonBlock, TEST_DATA, HASH_COUNT_SMALL);
    }

    function testRequestRandomNumber_RevertTooFar() public {
        uint256 tooFarBlock = block.number + romulus.MAX_REVEAL_DELAY() + 1;

        vm.expectRevert(RevealBlockTooFar.selector);
        romulus.requestRandomNumber(tooFarBlock, TEST_DATA, HASH_COUNT_SMALL);
    }

    function testRequestRandomNumber_RevertInvalidHashCount() public {
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;

        // Test zero hash count
        vm.expectRevert(InvalidHashCount.selector);
        romulus.requestRandomNumber(revealBlock, TEST_DATA, 0);
    }

    function testRequestRandomNumber_RevertMaxHashCountExceeded() public {
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;
        uint256 tooLargeHashCount = romulus.MAX_HASH_COUNT() + 1; // 1001

        vm.expectRevert(InvalidHashCount.selector);
        romulus.requestRandomNumber(revealBlock, TEST_DATA, tooLargeHashCount);
    }

    function testRevealRandomNumber_Success() public {
        // Create request from the mock consumer
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;
        mockConsumer.requestRandomNumber(
            address(romulus),
            revealBlock,
            TEST_DATA,
            HASH_COUNT_SMALL
        );

        // Advance to a block AFTER the reveal block so we can access its hash
        // The contract needs to access blockhash(revealBlock), which requires being at revealBlock + 1 or later
        _advanceBlockWithHistory(revealBlock + HASH_COUNT_SMALL + 1);

        // We can't predict the exact random number, so just check that the event is emitted
        vm.expectEmit(true, false, false, false); // Only check requestId
        emit RandomNumberRevealed(1, 0); // The actual random number will be different

        romulus.revealRandomNumber(1);

        // Verify request was deleted
        (address clientContract, , , ) = romulus.requests(1);
        assertEq(clientContract, address(0));

        // Verify consumer received callback
        assertEq(mockConsumer.lastRequestId(), 1);
        assertGt(mockConsumer.lastRandomNumber(), 0);
        assertEq(mockConsumer.lastData(), TEST_DATA);
    }

    function testRevealRandomNumber_RevertNonExistentRequest() public {
        vm.expectRevert(RequestDoesNotExist.selector);
        romulus.revealRandomNumber(999);
    }

    function testRevealRandomNumber_RevertTooEarly() public {
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;
        romulus.requestRandomNumber(revealBlock, TEST_DATA, HASH_COUNT_SMALL);

        // Try to reveal before reveal block
        _advanceBlockWithHistory(revealBlock - 1);

        vm.expectRevert(TooEarlyToReveal.selector);
        romulus.revealRandomNumber(1);
    }

    function testRevealRandomNumber_HandleConsumerRevert() public {
        // Create request using mock consumer
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;
        mockConsumer.requestRandomNumber(
            address(romulus),
            revealBlock,
            TEST_DATA,
            HASH_COUNT_SMALL
        );

        // Set consumer to revert
        mockConsumer.setShouldRevert(true);

        // Advance to reveal block with proper history
        _advanceBlockWithHistory(revealBlock + HASH_COUNT_SMALL + 1);

        // Should not revert even if consumer reverts
        romulus.revealRandomNumber(1);

        // Verify request was still deleted
        (address clientContract, , , ) = romulus.requests(1);
        assertEq(clientContract, address(0));
    }

    function testRandomnessUniqueness_CommitReveal() public {
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;

        // Create multiple requests using mock consumer
        mockConsumer.requestRandomNumber(
            address(romulus),
            revealBlock,
            TEST_DATA,
            HASH_COUNT_SMALL
        );
        mockConsumer.requestRandomNumber(
            address(romulus),
            revealBlock,
            TEST_DATA,
            HASH_COUNT_SMALL
        );
        mockConsumer.requestRandomNumber(
            address(romulus),
            revealBlock,
            TEST_DATA,
            HASH_COUNT_SMALL
        );

        // Advance to reveal block with proper history
        _advanceBlockWithHistory(revealBlock + HASH_COUNT_SMALL + 1);

        // Reveal all requests
        romulus.revealRandomNumber(1);
        uint256 random1 = mockConsumer.lastRandomNumber();

        romulus.revealRandomNumber(2);
        uint256 random2 = mockConsumer.lastRandomNumber();

        romulus.revealRandomNumber(3);
        uint256 random3 = mockConsumer.lastRandomNumber();

        // All random numbers should be different
        assertTrue(random1 != random2);
        assertTrue(random2 != random3);
        assertTrue(random1 != random3);

        // All should be non-zero
        assertGt(random1, 0);
        assertGt(random2, 0);
        assertGt(random3, 0);
    }

    function testRandomnessUniqueness_InstantRing() public {
        uint256[] memory randoms = new uint256[](10);

        // Generate multiple instant random numbers
        for (uint256 i = 0; i < 10; i++) {
            randoms[i] = romulus.getInstantRandom(abi.encode(i));
        }

        // Check all are unique and non-zero
        for (uint256 i = 0; i < 10; i++) {
            assertGt(randoms[i], 0);
            for (uint256 j = i + 1; j < 10; j++) {
                assertTrue(randoms[i] != randoms[j]);
            }
        }
    }

    function testRandomnessDistribution() public {
        uint256[] memory randoms = new uint256[](100);

        // Generate many random numbers
        for (uint256 i = 0; i < 100; i++) {
            randoms[i] = romulus.getInstantRandom(abi.encode(i));
        }

        // Basic distribution test - check that we have variety in high/low bits
        uint256 highBitCount = 0;
        uint256 lowBitCount = 0;

        for (uint256 i = 0; i < 100; i++) {
            if (randoms[i] & (1 << 255) != 0) highBitCount++;
            if (randoms[i] & 1 != 0) lowBitCount++;
        }

        // Should have roughly 50% high bits and 50% low bits (with some tolerance)
        assertGt(highBitCount, 30);
        assertLt(highBitCount, 70);
        assertGt(lowBitCount, 30);
        assertLt(lowBitCount, 70);
    }

    function testRingBuffer_InitialState() public view {
        (
            uint256 validSeeds,
            uint256 oldestSeedAge,
            uint256 nextRefreshIn
        ) = romulus.getRingStatus();

        // Should have at least one valid seed from constructor
        assertGt(validSeeds, 0);
        assertEq(oldestSeedAge, 0); // Just generated
        assertGt(nextRefreshIn, 0); // Should have time until next refresh
    }

    function testRingBuffer_SeedGeneration() public {
        uint256 initialPosition = romulus.currentRingPosition();

        // Advance time to allow new seed generation
        _advanceBlockWithHistory(
            block.number + romulus.SEED_REFRESH_INTERVAL()
        );

        vm.expectEmit(true, false, false, false); // Only check first parameter (position)
        emit SeedGenerated(
            initialPosition % romulus.RING_SIZE(),
            0,
            block.number
        );

        romulus.generateSeed();

        // Position should have advanced
        assertEq(
            romulus.currentRingPosition(),
            (initialPosition + 1) % romulus.RING_SIZE()
        );
    }

    function testRingBuffer_AutoRefresh() public {
        uint256 initialPosition = romulus.currentRingPosition();

        // Advance time to trigger auto-refresh
        _advanceBlockWithHistory(
            block.number + romulus.SEED_REFRESH_INTERVAL()
        );

        // Getting instant random should trigger refresh
        romulus.getInstantRandom("trigger refresh");

        // Position should have advanced
        assertEq(
            romulus.currentRingPosition(),
            (initialPosition + 1) % romulus.RING_SIZE()
        );
    }

    function testRingBuffer_SeedConsumption() public {
        // Get the initial seed state
        (uint256 validSeeds, , ) = romulus.getRingStatus();
        uint256 initialValidSeeds = validSeeds;

        // Consume a seed many times
        for (uint256 i = 0; i < 100; i++) {
            romulus.getInstantRandom(abi.encode(i));
        }

        // Should have one less valid seed (consumed seed should be invalidated)
        (validSeeds, , ) = romulus.getRingStatus();
        assertEq(validSeeds, initialValidSeeds - 1);
    }

    function testRingBuffer_ForwardSecrecy() public {
        // Generate multiple seeds
        for (uint256 i = 0; i < 5; i++) {
            _advanceBlockWithHistory(
                block.number + romulus.SEED_REFRESH_INTERVAL()
            );
            romulus.generateSeed();
        }

        // Get random numbers - should use oldest seed first
        uint256 random1 = romulus.getInstantRandom("test1");
        uint256 random2 = romulus.getInstantRandom("test2");

        // Both should be different (forward secrecy via consume counter)
        assertTrue(random1 != random2);
    }

    function testEntropyAccumulation() public {
        (uint256 initialContributions, , ) = romulus.getEntropyStats();

        // Make some requests to accumulate entropy
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;
        romulus.requestRandomNumber(revealBlock, TEST_DATA, HASH_COUNT_SMALL);

        // Move to next block
        _advanceBlockWithHistory(block.number + 1);
        romulus.getInstantRandom("test");

        (uint256 newContributions, , ) = romulus.getEntropyStats();

        // Should have accumulated more entropy
        assertGt(newContributions, initialContributions);
    }

    function testEntropyAccumulation_OncePerBlock() public {
        (uint256 initialContributions, , ) = romulus.getEntropyStats();

        // Move to a new block to allow entropy accumulation
        vm.roll(block.number + 1);

        // Multiple calls in same block
        romulus.getInstantRandom("test1");
        romulus.getInstantRandom("test2");
        romulus.getInstantRandom("test3");

        (uint256 newContributions, , ) = romulus.getEntropyStats();

        // Should only accumulate once per block
        // The first call in this new block should have incremented by 1
        assertEq(newContributions, initialContributions + 1);
    }

    function testEIP2935_RequestValidation() public {
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;
        romulus.requestRandomNumber(revealBlock, TEST_DATA, HASH_COUNT_SMALL);

        // Check request is valid initially
        (bool available, uint256 blocksUntilExpiry) = romulus
            .isRequestStillValid(1);
        assertTrue(available);
        assertGt(blocksUntilExpiry, 0);

        // Advance far into the future (beyond EIP-2935 window)
        _advanceBlockWithHistory(
            revealBlock + romulus.EIP_2935_HISTORY_WINDOW() + 100
        );

        // Request should no longer be valid
        (available, ) = romulus.isRequestStillValid(1);
        assertFalse(available);
    }

    function testEIP2935_RevealExpiry() public {
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;
        romulus.requestRandomNumber(revealBlock, TEST_DATA, HASH_COUNT_SMALL);

        // Advance beyond EIP-2935 window
        _advanceBlockWithHistory(
            revealBlock + romulus.EIP_2935_HISTORY_WINDOW() + 100
        );

        vm.expectRevert(BlockHashesExpired.selector);
        romulus.revealRandomNumber(1);
    }

    function testSecurity_NoReentrancy() public {
        // This test ensures the reveal function is protected against reentrancy
        // by deleting the request before making external calls

        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;
        mockConsumer.requestRandomNumber(
            address(romulus),
            revealBlock,
            TEST_DATA,
            HASH_COUNT_SMALL
        );

        _advanceBlockWithHistory(revealBlock + HASH_COUNT_SMALL + 1);
        romulus.revealRandomNumber(1);

        // Request should be deleted, preventing double-reveal
        vm.expectRevert(RequestDoesNotExist.selector);
        romulus.revealRandomNumber(1);
    }

    function testSecurity_OnlyOwnerFunctions() public {
        address notOwner = address(0x1234);

        vm.prank(notOwner);
        vm.expectRevert(IRomulus.NotOwner.selector);
        romulus.invalidateSeed(0);
    }

    function testSecurity_SeedInvalidation() public {
        // Owner should be able to invalidate seeds
        romulus.invalidateSeed(0);

        // Should revert when trying to get instant random with no valid seeds
        // (assuming this was the only seed)
        vm.expectRevert(IRomulus.NoValidSeedsAvailable.selector);
        romulus.getInstantRandom("test");
    }

    function testEdgeCase_LargeHashCount() public {
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;
        uint256 hashCount = 250;

        mockConsumer.requestRandomNumber(
            address(romulus),
            revealBlock,
            TEST_DATA,
            hashCount
        );

        _advanceBlockWithHistory(revealBlock + hashCount + 1);

        romulus.revealRandomNumber(1);

        assertGt(mockConsumer.lastRandomNumber(), 0);
    }

    function testEdgeCase_EmptyData() public {
        uint256 revealBlock = block.number + romulus.MIN_DELAY() + 10;

        // Should work with empty data - use mock consumer
        mockConsumer.requestRandomNumber(
            address(romulus),
            revealBlock,
            "",
            HASH_COUNT_SMALL
        );

        _advanceBlockWithHistory(revealBlock + HASH_COUNT_SMALL + 1);
        romulus.revealRandomNumber(1);

        assertGt(mockConsumer.lastRandomNumber(), 0);
        assertEq(mockConsumer.lastData(), "");
    }

    function testEdgeCase_RingBufferFull() public {
        // Fill the ring buffer partially to avoid gas limits
        // RING_SIZE is 24, let's fill 10 slots to test wrapping
        for (uint256 i = 0; i < 10; i++) {
            vm.roll(block.number + romulus.SEED_REFRESH_INTERVAL());
            // Set up minimal history for this block
            bytes32 mockHash = keccak256(
                abi.encodePacked("block", block.number)
            );
            vm.setBlockhash(block.number, mockHash);
            romulus.generateSeed();
        }

        // Should still work (ring should wrap around)
        uint256 random = romulus.getInstantRandom("test");
        assertGt(random, 0);
    }

    function testFuzz_RequestRandomNumber(
        uint256 hashCount,
        uint256 delayBlocks
    ) public {
        // Bound inputs to valid ranges
        hashCount = bound(hashCount, 1, romulus.MAX_HASH_COUNT());
        delayBlocks = bound(
            delayBlocks,
            romulus.MIN_DELAY(),
            romulus.MAX_REVEAL_DELAY()
        );

        uint256 revealBlock = block.number + delayBlocks;

        // Should not revert with valid inputs
        romulus.requestRandomNumber(revealBlock, TEST_DATA, hashCount);

        // Verify request was stored
        (address clientContract, , , ) = romulus.requests(1);
        assertEq(clientContract, address(this));
    }

    function testFuzz_InstantRandom(bytes memory data) public {
        // Should work with any data
        uint256 random = romulus.getInstantRandom(data);
        assertGt(random, 0);
    }

    function testCannotInvalidateSeedWithoutOwner() public {
        vm.prank(address(0x1234));
        vm.expectRevert(IRomulus.NotOwner.selector);
        romulus.invalidateSeed(0);
    }

    function testCannotInvalidateSeedBeyondRingSize() public {
        vm.expectRevert(InvalidRingPosition.selector);
        romulus.invalidateSeed(24);
    }

    function testNoValidSeedsAfterInvalidatingAll() public {
        for (uint256 i = 0; i < romulus.RING_SIZE(); i++) {
            romulus.invalidateSeed(i);
        }
        vm.expectRevert(IRomulus.NoValidSeedsAvailable.selector);
        romulus.getInstantRandom("");
    }
}
