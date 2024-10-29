import React from 'react';

interface MarketInfoProps {
  marketCap: number;
  gainerPercentage: number;
  topgain: string;
}

const MarketInfo: React.FC<MarketInfoProps> = ({ marketCap, gainerPercentage,topgain }) => {
  return (
    <div
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-gray-200 border border-gray-600 rounded-lg px-4 py-2 flex items-center space-x-4"
      style={{ minWidth: '250px', textAlign: 'center' }}
    >
      <div className="text-sm font-medium">
        Total Market Cap: ${marketCap}M
      </div>
      <div className="text-sm font-medium">
        Top Gainer 24H: <span className="mr-1">{topgain}</span>
        <span className="text-green-500">+{gainerPercentage}%</span>
      </div>
    </div>
  );
};

export default MarketInfo;
