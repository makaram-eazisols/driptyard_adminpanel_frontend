"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flag, Search, CheckCircle, XCircle, Loader2, RotateCcw, Check } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

function FlaggedContent() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActions, setLoadingActions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const STATUS_SUCCESS_STATES = ["resolved", "approved", "cleared"];

  useEffect(() => {
    fetchFlaggedContent();
  }, [currentPage, searchTerm]);

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
    };
  };

  const fetchFlaggedContent = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAdminReports({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
      });
      const items = data.reports || [];
      const normalizedItems = items.map(normalizeFlaggedItem);
      setFlaggedContent(normalizedItems);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to fetch flagged content",
        variant: "destructive",
      });
      setFlaggedContent([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    return STATUS_SUCCESS_STATES.includes((status || "").toLowerCase()) ? "success" : "destructive";
  };

  const handleApprove = async (item) => {
    const actionKey = `approve-${item.reportId}`;
    try {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));
      await apiClient.approveReport(item.reportId);
      toast({
        title: "Success",
        description: "Report has been approved and resolved",
      });
      fetchFlaggedContent();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to approve report",
        variant: "destructive",
      });
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleRemove = async (item) => {
    const actionKey = `remove-${item.reportId}`;
    try {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));
      await apiClient.rejectReport(item.reportId);
      toast({
        title: "Success",
        description: "Report has been rejected",
      });
      fetchFlaggedContent();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to reject report",
        variant: "destructive",
      });
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleReReview = async (item) => {
    const actionKey = `review-${item.reportId}`;
    try {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));
      await apiClient.reviewReport(item.reportId);
      toast({
        title: "Success",
        description: "Report has been reopened for review",
      });
      fetchFlaggedContent();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to reopen report",
        variant: "destructive",
      });
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
          <div className="relative w-full max-w-sm md:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search flagged content..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : flaggedContent.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No flagged content found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flaggedContent.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 hover:border-accent/20">
                  <div className="relative">
                    {item.image && item.image !== "/placeholder.svg" && item.image !== "" ? (
                      <div className="w-full h-48 overflow-hidden bg-muted">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-accent">
                            {item.title
                              .split(" ")
                              .map((word) => word?.[0] || "")
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "FL"}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant={getStatusBadgeVariant(item.status)} className="capitalize shadow-sm">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2 text-secondary line-clamp-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{item.date}</p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="space-y-1">
                          {item.price && (
                            <p className="text-sm font-medium text-secondary">
                              ${item.price}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {item.reportCount || 0} {item.reportCount === 1 ? 'Report' : 'Reports'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        {isPending(item.status) ? (
                          <>
                            <Button
                              size="sm"
                              className="gradient-driptyard-hover text-white flex-1"
                              onClick={() => handleApprove(item)}
                              disabled={loadingActions[`approve-${item.reportId}`]}
                            >
                              {loadingActions[`approve-${item.reportId}`] ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleRemove(item)}
                              disabled={loadingActions[`remove-${item.reportId}`]}
                            >
                              {loadingActions[`remove-${item.reportId}`] ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                              )}
                              Remove
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="gradient-driptyard-hover text-white w-full"
                            onClick={() => handleReReview(item)}
                            disabled={loadingActions[`review-${item.reportId}`]}
                          >
                            {loadingActions[`review-${item.reportId}`] ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Review Again
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
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
