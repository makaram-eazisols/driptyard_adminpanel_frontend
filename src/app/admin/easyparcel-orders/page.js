"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { notifyError } from "@/lib/toast";

function EasyparcelOrders() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openRows, setOpenRows] = useState(new Set());

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getEasyparcelShipments();
      const data = Array.isArray(res?.data) ? res.data : [];
      setShipments(data);
    } catch (err) {
      console.error("Failed to fetch Easyparcel shipments:", err);
      setError(err.response?.data?.detail || "Failed to load Easyparcel orders");
      notifyError(err.response?.data?.detail || "Failed to load Easyparcel orders");
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const toggleRow = (shipmentId) => {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(shipmentId)) next.delete(shipmentId);
      else next.add(shipmentId);
      return next;
    });
  };

  const formatDate = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const formatCurrency = (amount, code = "MYR") => {
    if (amount == null || amount === "") return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code || "MYR",
    }).format(Number(amount));
  };

  const rowKey = (s) => s.shipment_number ?? (s.shipment_id != null ? String(s.shipment_id) : "");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Easyparcel Order Details</h1>
            <p className="text-muted-foreground mt-1">
              View all Easyparcel shipments (live data from Easyparcel API)
            </p>
          </div>
          <Button variant="outline" onClick={fetchShipments} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Shipment #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>AWB</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Loading shipments...</p>
                      </TableCell>
                    </TableRow>
                  ) : shipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                        {error ? "Could not load shipments." : "No Easyparcel shipments found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    shipments.map((s) => {
                      const key = rowKey(s);
                      const isOpen = key && openRows.has(key);
                      const courier = s.courier || {};
                      const receiver = s.receiver_details || {};
                      const awb = s.awb_number ?? s.awb;
                      const amount = s.pricing?.price ?? s.total_amount;
                      const currency = s.pricing?.currency_code ?? s.currency_code;
                      const dateVal = s.coll_date ?? s.order_date;
                      const awbLink = s.awb_url ?? s.awb_id_link;
                      return (
                        <React.Fragment key={key}>
                          <TableRow className="align-top">
                            <TableCell className="w-8 p-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleRow(key)}
                              >
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{s.shipment_number ?? ""}</TableCell>
                            <TableCell className="font-mono text-sm">{s.order_number ?? ""}</TableCell>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                              {formatDate(dateVal) ?? ""}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {courier.courier_logo && (
                                  <span className="relative inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-muted text-xs font-medium">
                                    <img
                                      src={courier.courier_logo}
                                      alt=""
                                      className="h-6 w-6 object-contain rounded"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                        const fallback = e.target.nextElementSibling;
                                        if (fallback) fallback.style.display = "inline-flex";
                                      }}
                                    />
                                    <span
                                      className="absolute inset-0 hidden items-center justify-center rounded bg-muted text-xs font-medium"
                                      style={{ display: "none" }}
                                      aria-hidden
                                    >
                                      {(courier.courier_name || courier.courier_short_name || "?")[0]}
                                    </span>
                                  </span>
                                )}
                                <span className="text-sm">{courier.courier_name ?? courier.courier_short_name ?? ""}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {courier.service_type && (
                                <Badge variant="outline" className="text-xs">
                                  {courier.service_type}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">{s.shipment_status ?? ""}</span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{awb ?? ""}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(amount, currency) ?? ""}
                            </TableCell>
                            <TableCell className="text-right">
                              {s.tracking_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a
                                    href={s.tracking_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Track"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          {isOpen && (
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={10} className="p-4">
                                <div className="grid gap-4 md:grid-cols-2 text-sm">
                                  <div>
                                    <h4 className="font-semibold mb-2">Courier</h4>
                                    <div className="space-y-0">
                                      {courier.courier_logo && (
                                        <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
                                          <span className="font-medium text-muted-foreground min-w-[140px]">Logo</span>
                                          <span className="break-words flex-1">
                                            <span className="relative inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-muted text-sm font-medium">
                                              <img
                                                src={courier.courier_logo}
                                                alt=""
                                                className="h-8 w-8 object-contain rounded"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                  e.target.style.display = "none";
                                                  const fallback = e.target.nextElementSibling;
                                                  if (fallback) fallback.style.display = "inline-flex";
                                                }}
                                              />
                                              <span
                                                className="absolute inset-0 hidden items-center justify-center rounded bg-muted text-sm font-medium"
                                                style={{ display: "none" }}
                                                aria-hidden
                                              >
                                                {(courier.courier_name || courier.courier_short_name || "?")[0]}
                                              </span>
                                            </span>
                                          </span>
                                        </div>
                                      )}
                                      {courier.courier_name && (
                                        <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
                                          <span className="font-medium text-muted-foreground min-w-[140px]">Name</span>
                                          <span className="break-words flex-1">{courier.courier_name}</span>
                                        </div>
                                      )}
                                      {courier.service_type && (
                                        <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
                                          <span className="font-medium text-muted-foreground min-w-[140px]">Service type</span>
                                          <span className="break-words flex-1">{courier.service_type}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Tracking</h4>
                                    {s.tracking_url && (
                                      <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
                                        <span className="font-medium text-muted-foreground min-w-[140px]">Tracking URL</span>
                                        <span className="break-words flex-1">
                                          <Button variant="outline" size="sm" asChild>
                                            <a href={s.tracking_url} target="_blank" rel="noreferrer">
                                              Open tracking <ExternalLink className="h-3 w-3 ml-1 inline" />
                                            </a>
                                          </Button>
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 text-sm mt-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Receiver</h4>
                                    <div className="space-y-0">
                                      {[
                                        { label: "Name", value: receiver.name },
                                        { label: "Email", value: receiver.email },
                                        { label: "Contact", value: receiver.contact },
                                        { label: "Alternative contact", value: receiver.alternative_contact },
                                        { label: "Subdivision / State", value: receiver.subdivision_code },
                                        { label: "Postal code", value: receiver.postal_code },
                                        { label: "Country", value: receiver.country },
                                        { label: "Collection date", value: dateVal ? formatDate(dateVal) : null },
                                      ].filter(({ value }) => value != null && value !== "").map(({ label, value }) => (
                                        <div key={label} className="flex flex-wrap gap-2 border-b border-border/50 pb-2 last:border-0">
                                          <span className="font-medium text-muted-foreground min-w-[140px]">{label}</span>
                                          <span className="break-words flex-1">{value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Sender</h4>
                                    {s.sender_details && Object.keys(s.sender_details).length > 0 ? (
                                      <div className="space-y-0">
                                        {Object.entries(s.sender_details)
                                          .filter(([, value]) => value != null && value !== "")
                                          .map(([key, value]) => (
                                            <div key={key} className="flex flex-wrap gap-2 border-b border-border/50 pb-2 last:border-0">
                                              <span className="font-medium text-muted-foreground min-w-[140px]">{key.replace(/_/g, " ")}</span>
                                              <span className="break-words flex-1">{String(value)}</span>
                                            </div>
                                          ))}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                                {s.parcel_items?.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-semibold mb-2">Parcel items</h4>
                                    <ul className="space-y-2">
                                      {s.parcel_items.map((item, i) => (
                                        <li key={i} className="border rounded p-2 bg-background text-sm">
                                          <span className="font-medium">{item.content || "Item"}</span>
                                          <span className="text-muted-foreground ml-2">
                                            {item.weight != null && `${item.weight} kg`}
                                            {item.length != null && item.width != null && item.height != null && ` · ${item.length}×${item.width}×${item.height} cm`}
                                            {item.value != null && ` · ${formatCurrency(item.value, item.currency_code)}`}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {awbLink && (
                                  <div className="mt-3">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={awbLink} target="_blank" rel="noreferrer">
                                        AWB Label <ExternalLink className="h-3 w-3 ml-1 inline" />
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function EasyparcelOrdersPage() {
  return (
    <ProtectedRoute>
      <EasyparcelOrders />
    </ProtectedRoute>
  );
}
