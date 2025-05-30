import { http, createConfig } from 'wagmi'
import { base, baseSepolia, mainnet } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// WalletConnect project ID (you should get this from https://cloud.walletconnect.com)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

export const config = createConfig({
    chains: [base, baseSepolia, mainnet],
    connectors: [
        injected(),
        metaMask(),
        walletConnect({ projectId }),
    ],
    transports: {
        [base.id]: http(),
        [baseSepolia.id]: http(),
        [mainnet.id]: http(),
    },
})

declare module 'wagmi' {
    interface Register {
        config: typeof config
    }
} 