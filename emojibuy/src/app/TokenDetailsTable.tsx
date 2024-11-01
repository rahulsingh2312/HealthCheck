// @ts-nocheck 
import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, // Register this element
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, // Register PointElement here
  Tooltip, 
  Legend
);

const formatNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + ' B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + ' M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + ' K';
  return num.toLocaleString();
};

interface TokenDetailsTableProps {
  selectedToken: {
  };
  isDarkMode: boolean;
}

const TokenDetailsTable: React.FC<TokenDetailsTableProps> = ({ selectedToken, isDarkMode }) => {
  const [chartType, setChartType] = useState("priceChange"); // Default chart

  if (!selectedToken) return null;

  const chartOptions = [
    { value: "priceChange", label: "Price Change" },
    { value: "volume", label: "Volume of Trades" },
    { value: "transactions", label: "Transaction Counts" },
    // { value: "liquidityMarketCap", label: "Liquidity vs Market Cap" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChartType(e.target.value);
  };


  const getChartData = () => {
    console.log(selectedToken);
    switch (chartType) {
      case "priceChange":
        return {
          labels: ["5 min", "1 hr", "6 hr", "24 hr"],
          datasets: [
            {
              label: "Price Change (%)",
              data: [
                selectedToken?.priceChange?.m5,
                selectedToken?.priceChange?.h1,
                selectedToken?.priceChange?.h6,
                selectedToken?.priceChange?.h24,
              ],
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
            },
          ],
        };
      case "volume":
        return {
          labels: ["5 min", "1 hr", "6 hr", "24 hr"],
          datasets: [
            {
              label: "Volume (USD)",
              data: [
                selectedToken.volume.m5,
                selectedToken.volume.h1,
                selectedToken.volume.h6,
                selectedToken.volume.h24,
              ],
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
              borderColor: 'rgba(153, 102, 255, 1)',
            },
          ],
        };
      case "transactions":
        return {
          labels: ["5 min", "1 hr", "6 hr", "24 hr"],
          datasets: [
            {
              label: "Buy Transactions",
              data: [
                selectedToken.txns.m5.buys,
                selectedToken.txns.h1.buys,
                selectedToken.txns.h6.buys,
                selectedToken.txns.h24.buys,
              ],
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
            },
            {
              label: "Sell Transactions",
              data: [
                selectedToken.txns.m5.sells,
                selectedToken.txns.h1.sells,
                selectedToken.txns.h6.sells,
                selectedToken.txns.h24.sells,
              ],
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgba(255, 99, 132, 1)',
            },
          ],
        };
      case "liquidityMarketCap":
        return {
          labels: ["Liquidity", "Market Cap"],
          datasets: [
            {
              label: "USD",
              data: [selectedToken.liquidity, selectedToken.marketCap],
              backgroundColor: 'rgba(255, 206, 86, 0.6)',
              borderColor: 'rgba(255, 206, 86, 1)',
            },
          ],
        };
      default:
        return {
          labels: [],
          datasets: [],
        };
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h3 className="text-xs font-semibold mb-3 border-b pb-2 dark:border-gray-700">
          Market Information
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">Price:</span>
            <span className="font-bold">{selectedToken.priceUsd} $</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">Market Cap:</span>
            <span className="font-bold">${formatNumber(selectedToken.marketCap)}</span>
            </div>
          <div className="flex justify-between">
            <span className="font-medium  text-gray-600 dark:text-gray-300">24h Volume:</span>
            <span className="font-bold">${formatNumber(selectedToken.volume.h24)}</span>
            </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">24h Change:</span>
            <span className={selectedToken.priceChange.h24 >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
              {selectedToken.priceChange.h24.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">Price:</span>
            <span className="font-bold">{selectedToken.priceNative} SOL</span>

          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">Liquidity:</span>
            <span className="font-[510]">${formatNumber(selectedToken.liquidity.usd)}</span>
            </div>
        </div>
      </div>

      <div className="my-4">
        <label className="block font-medium text-gray-600 dark:text-gray-300 mb-2">Select Chart Type:</label>
        <select
          value={chartType}
          onChange={handleChange}
          className="rounded-lg p-2 bg-white dark:bg-gray-700 text-sm"
        >
          {chartOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg flex justify-center items-center bg-white dark:bg-gray-800">
        {chartType === "liquidityMarketCap" ? (
          <Bar data={getChartData()} />
        ) : (
          <Line data={getChartData()} />
        )}
      </div>
    </div>
  );
};

export default TokenDetailsTable;
