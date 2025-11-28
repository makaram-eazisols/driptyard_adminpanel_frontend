"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Edit2, Trash2, Loader2, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [editUser, setEditUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("user-edit");
  const [permissionsForm, setPermissionsForm] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Check manage users permission
  const canManageUsers = user?.is_admin || user?.permissions?.can_manage_users === true;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAdminUsers({
        page: currentPage,
        page_size: 10,
        search: searchTerm || undefined,
        exclude_admins: true,
      });
      // Filter out admins and moderators on client side
      const customerUsers = (data.users || []).filter((user) => !user.is_admin && !user.is_moderator && user.role !== "admin" && user.role !== "moderator");
      setUsers(customerUsers);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || customerUsers.length || 0);
      setPageSize(data.page_size || 10);
    } catch (error) {
      notifyError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (user) => {
    setEditUser({ ...user });
    setIsEditDialogOpen(true);
    setActiveTab("user-edit");
    setPermissionsForm(null);
    
    // Load permissions if user is a moderator
    if (user.is_moderator || user.role === "moderator") {
      setPermissionsLoading(true);
      try {
        const data = await apiClient.getModeratorPermissions(user.id || user.user_id);
        setPermissionsForm(data);
      } catch (error) {
        console.error("Failed to load user permissions:", error);
        setPermissionsForm(null);
      } finally {
        setPermissionsLoading(false);
      }
    }
  };

  const handleSaveUser = async () => {
    if (!editUser) return;

    try {
      setEditLoading(true);
      await apiClient.updateAdminUser(editUser.id, {
        first_name: editUser.first_name,
        last_name: editUser.last_name,
        email: editUser.email,
        username: editUser.username,
        is_active: editUser.is_active,
        is_verified: editUser.is_verified,
      });
      notifySuccess("User has been updated");
      setIsEditDialogOpen(false);
      setEditUser(null);
      setActiveTab("user-edit");
      fetchUsers();
    } catch (error) {
      notifyError("Failed to update user");
    } finally {
      setEditLoading(false);
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
    if (!editUser || !permissionsForm) return;
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
        editUser.id || editUser.user_id,
        payload,
      );
      notifySuccess("Permissions updated successfully");
      setIsEditDialogOpen(false);
      setEditUser(null);
      setActiveTab("user-edit");
      setPermissionsForm(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update permissions:", error);
      notifyError(error.response?.data?.detail || "Failed to update permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      await apiClient.deleteAdminUser(deleteUserId);
      notifySuccess("User has been deleted");
      setDeleteUserId(null);
      fetchUsers();
    } catch (error) {
      notifyError("Failed to delete user");
    }
  };

  const getStatusBadgeVariant = (user) => {
    const isHealthy = !user.is_banned && user.is_active && user.is_verified;
    return isHealthy ? "success" : "destructive";
  };

  const getStatusText = (user) => {
    if (user.is_banned) return "Banned";
    if (!user.is_active) return "Inactive";
    if (!user.is_verified) return "Unverified";
    return "Active";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage customer accounts and permissions</p>
          </div>
          <div className="relative w-full max-w-sm md:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              className="pl-10 bg-background"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
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
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No customers found</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="h-12 px-4 font-semibold text-secondary">User Name</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Email</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Status</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Joined</TableHead>
                      {canManageUsers && (
                        <TableHead className="h-12 px-4 text-right font-semibold text-secondary">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3 px-4">
                          <p className="font-semibold text-sm text-primary leading-tight">{user?.username || "Unknown User"}</p>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-sm text-foreground">{user.email}</p>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant={getStatusBadgeVariant(user)} className="text-xs">{getStatusText(user)}</Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-sm text-foreground">{format(new Date(user.created_at), "MMM dd, yyyy")}</p>
                        </TableCell>
                        {canManageUsers && (
                          <TableCell className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditUser(user)}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive cursor-pointer focus:text-destructive"
                                  onClick={() => setDeleteUserId(user.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
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
                          : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)}`}
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
      </div>

      {/* Edit User Dialog */}
      {canManageUsers && (
        <Dialog 
          open={isEditDialogOpen} 
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setActiveTab("user-edit");
              setEditUser(null);
              setPermissionsForm(null);
            }
          }}
        >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user-edit">User Edit</TabsTrigger>
                <TabsTrigger value="permissions" disabled={!editUser.is_moderator && editUser.role !== "moderator"}>
                  Permissions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="user-edit" className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      value={editUser.first_name || ""}
                      onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      value={editUser.last_name || ""}
                      onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={editUser.username || ""}
                      onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={editUser.email || ""} disabled />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-active">Active</Label>
                  <Switch
                    id="is-active"
                    checked={!!editUser.is_active}
                    onCheckedChange={(checked) => setEditUser({ ...editUser, is_active: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-verified">Verified</Label>
                  <Switch
                    id="is-verified"
                    checked={!!editUser.is_verified}
                    onCheckedChange={(checked) => setEditUser({ ...editUser, is_verified: checked })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditUser(null);
                      setActiveTab("user-edit");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveUser} className="gradient-driptyard-hover text-white" disabled={editLoading}>
                    {editLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4 py-4">
                {permissionsLoading ? (
                  <div className="space-y-2 py-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !permissionsForm ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No permissions found for this user.
                  </p>
                ) : (
                  <div className="space-y-4">
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
                        onClick={() => {
                          setIsEditDialogOpen(false);
                          setEditUser(null);
                          setActiveTab("user-edit");
                        }}
                        disabled={savingPermissions}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSavePermissions} disabled={savingPermissions} className="gradient-driptyard-hover text-white">
                        {savingPermissions && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {savingPermissions ? "Saving..." : "Save Permissions"}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {canManageUsers && (
        <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      )}
    </AdminLayout>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <Users />
    </ProtectedRoute>
  );
}
