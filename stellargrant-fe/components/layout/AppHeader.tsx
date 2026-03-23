/**
 * AppHeader Component
 * 
 * Top navigation bar with logo, main nav links (Explore, Create, Profile),
 * wallet connect button, and network indicator (Testnet/Mainnet badge).
 */

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold">StellarGrants</h1>
          <nav className="flex gap-4">
            <a href="/grants">Explore</a>
            <a href="/grants/create">Create</a>
            <a href="/profile">Profile</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm px-2 py-1 bg-yellow-100 rounded">Testnet</span>
          {/* WalletConnect component will be rendered here */}
        </div>
      </div>
    </header>
  );
}
