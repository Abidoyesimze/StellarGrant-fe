/**
 * Milestone List Page
 * 
 * Shows all milestones for a grant with their status and progress.
 */

interface MilestonesPageProps {
  params: {
    id: string;
  };
}

export default function MilestonesPage({ params }: MilestonesPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Milestones - Grant #{params.id}</h1>
      {/* Milestone list will be implemented here */}
    </div>
  );
}
