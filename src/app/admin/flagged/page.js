"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { apiClient } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

function FlaggedContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [priceSort, setPriceSort] = useState("none");
  const [reportCountSort, setReportCountSort] = useState("none");
  const [showFilters, setShowFilters] = useState(false);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActions, setLoadingActions] = useState({});
  const [viewItem, setViewItem] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [viewUserLoading, setViewUserLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [bulkApproveDialog, setBulkApproveDialog] = useState(false);
  const [bulkRejectDialog, setBulkRejectDialog] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Check if user can manage flagged content
  const canManageFlaggedContent =
    user?.is_admin || user?.permissions?.can_manage_flagged_content === true;

  const STATUS_SUCCESS_STATES = ["resolved", "approved", "cleared"];

  useEffect(() => {
    fetchFlaggedContent();
    // Clear selection when filters change
    setSelectedItems(new Set());
  }, [currentPage, searchTerm, priceSort, reportCountSort]);

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

  const applySorting = (items) => {
    // If no sorting is selected, return items as-is
    if (priceSort === "none" && reportCountSort === "none") {
      return items;
    }

    let sortedItems = [...items];

    // Apply sorting based on priority: price first, then report count
    sortedItems.sort((a, b) => {
      // Primary sort: Price
      if (priceSort === "low-to-high") {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        if (priceA !== priceB) {
          return priceA - priceB;
        }
      } else if (priceSort === "high-to-low") {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        if (priceA !== priceB) {
          return priceB - priceA;
        }
      }

      // Secondary sort: Report Count (applies when prices are equal or price sort is not active)
      if (reportCountSort === "low-to-high") {
        const countA = a.reportCount || 0;
        const countB = b.reportCount || 0;
        return countA - countB;
      } else if (reportCountSort === "high-to-low") {
        const countA = a.reportCount || 0;
        const countB = b.reportCount || 0;
        return countB - countA;
      }

      return 0;
    });

    return sortedItems;
  };

  const fetchFlaggedContent = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
      };

      const data = await apiClient.getAdminReports(params);
      let items = data.reports || [];
      
      const normalizedItems = items.map(normalizeFlaggedItem);
      const sortedItems = applySorting(normalizedItems);
      setFlaggedContent(sortedItems);
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
    setPriceSort("none");
    setReportCountSort("none");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || priceSort !== "none" || reportCountSort !== "none";

  const getStatusBadgeVariant = (status) => {
    return STATUS_SUCCESS_STATES.includes((status || "").toLowerCase()) ? "success" : "destructive";
  };

  const getUserStatusBadgeVariant = (user) => {
    if (user.is_banned || user.is_suspended || !user.is_active) {
      return "destructive";
    }
    if (!user.is_verified) {
      return "destructive";
    }
    return "success";
  };

  const getUserStatusText = (user) => {
    if (user.is_banned) return "Inactive";
    if (user.is_suspended) return "Suspended";
    if (!user.is_active) return "Inactive";
    if (!user.is_verified) return "Unverified";
    return "Active";
  };

  const handleViewUser = async (userId) => {
    try {
      setViewUserLoading(true);
      setIsViewUserDialogOpen(true);
      const userDetails = await apiClient.getUserDetails(userId);
      setViewUser(userDetails);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      notifyError(error.response?.data?.detail || "Failed to load user details");
      setIsViewUserDialogOpen(false);
    } finally {
      setViewUserLoading(false);
    }
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

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(new Set(flaggedContent.map((item) => item.reportId)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (reportId, checked) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(reportId);
    } else {
      newSelected.delete(reportId);
    }
    setSelectedItems(newSelected);
  };

  const isAllSelected = flaggedContent.length > 0 && selectedItems.size === flaggedContent.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < flaggedContent.length;

  // Bulk action handlers
  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) return;

    setBulkActionLoading(true);
    try {
      const reportIds = Array.from(selectedItems).map(id => parseInt(id, 10));
      const response = await apiClient.bulkApproveReports(reportIds);
      notifySuccess(response.message || `${selectedItems.size} report(s) approved successfully`);
      setSelectedItems(new Set());
      setBulkApproveDialog(false);
      fetchFlaggedContent();
    } catch (error) {
      console.error("Failed to approve reports:", error);
      notifyError(error.response?.data?.detail || "Failed to approve reports");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedItems.size === 0) return;

    setBulkActionLoading(true);
    try {
      const reportIds = Array.from(selectedItems).map(id => parseInt(id, 10));
      const response = await apiClient.bulkRejectReports(reportIds);
      notifySuccess(response.message || `${selectedItems.size} report(s) rejected successfully`);
      setSelectedItems(new Set());
      setBulkRejectDialog(false);
      fetchFlaggedContent();
    } catch (error) {
      console.error("Failed to reject reports:", error);
      notifyError(error.response?.data?.detail || "Failed to reject reports");
    } finally {
      setBulkActionLoading(false);
    }
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
                  {[searchTerm, priceSort !== "none" ? "price" : null, reportCountSort !== "none" ? "reports" : null].filter(Boolean).length}
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
                <Label htmlFor="priceSort">Sort by Price</Label>
                <Select value={priceSort} onValueChange={(value) => {
                  setPriceSort(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="priceSort">
                    <SelectValue placeholder="No sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No sorting</SelectItem>
                    <SelectItem value="low-to-high">Low to High</SelectItem>
                    <SelectItem value="high-to-low">High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 w-full md:w-auto md:min-w-[200px]">
                <Label htmlFor="reportCountSort">Sort by Reports</Label>
                <Select value={reportCountSort} onValueChange={(value) => {
                  setReportCountSort(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="reportCountSort">
                    <SelectValue placeholder="No sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No sorting</SelectItem>
                    <SelectItem value="low-to-high">Low to High</SelectItem>
                    <SelectItem value="high-to-low">High to Low</SelectItem>
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
            {/* Bulk Action Toolbar */}
            {canManageFlaggedContent && selectedItems.size > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">
                    {selectedItems.size} item(s) selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkApproveDialog(true)}
                    disabled={bulkActionLoading}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkRejectDialog(true)}
                    disabled={bulkActionLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItems(new Set())}
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
                    {canManageFlaggedContent && (
                      <TableHead className="h-12 px-4 w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[100px]">Thumbnail</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[250px]">Title</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[100px]">Price</TableHead>
                    <TableHead className="h-12 px-4 font-semibold text-secondary max-w-[100px]">Reports</TableHead>
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

                    const productId = item.productId;
                    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://driptyard.vercel.app";
                    // Ensure proper URL construction with /products/ path
                    let baseUrl = websiteUrl.endsWith('/') ? websiteUrl.slice(0, -1) : websiteUrl;
                    if (!baseUrl.endsWith('/products')) {
                      baseUrl = `${baseUrl}/products`;
                    }
                    const productUrl = productId ? `${baseUrl}/${productId}` : null;
                    
                    const handleRowClick = () => {
                      if (productUrl) {
                        window.open(productUrl, "_blank");
                      }
                    };

                    return (
                      <TableRow 
                        key={item.id} 
                        className={`hover:bg-muted/30 transition-colors ${productUrl ? "cursor-pointer" : ""}`}
                        onDoubleClick={productUrl ? handleRowClick : undefined}
                      >
                        {canManageFlaggedContent && (
                          <TableCell className="py-3 px-4">
                            <Checkbox
                              checked={selectedItems.has(item.reportId)}
                              onCheckedChange={(checked) => handleSelectItem(item.reportId, checked)}
                            />
                          </TableCell>
                        )}
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
                          {productUrl ? (
                            <a 
                              href={productUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-semibold text-sm text-primary leading-tight break-words hover:text-accent transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(productUrl, "_blank");
                              }}
                            >
                              {item.title}
                            </a>
                          ) : (
                            <p className="font-semibold text-sm text-primary leading-tight break-words">{item.title}</p>
                          )}
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

                {/* All Reports Table */}
                {viewItem.all_reports && viewItem.all_reports.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <Label className="text-base font-semibold text-secondary">All Reported Users</Label>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="h-12 px-4 font-semibold text-secondary">Username</TableHead>
                            <TableHead className="h-12 px-4 font-semibold text-secondary">Email</TableHead>
                            <TableHead className="h-12 px-4 font-semibold text-secondary">Reason</TableHead>
                            <TableHead className="h-12 px-4 font-semibold text-secondary">Status</TableHead>
                            <TableHead className="h-12 px-4 font-semibold text-secondary">Created At</TableHead>
                            <TableHead className="h-12 px-4 font-semibold text-secondary">Updated At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewItem.all_reports.map((report) => (
                            <TableRow key={report.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="py-3 px-4">
                                <p 
                                  className="text-sm font-medium text-primary hover:text-accent transition-colors cursor-pointer"
                                  onClick={() => handleViewUser(report.user_id)}
                                  title="Click to view user details"
                                >
                                  {report.user_username || "N/A"}
                                </p>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <p className="text-sm text-foreground">{report.user_email || "N/A"}</p>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <p className="text-sm text-foreground break-words max-w-[200px]">
                                  {report.reason || "No reason provided"}
                                </p>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <Badge 
                                  variant={getStatusBadgeVariant(report.status)} 
                                  className="capitalize text-xs"
                                >
                                  {report.status || "N/A"}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <p className="text-sm text-foreground">
                                  {report.created_at ? formatDateTime(report.created_at) : "N/A"}
                                </p>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <p className="text-sm text-foreground">
                                  {report.updated_at ? formatDateTime(report.updated_at) : "N/A"}
                                </p>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

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

        {/* Bulk Approve Dialog */}
        {canManageFlaggedContent && (
          <AlertDialog open={bulkApproveDialog} onOpenChange={setBulkApproveDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve {selectedItems.size} Report(s)?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will approve {selectedItems.size} selected report(s) and mark them as resolved. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={bulkActionLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkApprove}
                  className="bg-green-600 text-white hover:bg-green-700"
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Approve Reports
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Bulk Reject Dialog */}
        {canManageFlaggedContent && (
          <AlertDialog open={bulkRejectDialog} onOpenChange={setBulkRejectDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject {selectedItems.size} Report(s)?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reject {selectedItems.size} selected report(s). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={bulkActionLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkReject}
                  className="bg-red-600 text-white hover:bg-red-700"
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Reject Reports
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* View User Details Dialog */}
        <Dialog open={isViewUserDialogOpen} onOpenChange={setIsViewUserDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {viewUserLoading ? (
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
                    <Badge variant={getUserStatusBadgeVariant(viewUser)} className="text-xs w-fit">
                      {getUserStatusText(viewUser)}
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
                    onClick={() => setIsViewUserDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewUserDialogOpen(false);
                      router.push("/admin/users");
                    }}
                    className="gradient-driptyard-hover text-white"
                  >
                    View in Customers Page
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No user data available</p>
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
