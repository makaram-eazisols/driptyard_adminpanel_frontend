"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/toast";

function RolesAndPermissions() {
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedModerator, setSelectedModerator] = useState(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsForm, setPermissionsForm] = useState(null);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Fetch moderators
  const fetchModerators = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getModerators({
        page: currentPage,
        page_size: pageSize,
        search: searchQuery || undefined,
      });
      const items = response.moderators || [];
      setModerators(items);
      setTotalPages(response.total_pages || 1);
      setTotalCount(response.total || items.length || 0);
      setPageSize(response.page_size || pageSize);
    } catch (error) {
      console.error("Error fetching moderators:", error);
      setModerators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerators();
  }, [currentPage, searchQuery]);

  const openPermissionsDialog = async (moderator) => {
    setSelectedModerator(moderator);
    setPermissionsDialogOpen(true);
    setPermissionsLoading(true);
    setPermissionsForm(null);

    try {
      const data = await apiClient.getModeratorPermissions(moderator.id || moderator.user_id);
      setPermissionsForm(data);
    } catch (error) {
      console.error("Failed to load moderator permissions:", error);
      setPermissionsForm(null);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleTogglePermission = (field) => {
    setPermissionsForm((prev) => {
      const newValue = !prev?.[field];
      const updated = {
        ...prev,
        [field]: newValue,
      };

      // If Read permission is unchecked, uncheck related permissions
      if (field === "can_see_users" && !newValue) {
        updated.can_manage_users = false;
      }
      if (field === "can_see_listings" && !newValue) {
        updated.can_manage_listings = false;
      }
      if (field === "can_see_spotlight_history" && !newValue) {
        updated.can_spotlight = false;
        updated.can_remove_spotlight = false;
      }
      if (field === "can_see_flagged_content" && !newValue) {
        updated.can_manage_flagged_content = false;
      }

      return updated;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedModerator || !permissionsForm) return;
    setSavingPermissions(true);
    try {
      const payload = {
        can_see_dashboard: !!permissionsForm.can_see_dashboard,
        can_see_users: !!permissionsForm.can_see_users,
        can_manage_users: !!permissionsForm.can_manage_users,
        can_see_listings: !!permissionsForm.can_see_listings,
        can_manage_listings: !!permissionsForm.can_manage_listings,
        can_see_spotlight_history: !!permissionsForm.can_see_spotlight_history,
        can_spotlight: !!permissionsForm.can_spotlight,
        can_remove_spotlight: !!permissionsForm.can_remove_spotlight,
        can_see_flagged_content: !!permissionsForm.can_see_flagged_content,
        can_manage_flagged_content: !!permissionsForm.can_manage_flagged_content,
      };

      await apiClient.updateModeratorPermissions(
        selectedModerator.id || selectedModerator.user_id,
        payload,
      );
      notifySuccess("Permissions updated successfully");
      setPermissionsDialogOpen(false);
    } catch (error) {
      console.error("Failed to update permissions:", error);
      notifyError(error.response?.data?.detail || "Failed to update permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Roles & Permissions</h1>
            <p className="text-muted-foreground mt-1">View moderators and their access</p>
          </div>
          <div className="relative w-full max-w-sm md:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search moderators..."
              className="pl-10 bg-background"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : moderators.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No moderators found</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Name</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Email</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Role</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Status</TableHead>
                      <TableHead className="h-12 px-4 text-right font-semibold text-secondary">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moderators.map((moderator) => (
                      <TableRow
                        key={moderator.id || moderator.user_id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="py-3 px-4">
                          <p className="font-semibold text-sm text-primary leading-tight">
                            {moderator.username ||
                              moderator.name ||
                              `${moderator.first_name || ""} ${moderator.last_name || ""}`.trim() ||
                              "N/A"}
                          </p>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-sm text-foreground">{moderator.email}</p>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {moderator.is_moderator ? "Moderator" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge
                            variant={moderator.is_active !== false ? "success" : "destructive"}
                            className="text-xs"
                          >
                            {moderator.is_active !== false ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPermissionsDialog(moderator)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-end mt-8">
                  <div className="inline-flex items-center divide-x divide-border rounded-xl border border-border bg-background shadow-sm">
                    <div className="px-4 py-2 text-sm font-medium">
                      <span className="text-primary">
                        {totalCount === 0
                          ? "0"
                          : `${(currentPage - 1) * pageSize + 1}-${Math.min(
                              currentPage * pageSize,
                              totalCount,
                            )}`}
                      </span>
                      <span className="ml-1 text-muted-foreground">of {totalCount}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
          <DialogContent
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Moderator Permissions</DialogTitle>
              {selectedModerator && (
                <DialogDescription>
                  Permissions for{" "}
                  <span className="font-medium text-primary">
                    {selectedModerator.username ||
                      selectedModerator.name ||
                      selectedModerator.email}
                  </span>
                </DialogDescription>
              )}
            </DialogHeader>

            {permissionsLoading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !permissionsForm ? (
              <p className="text-sm text-muted-foreground py-2">
                No permissions found for this moderator.
              </p>
            ) : (
              <div className="space-y-4 py-2">
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="h-12 px-4 font-semibold text-secondary">
                          Role Name
                        </TableHead>
                        <TableHead className="h-12 px-4 text-center font-semibold text-secondary">
                          Read
                        </TableHead>
                        <TableHead className="h-12 px-4 text-center font-semibold text-secondary">
                          Manage
                        </TableHead>
                        <TableHead className="h-12 px-4 text-center font-semibold text-secondary">
                          Create
                        </TableHead>
                        <TableHead className="h-12 px-4 text-center font-semibold text-secondary">
                          Delete
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Users */}
                      <TableRow className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3 px-4 font-medium text-sm">Users</TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Checkbox
                            checked={!!permissionsForm.can_see_users}
                            onCheckedChange={() => handleTogglePermission("can_see_users")}
                          />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Checkbox
                            checked={!!permissionsForm.can_manage_users}
                            onCheckedChange={() => handleTogglePermission("can_manage_users")}
                            disabled={!permissionsForm.can_see_users}
                          />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <span className="text-muted-foreground">—</span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <span className="text-muted-foreground">—</span>
                        </TableCell>
                      </TableRow>

                      {/* Listings */}
                      <TableRow className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3 px-4 font-medium text-sm">Listings</TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Checkbox
                            checked={!!permissionsForm.can_see_listings}
                            onCheckedChange={() => handleTogglePermission("can_see_listings")}
                          />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Checkbox
                            checked={!!permissionsForm.can_manage_listings}
                            onCheckedChange={() => handleTogglePermission("can_manage_listings")}
                            disabled={!permissionsForm.can_see_listings}
                          />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <span className="text-muted-foreground">—</span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <span className="text-muted-foreground">—</span>
                        </TableCell>
                      </TableRow>

                      {/* Spotlight History */}
                      <TableRow className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3 px-4 font-medium text-sm">
                          Spotlight History
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Checkbox
                            checked={!!permissionsForm.can_see_spotlight_history}
                            onCheckedChange={() =>
                              handleTogglePermission("can_see_spotlight_history")
                            }
                          />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <span className="text-muted-foreground">—</span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Checkbox
                            checked={!!permissionsForm.can_spotlight}
                            onCheckedChange={() => handleTogglePermission("can_spotlight")}
                            disabled={!permissionsForm.can_see_spotlight_history}
                          />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Checkbox
                            checked={!!permissionsForm.can_remove_spotlight}
                            onCheckedChange={() => handleTogglePermission("can_remove_spotlight")}
                            disabled={!permissionsForm.can_see_spotlight_history}
                          />
                        </TableCell>
                      </TableRow>

                      {/* Flagged Content */}
                      <TableRow className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3 px-4 font-medium text-sm">Flagged Content</TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Checkbox
                            checked={!!permissionsForm.can_see_flagged_content}
                            onCheckedChange={() => handleTogglePermission("can_see_flagged_content")}
                          />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Checkbox
                            checked={!!permissionsForm.can_manage_flagged_content}
                            onCheckedChange={() =>
                              handleTogglePermission("can_manage_flagged_content")
                            }
                            disabled={!permissionsForm.can_see_flagged_content}
                          />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <span className="text-muted-foreground">—</span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <span className="text-muted-foreground">—</span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end pt-4 gap-2 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setPermissionsDialogOpen(false)}
                    disabled={savingPermissions}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSavePermissions} disabled={savingPermissions}>
                    {savingPermissions ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default function RolesAndPermissionsPage() {
  return (
    <ProtectedRoute>
      <RolesAndPermissions />
    </ProtectedRoute>
  );
}

