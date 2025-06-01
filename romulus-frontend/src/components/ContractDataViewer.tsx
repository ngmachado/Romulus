'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, ExternalLink } from 'lucide-react'
import { ROMULUS_ADDRESS } from '@/lib/contracts'
import { useRomulusData } from '@/hooks/useRomulus'

export function ContractDataViewer() {
    const {
        owner,
        requestCounter,
        currentRingPosition,
        callbackGasLimit,
        ringStatus,
        entropyStats,
        constants,
        isLoading,
        error
    } = useRomulusData()

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const openInExplorer = () => {
        window.open(`https://basescan.org/address/${ROMULUS_ADDRESS}`, '_blank')
    }

    if (error) {
        return (
            <Card className="border-red-500/20 bg-gray-900/50 backdrop-blur-xl">
                <CardContent className="p-6">
                    <div className="text-center text-red-400">
                        Error loading contract data: {error.message}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-cyan-500/20 bg-gray-900/50 backdrop-blur-xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                            RomulusV2 Contract
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Live contract state and statistics on Base
                        </CardDescription>
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        disabled={isLoading}
                        className="bg-cyan-600 hover:bg-cyan-700"
                        size="sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {!isLoading ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-sm text-gray-400">Contract Address</div>
                                <div className="flex items-center gap-2">
                                    <code className="text-cyan-400 font-mono text-xs">
                                        {ROMULUS_ADDRESS}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyToClipboard(ROMULUS_ADDRESS)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm text-gray-400">Network</div>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    Base Mainnet
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                <div className="text-2xl font-bold text-cyan-400">
                                    {requestCounter?.toString() || '0'}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Total Requests</div>
                            </div>

                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                <div className="text-2xl font-bold text-purple-400">
                                    {currentRingPosition?.toString() || '0'}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Ring Position</div>
                            </div>

                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                <div className="text-2xl font-bold text-green-400">
                                    {entropyStats?.[0]?.toString() || '0'}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Entropy Contributions</div>
                            </div>
                        </div>

                        {/* Ring Status */}
                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                                <div className="text-lg font-bold text-blue-400">
                                    {ringStatus?.[0]?.toString() || '0'}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Valid Seeds</div>
                            </div>

                            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                                <div className="text-lg font-bold text-orange-400">
                                    {ringStatus?.[1]?.toString() || '0'}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Oldest Seed Age</div>
                            </div>

                            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                                <div className="text-lg font-bold text-pink-400">
                                    {ringStatus?.[2]?.toString() || '0'}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Next Refresh In</div>
                            </div>
                        </div>

                        {/* V2 Specific Info */}
                        <div className="pt-4 border-t border-gray-800">
                            <div className="text-sm font-semibold text-gray-300 mb-2">V2 Configuration</div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Callback Gas Limit</span>
                                    <span className="text-gray-300 font-mono">
                                        {callbackGasLimit?.toString() || '50000'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Default Span</span>
                                    <span className="text-gray-300 font-mono">
                                        {constants?.defaultSpan?.toString() || '64'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Min/Max Span</span>
                                    <span className="text-gray-300 font-mono">
                                        {constants?.minSpan?.toString() || '8'} / {constants?.maxSpan?.toString() || '4000'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Grace Period</span>
                                    <span className="text-gray-300 font-mono">
                                        {constants?.grace?.toString() || '1'} block
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Ring Size</span>
                                    <span className="text-gray-300 font-mono">
                                        {constants?.ringSize?.toString() || '24'} seeds
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Block Time</span>
                                    <span className="text-gray-300 font-mono">
                                        {constants?.baseBlockTime?.toString() || '2'}s
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-400">Contract Owner</span>
                                <span className="text-gray-300 font-mono text-xs">
                                    {owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : 'Loading...'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Last Entropy Block</span>
                                <span className="text-gray-300 font-mono">
                                    {entropyStats?.[1]?.toString() || '0'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                onClick={openInExplorer}
                                className="flex-1 bg-transparent border border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400"
                                size="sm"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View on Basescan
                            </Button>
                            <Button
                                onClick={() => copyToClipboard(ROMULUS_ADDRESS)}
                                className="flex-1 bg-transparent border border-purple-500/30 hover:bg-purple-500/10 text-purple-400"
                                size="sm"
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Address
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                        Loading contract data...
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 