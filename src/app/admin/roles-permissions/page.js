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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Edit, ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/toast";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

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
      role: "",
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

  const handleRoleChange = (value) => {
    setCreateUserForm((prev) => ({
      ...prev,
      role: value,
    }));
  };

  const handleCreateUser = async () => {
    // Validation
    if (!createUserForm.email || !createUserForm.password || !createUserForm.username || !phoneValue || !createUserForm.role) {
      notifyError("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createUserForm.email)) {
      notifyError("Please enter a valid email address");
      return;
    }

    // Password validation (minimum 6 characters)
    if (createUserForm.password.length < 6) {
      notifyError("Password must be at least 6 characters long");
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
        is_admin: createUserForm.role === "admin",
        is_moderator: createUserForm.role === "moderator",
        is_customer: createUserForm.role === "customer",
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
        role: "",
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
              <h1 className="text-3xl font-bold text-secondary">Users</h1>
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
          <div className="flex justify-end">
            <Button
              onClick={handleOpenCreateDialog}
              className="gradient-driptyard-hover text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
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
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system with the required information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="create-email">Email *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="user@example.com"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-password">Password *</Label>
                  <Input
                    id="create-password"
                    type="password"
                    placeholder="Enter password"
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="create-username">Username *</Label>
                  <Input
                    id="create-username"
                    placeholder="Enter username"
                    value={createUserForm.username}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-phone">Phone Number *</Label>
                  <div className="[&_.PhoneInputInput]:flex [&_.PhoneInputInput]:h-10 [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded-md [&_.PhoneInputInput]:border [&_.PhoneInputInput]:border-input [&_.PhoneInputInput]:bg-background [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:ring-offset-background [&_.PhoneInputInput]:focus-visible:outline-none [&_.PhoneInputInput]:focus-visible:ring-2 [&_.PhoneInputInput]:focus-visible:ring-ring [&_.PhoneInputInput]:focus-visible:ring-offset-2 [&_.PhoneInputInput]:disabled:cursor-not-allowed [&_.PhoneInputInput]:disabled:opacity-50 [&_.PhoneInputCountry]:mr-2">
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
              <div className="grid gap-2">
                <Label>Role *</Label>
                <RadioGroup
                  value={createUserForm.role}
                  onValueChange={handleRoleChange}
                  className="flex flex-col space-y-2"
                >
                  {/* <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="role-admin" />
                    <Label htmlFor="role-admin" className="font-normal cursor-pointer">
                      Admin
                    </Label>
                  </div> */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderator" id="role-moderator" />
                    <Label htmlFor="role-moderator" className="font-normal cursor-pointer">
                      Moderator
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="role-customer" />
                    <Label htmlFor="role-customer" className="font-normal cursor-pointer">
                      Customer
                    </Label>
                  </div>
                </RadioGroup>
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
                      role: "",
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

