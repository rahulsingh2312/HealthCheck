import React from 'react';

interface MarketInfoProps {
  marketCap: any;
  gainerPercentage: any;
  topgain: any;
}

const MarketInfo: React.FC<MarketInfoProps> = ({ marketCap, gainerPercentage,topgain }) => {
  console.log('marketCap', marketCap);
  console.log('gainerPercentage', gainerPercentage);
  console.log('topgain', topgain);
  return (
    <div
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-gray-200 border border-gray-600 rounded-lg px-4 py-2 flex items-center space-x-4"
      style={{ textAlign: 'center' }}
    >
      <div className="text-sm hidden md:flex font-medium">
        Total Market Cap: ${marketCap}M
      </div>
      <div className="text-sm hidden md:flex justify-center items-center font-medium">
        Top Gainer 24H: <span className="mr-1"><img className='w-[30px] mx-4' src={topgain} /></span>
        <span className="text-green-500">+{gainerPercentage}%</span>
      </div>

      <div className="text-sm flex justify-center items-center md:hidden font-medium whitespace-nowrap">
  Total MC: ${marketCap}
</div>


      <div className="text-sm flex justify-center items-center   whitespace-nowrap md:hidden font-medium">
    T Gainer 
      <div className="text-green-500"> &nbsp;+{gainerPercentage}%</div>
      </div>
      <div className="text-sm flex md:hidden font-medium">
      <img className='w-[45px] mr-4' src={topgain} />
      </div>
    </div>
  );
};

export default MarketInfo;
