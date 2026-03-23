/**
 * Fund Grant Page
 * 
 * Dedicated funding flow. Lets any address deposit XLM or USDC
 * into a grant's escrow.
 */

interface FundGrantPageProps {
  params: {
    id: string;
  };
}

export default function FundGrantPage({ params }: FundGrantPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Fund Grant #{params.id}</h1>
      {/* Fund grant flow will be implemented here */}
    </div>
  );
}
