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

export function useCallbackGasLimit() {
    return useReadContract({
        ...romulusContract,
        functionName: 'callbackGasLimit',
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

// V2: New function for getting reveal timing
export function useGetRevealTime(requestId: number) {
    return useReadContract({
        ...romulusContract,
        functionName: 'getRevealTime',
        args: [BigInt(requestId)],
    })
}

// V2 Contract constants
export function useDefaultSpan() {
    return useReadContract({
        ...romulusContract,
        functionName: 'DEFAULT_SPAN',
    })
}

export function useMinSpan() {
    return useReadContract({
        ...romulusContract,
        functionName: 'MIN_SPAN',
    })
}

export function useMaxSpan() {
    return useReadContract({
        ...romulusContract,
        functionName: 'MAX_SPAN',
    })
}

export function useGrace() {
    return useReadContract({
        ...romulusContract,
        functionName: 'GRACE',
    })
}

export function useMinCallbackGas() {
    return useReadContract({
        ...romulusContract,
        functionName: 'MIN_CALLBACK_GAS',
    })
}

export function useMaxCallbackGas() {
    return useReadContract({
        ...romulusContract,
        functionName: 'MAX_CALLBACK_GAS',
    })
}

export function useBaseBlockTime() {
    return useReadContract({
        ...romulusContract,
        functionName: 'BASE_BLOCK_TIME',
    })
}

export function useEIP2935HistoryWindow() {
    return useReadContract({
        ...romulusContract,
        functionName: 'EIP_2935_HISTORY_WINDOW',
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

// V2: Updated requestRandomNumber to use span instead of revealBlock and hashCount
export function useRequestRandomNumber() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    // Request with custom span
    const requestRandomNumber = (data: string, span: number) => {
        const encodedData = encodePacked(['string'], [data])
        writeContract({
            ...romulusContract,
            functionName: 'requestRandomNumber',
            args: [encodedData, span],
        })
    }

    // Request with default span
    const requestRandomNumberDefault = (data: string) => {
        const encodedData = encodePacked(['string'], [data])
        writeContract({
            ...romulusContract,
            functionName: 'requestRandomNumber',
            args: [encodedData],
        })
    }

    return {
        requestRandomNumber,
        requestRandomNumberDefault,
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

// V2: New hook for setting callback gas limit
export function useSetCallbackGasLimit() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    const setCallbackGasLimit = (newLimit: number) => {
        writeContract({
            ...romulusContract,
            functionName: 'setCallbackGasLimit',
            args: [BigInt(newLimit)],
        })
    }

    return {
        setCallbackGasLimit,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    }
}

// Comprehensive hook for all Romulus data
export function useRomulusData() {
    const owner = useRomulusOwner()
    const requestCounter = useRequestCounter()
    const currentRingPosition = useCurrentRingPosition()
    const callbackGasLimit = useCallbackGasLimit()
    const ringStatus = useRingStatus()
    const entropyStats = useEntropyStats()

    // V2 Constants
    const defaultSpan = useDefaultSpan()
    const minSpan = useMinSpan()
    const maxSpan = useMaxSpan()
    const grace = useGrace()
    const minCallbackGas = useMinCallbackGas()
    const maxCallbackGas = useMaxCallbackGas()
    const baseBlockTime = useBaseBlockTime()
    const eip2935HistoryWindow = useEIP2935HistoryWindow()
    const ringSize = useRingSize()
    const seedRefreshInterval = useSeedRefreshInterval()
    const hashesPerSeed = useHashesPerSeed()

    return {
        owner: owner.data,
        requestCounter: requestCounter.data,
        currentRingPosition: currentRingPosition.data,
        callbackGasLimit: callbackGasLimit.data,
        ringStatus: ringStatus.data,
        entropyStats: entropyStats.data,

        // V2 Constants
        constants: {
            defaultSpan: defaultSpan.data,
            minSpan: minSpan.data,
            maxSpan: maxSpan.data,
            grace: grace.data,
            minCallbackGas: minCallbackGas.data,
            maxCallbackGas: maxCallbackGas.data,
            baseBlockTime: baseBlockTime.data,
            eip2935HistoryWindow: eip2935HistoryWindow.data,
            ringSize: ringSize.data,
            seedRefreshInterval: seedRefreshInterval.data,
            hashesPerSeed: hashesPerSeed.data,
        },

        isLoading: owner.isLoading || requestCounter.isLoading || ringStatus.isLoading || entropyStats.isLoading,
        error: owner.error || requestCounter.error || ringStatus.error || entropyStats.error,
    }
} 