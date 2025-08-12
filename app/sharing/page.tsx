import { SharingDashboard } from "@/components/sharing/sharing-dashboard";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { memo } from "react";

const SharingPage = memo(function SharingPage() {
  return (
    <ErrorBoundary>
      <SharingDashboard />
    </ErrorBoundary>
  );
});

export default SharingPage;
