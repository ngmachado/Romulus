'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { romulusContract } from '@/lib/contracts'
import { encodePacked } from 'viem'
import { useState, useEffect } from 'react'
import { decodeEventLog } from 'viem'

// Read hooks
export function useRomulusOwner() {
    return useReadContract({
        ...romulusContract,
        functionName: 'owner',
    })
}

export function useRequestCounter() {
    return useReadContract({
        ...romulusContract,
        functionName: 'requestCounter',
    })
}

export function useCurrentRingPosition() {
    return useReadContract({
        ...romulusContract,
        functionName: 'currentRingPosition',
    })
}

export function useRingStatus() {
    return useReadContract({
        ...romulusContract,
        functionName: 'getRingStatus',
    })
}

export function useEntropyStats() {
    return useReadContract({
        ...romulusContract,
        functionName: 'getEntropyStats',
    })
}

export function useRingSeed(position: number) {
    return useReadContract({
        ...romulusContract,
        functionName: 'randomRing',
        args: [BigInt(position)],
    })
}

export function useRequest(requestId: number) {
    return useReadContract({
        ...romulusContract,
        functionName: 'requests',
        args: [BigInt(requestId)],
    })
}

export function useIsRequestValid(requestId: number) {
    return useReadContract({
        ...romulusContract,
        functionName: 'isRequestStillValid',
        args: [BigInt(requestId)],
    })
}

// Contract constants
export function useMinDelay() {
    return useReadContract({
        ...romulusContract,
        functionName: 'MIN_DELAY',
    })
}

export function useMaxHashCount() {
    return useReadContract({
        ...romulusContract,
        functionName: 'MAX_HASH_COUNT',
    })
}

export function useRingSize() {
    return useReadContract({
        ...romulusContract,
        functionName: 'RING_SIZE',
    })
}

export function useSeedRefreshInterval() {
    return useReadContract({
        ...romulusContract,
        functionName: 'SEED_REFRESH_INTERVAL',
    })
}

export function useHashesPerSeed() {
    return useReadContract({
        ...romulusContract,
        functionName: 'HASHES_PER_SEED',
    })
}

// Write hooks
export function useGetInstantRandom() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()
    const [returnValue, setReturnValue] = useState<bigint | null>(null)
    const [debugInfo, setDebugInfo] = useState<string>('')

    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
        hash,
    })

    // Try to extract return value from transaction receipt
    useEffect(() => {
        if (isSuccess && receipt && receipt.logs) {
            setDebugInfo(`Processing ${receipt.logs.length} logs from transaction`)
            console.log('Transaction receipt:', receipt)

            // Look for InstantRandomDelivered event in logs
            for (const log of receipt.logs) {
                console.log('Processing log:', log)

                // Check if this log is from our contract and has the right event signature
                if (log.address?.toLowerCase() === romulusContract.address.toLowerCase()) {
                    try {
                        const decoded = decodeEventLog({
                            abi: romulusContract.abi,
                            data: log.data,
                            topics: log.topics,
                        })

                        console.log('Decoded event:', decoded)
                        setDebugInfo(`Found event: ${decoded.eventName}`)

                        if (decoded.eventName === 'InstantRandomDelivered') {
                            const args = decoded.args as {
                                client: string
                                randomNumber: bigint
                                ringPosition: bigint
                                consumeCount: bigint
                            }
                            console.log('InstantRandomDelivered args:', args)
                            setReturnValue(args.randomNumber)
                            setDebugInfo(`Successfully extracted random value: ${args.randomNumber.toString()}`)
                            break
                        }
                    } catch (decodeError) {
                        console.log('Failed to decode log:', decodeError)
                        // Try manual parsing as fallback
                        const eventSignature = '0x261edada7646f83f8c02192253ce8ad7a8c99c9625bfe3d4d9020c1201b30cf6'
                        if (log.topics[0] === eventSignature) {
                            try {
                                // Manual parsing: data contains randomNumber, ringPosition, consumeCount
                                // Each uint256 is 32 bytes (64 hex chars)
                                const dataWithoutPrefix = log.data.slice(2) // Remove '0x'
                                const randomNumberHex = dataWithoutPrefix.slice(0, 64) // First 32 bytes
                                const randomNumber = BigInt('0x' + randomNumberHex)

                                console.log('Manual parsing - randomNumberHex:', randomNumberHex)
                                console.log('Manual parsing - randomNumber:', randomNumber.toString())

                                setReturnValue(randomNumber)
                                setDebugInfo(`Manually extracted random value: ${randomNumber.toString()}`)
                                break
                            } catch (manualError) {
                                console.log('Manual parsing failed:', manualError)
                                setDebugInfo(`Manual parsing failed: ${manualError}`)
                            }
                        }
                    }
                }
            }

            if (!returnValue) {
                setDebugInfo('No InstantRandomDelivered event found in transaction logs')
            }
        }
    }, [isSuccess, receipt, returnValue])

    const getInstantRandom = (data: string) => {
        setReturnValue(null) // Reset previous value
        setDebugInfo('Starting transaction...')
        const encodedData = encodePacked(['string'], [data])
        writeContract({
            ...romulusContract,
            functionName: 'getInstantRandom',
            args: [encodedData],
        })
    }

    return {
        getInstantRandom,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
        returnValue,
        debugInfo,
    }
}

export function useRequestRandomNumber() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    const requestRandomNumber = (revealBlock: number, data: string, hashCount: number) => {
        const encodedData = encodePacked(['string'], [data])
        writeContract({
            ...romulusContract,
            functionName: 'requestRandomNumber',
            args: [BigInt(revealBlock), encodedData, BigInt(hashCount)],
        })
    }

    return {
        requestRandomNumber,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    }
}

export function useRevealRandomNumber() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    const revealRandomNumber = (requestId: number) => {
        writeContract({
            ...romulusContract,
            functionName: 'revealRandomNumber',
            args: [BigInt(requestId)],
        })
    }

    return {
        revealRandomNumber,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    }
}

export function useGenerateSeed() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    const generateSeed = () => {
        writeContract({
            ...romulusContract,
            functionName: 'generateSeed',
        })
    }

    return {
        generateSeed,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    }
}

// Combined hook for all contract data
export function useRomulusData() {
    const owner = useRomulusOwner()
    const requestCounter = useRequestCounter()
    const ringPosition = useCurrentRingPosition()
    const ringStatus = useRingStatus()
    const entropyStats = useEntropyStats()
    const minDelay = useMinDelay()
    const maxHashCount = useMaxHashCount()
    const ringSize = useRingSize()
    const seedRefreshInterval = useSeedRefreshInterval()
    const hashesPerSeed = useHashesPerSeed()

    return {
        owner: owner.data,
        requestCounter: requestCounter.data,
        ringPosition: ringPosition.data,
        ringStatus: ringStatus.data,
        entropyStats: entropyStats.data,
        constants: {
            minDelay: minDelay.data,
            maxHashCount: maxHashCount.data,
            ringSize: ringSize.data,
            seedRefreshInterval: seedRefreshInterval.data,
            hashesPerSeed: hashesPerSeed.data,
        },
        isLoading: owner.isLoading || requestCounter.isLoading || ringStatus.isLoading,
        error: owner.error || requestCounter.error || ringStatus.error,
    }
} 