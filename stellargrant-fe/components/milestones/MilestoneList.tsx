/**
 * MilestoneList Component
 * 
 * Ordered list of milestones with status indicators.
 * Clicking a milestone navigates to its detail page.
 */

interface Milestone {
  idx: number;
  title: string;
  status: string;
  submitted: boolean;
  approved: boolean;
}

interface MilestoneListProps {
  milestones: Milestone[];
  grantId: string;
}

export function MilestoneList({ milestones, grantId }: MilestoneListProps) {
  // TODO: Implement milestone list component
  return (
    <div className="space-y-4">
      {milestones.map((milestone) => (
        <div key={milestone.idx} className="border rounded p-4">
          <h4 className="font-semibold">{milestone.title}</h4>
          {/* Milestone list item will be implemented here */}
        </div>
      ))}
    </div>
  );
}
