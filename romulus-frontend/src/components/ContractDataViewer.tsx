'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, ExternalLink } from 'lucide-react'
import { ROMULUS_ADDRESS } from '@/lib/contracts'

interface ContractData {
    address: string;
    network: string;
    blockNumber: number;
    requestCounter: number;
    currentRingPosition: number;
    entropyContributions: number;
    lastSeedGeneration: number;
    owner: string;
}

export function ContractDataViewer() {
    const [contractData, setContractData] = useState<ContractData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const refreshData = async () => {
        setIsLoading(true)
        // Simulate fetching contract data
        await new Promise(resolve => setTimeout(resolve, 1000))

        setContractData({
            address: ROMULUS_ADDRESS,
            network: 'Base',
            blockNumber: 12345678,
            requestCounter: 156,
            currentRingPosition: 12,
            entropyContributions: 45892,
            lastSeedGeneration: 12345600,
            owner: '0x1234...5678'
        })

        setIsLoading(false)
    }

    useEffect(() => {
        refreshData()
    }, [])

    return (
        <Card className="border-cyan-500/20 bg-gray-900/50 backdrop-blur-xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                            Contract Data
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Live contract state and statistics
                        </CardDescription>
                    </div>
                    <Button
                        onClick={refreshData}
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
                {contractData ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-sm text-gray-400">Contract Address</div>
                                <div className="flex items-center gap-2">
                                    <code className="text-cyan-400 font-mono text-xs">
                                        {contractData.address}
                                    </code>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm text-gray-400">Network</div>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    {contractData.network}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                <div className="text-2xl font-bold text-cyan-400">
                                    {contractData.requestCounter}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Total Requests</div>
                            </div>

                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                <div className="text-2xl font-bold text-purple-400">
                                    {contractData.currentRingPosition}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Ring Position</div>
                            </div>

                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                <div className="text-2xl font-bold text-green-400">
                                    {contractData.entropyContributions.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Entropy Contributions</div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Block Number</span>
                                <span className="text-gray-300 font-mono">
                                    {contractData.blockNumber.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-400">Last Seed Generation</span>
                                <span className="text-gray-300 font-mono">
                                    {contractData.lastSeedGeneration.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-400">Contract Owner</span>
                                <span className="text-gray-300 font-mono">
                                    {contractData.owner}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                className="flex-1 bg-transparent border border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400"
                                size="sm"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View on Explorer
                            </Button>
                            <Button
                                className="flex-1 bg-transparent border border-purple-500/30 hover:bg-purple-500/10 text-purple-400"
                                size="sm"
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy ABI
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        Loading contract data...
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 