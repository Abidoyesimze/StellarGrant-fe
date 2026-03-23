/**
 * Create Grant Page
 * 
 * Multi-step form for creating a new grant on-chain.
 * Wallet connection required.
 * 
 * Form steps:
 * 1. Basic Info - title, description, category
 * 2. Budget - funding token, target amount, platform fee
 * 3. Timeline - start date, deadline
 * 4. Milestones - dynamic list of milestone titles and proof types
 * 5. Reviewers - add reviewer Stellar addresses (min 1, max 7)
 * 6. Review & Sign - summary card + Freighter signing prompt
 */

export default function CreateGrantPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Grant</h1>
      {/* Multi-step grant creation form will be implemented here */}
    </div>
  );
}
