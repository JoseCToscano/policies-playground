# Stellar Network Switching Implementation Plan

This document provides a step-by-step plan for implementing network switching between Stellar Testnet and Mainnet in your passkey-kit project, based on the Freelii Core implementation.

## Overview

The implementation allows users to dynamically switch between Stellar Testnet and Mainnet without application restarts. It uses React Context for state management, environment variables for configuration, and provides a seamless developer experience.

## Prerequisites

Before starting, ensure you have:

- [ ] A Next.js project with React 18+
- [ ] `passkey-kit` package installed
- [ ] `@stellar/stellar-sdk` installed
- [ ] TypeScript configured
- [ ] A UI library (Tailwind CSS recommended)

## Implementation Steps

### Phase 1: Core Infrastructure

#### Step 1: Set Up Environment Variables
**Duration: 30 minutes**

1. **Add environment variables** to your `.env.local` file:
   ```bash
   # Copy the variables from 05-environment-variables.md
   # Start with testnet variables and add mainnet as needed
   ```

2. **Update your environment validation** (if using `@t3-oss/env-nextjs`):
   ```typescript
   // Add network-specific environment variables to your env validation
   ```

3. **Test environment loading**:
   ```bash
   npm run dev
   # Verify no environment variable errors
   ```

#### Step 2: Create Stellar Context
**Duration: 45 minutes**

1. **Create the context file**:
   ```bash
   mkdir -p src/contexts
   # Copy 01-stellar-context.tsx to src/contexts/stellar-context.tsx
   ```

2. **Adapt imports** to your project structure:
   - Update any UI library imports
   - Adjust file paths as needed

3. **Integrate into your app**:
   ```typescript
   // In your layout.tsx or _app.tsx
   import { StellarProvider } from '@/contexts/stellar-context';
   
   export default function RootLayout({ children }) {
     return (
       <StellarProvider>
         {children}
       </StellarProvider>
     );
   }
   ```

#### Step 3: Create Stellar Clients Factory
**Duration: 30 minutes**

1. **Create the factory file**:
   ```bash
   mkdir -p src/lib
   # Copy 02-stellar-clients-factory.ts to src/lib/stellar-clients-factory.ts
   ```

2. **Verify passkey-kit imports**:
   - Ensure all imports from `passkey-kit` are correct
   - Update any deprecated API calls

3. **Test factory function**:
   ```typescript
   // Add a simple test to verify clients are created correctly
   ```

#### Step 4: Create Stellar Hooks
**Duration: 30 minutes**

1. **Create the hooks file**:
   ```bash
   mkdir -p src/hooks
   # Copy 03-stellar-hooks.ts to src/hooks/use-stellar-clients.ts
   ```

2. **Update import paths**:
   - Fix relative imports to match your project structure

3. **Test hooks in a component**:
   ```typescript
   // Create a simple test component to verify hooks work
   ```

### Phase 2: UI Components

#### Step 5: Create Network Switcher Component
**Duration: 45 minutes**

1. **Create the component file**:
   ```bash
   mkdir -p src/components
   # Copy 04-network-switcher.tsx to src/components/network-switcher.tsx
   ```

2. **Adapt to your UI library**:
   - Replace button imports with your UI library
   - Update class names to match your design system
   - Adjust styling to fit your theme

3. **Add to your layout**:
   ```typescript
   // Add NetworkSwitcher to your header/navigation
   import { NetworkSwitcher } from '@/components/network-switcher';
   ```

#### Step 6: Test Basic Functionality
**Duration: 30 minutes**

1. **Create a test page**:
   ```typescript
   // pages/test-network.tsx or app/test-network/page.tsx
   // Simple page that shows current network and client info
   ```

2. **Verify network switching**:
   - [ ] Network switcher appears correctly
   - [ ] Clicking switches network
   - [ ] localStorage persistence works
   - [ ] Clients update when network changes

### Phase 3: Integration with Existing Code

#### Step 7: Update Existing Wallet Code
**Duration: 2-4 hours (varies by codebase)**

1. **Identify current Stellar client usage**:
   ```bash
   # Search for existing passkey-kit imports
   grep -r "passkey-kit" src/
   # Search for hardcoded network configurations
   grep -r "soroban-testnet\|soroban-mainnet" src/
   ```

2. **Replace static clients with hooks**:
   ```typescript
   // Before
   import { account } from '@/lib/stellar-clients';
   
   // After
   import { useStellarAccount } from '@/hooks/use-stellar-clients';
   const account = useStellarAccount();
   ```

3. **Update server-side code** (if applicable):
   - Server components can't use React Context
   - Consider creating server-side utilities that accept network parameters

#### Step 8: Handle Network-Specific Data
**Duration: 1-2 hours**

1. **Update wallet filtering**:
   ```typescript
   // Filter wallets by network when displaying
   const wallets = allWallets.filter(wallet => 
     wallet.network === currentNetwork
   );
   ```

2. **Handle network switching**:
   - Clear wallet selection when switching networks
   - Show appropriate UI states for empty network states
   - Handle redirects to wallet creation if needed

3. **Update database models** (if needed):
   ```sql
   -- Add network_environment column to wallets table
   ALTER TABLE wallets ADD COLUMN network_environment VARCHAR(10) DEFAULT 'testnet';
   ```

### Phase 4: Testing and Refinement

#### Step 9: Comprehensive Testing
**Duration: 2-3 hours**

1. **Test wallet operations on both networks**:
   - [ ] Wallet creation works on testnet
   - [ ] Wallet creation works on mainnet (if ready)
   - [ ] Transfers work on both networks
   - [ ] Network switching preserves app state

2. **Test edge cases**:
   - [ ] Network switching with no wallets
   - [ ] Network switching with selected wallet
   - [ ] Page refresh preserves network selection
   - [ ] Invalid environment variables handled gracefully

3. **Test user experience**:
   - [ ] Clear visual feedback for current network
   - [ ] Appropriate warnings for mainnet operations
   - [ ] Smooth transitions between networks

#### Step 10: Performance and Security Review
**Duration: 1 hour**

1. **Performance optimizations**:
   - [ ] Verify React.memo usage for expensive components
   - [ ] Check for unnecessary re-renders during network switches
   - [ ] Optimize client creation with proper memoization

2. **Security review**:
   - [ ] Verify no sensitive data in client-side environment variables
   - [ ] Ensure proper network isolation
   - [ ] Review JWT token usage and rotation

### Phase 5: Documentation and Deployment

#### Step 11: Update Documentation
**Duration: 1 hour**

1. **User documentation**:
   - Add network switching to user guides
   - Document any network-specific limitations
   - Create troubleshooting guides

2. **Developer documentation**:
   - Update README with new environment variables
   - Document the new architecture
   - Add code examples for common patterns

#### Step 12: Deployment Preparation
**Duration: 1-2 hours**

1. **Environment configuration**:
   - [ ] Set up testnet environment variables in production
   - [ ] Set up mainnet environment variables (when ready)
   - [ ] Configure deployment pipeline for environment variables

2. **Monitoring and logging**:
   - [ ] Add logging for network switches
   - [ ] Monitor for errors specific to network configurations
   - [ ] Set up alerts for wallet creation failures

## Estimated Timeline

- **Phase 1** (Core Infrastructure): 2-3 hours
- **Phase 2** (UI Components): 1.5 hours
- **Phase 3** (Integration): 3-6 hours (varies significantly)
- **Phase 4** (Testing): 3-4 hours
- **Phase 5** (Documentation & Deployment): 2-3 hours

**Total Estimated Time: 11-19 hours**

## Risk Mitigation

### High Priority Risks

1. **Environment Variable Confusion**:
   - Risk: Wrong network configuration in production
   - Mitigation: Implement runtime validation and clear logging

2. **Data Isolation Issues**:
   - Risk: Testnet and mainnet data mixing
   - Mitigation: Clear network indicators and proper filtering

3. **User Confusion**:
   - Risk: Users accidentally using wrong network
   - Mitigation: Clear visual indicators and confirmations for mainnet operations

### Medium Priority Risks

1. **Performance Impact**:
   - Risk: Network switching causes lag
   - Mitigation: Proper memoization and lazy loading

2. **Backward Compatibility**:
   - Risk: Breaking existing functionality
   - Mitigation: Gradual migration and extensive testing

## Success Criteria

- [ ] Users can switch between testnet and mainnet seamlessly
- [ ] Network preference persists across browser sessions
- [ ] All wallet operations work correctly on both networks
- [ ] Clear visual indicators show current network
- [ ] No breaking changes to existing functionality
- [ ] Performance impact is minimal
- [ ] Code is well-documented and maintainable

## Next Steps After Implementation

1. **User Feedback Collection**: Gather feedback on network switching UX
2. **Performance Monitoring**: Track metrics for network switch performance
3. **Feature Expansion**: Consider adding more networks or advanced features
4. **Security Audit**: Regular review of network isolation and security practices

## Support and Resources

- **Reference Files**: All implementation files are in `implementation-ref/`
- **Freelii Core**: Original implementation in this repository
- **Passkey Kit Docs**: [passkey-kit documentation](https://passkey-kit.org/)
- **Stellar Docs**: [Stellar developer documentation](https://developers.stellar.org/)

## Troubleshooting Common Issues

### Network Switch Not Working
1. Check browser localStorage for `stellar-network` key
2. Verify environment variables are properly loaded
3. Check React Context provider is wrapping your app

### Clients Not Updating
1. Verify `useMemo` dependencies in hooks
2. Check if context value is properly memoized
3. Ensure components are re-rendering on network change

### Environment Variables Not Loading
1. Verify `NEXT_PUBLIC_` prefix on all client-side variables
2. Check `.env.local` file format and syntax
3. Restart development server after environment changes

### TypeScript Errors
1. Update import paths to match your project structure
2. Install missing dependencies (`@types/react`, etc.)
3. Check passkey-kit version compatibility