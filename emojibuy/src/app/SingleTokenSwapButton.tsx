import { useSingleTokenSwap } from "./useSingleTokenSwap";

const SingleTokenSwapButton: React.FC<{
    tokenAddress: string, 
    solAmount: number,
    isdarkmode: boolean;
  }> = ({ tokenAddress, solAmount , isdarkmode}) => {
    const { executeSwap, loading, error } = useSingleTokenSwap();
  
    const handleSwap = async () => {
      try {
        await executeSwap(tokenAddress, solAmount);
        alert('Swap successful!');
      } catch (err) {
        alert('Swap failed');
      }
    };
  
    return (
      <button 
        onClick={handleSwap} 
        disabled={loading}
        className={`w-full ${
            isdarkmode ? 'text-white' : 'text-white border'
          } bg-custom-green hover:bg-green-700 py-3 rounded-lg  font-medium transition-colors
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}
          `}
      
      >
        {loading ? 'Buying...' : 'Buy Now'}
      </button>
    );
  };
  
  export default SingleTokenSwapButton;