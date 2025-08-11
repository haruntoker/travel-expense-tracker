import { SharingDashboard } from "@/components/sharing/sharing-dashboard";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function SharingPage() {
  return (
    <ErrorBoundary>
      <SharingDashboard />
    </ErrorBoundary>
  );
}
