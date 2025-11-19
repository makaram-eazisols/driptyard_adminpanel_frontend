"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, CheckCircle, XCircle, DollarSign } from "lucide-react";

// Mock data
const mockPayoutRequests = [
  {
    id: "1",
    seller: "john.doe@example.com",
    amount: "$1,250.00",
    method: "Bank Transfer",
    accountDetails: "****1234",
    requestedDate: "2024-01-15",
    status: "pending",
    salesCount: 15,
    period: "Dec 2023"
  },
  {
    id: "2",
    seller: "jane.smith@example.com",
    amount: "$890.50",
    method: "PayPal",
    accountDetails: "jane****@example.com",
    requestedDate: "2024-01-14",
    status: "pending",
    salesCount: 12,
    period: "Dec 2023"
  },
  {
    id: "3",
    seller: "sneaker.king@example.com",
    amount: "$2,100.00",
    method: "Bank Transfer",
    accountDetails: "****5678",
    requestedDate: "2024-01-13",
    status: "pending",
    salesCount: 23,
    period: "Dec 2023"
  },
];

function Payouts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectReasons, setRejectReasons] = useState({});

  const handleApprovePayout = (id) => {
    console.log("Approving payout:", id);
    // TODO: Call API
  };

  const handleRejectPayout = (id) => {
    console.log("Rejecting payout:", id, "Reason:", rejectReasons[id]);
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
            Payout Requests
          </h1>
          <p className="text-muted-foreground">Review and approve seller payout requests</p>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search payout requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid gap-4">
          {mockPayoutRequests.map((payout) => (
            <Card key={payout.id}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full gradient-driptyard flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{payout.seller}</h3>
                        <p className="text-sm text-muted-foreground">
                          Requested: {payout.requestedDate}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {payout.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold text-primary">{payout.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Method</p>
                    <p className="font-medium">{payout.method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account</p>
                    <p className="font-medium">{payout.accountDetails}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sales Period</p>
                    <p className="font-medium">{payout.period}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{payout.salesCount} sales</Badge>
                </div>
                <div className="space-y-3 pt-2">
                  <Textarea
                    placeholder="Add rejection reason (if applicable)..."
                    value={rejectReasons[payout.id] || ""}
                    onChange={(e) => handleRejectReasonChange(payout.id, e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="gradient-driptyard-hover text-white"
                      onClick={() => handleApprovePayout(payout.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Payout
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectPayout(payout.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
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

export default function PayoutsPage() {
  return (
    <ProtectedRoute>
      <Payouts />
    </ProtectedRoute>
  );
}
