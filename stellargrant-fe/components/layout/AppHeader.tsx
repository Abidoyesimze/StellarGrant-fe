"use client";

import Link from "next/link";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { WalletConnect } from "@/components/wallet/WalletConnect";

export function AppHeader() {
  return (
    <header className="border-b border-border-color bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-orbitron text-lg font-bold text-text-primary hover:text-accent-primary transition-colors"
          >
            StellarGrants
          </Link>
          <nav className="hidden sm:flex gap-4 font-mono text-sm">
            <Link href="/grants" className="text-text-muted hover:text-accent-secondary transition-colors">
              Explore
            </Link>
            <Link
              href="/grants/create"
              className="text-text-muted hover:text-accent-secondary transition-colors"
            >
              Create
            </Link>
            <Link href="/profile" className="text-text-muted hover:text-accent-secondary transition-colors">
              Profile
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider px-2 py-1 border border-warning/40 text-warning">
            Testnet
          </span>
          <NotificationBell />
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
