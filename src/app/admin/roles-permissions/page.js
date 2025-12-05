"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, ChevronLeft, ChevronRight, Loader2, Plus, Filter, X, Eye, Ban, Unlock, KeyRound, Trash2, MoreVertical, EyeOff, Edit2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/toast";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

function RolesAndPermissions() {
  const { user } = useAuth();
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedModerator, setSelectedModerator] = useState(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsForm, setPermissionsForm] = useState(null);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState("user-edit");
  const [editUser, setEditUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    email: "",
    password: "",
    username: "",
    phone: "",
    country_code: "",
    role: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [viewUser, setViewUser] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [suspendUserId, setSuspendUserId] = useState(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [selectedModerators, setSelectedModerators] = useState(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState("active");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Fetch moderators
  const fetchModerators = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
        search: searchQuery || undefined,
      };

      if (status && status !== "all") {
        if (status === "active") {
          params.is_active = true;
        } else if (status === "inactive") {
          params.is_active = false;
        }
      }

      const response = await apiClient.getModerators(params);
      let items = response.moderators || [];
      
      // Apply client-side status filtering if needed
      if (status === "active") {
        items = items.filter((moderator) => moderator.is_active !== false);
      } else if (status === "inactive") {
        items = items.filter((moderator) => moderator.is_active === false);
      }
      
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

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatus("all");
    setCurrentPage(1);
  };

  const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const hasActiveFilters = searchQuery || (status && status !== "all");

  useEffect(() => {
    fetchModerators();
    // Clear selection when filters change
    setSelectedModerators(new Set());
  }, [currentPage, searchQuery, status]);

  const openPermissionsDialog = async (moderator) => {
    setSelectedModerator(moderator);
    setEditUser({ ...moderator });
    setPermissionsDialogOpen(true);
    setActiveTab("user-edit");
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

  const handleEditUser = async (moderator) => {
    await openPermissionsDialog(moderator);
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

  const handleSaveUser = async () => {
    if (!editUser) return;

    // Username validation (only letters, numbers, underscores, and hyphens)
    if (editUser.username) {
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(editUser.username)) {
        notifyError("Username can only contain letters, numbers, underscores, and hyphens");
        return;
      }
    }

    try {
      setEditLoading(true);
      await apiClient.updateAdminUser(editUser.id || editUser.user_id, {
        first_name: editUser.first_name,
        last_name: editUser.last_name,
        email: editUser.email,
        username: editUser.username,
        is_active: editUser.is_active,
        is_verified: editUser.is_verified,
      });
      notifySuccess("User has been updated");
      setPermissionsDialogOpen(false);
      setActiveTab("user-edit");
      setSelectedModerator(null);
      setEditUser(null);
      setPermissionsForm(null);
      fetchModerators();
    } catch (error) {
      notifyError("Failed to update user");
    } finally {
      setEditLoading(false);
    }
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
      setActiveTab("user-edit");
      setSelectedModerator(null);
      setEditUser(null);
      setPermissionsForm(null);
      fetchModerators();
    } catch (error) {
      console.error("Failed to update permissions:", error);
      notifyError(error.response?.data?.detail || "Failed to update permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
    setCreateUserForm({
      email: "",
      password: "",
      username: "",
      phone: "",
      country_code: "",
      role: "moderator", // Default to moderator
    });
    setPhoneValue("");
  };

  const handlePhoneChange = (value) => {
    setPhoneValue(value || "");
    if (value) {
      try {
        // Extract country code from phone value (format: +1234567890 or +1 234567890)
        let extractedCountryCode = "";
        let phoneNumber = value;
        
        // Remove spaces and extract country code
        const cleanValue = value.replace(/\s/g, "");
        const match = cleanValue.match(/^\+(\d{1,3})/);
        if (match) {
          extractedCountryCode = match[1];
          // Remove country code from phone number
          phoneNumber = cleanValue.substring(match[0].length);
        }

        setCreateUserForm((prev) => ({
          ...prev,
          phone: phoneNumber || value,
          country_code: extractedCountryCode,
        }));
      } catch (error) {
        setCreateUserForm((prev) => ({
          ...prev,
          phone: value || "",
        }));
      }
    } else {
      setCreateUserForm((prev) => ({
        ...prev,
        phone: "",
        country_code: "",
      }));
    }
  };

  // Check manage users permission
  const canManageUsers = user?.is_admin || user?.permissions?.can_manage_users === true;

  const handleViewUser = async (moderator) => {
    try {
      setViewLoading(true);
      setIsViewDialogOpen(true);
      const userId = moderator.id || moderator.user_id;
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
      fetchModerators();
    } catch (error) {
      console.error("Failed to suspend user:", error);
      notifyError(error.response?.data?.detail || "Failed to suspend user");
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await apiClient.unsuspendAdminUser(userId);
      notifySuccess("User has been reinstated. They will be notified via email.");
      fetchModerators();
    } catch (error) {
      console.error("Failed to unsuspend user:", error);
      notifyError(error.response?.data?.detail || "Failed to reinstate user");
    }
  };

  const handleReinstateUser = async (moderator) => {
    const userId = moderator.id || moderator.user_id;
    
    try {
      // If user is suspended, unsuspend them
      if (moderator.is_suspended) {
        await apiClient.unsuspendAdminUser(userId);
        notifySuccess("User has been reinstated. They will be notified via email.");
      } 
      // If user is inactive, activate them
      else if (!moderator.is_active) {
        await apiClient.updateAdminUser(userId, {
          is_active: true,
        });
        notifySuccess("User has been activated successfully.");
      }
      fetchModerators();
    } catch (error) {
      console.error("Failed to reinstate user:", error);
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

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      await apiClient.deleteAdminUser(deleteUserId);
      notifySuccess("User has been permanently deleted");
      setDeleteUserId(null);
      fetchModerators();
    } catch (error) {
      console.error("Failed to delete user:", error);
      notifyError(error.response?.data?.detail || "Failed to delete user");
    }
  };

  const getStatusBadgeVariant = (moderator) => {
    if (moderator.is_banned || moderator.is_suspended || !moderator.is_active) {
      return "destructive";
    }
    return "success";
  };

  const getStatusText = (moderator) => {
    if (moderator.is_banned) return "Banned";
    if (moderator.is_suspended) return "Suspended";
    if (!moderator.is_active) return "Inactive";
    return "Active";
  };

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedModerators(new Set(moderators.map((m) => m.id || m.user_id)));
    } else {
      setSelectedModerators(new Set());
    }
  };

  const handleSelectModerator = (moderatorId, checked) => {
    const newSelected = new Set(selectedModerators);
    if (checked) {
      newSelected.add(moderatorId);
    } else {
      newSelected.delete(moderatorId);
    }
    setSelectedModerators(newSelected);
  };

  const isAllSelected = moderators.length > 0 && selectedModerators.size === moderators.length;
  const isIndeterminate = selectedModerators.size > 0 && selectedModerators.size < moderators.length;

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (selectedModerators.size === 0) return;

    setBulkActionLoading(true);
    try {
      const moderatorIds = Array.from(selectedModerators).map(id => parseInt(id, 10));
      const response = await apiClient.bulkDeleteUsers(moderatorIds);
      notifySuccess(response.message || `${selectedModerators.size} moderator(s) deleted successfully`);
      setSelectedModerators(new Set());
      setBulkDeleteDialog(false);
      fetchModerators();
    } catch (error) {
      console.error("Failed to delete moderators:", error);
      notifyError(error.response?.data?.detail || "Failed to delete moderators");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedModerators.size === 0) return;

    setBulkActionLoading(true);
    try {
      const moderatorIds = Array.from(selectedModerators).map(id => parseInt(id, 10));
      const isActive = bulkStatusValue === "active";
      const response = await apiClient.bulkUpdateUserStatus(moderatorIds, isActive);
      notifySuccess(response.message || `${selectedModerators.size} moderator(s) status updated successfully`);
      setSelectedModerators(new Set());
      setBulkStatusDialog(false);
      fetchModerators();
    } catch (error) {
      console.error("Failed to update moderator status:", error);
      notifyError(error.response?.data?.detail || "Failed to update moderator status");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleCreateUser = async () => {
    // Validation
    if (!createUserForm.email || !createUserForm.password || !createUserForm.username || !phoneValue) {
      notifyError("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createUserForm.email)) {
      notifyError("Please enter a valid email address");
      return;
    }

    // Username validation (only letters, numbers, underscores, and hyphens)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(createUserForm.username)) {
      notifyError("Username can only contain letters, numbers, underscores, and hyphens");
      return;
    }

    // Standard password validation
    if (createUserForm.password.length < 8) {
      notifyError("Password must be at least 8 characters long");
      return;
    }
    if (!/[A-Z]/.test(createUserForm.password)) {
      notifyError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(createUserForm.password)) {
      notifyError("Password must contain at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(createUserForm.password)) {
      notifyError("Password must contain at least one number");
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(createUserForm.password)) {
      notifyError("Password must contain at least one special character");
      return;
    }

    // Use country code from form state (already extracted in handlePhoneChange)
    const countryCode = createUserForm.country_code;

    setCreateLoading(true);
    try {
      const payload = {
        email: createUserForm.email,
        password: createUserForm.password,
        username: createUserForm.username,
        phone: phoneValue,
        country_code: countryCode || createUserForm.country_code,
        is_admin: false,
        is_moderator: true, // Always moderator for this page
        is_customer: false,
      };

      await apiClient.createAdminUser(payload);
      notifySuccess("User created successfully");
      setIsCreateDialogOpen(false);
      setCreateUserForm({
        email: "",
        password: "",
        username: "",
        phone: "",
        country_code: "",
        role: "moderator",
      });
      setPhoneValue("");
      fetchModerators();
    } catch (error) {
      console.error("Failed to create user:", error);
      notifyError(error.response?.data?.detail || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-2">
          <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary">Moderators</h1>
              <p className="text-muted-foreground mt-1">View moderators and their access</p>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {[searchQuery, status && status !== "all" ? status : null].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
              <Button
                onClick={handleOpenCreateDialog}
                className="gradient-driptyard-hover text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
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
                    placeholder="Search moderators..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
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
              {/* Bulk Action Toolbar */}
              {canManageUsers && selectedModerators.size > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">
                      {selectedModerators.size} moderator(s) selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkStatusDialog(true)}
                      disabled={bulkActionLoading}
                    >
                      Change Status
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBulkDeleteDialog(true)}
                      disabled={bulkActionLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedModerators(new Set())}
                      disabled={bulkActionLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      {canManageUsers && (
                        <TableHead className="h-12 px-4 w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Name</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Email</TableHead>
                      {/* <TableHead className="h-12 px-4 font-semibold text-secondary">Role</TableHead> */}
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Status</TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-secondary">Joined</TableHead>
                      {canManageUsers && (
                        <TableHead className="h-12 px-4 text-right font-semibold text-secondary">
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moderators.map((moderator) => (
                      <TableRow
                        key={moderator.id || moderator.user_id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {canManageUsers && (
                          <TableCell className="py-3 px-4">
                            <Checkbox
                              checked={selectedModerators.has(moderator.id || moderator.user_id)}
                              onCheckedChange={(checked) => handleSelectModerator(moderator.id || moderator.user_id, checked)}
                            />
                          </TableCell>
                        )}
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
                        {/* <TableCell className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {moderator.is_moderator ? "Moderator" : "User"}
                          </Badge>
                        </TableCell> */}
                        <TableCell className="py-3 px-4">
                          <Badge variant={getStatusBadgeVariant(moderator)} className="text-xs">
                            {getStatusText(moderator)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-sm text-foreground">
                            {moderator.created_at ? format(new Date(moderator.created_at), "MMM dd, yyyy") : "N/A"}
                          </p>
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
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleViewUser(moderator)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditUser(moderator)}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {moderator.is_suspended || !moderator.is_active ? (
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleReinstateUser(moderator)}>
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Reinstate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => setSuspendUserId(moderator.id || moderator.user_id)}>
                                    <Ban className="h-4 w-4 mr-2" />
                                    Suspend
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="cursor-pointer" onClick={() => setResetPasswordUserId(moderator.id || moderator.user_id)}>
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive cursor-pointer focus:text-destructive"
                                  onClick={() => setDeleteUserId(moderator.id || moderator.user_id)}
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

        <Dialog 
          open={permissionsDialogOpen} 
          onOpenChange={(open) => {
            setPermissionsDialogOpen(open);
            if (!open) {
              setActiveTab("user-edit");
              setSelectedModerator(null);
              setEditUser(null);
              setPermissionsForm(null);
            }
          }}
        >
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

            {editUser && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="user-edit">User Edit</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
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
                      <p className="text-xs text-muted-foreground">Only letters, numbers, underscores, and hyphens are allowed</p>
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
                        setPermissionsDialogOpen(false);
                        setActiveTab("user-edit");
                      }}
                      disabled={editLoading}
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
                      No permissions found for this moderator.
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
                            setPermissionsDialogOpen(false);
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

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Create New Moderator</DialogTitle>
              <DialogDescription>Add a new moderator to the system with the required information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-email" className="h-5">Email *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="user@example.com"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                    required
                    className="h-10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-phone" className="h-5">Phone Number *</Label>
                  <div className="h-10 [&_.PhoneInputInput]:flex [&_.PhoneInputInput]:h-10 [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded-md [&_.PhoneInputInput]:border [&_.PhoneInputInput]:border-input [&_.PhoneInputInput]:bg-background [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:ring-offset-background [&_.PhoneInputInput]:focus-visible:outline-none [&_.PhoneInputInput]:focus-visible:ring-2 [&_.PhoneInputInput]:focus-visible:ring-ring [&_.PhoneInputInput]:focus-visible:ring-offset-2 [&_.PhoneInputInput]:disabled:cursor-not-allowed [&_.PhoneInputInput]:disabled:opacity-50 [&_.PhoneInputCountry]:mr-2 [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center">
                    <PhoneInput
                      international
                      defaultCountry="US"
                      value={phoneValue}
                      onChange={handlePhoneChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-username" className="h-5">Username *</Label>
                  <Input
                    id="create-username"
                    placeholder="Enter username"
                    value={createUserForm.username}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, username: e.target.value })}
                    required
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground h-4">Only letters, numbers, underscores, and hyphens are allowed</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-password" className="h-5">Password *</Label>
                  <div className="relative">
                    <Input
                      id="create-password"
                      type={showCreatePassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={createUserForm.password}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                      required
                      className="pr-10 h-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showCreatePassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground h-4">Must be at least 8 characters with uppercase, lowercase, number, and special character</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setCreateUserForm({
                      email: "",
                      password: "",
                      username: "",
                      phone: "",
                      country_code: "",
                      role: "moderator",
                    });
                    setPhoneValue("");
                  }}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} className="gradient-driptyard-hover text-white" disabled={createLoading}>
                  {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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

        {/* Bulk Delete Dialog */}
        {canManageUsers && (
          <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedModerators.size} Moderator(s)?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {selectedModerators.size} selected moderator(s) and all associated data. This action cannot be undone. The deletion will be recorded in the system logs for auditing purposes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={bulkActionLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Bulk Status Change Dialog */}
        {canManageUsers && (
          <Dialog open={bulkStatusDialog} onOpenChange={setBulkStatusDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Change Status for {selectedModerators.size} Moderator(s)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>New Status</Label>
                  <Select value={bulkStatusValue} onValueChange={setBulkStatusValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setBulkStatusDialog(false)}
                  disabled={bulkActionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkStatusChange}
                  className="gradient-driptyard-hover text-white"
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Status
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
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

