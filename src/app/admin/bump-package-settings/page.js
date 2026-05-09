"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Settings } from "@/app/admin/settings/page";

export default function BumpPackageSettingsPage() {
  return (
    <ProtectedRoute>
      <Settings defaultTab="bump-package-settings" />
    </ProtectedRoute>
  );
}
