# Stellar Network Switching Implementation Reference

This directory contains reference implementations and documentation for adding Stellar Testnet/Mainnet network switching to your passkey-kit project, based on the Freelii Core implementation.

## 📁 Files Overview

| File | Description | Purpose |
|------|-------------|---------|
| `01-stellar-context.tsx` | React Context for network management | Core state management and configuration |
| `02-stellar-clients-factory.ts` | Factory for creating Stellar SDK clients | Dynamic client creation based on network |
| `03-stellar-hooks.ts` | React hooks for accessing clients | Developer-friendly API for components |
| `04-network-switcher.tsx` | UI component for switching networks | User interface for network selection |
| `05-environment-variables.md` | Environment variable documentation | Configuration setup guide |
| `IMPLEMENTATION_PLAN.md` | Step-by-step implementation guide | Complete implementation roadmap |

## 🚀 Quick Start

1. **Read the Implementation Plan**: Start with `IMPLEMENTATION_PLAN.md` for a complete roadmap
2. **Set Up Environment**: Follow `05-environment-variables.md` for configuration
3. **Copy Core Files**: Use the numbered files as templates for your implementation
4. **Adapt to Your Project**: Modify imports and styling to match your setup

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Network        │    │  Stellar         │    │  Stellar        │
│  Switcher UI    │◄──►│  Context         │◄──►│  Clients        │
│                 │    │                  │    │  Factory        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  localStorage    │    │  PasskeyKit     │
                       │  Persistence     │    │  StellarSDK     │
                       └──────────────────┘    │  SAC Clients    │
                                               └─────────────────┘
```

## 📋 Key Features

- **Dynamic Network Switching**: Switch between testnet and mainnet without app restart
- **Persistent Preferences**: Network choice saved in localStorage
- **Type Safety**: Full TypeScript support with strict typing
- **Performance Optimized**: Memoized clients and efficient re-renders
- **Developer Friendly**: Clean hooks API for easy integration
- **UI Components**: Ready-to-use network switcher components

## 🔧 Implementation Checklist

### Core Setup
- [ ] Environment variables configured
- [ ] Stellar context implemented
- [ ] Clients factory created
- [ ] Hooks implemented
- [ ] Network switcher component added

### Integration
- [ ] Context provider added to app root
- [ ] Existing code migrated to use hooks
- [ ] Network-specific data handling implemented
- [ ] Testing completed on both networks

### Production Ready
- [ ] Environment variables set in deployment
- [ ] Security review completed
- [ ] Performance optimization verified
- [ ] Documentation updated

## 💡 Usage Examples

### Basic Network Switching
```tsx
import { useStellar } from '@/contexts/stellar-context';

function MyComponent() {
  const { network, setNetwork } = useStellar();
  
  return (
    <div>
      Current: {network}
      <button onClick={() => setNetwork('mainnet')}>
        Switch to Mainnet
      </button>
    </div>
  );
}
```

### Using Stellar Clients
```tsx
import { useStellarClients } from '@/hooks/use-stellar-clients';

function WalletComponent() {
  const { account, server, network } = useStellarClients();
  
  const createWallet = async () => {
    const result = await account.createWallet('MyApp', 'MyWallet');
    await server.send(result.signedTx);
  };
  
  return (
    <div>
      Network: {network}
      <button onClick={createWallet}>Create Wallet</button>
    </div>
  );
}
```

### Network-Aware Operations
```tsx
import { useStellarConfig } from '@/hooks/use-stellar-clients';

function TransferComponent() {
  const { isTestnet, isMainnet } = useStellarConfig();
  
  if (isMainnet) {
    // Show additional confirmation for mainnet
    return <MainnetWarning />;
  }
  
  return <TestnetTransferForm />;
}
```

## ⚠️ Important Considerations

### Security
- **Never commit JWT tokens** to version control
- **Use separate tokens** for testnet and mainnet
- **Validate environment variables** at runtime
- **Implement proper error handling** for network failures

### Performance
- **Memoize expensive operations** (client creation, configuration)
- **Avoid unnecessary re-renders** during network switches
- **Lazy load network-specific resources** when possible

### User Experience
- **Clear visual indicators** for current network
- **Confirmation dialogs** for mainnet operations
- **Graceful error handling** for network issues
- **Proper loading states** during network switches

## 🔍 Troubleshooting

### Common Issues

**Network switch doesn't work:**
- Check localStorage for `stellar-network` key
- Verify context provider wraps your app
- Check browser console for errors

**Clients not updating:**
- Verify `useMemo` dependencies
- Check context re-renders
- Ensure components are reactive to context changes

**Environment variables not loading:**
- Confirm `NEXT_PUBLIC_` prefix
- Restart development server
- Check `.env.local` syntax

### Debug Tools

Add this to your component for debugging:
```tsx
const { network, config } = useStellar();
console.log('Current network:', network);
console.log('Current config:', config);
```

## 📚 Additional Resources

- **Passkey Kit Documentation**: [passkey-kit.org](https://passkey-kit.org/)
- **Stellar Developer Docs**: [developers.stellar.org](https://developers.stellar.org/)
- **Soroban Documentation**: [soroban.stellar.org](https://soroban.stellar.org/)
- **React Context Patterns**: [react.dev/reference/react/useContext](https://react.dev/reference/react/useContext)

## 🤝 Contributing

This reference implementation is based on the Freelii Core project. For improvements or questions:

1. Review the original implementation in the main codebase
2. Test changes thoroughly on both networks
3. Update documentation as needed
4. Consider backward compatibility

## 📄 License

This reference implementation follows the same license as the Freelii Core project.