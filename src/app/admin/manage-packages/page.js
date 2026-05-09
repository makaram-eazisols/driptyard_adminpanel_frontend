"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Settings } from "@/app/admin/settings/page";

export default function ManagePackagesPage() {
  return (
    <ProtectedRoute>
      <Settings defaultTab="manage-packages" />
    </ProtectedRoute>
  );
}
