/**
 * NETWORK SWITCHER UI COMPONENT - REFERENCE IMPLEMENTATION
 * 
 * This file demonstrates a UI component for switching between Stellar
 * Testnet and Mainnet. The component provides visual feedback and
 * integrates with the Stellar context.
 * 
 * Key Features:
 * - Toggle between testnet and mainnet
 * - Visual indicators for current network
 * - Responsive design
 * - Accessibility considerations
 * - Customizable styling
 */

'use client';

import { useStellar, type NetworkType } from './01-stellar-context';
// Note: You'll need to adapt these imports to your UI library
// import { Button } from '@your-ui-lib/button';
// import { cn } from '@your-utils/cn'; // className utility function

/**
 * Props for the NetworkSwitcher component
 */
interface NetworkSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'pills';
}

/**
 * NetworkSwitcher Component
 * 
 * A toggle component that allows users to switch between Stellar networks.
 * 
 * Usage:
 * ```tsx
 * <NetworkSwitcher className="mb-4" size="md" variant="default" />
 * ```
 */
export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({ 
  className,
  size = 'md',
  variant = 'default'
}) => {
  const { network, setNetwork } = useStellar();

  const handleNetworkChange = (newNetwork: NetworkType) => {
    setNetwork(newNetwork);
  };

  // Size configurations
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  // Base button classes - adapt to your UI library
  const baseButtonClasses = `
    border-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    ${sizeClasses[size]}
  `;

  // Testnet styling (orange theme)
  const testnetClasses = network === 'testnet'
    ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 focus:ring-orange-500'
    : 'bg-white text-gray-600 hover:bg-gray-50 focus:ring-gray-500';

  // Mainnet styling (green theme)
  const mainnetClasses = network === 'mainnet'
    ? 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500'
    : 'bg-white text-gray-600 hover:bg-gray-50 focus:ring-gray-500';

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className="text-sm font-medium text-gray-700 mr-2">
          {network === 'testnet' ? '🧪' : '🌐'} {network}
        </span>
        <button
          onClick={() => handleNetworkChange(network === 'testnet' ? 'mainnet' : 'testnet')}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
          title={`Switch to ${network === 'testnet' ? 'mainnet' : 'testnet'}`}
        >
          Switch
        </button>
      </div>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={`inline-flex space-x-1 ${className}`}>
        <button
          onClick={() => handleNetworkChange('testnet')}
          className={`
            ${baseButtonClasses} rounded-full border
            ${network === 'testnet' 
              ? 'bg-orange-500 text-white border-orange-500' 
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          Testnet
        </button>
        <button
          onClick={() => handleNetworkChange('mainnet')}
          className={`
            ${baseButtonClasses} rounded-full border
            ${network === 'mainnet' 
              ? 'bg-green-500 text-white border-green-500' 
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          Mainnet
        </button>
      </div>
    );
  }

  // Default variant - toggle style
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Network:</span>
      <div className="flex rounded-md border border-gray-300 overflow-hidden">
        <button
          onClick={() => handleNetworkChange('testnet')}
          className={`
            ${baseButtonClasses} rounded-none
            ${testnetClasses}
          `}
          aria-pressed={network === 'testnet'}
          title="Switch to Stellar Testnet"
        >
          🧪 Testnet
        </button>
        <button
          onClick={() => handleNetworkChange('mainnet')}
          className={`
            ${baseButtonClasses} rounded-none border-l border-gray-300
            ${mainnetClasses}
          `}
          aria-pressed={network === 'mainnet'}
          title="Switch to Stellar Mainnet"
        >
          🌐 Mainnet
        </button>
      </div>
    </div>
  );
};

/**
 * Alternative: Dropdown-style Network Switcher
 * 
 * This variant provides a dropdown interface which can be useful
 * when you have limited horizontal space.
 */
export const NetworkSwitcherDropdown: React.FC<NetworkSwitcherProps> = ({ className }) => {
  const { network, setNetwork } = useStellar();

  return (
    <div className={`relative inline-block ${className}`}>
      <label htmlFor="network-select" className="block text-sm font-medium text-gray-700 mb-1">
        Network
      </label>
      <select
        id="network-select"
        value={network}
        onChange={(e) => setNetwork(e.target.value as NetworkType)}
        className="
          block w-full pl-3 pr-10 py-2 text-base border border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          rounded-md bg-white
        "
      >
        <option value="testnet">🧪 Testnet</option>
        <option value="mainnet">🌐 Mainnet</option>
      </select>
    </div>
  );
};

/**
 * Network Status Indicator
 * 
 * A simple status indicator that shows the current network
 * without switching functionality.
 */
export const NetworkStatus: React.FC<{ className?: string }> = ({ className }) => {
  const { network } = useStellar();

  const statusConfig = {
    testnet: {
      label: 'Testnet',
      emoji: '🧪',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      dotColor: 'bg-orange-400'
    },
    mainnet: {
      label: 'Mainnet',
      emoji: '🌐',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      dotColor: 'bg-green-400'
    }
  };

  const config = statusConfig[network];

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.dotColor} mr-1.5`} />
      {config.emoji} {config.label}
    </div>
  );
};

export default NetworkSwitcher;

/**
 * Usage Examples:
 * 
 * 1. Basic usage in a header:
 * ```tsx
 * import { NetworkSwitcher } from './network-switcher';
 * 
 * function AppHeader() {
 *   return (
 *     <header className="flex justify-between items-center p-4">
 *       <h1>My Stellar App</h1>
 *       <NetworkSwitcher />
 *     </header>
 *   );
 * }
 * ```
 * 
 * 2. Different variants:
 * ```tsx
 * // Compact for mobile
 * <NetworkSwitcher variant="compact" size="sm" />
 * 
 * // Pills style
 * <NetworkSwitcher variant="pills" size="md" />
 * 
 * // Dropdown for settings
 * <NetworkSwitcherDropdown className="w-48" />
 * 
 * // Status indicator only
 * <NetworkStatus className="ml-2" />
 * ```
 * 
 * 3. With custom styling:
 * ```tsx
 * <NetworkSwitcher 
 *   className="bg-gray-50 p-2 rounded-lg shadow-sm" 
 *   size="lg"
 * />
 * ```
 * 
 * Styling Notes:
 * - The component uses Tailwind CSS classes
 * - Adapt the classes to match your design system
 * - Consider using your UI library's Button, Select, or Badge components
 * - Ensure accessibility with proper ARIA attributes
 * - Test color contrast for accessibility compliance
 */