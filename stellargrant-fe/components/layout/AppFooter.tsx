/**
 * AppFooter Component
 * 
 * Footer with links to GitHub, Drips Wave, Stellar documentation,
 * and protocol contract address.
 */

export function AppFooter() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-2">Resources</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="https://github.com/your-org/stellargrant-fe" className="text-muted-foreground hover:text-foreground">GitHub</a></li>
              <li><a href="https://drips.network/wave/stellar" className="text-muted-foreground hover:text-foreground">Drips Wave</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Documentation</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="https://developers.stellar.org" className="text-muted-foreground hover:text-foreground">Stellar Docs</a></li>
              <li><a href="https://soroban.stellar.org" className="text-muted-foreground hover:text-foreground">Soroban Docs</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Contract</h3>
            <p className="text-sm text-muted-foreground font-mono">
              CXXX...
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
