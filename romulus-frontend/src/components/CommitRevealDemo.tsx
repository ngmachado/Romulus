'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Clock,
    Shield,
    Hash,
    Eye,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Copy,
    RefreshCw
} from 'lucide-react'

interface CommitPhase {
    id: string
    status: 'pending' | 'committed' | 'ready' | 'revealed' | 'expired'
    commitBlock: number
    revealBlock: number
    blocksToWait: number
    currentBlock: number
    commitHash?: string
    randomValue?: string
    entropy?: string
}

export function CommitRevealDemo() {
    const [currentBlock, setCurrentBlock] = useState(18500000)
    const [blocksToWait, setBlocksToWait] = useState(100)
    const [commits, setCommits] = useState<CommitPhase[]>([])
    const [isCommitting, setIsCommitting] = useState(false)

    // Simulate block progression
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBlock(prev => prev + 1)
        }, 2000) // 2 second block time

        return () => clearInterval(interval)
    }, [])

    // Update commit statuses based on current block
    useEffect(() => {
        setCommits(prev => prev.map(commit => {
            const blocksUntilReveal = commit.revealBlock - currentBlock

            if (commit.status === 'committed' && blocksUntilReveal <= 0) {
                return { ...commit, status: 'ready' }
            }
            if (commit.status === 'ready' && blocksUntilReveal < -100) {
                return { ...commit, status: 'expired' }
            }
            return { ...commit, currentBlock }
        }))
    }, [currentBlock])

    const handleCommit = async () => {
        setIsCommitting(true)

        // Simulate commit transaction
        await new Promise(resolve => setTimeout(resolve, 1500))

        const newCommit: CommitPhase = {
            id: `commit-${Date.now()}`,
            status: 'committed',
            commitBlock: currentBlock,
            revealBlock: currentBlock + blocksToWait,
            blocksToWait,
            currentBlock,
            commitHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        }

        setCommits(prev => [newCommit, ...prev.slice(0, 4)])
        setIsCommitting(false)
    }

    const handleReveal = async (commitId: string) => {
        const randomValue = `0x${Math.random().toString(16).substr(2, 64)}`
        const entropy = `${Math.floor(Math.random() * 1000000)}`

        setCommits(prev => prev.map(commit =>
            commit.id === commitId
                ? { ...commit, status: 'revealed', randomValue, entropy }
                : commit
        ))
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'pending'
            case 'committed': return 'pending'
            case 'ready': return 'ready'
            case 'revealed': return 'revealed'
            case 'expired': return 'expired'
            default: return 'pending'
        }
    }

    const getProgressValue = (commit: CommitPhase) => {
        if (commit.status === 'revealed' || commit.status === 'expired') return 100
        const elapsed = currentBlock - commit.commitBlock
        const total = commit.blocksToWait
        return Math.min((elapsed / total) * 100, 100)
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <Card className="glass-card-glow">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-bg-primary pulse-glow">
                            <Shield className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl text-gradient-primary">Commit-Reveal Protocol</CardTitle>
                            <CardDescription className="text-lg">
                                Maximum security randomness using future block hashes
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="metric-card">
                            <div className="metric-value text-glow-cyan">{currentBlock.toLocaleString()}</div>
                            <div className="metric-label">Current Block</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-purple">{blocksToWait}</div>
                            <div className="metric-label">Blocks to Wait</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-green">{commits.filter(c => c.status === 'revealed').length}</div>
                            <div className="metric-label">Revealed</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Commit Interface */}
            <Card className="glass-card interactive-card">
                <CardHeader>
                    <CardTitle className="text-gradient-secondary flex items-center gap-2">
                        <Hash className="w-5 h-5" />
                        Create New Commit
                    </CardTitle>
                    <CardDescription>
                        Initiate a new commit-reveal sequence for secure randomness generation
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="blocks-to-wait" className="text-sm font-medium">
                                Blocks to Wait (1-1000)
                            </Label>
                            <Input
                                id="blocks-to-wait"
                                type="number"
                                min="1"
                                max="1000"
                                value={blocksToWait}
                                onChange={(e) => setBlocksToWait(Number(e.target.value))}
                                className="bg-input border-border focus:border-glow-purple"
                            />
                            <p className="text-xs text-muted-foreground">
                                Higher values = more security, longer wait time
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Estimated Wait Time</Label>
                            <div className="hash-display">
                                {Math.round((blocksToWait * 2) / 60)} minutes {(blocksToWait * 2) % 60} seconds
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Based on 2-second block time
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleCommit}
                        disabled={isCommitting}
                        className="btn-neon w-full"
                    >
                        {isCommitting ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Committing...
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4 mr-2" />
                                Create Commit
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Active Commits */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gradient-primary flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Active Commits
                </h3>

                {commits.length === 0 ? (
                    <Card className="glass-card">
                        <CardContent className="py-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                                <Hash className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">No active commits. Create your first commit above.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {commits.map((commit) => (
                            <Card key={commit.id} className="glass-card interactive-card">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-gradient-bg-secondary">
                                                {commit.status === 'revealed' ? (
                                                    <CheckCircle className="w-5 h-5 text-primary-foreground" />
                                                ) : commit.status === 'expired' ? (
                                                    <AlertCircle className="w-5 h-5 text-primary-foreground" />
                                                ) : commit.status === 'ready' ? (
                                                    <Eye className="w-5 h-5 text-primary-foreground" />
                                                ) : (
                                                    <Clock className="w-5 h-5 text-primary-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium">Commit #{commit.id.split('-')[1]}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Block {commit.commitBlock.toLocaleString()} → {commit.revealBlock.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className={`status-badge ${getStatusColor(commit.status)}`}>
                                            {commit.status === 'committed' && (
                                                <>
                                                    <Clock className="w-3 h-3" />
                                                    Waiting
                                                </>
                                            )}
                                            {commit.status === 'ready' && (
                                                <>
                                                    <Eye className="w-3 h-3" />
                                                    Ready to Reveal
                                                </>
                                            )}
                                            {commit.status === 'revealed' && (
                                                <>
                                                    <CheckCircle className="w-3 h-3" />
                                                    Revealed
                                                </>
                                            )}
                                            {commit.status === 'expired' && (
                                                <>
                                                    <AlertCircle className="w-3 h-3" />
                                                    Expired
                                                </>
                                            )}
                                        </Badge>
                                    </div>

                                    {/* Progress Bar */}
                                    {commit.status !== 'revealed' && commit.status !== 'expired' && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span>Progress</span>
                                                <span>{Math.round(getProgressValue(commit))}%</span>
                                            </div>
                                            <Progress
                                                value={getProgressValue(commit)}
                                                className="h-2 bg-muted/20"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                <span>Block {commit.commitBlock.toLocaleString()}</span>
                                                <span>{commit.revealBlock - currentBlock} blocks remaining</span>
                                                <span>Block {commit.revealBlock.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Commit Hash */}
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-xs font-medium text-muted-foreground">COMMIT HASH</Label>
                                            <div className="hash-display mt-1 flex items-center justify-between">
                                                <span className="truncate">{commit.commitHash}</span>
                                                <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Reveal Section */}
                                        {commit.status === 'ready' && (
                                            <>
                                                <Separator className="bg-border/50" />
                                                <Button
                                                    onClick={() => handleReveal(commit.id)}
                                                    className="btn-neon w-full"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Reveal Random Value
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </>
                                        )}

                                        {/* Revealed Values */}
                                        {commit.status === 'revealed' && (
                                            <>
                                                <Separator className="bg-border/50" />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-xs font-medium text-muted-foreground">RANDOM VALUE</Label>
                                                        <div className="hash-display mt-1 flex items-center justify-between">
                                                            <span className="truncate text-glow-green">{commit.randomValue}</span>
                                                            <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
                                                                <Copy className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs font-medium text-muted-foreground">ENTROPY SCORE</Label>
                                                        <div className="hash-display mt-1">
                                                            <span className="text-glow-cyan font-mono">{commit.entropy}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
} 