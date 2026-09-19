/*
 * StatusBadge
 * -----------
 * A tiny reusable component. It takes a status string and renders a colored
 * pill. Splitting small pieces like this out keeps the bigger components
 * readable and is the core idea behind React: build UI from composable parts.
 */

const LABELS = {
  pending: "Pending",
  approved: "Approved",
  running: "Running",
  completed: "Completed",
  denied: "Denied",
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{LABELS[status] || status}</span>;
}
