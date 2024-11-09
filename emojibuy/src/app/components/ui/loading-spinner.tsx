import exp from "constants";

// components/ui/loading-spinner.tsx
export const LoadingSpinner = ({ size = 24 }: { size?: number }) => (
    <div
      style={{ width: size, height: size }}
      className="animate-spin rounded-full border-4 border-white border-t-transparent"
    />
  );

  export default LoadingSpinner;