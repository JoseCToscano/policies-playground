'use client';

import { useStellar, type NetworkType } from '~/contexts/stellar-context';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface NetworkSwitcherProps {
  className?: string;
}

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({ className }) => {
  const { network, setNetwork } = useStellar();

  const handleNetworkChange = (newNetwork: NetworkType) => {
    setNetwork(newNetwork);
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <span className="text-sm font-medium text-gray-700">Network:</span>
      <div className="flex rounded-md border border-gray-300 overflow-hidden">
        <Button
          variant={network === 'testnet' ? 'default' : 'outline'}
          onClick={() => handleNetworkChange('testnet')}
          className={cn(
            'rounded-none border-0 px-3 py-1 text-xs',
            network === 'testnet'
              ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          Testnet
        </Button>
        <Button
          variant={network === 'mainnet' ? 'default' : 'outline'}
          onClick={() => handleNetworkChange('mainnet')}
          className={cn(
            'rounded-none border-0 px-3 py-1 text-xs',
            network === 'mainnet'
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          Mainnet
        </Button>
      </div>
    </div>
  );
};

/**
 * Network Status Indicator
 * A simple status indicator that shows the current network without switching functionality
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
    <div className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      config.bgColor,
      config.textColor,
      className
    )}>
      <div className={cn("w-2 h-2 rounded-full mr-1.5", config.dotColor)} />
      {config.emoji} {config.label}
    </div>
  );
};

export default NetworkSwitcher;