"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Edit2, Trash2, Loader2, MoreVertical, ChevronLeft, ChevronRight, Filter, X, Eye, Ban, Unlock, KeyRound, EyeOff } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
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
  const [viewUser, setViewUser] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [suspendUserId, setSuspendUserId] = useState(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // Check manage users permission
  const canManageUsers = user?.is_admin || user?.permissions?.can_manage_users === true;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, status]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: 10,
        search: searchTerm || undefined,
        exclude_admins: true,
      };

      if (status && status !== "all") {
        if (status === "active") {
          params.is_active = true;
        } else if (status === "inactive") {
          params.is_active = false;
        }
      }

      const data = await apiClient.getAdminUsers(params);
      // Filter out admins and moderators on client side
      let customerUsers = (data.users || []).filter((user) => !user.is_admin && !user.is_moderator);
      
      // Apply client-side status filtering if needed
      if (status === "active") {
        customerUsers = customerUsers.filter((user) => user.is_active && !user.is_banned && user.is_verified);
      } else if (status === "inactive") {
        customerUsers = customerUsers.filter((user) => !user.is_active || user.is_banned || !user.is_verified);
      }
      
      setUsers(customerUsers);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || customerUsers.length || 0);
      setPageSize(data.page_size || 10);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      notifyError(error.response?.data?.detail || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatus("all");
    setCurrentPage(1);
  };

  const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const hasActiveFilters = searchTerm || (status && status !== "all");

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
      const userId = editUser.id || editUser.user_id;
      await apiClient.updateAdminUser(userId, {
        first_name: editUser.first_name,
        last_name: editUser.last_name,
        email: editUser.email,
        username: editUser.username,
        is_active: editUser.is_active,
        is_verified: editUser.is_verified,
      });
      notifySuccess("User has been updated successfully");
      setIsEditDialogOpen(false);
      setEditUser(null);
      setActiveTab("user-edit");
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || "Failed to update user";
      notifyError(errorMessage);
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
      notifySuccess("User has been permanently deleted");
      setDeleteUserId(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      notifyError(error.response?.data?.detail || "Failed to delete user");
    }
  };

  const handleViewUser = async (user) => {
    try {
      setViewLoading(true);
      setIsViewDialogOpen(true);
      const userId = user.id || user.user_id;
      const userDetails = await apiClient.getUserDetails(userId);
      setViewUser(userDetails);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      notifyError(error.response?.data?.detail || "Failed to load user details");
      setIsViewDialogOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!suspendUserId) return;

    try {
      await apiClient.suspendAdminUser(suspendUserId);
      notifySuccess("User has been suspended. They will be notified via email.");
      setSuspendUserId(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to suspend user:", error);
      notifyError(error.response?.data?.detail || "Failed to suspend user");
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await apiClient.unsuspendAdminUser(userId);
      notifySuccess("User has been reinstated. They will be notified via email.");
      fetchUsers();
    } catch (error) {
      console.error("Failed to unsuspend user:", error);
      notifyError(error.response?.data?.detail || "Failed to reinstate user");
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId) return;

    // Validation
    if (!newPassword || !confirmPassword) {
      notifyError("Please enter and confirm the new password");
      return;
    }

    if (newPassword.length < 6) {
      notifyError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      notifyError("Passwords do not match");
      return;
    }

    try {
      setResetPasswordLoading(true);
      await apiClient.resetUserPassword(resetPasswordUserId, newPassword);
      notifySuccess("Password has been reset. User will be notified via email with their new password.");
      setResetPasswordUserId(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to reset password:", error);
      notifyError(error.response?.data?.detail || "Failed to reset password");
    } finally {
      setResetPasswordLoading(false);
    }
  };


  const getStatusBadgeVariant = (user) => {
    if (user.is_banned || user.is_suspended || !user.is_active) {
      return "destructive";
    }
    if (!user.is_verified) {
      return "destructive";
    }
    return "success";
  };

  const getStatusText = (user) => {
    if (user.is_banned) return "Banned";
    if (user.is_suspended) return "Suspended";
    if (!user.is_active) return "Inactive";
    if (!user.is_verified) return "Unverified";
    return "Active";
  };

  const handleUsernameDoubleClick = (user) => {
    handleViewUser(user);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage customer accounts and permissions</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {[searchTerm, status && status !== "all" ? status : null].filter(Boolean).length}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="rounded-lg border border-border bg-background p-4 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2 w-full md:w-auto md:min-w-[250px]">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => {
                  setStatus(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
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
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Listings</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Status</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Joined</TableHead>
                      {canManageUsers && (
                        <TableHead className="h-12 px-4 text-right font-semibold text-secondary">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3 px-4">
                          <p 
                            className="font-semibold text-sm text-primary leading-tight cursor-pointer hover:text-accent transition-colors"
                            onDoubleClick={() => handleUsernameDoubleClick(user)}
                            title="Double-click to view details"
                          >
                            {user?.username || "Unknown User"}
                          </p>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-sm text-foreground">{user.email}</p>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-sm text-foreground">{user.listings_count || 0}</p>
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
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleViewUser(user)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditUser(user)}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {user.is_suspended ? (
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleUnsuspendUser(user.id)}>
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Reinstate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => setSuspendUserId(user.id)}>
                                    <Ban className="h-4 w-4 mr-2" />
                                    Suspend
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="cursor-pointer" onClick={() => setResetPasswordUserId(user.id)}>
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Reset Password
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
                {/* <div className="flex items-center justify-between">
                  <Label htmlFor="is-active">Active</Label>
                  <Switch
                    id="is-active"
                    checked={!!editUser.is_active}
                    onCheckedChange={(checked) => setEditUser({ ...editUser, is_active: checked })}
                  />
                </div> */}
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
            <AlertDialogTitle>Permanently Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user and all associated data including their listings. This action cannot be undone. The deletion will be recorded in the system logs for auditing purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      )}

      {/* Suspend Confirmation Dialog */}
      {canManageUsers && (
        <AlertDialog open={!!suspendUserId} onOpenChange={() => setSuspendUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend the user's account. They will be notified via email and will not be able to access their account until reinstated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      )}

      {/* Reset Password Dialog */}
      {canManageUsers && (
        <Dialog open={!!resetPasswordUserId} onOpenChange={(open) => {
          if (!open) {
            setResetPasswordUserId(null);
            setNewPassword("");
            setConfirmPassword("");
            setShowPassword(false);
            setShowConfirmPassword(false);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={resetPasswordLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={resetPasswordLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={resetPasswordLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={resetPasswordLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                The user will receive an email notification with their new password.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordUserId(null);
                  setNewPassword("");
                  setConfirmPassword("");
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                disabled={resetPasswordLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetPassword}
                className="gradient-driptyard-hover text-white"
                disabled={resetPasswordLoading || !newPassword || !confirmPassword}
              >
                {resetPasswordLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reset Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}


      {/* View User Details Dialog */}
      {canManageUsers && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {viewLoading ? (
              <div className="space-y-4 py-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : viewUser ? (
              <div className="space-y-6 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Username</Label>
                    <p className="text-sm font-medium">{viewUser.username || "N/A"}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium">{viewUser.email || "N/A"}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">First Name</Label>
                    <p className="text-sm font-medium">{viewUser.first_name || "N/A"}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Last Name</Label>
                    <p className="text-sm font-medium">{viewUser.last_name || "N/A"}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="text-sm font-medium">{viewUser.phone || "N/A"}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Listings Count</Label>
                    <p className="text-sm font-medium">{viewUser.listings_count || 0}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant={getStatusBadgeVariant(viewUser)} className="text-xs w-fit">
                      {getStatusText(viewUser)}
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Verified</Label>
                    <Badge variant={viewUser.is_verified ? "success" : "destructive"} className="text-xs w-fit">
                      {viewUser.is_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Joined Date</Label>
                    <p className="text-sm font-medium">
                      {viewUser.created_at ? format(new Date(viewUser.created_at), "MMM dd, yyyy HH:mm") : "N/A"}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p className="text-sm font-medium">
                      {viewUser.updated_at ? format(new Date(viewUser.updated_at), "MMM dd, yyyy HH:mm") : "N/A"}
                    </p>
                  </div>
                </div>
                {viewUser.bio && (
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Bio</Label>
                    <p className="text-sm">{viewUser.bio}</p>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditUser(viewUser);
                    }}
                    className="gradient-driptyard-hover text-white"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No user data available</p>
            )}
          </DialogContent>
        </Dialog>
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
