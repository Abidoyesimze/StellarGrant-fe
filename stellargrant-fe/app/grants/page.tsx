/**
 * Grant Listing Page
 * 
 * Paginated, filterable list of all grants stored on-chain.
 * 
 * Query Parameters:
 * - status: open | active | completed | cancelled
 * - token: XLM | USDC | all
 * - page: number (pagination)
 * - sort: newest | funded | deadline
 * - q: string (search query)
 */

export default function GrantsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Grants</h1>
      {/* Grant listing will be implemented here */}
    </div>
  );
}
