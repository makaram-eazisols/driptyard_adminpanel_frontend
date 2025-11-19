"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const orders = [
  { id: "ORD001", customer: "John Doe", email: "john@example.com", date: "2025-01-10", total: "$1,299", status: "completed" },
  { id: "ORD002", customer: "Jane Smith", email: "jane@example.com", date: "2025-01-10", total: "$89", status: "pending" },
  { id: "ORD003", customer: "Mike Johnson", email: "mike@example.com", date: "2025-01-09", total: "$159", status: "processing" },
  { id: "ORD004", customer: "Sarah Williams", email: "sarah@example.com", date: "2025-01-09", total: "$449", status: "completed" },
  { id: "ORD005", customer: "Tom Brown", email: "tom@example.com", date: "2025-01-08", total: "$199", status: "pending" },
  { id: "ORD006", customer: "Emma Davis", email: "emma@example.com", date: "2025-01-08", total: "$329", status: "shipped" },
  { id: "ORD007", customer: "Chris Wilson", email: "chris@example.com", date: "2025-01-07", total: "$599", status: "completed" },
];

function Orders() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0B0B0D]">Orders</h1>
          <p className="text-muted-foreground mt-1">Track and manage customer orders</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search orders..." className="pl-10 bg-background" />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="text-muted-foreground">{order.email}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell className="font-semibold">{order.total}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "completed"
                            ? "default"
                            : order.status === "pending"
                            ? "secondary"
                            : order.status === "shipped"
                            ? "outline"
                            : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <Orders />
    </ProtectedRoute>
  );
}
