"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter, MoreVertical, CheckCircle, Eye } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TYPE_OPTIONS = [
  { label: "All types", value: "all" },
  { label: "Product", value: "product" },
  { label: "Order", value: "order" },
  { label: "General", value: "general" },
  { label: "User", value: "user" },
  { label: "Conversation", value: "conversation" },
];

function Reports() {
  const [loading, setLoading] = useState(true);
  const [allReports, setAllReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [statusOptions, setStatusOptions] = useState([]);
  const [isConversationDialogOpen, setIsConversationDialogOpen] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversationMeta, setSelectedConversationMeta] = useState(null);
  const [selectedConversationProductName, setSelectedConversationProductName] = useState("");
  const [conversationMessages, setConversationMessages] = useState([]);

  // User-report conversation modal state
  const [isUserConvDialogOpen, setIsUserConvDialogOpen] = useState(false);
  const [userConvLoading, setUserConvLoading] = useState(false);
  const [userConvMessages, setUserConvMessages] = useState([]);
  const [userConvMeta, setUserConvMeta] = useState(null);
  const [userConvReport, setUserConvReport] = useState(null);

  // Product-report conversation modal state
  const [isProductConvDialogOpen, setIsProductConvDialogOpen] = useState(false);
  const [productConvLoading, setProductConvLoading] = useState(false);
  const [productConvMessages, setProductConvMessages] = useState([]);
  const [productConvMeta, setProductConvMeta] = useState(null);
  const [productConvReport, setProductConvReport] = useState(null);

  // Order-report conversation modal state
  const [isOrderConvDialogOpen, setIsOrderConvDialogOpen] = useState(false);
  const [orderConvLoading, setOrderConvLoading] = useState(false);
  const [orderConvMessages, setOrderConvMessages] = useState([]);
  const [orderConvMeta, setOrderConvMeta] = useState(null);
  const [orderConvReport, setOrderConvReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAdminAllReports();

      const flatten = [];

      (data.product_reports || []).forEach((r) =>
        flatten.push({
          id: `product-${r.id}`,
          rawId: r.id,
          type: "product",
          status: r.status,
          reason: r.reason,
          description: r.description,
          created_at: r.created_at,
          reporter_id: r.reporter_id,
          reporter_email: r.reporter_email,
          reporter_username: r.reporter_username,
          product_id: r.product_id,
          product_title: r.product_title,
          owner_id: r.owner_id,
          owner_username: r.owner_username,
          owner_is_suspended: r.owner_is_suspended,
          target: r.product_title
            ? `${r.product_title} (ID: ${r.product_id})`
            : r.product_id
            ? `Product #${r.product_id}`
            : "Product",
        }),
      );

      (data.order_reports || []).forEach((r) =>
        flatten.push({
          id: `order-${r.id}`,
          rawId: r.id,
          type: "order",
          status: r.status,
          reason: r.reason,
          description: r.description,
          created_at: r.created_at,
          reporter_id: r.reporter_id,
          reporter_username: r.reporter_username,
          reporter_email: r.reporter_email,
          order_id: r.order_id,
          order_number: r.order_number,
          buyer_id: r.buyer_id,
          seller_id: r.seller_id,
          other_party_id: r.other_party_id,
          other_party_username: r.other_party_username,
          other_party_role: r.other_party_role,
          other_party_is_suspended: r.other_party_is_suspended,
          target: r.order_number
            ? `Order ${r.order_number}`
            : r.order_id
            ? `Order #${r.order_id}`
            : "Order",
        }),
      );

      (data.general_reports || []).forEach((r) =>
        flatten.push({
          id: `general-${r.id}`,
          rawId: r.id,
          type: "general",
          status: r.status,
          reason: r.reason,
          description: r.description,
          created_at: r.created_at,
          reporter_id: r.reporter_id,
          target: r.target_type && r.target_id ? `${r.target_type} #${r.target_id}` : r.target_type || "General",
        }),
      );

      (data.user_reports || []).forEach((r) =>
        flatten.push({
          id: `user-${r.id}`,
          rawId: r.id,
          type: "user",
          status: r.status,
          reason: r.reason,
          description: r.description,
          created_at: r.created_at,
          reporter_id: r.reporter_id,
          reporter_email: r.reporter_email,
          reporter_username: r.reporter_username,
          reported_user_id: r.reported_user_id,
          reported_user_username: r.reported_user_username,
          reported_user_is_suspended: r.reported_user_is_suspended,
          target: r.reported_user_username
            ? `${r.reported_user_username} (ID: ${r.reported_user_id})`
            : r.reported_user_id
            ? `User #${r.reported_user_id}`
            : "User",
        }),
      );

      (data.conversation_reports || []).forEach((r) =>
        flatten.push({
          id: `conversation-${r.id}`,
          rawId: r.id,
          type: "conversation",
          status: r.status,
          reason: r.reason,
          description: r.description,
          created_at: r.created_at,
          reporter_id: r.reporter_id,
          conversation_id: r.conversation_id,
          target: r.conversation_id ? `Conversation #${r.conversation_id}` : "Conversation",
        }),
      );

      // Sort newest first
      flatten.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      setAllReports(flatten);
      setFilteredReports(flatten);
    } catch (error) {
      console.error("Failed to fetch all reports:", error);
      notifyError(error.response?.data?.detail || error.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const statuses = await apiClient.getReportStatuses();
        setStatusOptions(statuses || []);
      } catch (error) {
        console.error("Failed to load report statuses:", error);
        notifyError(error.response?.data?.detail || error.message || "Failed to load report statuses");
      }
      await fetchReports();
    };
    run();
  }, []);

  useEffect(() => {
    let next = [...allReports];

    if (typeFilter !== "all") {
      next = next.filter((r) => r.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      next = next.filter((r) => {
        return (
          (r.reason || "").toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q) ||
          (r.status || "").toLowerCase().includes(q) ||
          (r.target || "").toLowerCase().includes(q) ||
          String(r.reporter_id || "").toLowerCase().includes(q) ||
          String(r.reporter_email || "").toLowerCase().includes(q)
        );
      });
    }

    setFilteredReports(next);
  }, [allReports, search, typeFilter]);

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  };

  const statusVariant = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "resolved" || s === "completed") return "success";
    if (s === "rejected") return "destructive";
    if (s === "pending" || s === "processing") return "outline";
    return "secondary";
  };

  const openProductReportConversation = async (report) => {
    setProductConvReport(report);
    setIsProductConvDialogOpen(true);
    setProductConvLoading(true);
    setProductConvMessages([]);
    setProductConvMeta(null);
    try {
      const data = await apiClient.getProductReportConversation(report.rawId);
      setProductConvMessages(Array.isArray(data.messages) ? data.messages : []);
      setProductConvMeta({
        conversation_id: data.conversation_id,
        buyer_id: data.buyer_id,
        seller_id: data.seller_id,
        product_id: data.product_id,
        product_title: data.product_title,
        reporter_id: report.reporter_id,
        reporter_username: report.reporter_username,
        owner_id: report.owner_id,
        owner_username: report.owner_username,
      });
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || "Failed to load conversation");
    } finally {
      setProductConvLoading(false);
    }
  };

  const getProductConvParticipantLabel = (senderId) => {
    if (!productConvMeta) return "Participant";
    const sid = Number(senderId);
    if (sid === Number(productConvMeta.reporter_id))
      return productConvMeta.reporter_username
        ? `Reporter (${productConvMeta.reporter_username})`
        : "Reporter";
    if (sid === Number(productConvMeta.owner_id))
      return productConvMeta.owner_username
        ? `Seller (${productConvMeta.owner_username})`
        : "Seller";
    return "Participant";
  };

  const openOrderReportConversation = async (report) => {
    setOrderConvReport(report);
    setIsOrderConvDialogOpen(true);
    setOrderConvLoading(true);
    setOrderConvMessages([]);
    setOrderConvMeta(null);
    try {
      const data = await apiClient.getOrderReportConversation(report.rawId);
      setOrderConvMessages(Array.isArray(data.messages) ? data.messages : []);
      setOrderConvMeta({
        conversation_id: data.conversation_id,
        buyer_id: data.buyer_id,
        seller_id: data.seller_id,
        order_id: data.order_id,
        order_number: data.order_number,
        reporter_id: report.reporter_id,
        reporter_username: report.reporter_username,
        other_party_id: report.other_party_id,
        other_party_username: report.other_party_username,
        other_party_role: report.other_party_role,
      });
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || "Failed to load conversation");
    } finally {
      setOrderConvLoading(false);
    }
  };

  const getOrderConvParticipantLabel = (senderId) => {
    if (!orderConvMeta) return "Participant";
    const sid = Number(senderId);
    if (sid === Number(orderConvMeta.reporter_id)) {
      return orderConvMeta.reporter_username
        ? `Reporter (${orderConvMeta.reporter_username})`
        : "Reporter";
    }
    if (sid === Number(orderConvMeta.other_party_id)) {
      const roleLabel = orderConvMeta.other_party_role
        ? orderConvMeta.other_party_role.charAt(0).toUpperCase() + orderConvMeta.other_party_role.slice(1)
        : "Other Party";
      return orderConvMeta.other_party_username
        ? `${roleLabel} (${orderConvMeta.other_party_username})`
        : roleLabel;
    }
    return "Participant";
  };

  const openUserReportConversation = async (report) => {
    setUserConvReport(report);
    setIsUserConvDialogOpen(true);
    setUserConvLoading(true);
    setUserConvMessages([]);
    setUserConvMeta(null);
    try {
      const data = await apiClient.getUserReportConversation(report.rawId);
      setUserConvMessages(Array.isArray(data.messages) ? data.messages : []);
      setUserConvMeta({
        conversation_id: data.conversation_id,
        buyer_id: data.buyer_id,
        seller_id: data.seller_id,
        reporter_id: report.reporter_id,
        reporter_username: report.reporter_username,
        reported_user_id: report.reported_user_id,
        reported_user_username: report.reported_user_username,
      });
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || "Failed to load conversation");
    } finally {
      setUserConvLoading(false);
    }
  };

  const getUserConvParticipantLabel = (senderId) => {
    if (!userConvMeta) return "Participant";
    const sid = Number(senderId);
    if (sid === Number(userConvMeta.reporter_id))
      return userConvMeta.reporter_username ? `Reporter (${userConvMeta.reporter_username})` : "Reporter";
    if (sid === Number(userConvMeta.reported_user_id))
      return userConvMeta.reported_user_username
        ? `Reported User (${userConvMeta.reported_user_username})`
        : "Reported User";
    return "Participant";
  };

  const handleStatusChange = async (report, statusName) => {
    const key = `status-${report.id}-${statusName}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await apiClient.updateReportStatus(report.type, report.rawId, statusName);
      notifySuccess(`Status updated to '${statusName}'.`);
      await fetchReports();
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || "Failed to update status");
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getConversationMeta = async (conversationId) => {
    try {
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await apiClient.getAdminConversations({
          page,
          page_size: 100,
        });
        const conversations = response?.conversations || [];
        const found = conversations.find((conv) => Number(conv.id) === Number(conversationId));
        if (found) return found;

        const total = Number(response?.total || 0);
        totalPages = Math.max(1, Math.ceil(total / 100));
        page += 1;
      }

      return null;
    } catch {
      return null;
    }
  };

  const openConversationModal = async (report) => {
    const conversationId = report?.conversation_id;
    if (!conversationId) {
      notifyError("Conversation ID is missing for this report.");
      return;
    }

    setSelectedConversationId(conversationId);
    setIsConversationDialogOpen(true);
    setConversationLoading(true);
    setConversationMessages([]);
    setSelectedConversationMeta(null);
    setSelectedConversationProductName("");

    try {
      const [messages, meta] = await Promise.all([
        apiClient.getAdminConversationMessages(conversationId),
        getConversationMeta(conversationId),
      ]);
      setConversationMessages(Array.isArray(messages) ? messages : []);
      setSelectedConversationMeta(meta);

      const productId = meta?.product_id;
      if (productId) {
        try {
          const product = await apiClient.getProduct(productId);
          const productName =
            product?.title || product?.name || product?.product_title || product?.product_name || "";
          setSelectedConversationProductName(productName);
        } catch {
          setSelectedConversationProductName("");
        }
      }
    } catch (error) {
      notifyError(error.response?.data?.detail || error.message || "Failed to load conversation");
    } finally {
      setConversationLoading(false);
    }
  };

  const getParticipantRole = (senderId) => {
    if (!selectedConversationMeta) return "Participant";
    if (Number(senderId) === Number(selectedConversationMeta.seller_id)) return "Seller";
    if (Number(senderId) === Number(selectedConversationMeta.buyer_id)) return "Buyer";
    return "Participant";
  };

  const formatMessageTime = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  };

  const getOfferStatusLabel = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (!normalized) return null;
    if (normalized === "accepted") return "Offer accepted";
    if (normalized === "rejected") return "Offer declined";
    if (normalized === "withdraw" || normalized === "withdrawn") return "Offer withdrawn";
    if (normalized === "pending") return "Offer pending";
    return `Offer ${normalized}`;
  };

  const getConversationProductName = () => {
    if (selectedConversationProductName) return selectedConversationProductName;
    const meta = selectedConversationMeta;
    if (!meta) return "";
    return (
      meta.product_name ||
      meta.product_title ||
      meta.productName ||
      meta.title ||
      meta?.product?.name ||
      meta?.product?.title ||
      ""
    );
  };

  console.log("Testing.....", getConversationProductName());
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">All Reports</h1>
            <p className="text-muted-foreground">
              View every report across the platform (products, orders, users, general issues, conversations).
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="pl-9 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No reports found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created at</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="capitalize">{r.type}</TableCell>
                        <TableCell>{r.target || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            {r.reporter_id && <span>ID: {r.reporter_id}</span>}
                            {r.reporter_username && <span className="font-medium">@{r.reporter_username}</span>}
                            {r.reporter_email && <span className="text-muted-foreground">{r.reporter_email}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm break-words">{r.reason || "—"}</span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm break-words">{r.description || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(r.status)} className="capitalize">
                            {r.status || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(r.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* ── Product reports: fixed 4-option menu ── */}
                              {r.type === "product" ? (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer flex items-center gap-2"
                                    onClick={() => openProductReportConversation(r)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    <span>View Conversation</span>
                                  </DropdownMenuItem>
                                  {[
                                    { label: "Pending", value: "pending" },
                                    { label: "Accepted", value: "approved" },
                                    { label: "Rejected", value: "rejected" },
                                  ].map(({ label, value }) => {
                                    const key = `status-${r.id}-${value}`;
                                    const currentStatus = (r.status || "").toLowerCase();
                                    const isActive = currentStatus === value;
                                    return (
                                      <DropdownMenuItem
                                        key={value}
                                        className="cursor-pointer flex items-center gap-2"
                                        disabled={actionLoading[key]}
                                        onClick={() => handleStatusChange(r, value)}
                                      >
                                        {actionLoading[key] ? (
                                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        ) : isActive ? (
                                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                        ) : (
                                          <span className="h-2 w-2 rounded-full bg-muted-foreground mr-2" />
                                        )}
                                        <span>{label}</span>
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </>
                              ) : /* ── Order reports: fixed 4-option menu ── */
                              r.type === "order" ? (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer flex items-center gap-2"
                                    onClick={() => openOrderReportConversation(r)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    <span>View Conversation</span>
                                  </DropdownMenuItem>
                                  {[
                                    { label: "Pending", value: "pending" },
                                    { label: "Accepted", value: "approved" },
                                    { label: "Rejected", value: "rejected" },
                                  ].map(({ label, value }) => {
                                    const key = `status-${r.id}-${value}`;
                                    const currentStatus = (r.status || "").toLowerCase();
                                    const isActive = currentStatus === value;
                                    return (
                                      <DropdownMenuItem
                                        key={value}
                                        className="cursor-pointer flex items-center gap-2"
                                        disabled={actionLoading[key]}
                                        onClick={() => handleStatusChange(r, value)}
                                      >
                                        {actionLoading[key] ? (
                                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        ) : isActive ? (
                                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                        ) : (
                                          <span className="h-2 w-2 rounded-full bg-muted-foreground mr-2" />
                                        )}
                                        <span>{label}</span>
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </>
                              ) : /* ── User reports: fixed 4-option menu ── */
                              r.type === "user" ? (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer flex items-center gap-2"
                                    onClick={() => openUserReportConversation(r)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    <span>View Conversation</span>
                                  </DropdownMenuItem>
                                  {[
                                    { label: "Pending", value: "pending" },
                                    { label: "Accepted", value: "approved" },
                                    { label: "Rejected", value: "rejected" },
                                  ].map(({ label, value }) => {
                                    const key = `status-${r.id}-${value}`;
                                    const currentStatus = (r.status || "").toLowerCase();
                                    const isActive = currentStatus === value;
                                    return (
                                      <DropdownMenuItem
                                        key={value}
                                        className="cursor-pointer flex items-center gap-2"
                                        disabled={actionLoading[key]}
                                        onClick={() => handleStatusChange(r, value)}
                                      >
                                        {actionLoading[key] ? (
                                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        ) : isActive ? (
                                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                        ) : (
                                          <span className="h-2 w-2 rounded-full bg-muted-foreground mr-2" />
                                        )}
                                        <span>{label}</span>
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </>
                              ) : (
                                /* ── All other report types ── */
                                <>
                                  {r.type === "conversation" && (
                                    <DropdownMenuItem
                                      className="cursor-pointer flex items-center gap-2"
                                      onClick={() => openConversationModal(r)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      <span>View Conversation</span>
                                    </DropdownMenuItem>
                                  )}
                                  {statusOptions.map((opt) => {
                                    if (r.type === "conversation") {
                                      const allowedConversationStatuses = new Set(["pending", "approved", "rejected"]);
                                      if (!allowedConversationStatuses.has(String(opt.status || "").toLowerCase())) {
                                        return null;
                                      }
                                    }
                                    const key = `status-${r.id}-${opt.status}`;
                                    const isActive =
                                      (r.status || "").toLowerCase() === (opt.status || "").toLowerCase();
                                    return (
                                      <DropdownMenuItem
                                        key={opt.id}
                                        className="cursor-pointer flex items-center gap-2"
                                        disabled={actionLoading[key]}
                                        onClick={() => handleStatusChange(r, opt.status)}
                                      >
                                        {actionLoading[key] ? (
                                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        ) : isActive ? (
                                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                        ) : (
                                          <span className="h-2 w-2 rounded-full bg-muted-foreground mr-2" />
                                        )}
                                        <span className="capitalize">{opt.status}</span>
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Product-report conversation modal ── */}
      <Dialog
        open={isProductConvDialogOpen}
        onOpenChange={(open) => {
          setIsProductConvDialogOpen(open);
          if (!open) {
            setProductConvMessages([]);
            setProductConvMeta(null);
            setProductConvReport(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {productConvMeta?.product_title
                ? `Conversation — ${productConvMeta.product_title}`
                : productConvMeta?.conversation_id
                ? `Conversation #${productConvMeta.conversation_id}`
                : "Conversation for Reported Product"}
            </DialogTitle>
            {productConvReport && (
              <p className="text-sm text-muted-foreground mt-1">
                Product:{" "}
                <strong>
                  {productConvReport.product_title
                    ? `${productConvReport.product_title} (ID: ${productConvReport.product_id})`
                    : `#${productConvReport.product_id}`}
                </strong>
                &nbsp;·&nbsp; Reporter:{" "}
                <strong>
                  {productConvReport.reporter_username
                    ? `${productConvReport.reporter_username} (ID: ${productConvReport.reporter_id})`
                    : `ID: ${productConvReport.reporter_id}`}
                </strong>
                &nbsp;·&nbsp; Seller:{" "}
                <strong>
                  {productConvReport.owner_username
                    ? `${productConvReport.owner_username} (ID: ${productConvReport.owner_id})`
                    : `ID: ${productConvReport.owner_id}`}
                </strong>
                {productConvReport.owner_is_suspended && (
                  <span className="ml-2 text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    Suspended
                  </span>
                )}
              </p>
            )}
          </DialogHeader>
          <div className="h-[60vh] overflow-y-auto rounded-md border border-border bg-muted/20 p-4 space-y-3">
            {productConvLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading conversation…</span>
              </div>
            ) : productConvMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No conversation found between the reporter and seller for this product.
              </div>
            ) : (
              productConvMessages.map((msg) => {
                const label = getProductConvParticipantLabel(msg.sender_id);
                const isReporter = label.startsWith("Reporter");
                const bubbleClass = isReporter
                  ? "bg-blue-100 text-blue-900 border-blue-200"
                  : "bg-green-100 text-green-900 border-green-200";
                const alignClass = isReporter ? "justify-end" : "justify-start";
                const messageType = String(msg.message_type || "").toLowerCase();
                const offerStatusLabel =
                  msg.offer_status
                    ? (() => {
                        const n = String(msg.offer_status).toLowerCase();
                        if (n === "accepted") return "Offer accepted";
                        if (n === "rejected") return "Offer declined";
                        if (n === "withdraw" || n === "withdrawn") return "Offer withdrawn";
                        if (n === "pending") return "Offer pending";
                        return `Offer ${n}`;
                      })()
                    : null;

                return (
                  <div key={msg.id} className={`flex ${alignClass}`}>
                    <div className={`max-w-[80%] rounded-xl border px-3 py-2 ${bubbleClass}`}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-wide opacity-80">
                        <span>{label}</span>
                        <span className="normal-case tracking-normal">
                          {msg.created_at
                            ? (() => { try { return new Date(msg.created_at).toLocaleString(); } catch { return String(msg.created_at); } })()
                            : ""}
                        </span>
                      </div>
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {messageType || "text"}
                        </Badge>
                        {offerStatusLabel && (
                          <Badge variant="outline" className="text-[10px]">
                            {offerStatusLabel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content || "—"}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Order-report conversation modal ── */}
      <Dialog
        open={isOrderConvDialogOpen}
        onOpenChange={(open) => {
          setIsOrderConvDialogOpen(open);
          if (!open) {
            setOrderConvMessages([]);
            setOrderConvMeta(null);
            setOrderConvReport(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {orderConvMeta?.conversation_id
                ? `Conversation #${orderConvMeta.conversation_id}`
                : "Conversation for Reported Order"}
            </DialogTitle>
            {orderConvReport && (
              <p className="text-sm text-muted-foreground mt-1">
                Order:{" "}
                <strong>
                  {orderConvReport.order_number
                    ? orderConvReport.order_number
                    : `#${orderConvReport.order_id}`}
                </strong>
                &nbsp;·&nbsp; Reporter:{" "}
                <strong>
                  {orderConvReport.reporter_username
                    ? `${orderConvReport.reporter_username} (ID: ${orderConvReport.reporter_id})`
                    : `ID: ${orderConvReport.reporter_id}`}
                </strong>
                {orderConvReport.other_party_username && (
                  <>
                    &nbsp;·&nbsp; Other Party ({orderConvReport.other_party_role}):{" "}
                    <strong>
                      {orderConvReport.other_party_username} (ID: {orderConvReport.other_party_id})
                    </strong>
                  </>
                )}
                {orderConvReport.other_party_is_suspended && (
                  <span className="ml-2 text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    Suspended
                  </span>
                )}
              </p>
            )}
          </DialogHeader>
          <div className="h-[60vh] overflow-y-auto rounded-md border border-border bg-muted/20 p-4 space-y-3">
            {orderConvLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading conversation…</span>
              </div>
            ) : orderConvMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No conversation found for this order.
              </div>
            ) : (
              orderConvMessages.map((msg) => {
                const label = getOrderConvParticipantLabel(msg.sender_id);
                const isReporter = label.startsWith("Reporter");
                const bubbleClass = isReporter
                  ? "bg-blue-100 text-blue-900 border-blue-200"
                  : "bg-amber-100 text-amber-900 border-amber-200";
                const alignClass = isReporter ? "justify-end" : "justify-start";
                const messageType = String(msg.message_type || "").toLowerCase();

                return (
                  <div key={msg.id} className={`flex ${alignClass}`}>
                    <div className={`max-w-[80%] rounded-xl border px-3 py-2 ${bubbleClass}`}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-wide opacity-80">
                        <span>{label}</span>
                        <span className="normal-case tracking-normal">
                          {msg.created_at
                            ? (() => { try { return new Date(msg.created_at).toLocaleString(); } catch { return String(msg.created_at); } })()
                            : ""}
                        </span>
                      </div>
                      <div className="mb-1">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {messageType || "text"}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content || "—"}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── User-report conversation modal ── */}
      <Dialog
        open={isUserConvDialogOpen}
        onOpenChange={(open) => {
          setIsUserConvDialogOpen(open);
          if (!open) {
            setUserConvMessages([]);
            setUserConvMeta(null);
            setUserConvReport(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {userConvMeta?.conversation_id
                ? `Conversation #${userConvMeta.conversation_id}`
                : "Conversation between Reporter and Reported User"}
            </DialogTitle>
            {userConvReport && (
              <p className="text-sm text-muted-foreground mt-1">
                Reporter:{" "}
                <strong>
                  {userConvReport.reporter_username
                    ? `${userConvReport.reporter_username} (ID: ${userConvReport.reporter_id})`
                    : `ID: ${userConvReport.reporter_id}`}
                </strong>{" "}
                &nbsp;·&nbsp; Reported:{" "}
                <strong>
                  {userConvReport.reported_user_username
                    ? `${userConvReport.reported_user_username} (ID: ${userConvReport.reported_user_id})`
                    : `ID: ${userConvReport.reported_user_id}`}
                </strong>
                {userConvReport.reported_user_is_suspended && (
                  <span className="ml-2 text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    Suspended
                  </span>
                )}
              </p>
            )}
          </DialogHeader>
          <div className="h-[60vh] overflow-y-auto rounded-md border border-border bg-muted/20 p-4 space-y-3">
            {userConvLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading conversation…</span>
              </div>
            ) : userConvMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No conversation found between these two users.
              </div>
            ) : (
              userConvMessages.map((msg) => {
                const label = getUserConvParticipantLabel(msg.sender_id);
                const isReporter = label.startsWith("Reporter");
                const bubbleClass = isReporter
                  ? "bg-blue-100 text-blue-900 border-blue-200"
                  : "bg-amber-100 text-amber-900 border-amber-200";
                const alignClass = isReporter ? "justify-end" : "justify-start";
                const messageType = String(msg.message_type || "").toLowerCase();

                return (
                  <div key={msg.id} className={`flex ${alignClass}`}>
                    <div className={`max-w-[80%] rounded-xl border px-3 py-2 ${bubbleClass}`}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-wide opacity-80">
                        <span>{label}</span>
                        <span className="normal-case tracking-normal">
                          {msg.created_at
                            ? (() => { try { return new Date(msg.created_at).toLocaleString(); } catch { return String(msg.created_at); } })()
                            : ""}
                        </span>
                      </div>
                      <div className="mb-1">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {messageType || "text"}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content || "—"}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Conversation-report conversation modal ── */}
      <Dialog
        open={isConversationDialogOpen}
        onOpenChange={(open) => {
          setIsConversationDialogOpen(open);
          if (!open) {
            setConversationMessages([]);
            setSelectedConversationMeta(null);
            setSelectedConversationId(null);
            setSelectedConversationProductName("");
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {getConversationProductName() || `Conversation #${selectedConversationId || ""}`}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[60vh] overflow-y-auto rounded-md border border-border bg-muted/20 p-4 space-y-3">
            {conversationLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading conversation...</span>
              </div>
            ) : conversationMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No messages found.
              </div>
            ) : (
              conversationMessages.map((msg) => {
                const role = getParticipantRole(msg.sender_id);
                const isSeller = role === "Seller";
                const isBuyer = role === "Buyer";
                const messageType = String(msg.message_type || "").toLowerCase();
                const offerStatusLabel = getOfferStatusLabel(msg.offer_status);
                const bubbleClass = isSeller
                  ? "bg-blue-100 text-blue-900 border-blue-200"
                  : isBuyer
                    ? "bg-green-100 text-green-900 border-green-200"
                    : "bg-background text-foreground border-border";
                const alignClass = isSeller ? "justify-end" : "justify-start";

                return (
                  <div key={msg.id} className={`flex ${alignClass}`}>
                    <div className={`max-w-[80%] rounded-xl border px-3 py-2 ${bubbleClass}`}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-wide opacity-80">
                        <span>{role}</span>
                        <span className="normal-case tracking-normal">{formatMessageTime(msg.created_at)}</span>
                      </div>
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {messageType || "text"}
                        </Badge>
                        {offerStatusLabel && (
                          <Badge variant="outline" className="text-[10px]">
                            {offerStatusLabel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content || "—"}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <Reports />
    </ProtectedRoute>
  );
}

