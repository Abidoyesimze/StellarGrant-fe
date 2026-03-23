/**
 * Grant Detail Page
 * 
 * Full grant page showing metadata, funding progress, milestone list,
 * reviewer panel, and event history.
 */

interface GrantDetailPageProps {
  params: {
    id: string;
  };
}

export default function GrantDetailPage({ params }: GrantDetailPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Grant #{params.id}</h1>
      {/* Grant detail view will be implemented here */}
    </div>
  );
}
