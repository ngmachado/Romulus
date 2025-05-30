'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAccount } from 'wagmi'
import { useGetInstantRandom, useRingStatus } from '@/hooks/useRomulus'
import { Zap, Dice6, Copy, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react'

export function InstantRandomDemo() {
    const [inputData, setInputData] = useState('')
    const [randomResult, setRandomResult] = useState<{
        value: string
        timestamp: Date
    } | null>(null)
    const [copied, setCopied] = useState(false)

    const { isConnected } = useAccount()
    const { data: ringStatus } = useRingStatus()

    const {
        getInstantRandom,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
        returnValue,
    } = useGetInstantRandom()

    // Update result when we get a return value
    useEffect(() => {
        if (returnValue) {
            setRandomResult({
                value: returnValue.toString(),
                timestamp: new Date()
            })
        }
    }, [returnValue])

    // Reset result when starting new transaction
    useEffect(() => {
        if (isPending) {
            setRandomResult(null)
        }
    }, [isPending])

    const handleGenerateRandom = () => {
        if (!isConnected) return
        getInstantRandom(inputData || 'demo')
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const validSeeds = ringStatus?.[0] || BigInt(0)
    const isSystemHealthy = Number(validSeeds) > 0

    return (
        <div className="space-y-8">
            {/* Header */}
            <Card className="glass-card-glow">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-bg-secondary pulse-glow">
                            <Zap className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl text-gradient-secondary">Instant Random Generator</CardTitle>
                            <CardDescription className="text-lg">
                                Generate cryptographically secure random values instantly
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="metric-card">
                            <div className="metric-value text-glow-green">{Number(validSeeds)}</div>
                            <div className="metric-label">Valid Seeds</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-cyan">
                                {isSystemHealthy ? 'Ready' : 'Unavailable'}
                            </div>
                            <div className="metric-label">System Status</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-purple">~0.001 ETH</div>
                            <div className="metric-label">Gas Cost</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Random Result Display */}
            {randomResult && (
                <Card className="glass-card-glow border-green-500/30">
                    <CardHeader>
                        <CardTitle className="text-gradient-primary flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-green-500" />
                            Random Value Generated!
                        </CardTitle>
                        <CardDescription>
                            Your cryptographically secure random number
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Main Random Value */}
                        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/20">
                            <div className="text-sm font-medium text-green-400 mb-2">RANDOM VALUE</div>
                            <div className="font-mono text-2xl md:text-3xl font-bold text-glow-green break-all">
                                {randomResult.value}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-3 text-green-400 hover:text-green-300"
                                onClick={() => copyToClipboard(randomResult.value)}
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Value
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center p-4 rounded-lg bg-muted/10 border border-border/50">
                                <div className="text-sm font-medium text-muted-foreground">Generated At</div>
                                <div className="text-sm font-mono text-glow-pink">
                                    {randomResult.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/10 border border-border/50">
                                <div className="text-sm font-medium text-muted-foreground">Value Length</div>
                                <div className="text-xl font-bold text-glow-cyan">{randomResult.value.length} digits</div>
                            </div>
                        </div>

                        {/* Value Analysis */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-xs text-muted-foreground">Hex</div>
                                <div className="font-mono text-sm text-glow-cyan">
                                    0x{BigInt(randomResult.value).toString(16).slice(0, 8)}...
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Mod 100</div>
                                <div className="font-mono text-sm text-glow-purple">
                                    {Number(BigInt(randomResult.value) % BigInt(100))}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Mod 1000</div>
                                <div className="font-mono text-sm text-glow-green">
                                    {Number(BigInt(randomResult.value) % BigInt(1000))}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Binary</div>
                                <div className="font-mono text-sm text-glow-pink">
                                    {BigInt(randomResult.value).toString(2).slice(0, 8)}...
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Generator Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-card interactive-card">
                    <CardHeader>
                        <CardTitle className="text-gradient-accent flex items-center gap-2">
                            <Dice6 className="w-5 h-5" />
                            Generate Random Value
                        </CardTitle>
                        <CardDescription>
                            Input optional data for additional entropy
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="input-data" className="text-sm font-medium">
                                Input Data (Optional)
                            </Label>
                            <Input
                                id="input-data"
                                type="text"
                                placeholder="Enter any text for additional entropy..."
                                value={inputData}
                                onChange={(e) => setInputData(e.target.value)}
                                className="bg-input border-border focus:border-glow-purple"
                            />
                            <p className="text-xs text-muted-foreground">
                                This data adds uniqueness but doesn&apos;t affect cryptographic security
                            </p>
                        </div>

                        {!isConnected ? (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm text-yellow-500">Connect wallet to generate random values</span>
                            </div>
                        ) : !isSystemHealthy ? (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                <span className="text-sm text-destructive">No valid seeds available</span>
                            </div>
                        ) : (
                            <Button
                                onClick={handleGenerateRandom}
                                disabled={isPending || isConfirming}
                                className="btn-neon w-full"
                            >
                                {isPending ? (
                                    <>
                                        <Zap className="w-4 h-4 mr-2 animate-pulse" />
                                        Sending Transaction...
                                    </>
                                ) : isConfirming ? (
                                    <>
                                        <Zap className="w-4 h-4 mr-2 animate-spin" />
                                        Confirming...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Generate Random Value
                                    </>
                                )}
                            </Button>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                <span className="text-sm text-destructive">
                                    {error.message || 'Transaction failed'}
                                </span>
                            </div>
                        )}

                        {isSuccess && !returnValue && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Zap className="w-4 h-4 text-blue-500 animate-spin" />
                                <span className="text-sm text-blue-500">Parsing transaction result...</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card interactive-card">
                    <CardHeader>
                        <CardTitle className="text-gradient-primary flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Transaction Status
                        </CardTitle>
                        <CardDescription>
                            Monitor your random generation transaction
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {hash && (
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-xs font-medium text-muted-foreground">TRANSACTION HASH</Label>
                                    <div className="hash-display mt-1 flex items-center justify-between">
                                        <span className="truncate">{hash}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-2 h-6 w-6 p-0"
                                            onClick={() => copyToClipboard(hash)}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Status</span>
                                    <Badge className={`status-badge ${isSuccess ? 'revealed' :
                                        isConfirming ? 'pending' :
                                            isPending ? 'pending' : 'ready'
                                        }`}>
                                        {isSuccess ? (
                                            <>
                                                <CheckCircle className="w-3 h-3" />
                                                Confirmed
                                            </>
                                        ) : isConfirming ? (
                                            <>
                                                <Zap className="w-3 h-3 animate-spin" />
                                                Confirming
                                            </>
                                        ) : isPending ? (
                                            <>
                                                <Zap className="w-3 h-3 animate-pulse" />
                                                Pending
                                            </>
                                        ) : (
                                            'Ready'
                                        )}
                                    </Badge>
                                </div>

                                <a
                                    href={`https://basescan.org/tx/${hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-neon w-full text-center"
                                >
                                    View on BaseScan
                                </a>
                            </div>
                        )}

                        {!hash && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Dice6 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Generate a random value to see transaction details</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* How It Works */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-gradient-secondary">How Instant Randomness Works</CardTitle>
                    <CardDescription>
                        Understanding the cryptographic process behind instant random generation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                1
                            </div>
                            <h4 className="font-semibold">Ring Buffer Selection</h4>
                            <p className="text-sm text-muted-foreground">
                                System selects the oldest valid seed from the 24-slot ring buffer to maintain forward secrecy.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-bg-secondary flex items-center justify-center text-primary-foreground font-bold">
                                2
                            </div>
                            <h4 className="font-semibold">Entropy Mixing</h4>
                            <p className="text-sm text-muted-foreground">
                                Combines pre-generated seed with your input, timestamp, and consume count for uniqueness.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-bg-accent flex items-center justify-center text-primary-foreground font-bold">
                                3
                            </div>
                            <h4 className="font-semibold">Cryptographic Hash</h4>
                            <p className="text-sm text-muted-foreground">
                                Final random value generated using keccak256 hash function for cryptographic security.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 