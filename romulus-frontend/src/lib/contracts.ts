import { Address } from 'viem'

// RomulusV2 contract address - deployed on Base mainnet
export const ROMULUS_ADDRESS: Address = '0x3E0b9b582B715967Ec6Fff2ec2a954cFF7528Ea5'

// RomulusV2 contract ABI (essential functions only)
export const ROMULUS_ABI = [
    // Read functions
    {
        inputs: [],
        name: 'owner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'requestCounter',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'currentRingPosition',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'callbackGasLimit',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getRingStatus',
        outputs: [
            { internalType: 'uint256', name: 'validSeeds', type: 'uint256' },
            { internalType: 'uint256', name: 'oldestSeedAge', type: 'uint256' },
            { internalType: 'uint256', name: 'nextRefreshIn', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getEntropyStats',
        outputs: [
            { internalType: 'uint256', name: 'contributions', type: 'uint256' },
            { internalType: 'uint256', name: 'lastBlock', type: 'uint256' },
            { internalType: 'uint256', name: 'blocksSinceLastEntropy', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    // V2: requests struct has changed to use startBlock and span
    {
        inputs: [{ internalType: 'uint256', name: 'requestId', type: 'uint256' }],
        name: 'requests',
        outputs: [
            { internalType: 'address', name: 'clientContract', type: 'address' },
            { internalType: 'uint256', name: 'startBlock', type: 'uint256' },
            { internalType: 'uint16', name: 'span', type: 'uint16' },
            { internalType: 'bytes', name: 'data', type: 'bytes' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'randomRing',
        outputs: [
            { internalType: 'bytes32', name: 'seedHash', type: 'bytes32' },
            { internalType: 'uint256', name: 'generatedAt', type: 'uint256' },
            { internalType: 'uint256', name: 'consumeCount', type: 'uint256' },
            { internalType: 'bool', name: 'isValid', type: 'bool' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'requestId', type: 'uint256' }],
        name: 'isRequestStillValid',
        outputs: [
            { internalType: 'bool', name: 'available', type: 'bool' },
            { internalType: 'uint256', name: 'blocksUntilExpiry', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    // V2: New function for getting reveal timing
    {
        inputs: [{ internalType: 'uint256', name: 'requestId', type: 'uint256' }],
        name: 'getRevealTime',
        outputs: [
            { internalType: 'uint256', name: 'canRevealAt', type: 'uint256' },
            { internalType: 'uint256', name: 'estimatedSeconds', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    // Write functions
    {
        inputs: [{ internalType: 'bytes', name: 'data', type: 'bytes' }],
        name: 'getInstantRandom',
        outputs: [{ internalType: 'uint256', name: 'randomNumber', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // V2: Request function with span instead of revealBlock and hashCount
    {
        inputs: [
            { internalType: 'bytes', name: 'data', type: 'bytes' },
            { internalType: 'uint16', name: 'span', type: 'uint16' },
        ],
        name: 'requestRandomNumber',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // V2: Request function with default span
    {
        inputs: [{ internalType: 'bytes', name: 'data', type: 'bytes' }],
        name: 'requestRandomNumber',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'requestId', type: 'uint256' }],
        name: 'revealRandomNumber',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'generateSeed',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'position', type: 'uint256' }],
        name: 'invalidateSeed',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // V2: Gas limit management
    {
        inputs: [{ internalType: 'uint256', name: 'newLimit', type: 'uint256' }],
        name: 'setCallbackGasLimit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // Events
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'requestId', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'startBlock', type: 'uint256' },
            { indexed: false, internalType: 'uint16', name: 'span', type: 'uint16' },
        ],
        name: 'RandomNumberRequested',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'requestId', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'randomNumber', type: 'uint256' },
        ],
        name: 'RandomNumberRevealed',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'requestId', type: 'uint256' },
            { indexed: false, internalType: 'address', name: 'clientContract', type: 'address' },
            { indexed: false, internalType: 'bytes', name: 'reason', type: 'bytes' },
        ],
        name: 'CallbackFailed',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'oldLimit', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'newLimit', type: 'uint256' },
        ],
        name: 'CallbackGasLimitUpdated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'ringPosition', type: 'uint256' },
            { indexed: false, internalType: 'bytes32', name: 'seedHash', type: 'bytes32' },
            { indexed: false, internalType: 'uint256', name: 'blockNumber', type: 'uint256' },
        ],
        name: 'SeedGenerated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'client', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'randomNumber', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'ringPosition', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'consumeCount', type: 'uint256' },
        ],
        name: 'InstantRandomDelivered',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'currentBlock', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'lastGeneration', type: 'uint256' },
        ],
        name: 'RingRefreshNeeded',
        type: 'event',
    },
    // V2 Constants
    {
        inputs: [],
        name: 'DEFAULT_SPAN',
        outputs: [{ internalType: 'uint16', name: '', type: 'uint16' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MIN_SPAN',
        outputs: [{ internalType: 'uint16', name: '', type: 'uint16' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MAX_SPAN',
        outputs: [{ internalType: 'uint16', name: '', type: 'uint16' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'GRACE',
        outputs: [{ internalType: 'uint16', name: '', type: 'uint16' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MIN_CALLBACK_GAS',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MAX_CALLBACK_GAS',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'BASE_BLOCK_TIME',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'EIP_2935_HISTORY_WINDOW',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'RING_SIZE',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'SEED_REFRESH_INTERVAL',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'HASHES_PER_SEED',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

// Contract configuration object
export const romulusContract = {
    address: ROMULUS_ADDRESS,
    abi: ROMULUS_ABI,
} as const 