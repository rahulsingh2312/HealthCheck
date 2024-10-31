import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AmountInputProps {
  value: number;
  isdarkmode: boolean;
  onChange: (value: number) => void;
}

const AmountInput: React.FC<AmountInputProps> = ({isdarkmode, value, onChange }) => {
  const [currency, setCurrency] = useState('SOL');
  
  const handleInputChange = (e:any) => {
    // Allow only numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = value.split('.');
    if (parts.length > 2) return;
    // Limit decimal places to 6
    if (parts[1] && parts[1].length > 6) return;
    onChange(value);
  };

  return (
    <div className="relative flex w-full items-center mb-6">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder="0.000"
        className={`${isdarkmode?"text-white bg-gray-800 ":"text-black bg-gray-100 "}  w-full 
         rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500`}
      />
      <div className="relative">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className={`${isdarkmode?"text-white bg-gray-800 ":"text-black bg-gray-100 "} rounded-r-lg px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
        >
          <option value="SOL">SOL &nbsp; &nbsp;</option>
          {/* <option value="USDC">USDC</option> */}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
      </div>
    </div>
  );
};

export default AmountInput;