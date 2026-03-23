/**
 * WalletAddress Component
 * 
 * Displays a truncated, copyable Stellar address with optional Identicon avatar.
 */

interface WalletAddressProps {
  address: string;
  truncate?: number;
  showCopy?: boolean;
  showAvatar?: boolean;
}

export function WalletAddress({
  address,
  truncate = 8,
  showCopy = true,
  showAvatar = false,
}: WalletAddressProps) {
  const truncated = address.length > truncate * 2
    ? `${address.slice(0, truncate)}...${address.slice(-truncate)}`
    : address;

  return (
    <div className="flex items-center gap-2">
      {showAvatar && (
        <div className="w-8 h-8 rounded-full bg-stellar-cyan" />
      )}
      <span className="font-mono">{truncated}</span>
      {showCopy && (
        <button
          onClick={() => navigator.clipboard.writeText(address)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Copy
        </button>
      )}
    </div>
  );
}
