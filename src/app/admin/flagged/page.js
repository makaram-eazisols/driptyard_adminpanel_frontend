"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, CheckCircle, XCircle, Loader2, Check, Filter, X, MoreVertical, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/toast";
import { useAuth } from "@/hooks/use-auth";

function FlaggedContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActions, setLoadingActions] = useState({});
  const [viewItem, setViewItem] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Check if user can manage flagged content
  const canManageFlaggedContent =
    user?.is_admin || user?.permissions?.can_manage_flagged_content === true;

  const STATUS_SUCCESS_STATES = ["resolved", "approved", "cleared"];

  useEffect(() => {
    fetchFlaggedContent();
  }, [currentPage, searchTerm, status]);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString.split("T")[0];
    }
  };

  const normalizeFlaggedItem = (item) => {
    return {
      id: item.product_id || item.latest_report_id,
      productId: item.product_id,
      reportId: item.latest_report_id,
      type: "product",
      title: item.product_title || "Untitled Product",
      price: item.product_price,
      flaggedBy: "User", // Not provided in API response
      reason: item.latest_report_reason || "No reason provided",
      date: formatDate(item.latest_report_created_at || item.first_reported_at),
      status: item.latest_report_status || "pending",
      image: item.product_images && item.product_images.length > 0 ? item.product_images[0] : "",
      images: item.product_images || [],
      reportCount: item.report_count || 0,
      isActive: item.product_is_active,
      ownerId: item.product_owner_id,
      // Keep raw data for view modal
      rawData: item,
    };
  };

  const handleViewItem = (item) => {
    setViewItem(item.rawData || item);
    setIsViewDialogOpen(true);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", { 
        year: "numeric", 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  const fetchFlaggedContent = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
      };

      if (status && status !== "all") {
        params.status = status;
      }

      const data = await apiClient.getAdminReports(params);
      let items = data.reports || [];
      
      // Apply client-side status filtering if needed
      if (status === "pending") {
        items = items.filter((item) => (item.latest_report_status || "pending").toLowerCase() === "pending");
      } else if (status === "approved") {
        items = items.filter((item) => (item.latest_report_status || "").toLowerCase() === "approved");
      }
      
      const normalizedItems = items.map(normalizeFlaggedItem);
      setFlaggedContent(normalizedItems);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || normalizedItems.length || 0);
      setPageSize(data.page_size || 10);
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || "Failed to fetch flagged content");
      setFlaggedContent([]);
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
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
  ];

  const hasActiveFilters = searchTerm || (status && status !== "all");

  const getStatusBadgeVariant = (status) => {
    return STATUS_SUCCESS_STATES.includes((status || "").toLowerCase()) ? "success" : "destructive";
  };

  const handleApprove = async (item) => {
    const actionKey = `approve-${item.reportId}`;
    try {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));
      await apiClient.approveReport(item.reportId);
      notifySuccess("Report has been approved and resolved");
      fetchFlaggedContent();
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || "Failed to approve report");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleRemove = async (item) => {
    const actionKey = `remove-${item.reportId}`;
    try {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));
      await apiClient.rejectReport(item.reportId);
      notifySuccess("Report has been rejected");
      fetchFlaggedContent();
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || "Failed to reject report");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleReReview = async (item) => {
    const actionKey = `review-${item.reportId}`;
    try {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));
      await apiClient.reviewReport(item.reportId);
      notifySuccess("Report has been reopened for review");
      fetchFlaggedContent();
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || "Failed to reopen report");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const isPending = (status) => {
    return (status || "").toLowerCase() === "pending";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">
              Flagged Content Queue
            </h1>
            <p className="text-muted-foreground">Review and manage flagged content</p>
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
                  placeholder="Search flagged content..."
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
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : flaggedContent.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No flagged content found</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[100px]">Thumbnail</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[250px]">Title</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[100px]">Price</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[100px]">Reports</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[120px]">Status</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[150px]">Date</TableHead>
                    {canManageFlaggedContent && (
                      <TableHead className="h-12 px-4 text-right font-semibold text-secondary max-w-[100px]">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedContent.map((item) => {
                    const getPrimaryImage = () => {
                      if (item.image && item.image !== "/placeholder.svg" && item.image !== "") {
                        return item.image;
                      }
                      return null;
                    };

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3 px-4 max-w-[100px]">
                          <div className="h-16 w-16 rounded-lg border border-border overflow-hidden bg-muted/50 shadow-sm">
                            {getPrimaryImage() ? (
                              <img
                                src={getPrimaryImage()}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                                No Image
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 max-w-[250px]">
                          <p className="font-semibold text-sm text-primary leading-tight break-words">{item.title}</p>
                        </TableCell>
                        <TableCell className="py-3 px-4 max-w-[100px]">
                          {item.price ? (
                            <p className="font-semibold text-sm text-primary">${item.price}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">—</p>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 max-w-[100px]">
                          <p className="text-sm text-foreground">
                            {item.reportCount || 0} {item.reportCount === 1 ? 'Report' : 'Reports'}
                          </p>
                        </TableCell>
                        <TableCell className="py-3 px-4 max-w-[120px]">
                          <Badge variant={getStatusBadgeVariant(item.status)} className="capitalize text-xs">
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 max-w-[150px]">
                          <p className="text-sm text-foreground">{item.date}</p>
                        </TableCell>
                        {canManageFlaggedContent && (
                          <TableCell className="py-3 px-4 text-right max-w-[100px]">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleViewItem(item)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                {isPending(item.status) ? (
                                  <>
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => handleApprove(item)}
                                      disabled={loadingActions[`approve-${item.reportId}`]}
                                    >
                                      {loadingActions[`approve-${item.reportId}`] ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                      )}
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive cursor-pointer focus:text-destructive"
                                      onClick={() => handleRemove(item)}
                                      disabled={loadingActions[`remove-${item.reportId}`]}
                                    >
                                      {loadingActions[`remove-${item.reportId}`] ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <XCircle className="h-4 w-4 mr-2" />
                                      )}
                                      Remove
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleReReview(item)}
                                    disabled={loadingActions[`review-${item.reportId}`]}
                                  >
                                    {loadingActions[`review-${item.reportId}`] ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4 mr-2" />
                                    )}
                                    Review Again
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
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

        {/* View Flagged Content Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Flagged Content Details</DialogTitle>
            </DialogHeader>
            {viewItem ? (
              <div className="space-y-6 py-4">
                {/* Product Images */}
                {viewItem.product_images && viewItem.product_images.length > 0 && (
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Product Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {viewItem.product_images.map((imageUrl, index) => (
                        <div key={index} className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted/50">
                          <img
                            src={imageUrl}
                            alt={`Product image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Product ID</Label>
                    <p className="text-sm font-medium">{viewItem.product_id || "N/A"}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Product Title</Label>
                    <p className="text-sm font-medium">{viewItem.product_title || "N/A"}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Product Price</Label>
                    <p className="text-sm font-medium">
                      {viewItem.product_price ? `$${viewItem.product_price}` : "N/A"}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Product Owner</Label>
                    <p className="text-sm font-medium">{viewItem.product_owner_username || "N/A"}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Product Status</Label>
                    <Badge variant={viewItem.product_is_active ? "success" : "destructive"} className="text-xs w-fit">
                      {viewItem.product_is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Report Count</Label>
                    <p className="text-sm font-medium">{viewItem.report_count || 0}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Latest Report</Label>
                    <p className="text-sm font-medium">{viewItem.latest_report_user_username || "N/A"}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Report Status</Label>
                    <Badge variant={getStatusBadgeVariant(viewItem.latest_report_status)} className="capitalize text-xs w-fit">
                      {viewItem.latest_report_status || "N/A"}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Report Reason</Label>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg border border-border">
                    {viewItem.latest_report_reason || "No reason provided"}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Latest Report Created At</Label>
                    <p className="text-sm font-medium">
                      {viewItem.latest_report_created_at 
                        ? formatDateTime(viewItem.latest_report_created_at) 
                        : "N/A"}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">First Reported At</Label>
                    <p className="text-sm font-medium">
                      {viewItem.first_reported_at 
                        ? formatDateTime(viewItem.first_reported_at) 
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No data available</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default function FlaggedContentPage() {
  return (
    <ProtectedRoute>
      <FlaggedContent />
    </ProtectedRoute>
  );
}
