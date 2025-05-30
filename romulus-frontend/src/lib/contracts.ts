import { Address } from 'viem'

// Romulus contract address
export const ROMULUS_ADDRESS: Address = '0x7F81b3324d3BD1ae94493aF29B63126052ECAfdB'

// Romulus contract ABI (essential functions only)
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
    {
        inputs: [{ internalType: 'uint256', name: 'requestId', type: 'uint256' }],
        name: 'requests',
        outputs: [
            { internalType: 'address', name: 'clientContract', type: 'address' },
            { internalType: 'uint256', name: 'revealBlock', type: 'uint256' },
            { internalType: 'bytes', name: 'data', type: 'bytes' },
            { internalType: 'uint256', name: 'hashCount', type: 'uint256' },
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
    // Write functions
    {
        inputs: [{ internalType: 'bytes', name: 'data', type: 'bytes' }],
        name: 'getInstantRandom',
        outputs: [{ internalType: 'uint256', name: 'randomNumber', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'revealBlock', type: 'uint256' },
            { internalType: 'bytes', name: 'data', type: 'bytes' },
            { internalType: 'uint256', name: 'hashCount', type: 'uint256' },
        ],
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
    // Events
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'requestId', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'revealBlock', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'hashCount', type: 'uint256' },
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
    // Constants
    {
        inputs: [],
        name: 'MIN_DELAY',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MAX_HASH_COUNT',
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