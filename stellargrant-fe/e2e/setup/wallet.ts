import { Page } from "@playwright/test";

export async function mockWalletConnected(
  page: Page,
  address = "GABC123456789012345678901234567890123456789012345678901234567890"
) {
  await page.addInitScript((addr) => {
    (window as any).freighterApi = {
      isConnected: () => Promise.resolve(true),
      getPublicKey: () => Promise.resolve(addr),
      getNetwork: () => Promise.resolve("testnet"),
      signTransaction: (xdr: string) => Promise.resolve(xdr + "_signed"),
    };
  }, address);
}
