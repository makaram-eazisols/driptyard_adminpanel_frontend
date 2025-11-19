"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, CheckCircle, XCircle } from "lucide-react";

// Mock data
const mockAppeals = [
  {
    id: "1",
    productTitle: "Nike Air Max 270",
    seller: "john.doe@example.com",
    reason: "Product was authentic but rejected",
    submittedDate: "2024-01-15",
    status: "pending",
    originalRejectionReason: "Suspected counterfeit",
    evidence: "Receipt from authorized retailer attached"
  },
  {
    id: "2",
    productTitle: "Adidas Yeezy Boost",
    seller: "jane.smith@example.com",
    reason: "Misidentified as replica",
    submittedDate: "2024-01-14",
    status: "pending",
    originalRejectionReason: "Authentication failed",
    evidence: "Certificate of authenticity provided"
  },
];

function Appeals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectReasons, setRejectReasons] = useState({});

  const handleApprove = (id) => {
    console.log("Approving appeal:", id);
    // TODO: Call API
  };

  const handleReject = (id) => {
    console.log("Rejecting appeal:", id, "Reason:", rejectReasons[id]);
    // TODO: Call API
    setRejectReasons({ ...rejectReasons, [id]: "" });
  };

  const handleRejectReasonChange = (id, value) => {
    setRejectReasons({ ...rejectReasons, [id]: value });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0B0B0D]">
            Authentication Appeals
          </h1>
          <p className="text-muted-foreground">Review listing rejection appeals</p>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search appeals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid gap-4">
          {mockAppeals.map((appeal) => (
            <Card key={appeal.id}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{appeal.productTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      Seller: {appeal.seller}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {appeal.submittedDate}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {appeal.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Original Rejection:</p>
                    <p className="text-sm text-muted-foreground">{appeal.originalRejectionReason}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Appeal Reason:</p>
                    <p className="text-sm text-muted-foreground">{appeal.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Evidence:</p>
                    <p className="text-sm text-muted-foreground">{appeal.evidence}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add rejection reason (optional)..."
                    value={rejectReasons[appeal.id] || ""}
                    onChange={(e) => handleRejectReasonChange(appeal.id, e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="gradient-driptyard-hover text-white"
                      onClick={() => handleApprove(appeal.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Restore Listing
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(appeal.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Appeal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AppealsPage() {
  return (
    <ProtectedRoute>
      <Appeals />
    </ProtectedRoute>
  );
}
