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
          created_at: r.created_at,
          reporter_id: r.reporter_id,
          reporter_email: r.reporter_email,
          target: r.product_id ? `Product #${r.product_id}` : "Product",
        }),
      );

      (data.order_reports || []).forEach((r) =>
        flatten.push({
          id: `order-${r.id}`,
          rawId: r.id,
          type: "order",
          status: r.status,
          reason: r.reason,
          created_at: r.created_at,
          reporter_id: r.reporter_id,
          target: r.order_id ? `Order #${r.order_id}` : "Order",
        }),
      );

      (data.general_reports || []).forEach((r) =>
        flatten.push({
          id: `general-${r.id}`,
          rawId: r.id,
          type: "general",
          status: r.status,
          reason: r.reason,
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
          created_at: r.created_at,
          reporter_id: r.reporter_id,
          target: r.reported_user_id ? `User #${r.reported_user_id}` : "User",
        }),
      );

      (data.conversation_reports || []).forEach((r) =>
        flatten.push({
          id: `conversation-${r.id}`,
          rawId: r.id,
          type: "conversation",
          status: r.status,
          reason: r.reason,
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
                            {r.reporter_email && <span>{r.reporter_email}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm break-words">{r.reason || "—"}</span>
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

