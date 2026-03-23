/**
 * Milestone Detail Page
 * 
 * Shows a single milestone's submitted proof, vote count, reviewer list,
 * and action buttons (Submit / Approve / Reject) depending on connected wallet role.
 */

interface MilestoneDetailPageProps {
  params: {
    id: string;
    idx: string;
  };
}

export default function MilestoneDetailPage({ params }: MilestoneDetailPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Milestone {params.idx} - Grant #{params.id}
      </h1>
      {/* Milestone detail + vote will be implemented here */}
    </div>
  );
}
