'use client'

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, LogOut, AlertTriangle, CheckCircle } from 'lucide-react'
import { base, baseSepolia } from 'wagmi/chains'
import { useEffect, useState } from 'react'

export function WalletConnect() {
    const [isHydrated, setIsHydrated] = useState(false)
    const { address, isConnected, chain } = useAccount()
    const { connect, connectors, isPending } = useConnect()
    const { disconnect } = useDisconnect()
    const chainId = useChainId()
    const { switchChain } = useSwitchChain()

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    const isCorrectNetwork = chainId === base.id || chainId === baseSepolia.id
    const networkName = chain?.name || 'Unknown'

    // Show loading state during hydration
    if (!isHydrated) {
        return (
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-gradient-primary flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Wallet
                    </CardTitle>
                    <CardDescription>
                        Loading wallet connection status...
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted/20 rounded"></div>
                        <div className="h-10 bg-muted/20 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (isConnected) {
        return (
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-gradient-primary flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Wallet Connected
                    </CardTitle>
                    <CardDescription>
                        Your wallet is connected to the Romulus oracle
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Address</span>
                            <span className="font-mono text-sm text-glow-cyan">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Network</span>
                            <div className="flex items-center gap-2">
                                {isCorrectNetwork ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                )}
                                <Badge className={`status-badge ${isCorrectNetwork ? 'ready' : 'pending'}`}>
                                    {networkName}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {!isCorrectNetwork && (
                        <div className="space-y-2">
                            <p className="text-sm text-yellow-500">
                                Please switch to Base or Base Sepolia network
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => switchChain({ chainId: base.id })}
                                    variant="outline"
                                    size="sm"
                                    className="btn-neon"
                                >
                                    Switch to Base
                                </Button>
                                <Button
                                    onClick={() => switchChain({ chainId: baseSepolia.id })}
                                    variant="outline"
                                    size="sm"
                                    className="btn-neon"
                                >
                                    Switch to Base Sepolia
                                </Button>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={() => disconnect()}
                        variant="outline"
                        className="w-full"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Disconnect
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="text-gradient-primary flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                </CardTitle>
                <CardDescription>
                    Connect your wallet to interact with the Romulus oracle
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {connectors.map((connector) => (
                    <Button
                        key={connector.uid}
                        onClick={() => connect({ connector })}
                        disabled={isPending}
                        className="btn-neon w-full"
                    >
                        <Wallet className="w-4 h-4 mr-2" />
                        {isPending ? 'Connecting...' : `Connect ${connector.name}`}
                    </Button>
                ))}
            </CardContent>
        </Card>
    )
} 