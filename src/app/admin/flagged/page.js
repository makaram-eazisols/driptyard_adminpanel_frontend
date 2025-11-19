"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flag, Search, CheckCircle, XCircle } from "lucide-react";

// Mock data - will be replaced with API calls
const mockFlaggedContent = [
  {
    id: "1",
    type: "product",
    title: "Vintage Sneakers",
    flaggedBy: "user@example.com",
    reason: "Counterfeit product",
    date: "2024-01-15",
    status: "pending",
    image: "/placeholder.svg"
  },
  {
    id: "2",
    type: "user",
    title: "John Doe Profile",
    flaggedBy: "admin@driptyard.com",
    reason: "Suspicious activity",
    date: "2024-01-14",
    status: "pending",
    image: "/placeholder.svg"
  },
  {
    id: "3",
    type: "product",
    title: "Designer Jacket",
    flaggedBy: "user2@example.com",
    reason: "Inappropriate content",
    date: "2024-01-13",
    status: "pending",
    image: "/placeholder.svg"
  },
];

function FlaggedContent() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleApprove = (id) => {
    console.log("Approving content:", id);
    // TODO: Call API
  };

  const handleRemove = (id) => {
    console.log("Removing content:", id);
    // TODO: Call API
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* <div>
          <h1 className="text-3xl font-bold text-[#0B0B0D]">
            Flagged Content Queue
          </h1>
          <p className="text-muted-foreground">Review and manage flagged content</p>
        </div> */}
        <div className="flex items-center gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search flagged content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="grid gap-4">
          {mockFlaggedContent.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-20 h-20 rounded-lg">
                    {item.image && item.image !== "/placeholder.svg" && item.image !== "" ? (
                      <AvatarImage src={item.image} alt={item.title} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="w-20 h-20 rounded-lg bg-[#E0B74F] text-[#0B0B0D] flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {item.title
                          .split(" ")
                          .map((word) => word?.[0] || "")
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "FL"}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="capitalize">
                            {item.type}
                          </Badge>
                          <span>•</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {item.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Flagged by:</span> {item.flaggedBy}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {item.reason}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="gradient-driptyard-hover text-white"
                        onClick={() => handleApprove(item.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemove(item.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
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

export default function FlaggedContentPage() {
  return (
    <ProtectedRoute>
      <FlaggedContent />
    </ProtectedRoute>
  );
}
