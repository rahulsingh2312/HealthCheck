import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { LineChart, BarChart, Activity, ArrowUpDown } from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement,
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement,
  Tooltip, 
  Legend
);

const formatNumber = (num: any) => {
  if (typeof num !== 'number' || isNaN(num)) return 'N/A';

  if (num >= 1e9) return (num / 1e9).toFixed(1) + ' B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + ' M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + ' K';
  
  if (num < 0.001 && num > 0) {
    const decimalPlaces = -Math.floor(Math.log10(num));
    return (
      <>
        0.<sub>{decimalPlaces}</sub>{num.toFixed(decimalPlaces).slice(-2)}
      </>
    );
  }
  
  return num.toLocaleString();
};



interface TokenDetailsTableProps {
  selectedToken: any;
  isDarkMode: boolean;
}

const TokenDetailsTable: React.FC<TokenDetailsTableProps> = ({ selectedToken, isDarkMode }) => {
  const [chartType, setChartType] = useState("priceChange");

  if (!selectedToken) return null;

  const chartOptions = [
    { value: "priceChange", label: "Price", icon: LineChart },
    { value: "volume", label: "Volume", icon: BarChart },
    { value: "transactions", label: "Transactions", icon: Activity },
  ];

  const getChartData = () => {
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
                selectedToken?.txns?.m5?.buys,
                selectedToken?.txns?.h1?.buys,
                selectedToken?.txns?.h6?.buys,
                selectedToken?.txns?.h24?.buys,
              ],
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
            },
            {
              label: "Sell Transactions",
              data: [
                selectedToken?.txns?.m5?.sells,
                selectedToken?.txns?.h1?.sells,
                selectedToken?.txns?.h6?.sells,
                selectedToken?.txns?.h24?.sells,
              ],
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgba(255, 99, 132, 1)',
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
            <span className="font-bold">{formatNumber(Number(selectedToken.priceUsd))} $</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">Market Cap:</span>
            <span className="font-bold">${formatNumber(selectedToken.marketCap)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">24h Volume:</span>
            <span className="font-bold">${formatNumber(selectedToken.volume.h24)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">24h Change:</span>
            <span className={selectedToken?.priceChange?.h24 >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
              {selectedToken?.priceChange?.h24?.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">Price:</span>
            <span className="font-bold">{formatNumber(Number(selectedToken.priceNative))} SOL</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">Liquidity:</span>
            <span className="font-[510]">${formatNumber(selectedToken?.liquidity?.usd)}</span>
          </div>
        </div>
      </div>

      <div className="my-4">
        <div className="flex gap-2">
          {chartOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setChartType(option.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                  ${chartType === option.value 
                    ? 'bg-[#A9F605] text-black' 
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                <Icon size={16} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg flex justify-center items-center bg-white dark:bg-gray-800 p-4">
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