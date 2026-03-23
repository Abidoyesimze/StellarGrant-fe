/**
 * GrantStatusBadge Component
 * 
 * Color-coded status chip mapping contract state to UI label.
 * 
 * Contract States:
 * - 0 (Pending) -> Gray
 * - 1 (Active) -> Blue
 * - 2 (In Progress) -> Cyan
 * - 3 (Complete) -> Green
 * - 4 (Cancelled) -> Red
 */

interface GrantStatusBadgeProps {
  status: number | string;
}

const statusConfig = {
  0: { label: "Pending", color: "bg-gray-500" },
  1: { label: "Active", color: "bg-blue-500" },
  2: { label: "In Progress", color: "bg-cyan-500" },
  3: { label: "Completed", color: "bg-green-500" },
  4: { label: "Cancelled", color: "bg-red-500" },
};

export function GrantStatusBadge({ status }: GrantStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0];
  
  return (
    <span className={`px-2 py-1 rounded text-white text-sm ${config.color}`}>
      {config.label}
    </span>
  );
}
