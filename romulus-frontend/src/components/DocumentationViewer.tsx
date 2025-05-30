'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    BookOpen, Shield, Code, Target, Cpu, ChevronRight,
    AlertTriangle, CheckCircle, Unlock, Info, ChevronDown
} from 'lucide-react'

interface DocSection {
    title: string
    icon: React.ReactNode
    content: React.ReactNode
}

export function DocumentationViewer() {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))
    const [activeSection, setActiveSection] = useState<string>('overview')
    const sectionRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({})

    const toggleSection = (section: string, shouldScroll = false) => {
        const newExpanded = new Set(expandedSections)
        if (newExpanded.has(section)) {
            newExpanded.delete(section)
        } else {
            newExpanded.add(section)
        }
        setExpandedSections(newExpanded)

        if (shouldScroll && sectionRefs.current[section]) {
            // Smooth scroll to section
            setTimeout(() => {
                sectionRefs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 100)
        }
    }

    const navigateToSection = (sectionId: string) => {
        // Always expand the section when navigating from quick nav
        const newExpanded = new Set(expandedSections)
        newExpanded.add(sectionId)
        setExpandedSections(newExpanded)

        // Scroll to the section
        setTimeout(() => {
            sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    // Track active section on scroll
    React.useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 100

            Object.entries(sectionRefs.current).forEach(([sectionId, ref]) => {
                if (ref) {
                    const { offsetTop, offsetHeight } = ref
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(sectionId)
                    }
                }
            })
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const sections: DocSection[] = [
        {
            title: 'Overview',
            icon: <BookOpen className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div className="prose prose-invert max-w-none">
                        <p className="text-lg leading-relaxed">
                            Romulus V2 is a <span className="text-glow-cyan">dual-mode randomness oracle</span> designed specifically for Base L2 network,
                            providing cryptographically secure random numbers without external dependencies or fees.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                            <h4 className="font-semibold text-cyan-400 mb-2">Secure Mode</h4>
                            <p className="text-sm text-muted-foreground">
                                High-stakes applications requiring unbiased randomness with user-configurable delays.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                            <h4 className="font-semibold text-purple-400 mb-2">Instant Mode</h4>
                            <p className="text-sm text-muted-foreground">
                                Low-stakes applications requiring immediate randomness in a single transaction.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-yellow-400">The L2 Sequencer Problem</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    On Base, a single sequencer controls block production, creating challenges for unbiased randomness.
                                    Romulus V2 solves this through economic disincentives and temporal separation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Security Model',
            icon: <Shield className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <Tabs defaultValue="secure" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="secure">Secure Mode</TabsTrigger>
                            <TabsTrigger value="instant">Instant Mode</TabsTrigger>
                        </TabsList>

                        <TabsContent value="secure" className="space-y-4 mt-4">
                            <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-gradient-primary">Eliminating Sequencer Bias</h4>

                                <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                                    <h5 className="font-semibold text-green-400 mb-2">Temporal Separation</h5>
                                    <div className="font-mono text-sm space-y-1">
                                        <div>Block N:     requestRandomNumber() called</div>
                                        <div>Block N+1:   Start of hash span</div>
                                        <div>Block N+64:  End of hash span (default)</div>
                                        <div>Block N+65:  Grace period</div>
                                        <div>Block N+66+: revealRandomNumber() allowed</div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left py-2">Span</th>
                                                <th className="text-left py-2">Time</th>
                                                <th className="text-left py-2">1-bit Cost</th>
                                                <th className="text-left py-2">8-bit Cost</th>
                                                <th className="text-left py-2">Use Case</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-muted-foreground">
                                            <tr className="border-b border-border/50">
                                                <td className="py-2">16</td>
                                                <td className="py-2 text-glow-cyan">~34s</td>
                                                <td className="py-2">Low</td>
                                                <td className="py-2">~2 hours</td>
                                                <td className="py-2">&lt;$100 bets</td>
                                            </tr>
                                            <tr className="border-b border-border/50">
                                                <td className="py-2">32</td>
                                                <td className="py-2 text-glow-purple">~66s</td>
                                                <td className="py-2">Medium</td>
                                                <td className="py-2">~4.5 hours</td>
                                                <td className="py-2">$100-1k bets</td>
                                            </tr>
                                            <tr className="border-b border-border/50">
                                                <td className="py-2">64</td>
                                                <td className="py-2 text-glow-green">~130s</td>
                                                <td className="py-2">High</td>
                                                <td className="py-2">~9 hours</td>
                                                <td className="py-2">$1k-10k bets</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2">128</td>
                                                <td className="py-2 text-glow-pink">~258s</td>
                                                <td className="py-2">Very High</td>
                                                <td className="py-2">~18 hours</td>
                                                <td className="py-2">&gt;$10k bets</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="instant" className="space-y-4 mt-4">
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-red-400">Security Warning</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Instant Mode is vulnerable to sequencer bias and should NOT be used for financial applications.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Unlock className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm">Sequencer can influence seed selection</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Unlock className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm">Transaction ordering manipulation possible</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Unlock className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm">Timestamp manipulation within allowed drift</span>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )
        },
        {
            title: 'Attack Analysis',
            icon: <Target className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-gradient-primary text-lg">Secure Mode Attacks</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Block Manipulation</span>
                                        <Badge className="status-badge expired">Not Viable</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Timing Attack</span>
                                        <Badge className="status-badge expired">No Effect</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Front-Running</span>
                                        <Badge className="status-badge expired">Cannot Influence</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">DoS Attack</span>
                                        <Badge className="status-badge pending">Delay Only</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-gradient-accent text-lg">Instant Mode Attacks</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Seed Selection</span>
                                        <Badge className="status-badge ready">High Risk</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">TX Ordering</span>
                                        <Badge className="status-badge ready">High Risk</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Timestamp Manip.</span>
                                        <Badge className="status-badge ready">Possible</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Entropy Starve</span>
                                        <Badge className="status-badge pending">Moderate</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
        },
        {
            title: 'Usage Guide',
            icon: <Code className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <Tabs defaultValue="secure-usage" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="secure-usage">Secure Mode</TabsTrigger>
                            <TabsTrigger value="instant-usage">Instant Mode</TabsTrigger>
                        </TabsList>

                        <TabsContent value="secure-usage" className="space-y-4 mt-4">
                            <div className="space-y-4">
                                <div>
                                    <h5 className="font-semibold mb-2 text-cyan-400">1. Request Randomness</h5>
                                    <div className="p-3 rounded-lg bg-black/50 border border-cyan-500/20">
                                        <pre className="text-xs font-mono text-cyan-300 overflow-x-auto">
                                            {`// Choose span based on value at risk
uint16 span = 64; // ~130 seconds on Base

// Request with custom span
uint256 requestId = romulus.requestRandomNumber(
    abi.encode(userId, gameId), // optional data
    span
);`}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-semibold mb-2 text-purple-400">2. Implement Callback</h5>
                                    <div className="p-3 rounded-lg bg-black/50 border border-purple-500/20">
                                        <pre className="text-xs font-mono text-purple-300 overflow-x-auto">
                                            {`contract MyContract is IRandomNumberConsumer {
    function receiveRandomNumber(
        uint256 requestId,
        uint256 randomNumber,
        bytes memory data
    ) external {
        require(msg.sender == address(romulus));
        processResult(requestId, randomNumber);
    }
}`}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-semibold mb-2 text-green-400">3. Monitor and Reveal</h5>
                                    <div className="p-3 rounded-lg bg-black/50 border border-green-500/20">
                                        <pre className="text-xs font-mono text-green-300 overflow-x-auto">
                                            {`// Check when reveal is available
(uint256 canRevealAt, uint256 estimatedSeconds) = 
    romulus.getRevealTime(requestId);

// Anyone can trigger reveal
if (block.number > canRevealAt) {
    romulus.revealRandomNumber(requestId);
}`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="instant-usage" className="space-y-4 mt-4">
                            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-yellow-400">Non-Financial Use Only</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Instant mode should only be used for UI randomization, visual effects, and non-competitive gaming.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-black/50 border border-pink-500/20">
                                <pre className="text-xs font-mono text-pink-300 overflow-x-auto">
                                    {`// ⚠️ WARNING: Only for non-financial applications
uint256 randomValue = romulus.getInstantRandom(
    abi.encode(userId, action)
);

// Use for UI randomization, visual effects, etc.
uint256 colorIndex = randomValue % colors.length;`}
                                </pre>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6">
                        <h4 className="font-semibold mb-3 text-gradient-accent">Span Selection Guide</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-2">Value at Risk</th>
                                        <th className="text-left py-2">Recommended Span</th>
                                        <th className="text-left py-2">Total Delay</th>
                                        <th className="text-left py-2">Security Level</th>
                                    </tr>
                                </thead>
                                <tbody className="text-muted-foreground">
                                    <tr className="border-b border-border/50">
                                        <td className="py-2">&lt;$100</td>
                                        <td className="py-2">16 blocks</td>
                                        <td className="py-2 text-glow-cyan">~34s</td>
                                        <td className="py-2"><Badge className="badge-sm">Basic</Badge></td>
                                    </tr>
                                    <tr className="border-b border-border/50">
                                        <td className="py-2">$100-$1k</td>
                                        <td className="py-2">32 blocks</td>
                                        <td className="py-2 text-glow-purple">~66s</td>
                                        <td className="py-2"><Badge className="badge-sm">Medium</Badge></td>
                                    </tr>
                                    <tr className="border-b border-border/50">
                                        <td className="py-2">$1k-$10k</td>
                                        <td className="py-2">64 blocks</td>
                                        <td className="py-2 text-glow-green">~130s</td>
                                        <td className="py-2"><Badge className="badge-sm">High</Badge></td>
                                    </tr>
                                    <tr>
                                        <td className="py-2">&gt;$10k</td>
                                        <td className="py-2">128+ blocks</td>
                                        <td className="py-2 text-glow-pink">~258s+</td>
                                        <td className="py-2"><Badge className="badge-sm">Maximum</Badge></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Technical Specifications',
            icon: <Cpu className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold mb-3 text-gradient-primary">Constants</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 rounded bg-muted/10">
                                    <span>DEFAULT_SPAN</span>
                                    <span className="font-mono text-cyan-400">64</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/10">
                                    <span>MIN_SPAN</span>
                                    <span className="font-mono text-cyan-400">8</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/10">
                                    <span>MAX_SPAN</span>
                                    <span className="font-mono text-cyan-400">4000</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/10">
                                    <span>RING_SIZE</span>
                                    <span className="font-mono text-purple-400">24</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/10">
                                    <span>SEED_REFRESH_INTERVAL</span>
                                    <span className="font-mono text-purple-400">1800</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3 text-gradient-accent">Gas Costs</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 rounded bg-muted/10">
                                    <span>Secure Request</span>
                                    <span className="font-mono text-green-400">~50k gas</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/10">
                                    <span>Secure Reveal</span>
                                    <span className="font-mono text-green-400">~20k + (span × 15)</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/10">
                                    <span>Instant Mode</span>
                                    <span className="font-mono text-green-400">~30k gas</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/10">
                                    <span>Callback Limit</span>
                                    <span className="font-mono text-green-400">10k-200k</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-3 text-gradient-secondary">Error Conditions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                                <code className="text-red-400">InvalidSpan</code>
                                <p className="text-xs text-muted-foreground mt-1">Span outside allowed range</p>
                            </div>
                            <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                                <code className="text-red-400">TooEarlyToReveal</code>
                                <p className="text-xs text-muted-foreground mt-1">Attempting reveal before span + grace</p>
                            </div>
                            <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                                <code className="text-red-400">BlockHashNotAvailable</code>
                                <p className="text-xs text-muted-foreground mt-1">Historical blocks outside EIP-2935</p>
                            </div>
                            <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                                <code className="text-red-400">NoValidSeedsAvailable</code>
                                <p className="text-xs text-muted-foreground mt-1">Ring buffer exhausted</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'What Romulus Can and Cannot Do',
            icon: <Info className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-4 text-green-400 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                What Romulus CAN Do
                            </h4>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <h5 className="font-semibold text-sm mb-1">Secure Mode</h5>
                                    <ul className="text-xs space-y-1 text-muted-foreground">
                                        <li>• Provide unbiased randomness</li>
                                        <li>• Eliminate sequencer manipulation</li>
                                        <li>• Generate cryptographically secure numbers</li>
                                        <li>• Support financial applications</li>
                                        <li>• Operate without external dependencies</li>
                                    </ul>
                                </div>
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <h5 className="font-semibold text-sm mb-1">Instant Mode</h5>
                                    <ul className="text-xs space-y-1 text-muted-foreground">
                                        <li>• Deliver immediate randomness</li>
                                        <li>• Provide sufficient entropy for UI</li>
                                        <li>• Operate with minimal gas costs</li>
                                        <li>• Support high-throughput apps</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-red-400 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                What Romulus CANNOT Do
                            </h4>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <h5 className="font-semibold text-sm mb-1">Fundamental Limits</h5>
                                    <ul className="text-xs space-y-1 text-muted-foreground">
                                        <li>• Cannot provide instant unbiased randomness</li>
                                        <li>• Cannot prevent network stalling (but makes it costly)</li>
                                        <li>• Cannot generate without delay in Secure Mode</li>
                                        <li>• Cannot work without block hash access</li>
                                    </ul>
                                </div>
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <h5 className="font-semibold text-sm mb-1">Mode-Specific Limits</h5>
                                    <ul className="text-xs space-y-1 text-muted-foreground">
                                        <li>• Secure: Cannot eliminate latency</li>
                                        <li>• Secure: Cannot work beyond 4000 blocks</li>
                                        <li>• Instant: Cannot prevent sequencer bias</li>
                                        <li>• Instant: Cannot guarantee fairness</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ]

    return (
        <div className="relative">
            {/* Floating Table of Contents - Desktop Only */}
            <div className="hidden xl:block fixed right-8 top-32 w-64 z-10">
                <Card className="glass-card border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">On this page</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        {sections.map((section) => {
                            const sectionId = section.title.toLowerCase().replace(/\s+/g, '-')
                            const isActive = activeSection === sectionId
                            const isExpanded = expandedSections.has(sectionId)

                            return (
                                <button
                                    key={sectionId}
                                    onClick={() => navigateToSection(sectionId)}
                                    className={`
                                        w-full text-left px-3 py-2 rounded-lg text-sm transition-all
                                        ${isActive ? 'bg-primary/20 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                                        flex items-center justify-between
                                    `}
                                >
                                    <span className="flex items-center gap-2">
                                        {section.icon}
                                        {section.title}
                                    </span>
                                    {isExpanded && <ChevronDown className="w-3 h-3" />}
                                </button>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8 xl:pr-72">
                {/* Header */}
                <Card className="glass-card-glow">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-bg-primary pulse-glow">
                                <BookOpen className="w-8 h-8 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl text-gradient-primary">Documentation</CardTitle>
                                <CardDescription className="text-lg">
                                    Complete guide to Romulus V2 randomness oracle
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Quick Navigation */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card
                        className="glass-card interactive-card cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => navigateToSection('security-model')}
                    >
                        <CardContent className="p-4 text-center">
                            <Shield className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                            <h4 className="font-semibold text-sm">Security Model</h4>
                        </CardContent>
                    </Card>
                    <Card
                        className="glass-card interactive-card cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => navigateToSection('usage-guide')}
                    >
                        <CardContent className="p-4 text-center">
                            <Code className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                            <h4 className="font-semibold text-sm">Usage Guide</h4>
                        </CardContent>
                    </Card>
                    <Card
                        className="glass-card interactive-card cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => navigateToSection('attack-analysis')}
                    >
                        <CardContent className="p-4 text-center">
                            <Target className="w-8 h-8 mx-auto mb-2 text-red-400" />
                            <h4 className="font-semibold text-sm">Attack Analysis</h4>
                        </CardContent>
                    </Card>
                    <Card
                        className="glass-card interactive-card cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => navigateToSection('technical-specifications')}
                    >
                        <CardContent className="p-4 text-center">
                            <Cpu className="w-8 h-8 mx-auto mb-2 text-green-400" />
                            <h4 className="font-semibold text-sm">Tech Specs</h4>
                        </CardContent>
                    </Card>
                </div>

                {/* Collapsible Sections */}
                <div className="space-y-4">
                    {sections.map((section, index) => {
                        const sectionId = section.title.toLowerCase().replace(/\s+/g, '-')
                        return (
                            <Card
                                key={index}
                                className={`glass-card doc-section-highlight ${expandedSections.has(sectionId) ? 'border-primary/30' : ''}`}
                                ref={(el) => { if (el) sectionRefs.current[sectionId] = el }}
                            >
                                <CardHeader
                                    className="cursor-pointer hover:bg-muted/5 transition-colors"
                                    onClick={() => toggleSection(sectionId)}
                                >
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {section.icon}
                                            <span className="text-gradient-accent">{section.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {expandedSections.has(sectionId) ? (
                                                <>
                                                    <span className="text-xs text-muted-foreground">Click to collapse</span>
                                                    <ChevronDown className="w-5 h-5 transition-transform" />
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-xs text-muted-foreground">Click to expand</span>
                                                    <ChevronRight className="w-5 h-5 transition-transform" />
                                                </>
                                            )}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                {expandedSections.has(sectionId) && (
                                    <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-300">
                                        {section.content}
                                    </CardContent>
                                )}
                            </Card>
                        )
                    })}
                </div>

                {/* Best Practices Quick Tips */}
                <Card className="glass-card border-yellow-500/20">
                    <CardHeader>
                        <CardTitle className="text-gradient-accent flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Best Practices
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <h5 className="font-semibold text-yellow-400">For Developers</h5>
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• Choose mode based on security requirements</li>
                                    <li>• Keep callbacks under 50k gas</li>
                                    <li>• Monitor for failed reveals</li>
                                    <li>• Never use Instant Mode for money</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h5 className="font-semibold text-yellow-400">Warning Signs</h5>
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• Unusual block production delays</li>
                                    <li>• Repeated failed reveal attempts</li>
                                    <li>• Abnormal gas price spikes</li>
                                    <li>• Pattern irregularities in outputs</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 