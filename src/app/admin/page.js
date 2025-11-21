"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Users2, Package2, TrendingUp, Star, AlertCircle, Flag } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const SUCCESS_ORDER_STATUSES = ["completed", "shipped", "delivered", "paid"];

const recentOrders = [
  { id: "ORD001", customer: "John Doe", product: "Luxury Watch", amount: "$1,299", status: "completed" },
  { id: "ORD002", customer: "Jane Smith", product: "Designer Shirt", amount: "$89", status: "pending" },
  { id: "ORD003", customer: "Mike Johnson", product: "Sneakers", amount: "$159", status: "processing" },
  { id: "ORD004", customer: "Sarah Williams", product: "Handbag", amount: "$449", status: "completed" },
  { id: "ORD005", customer: "Tom Brown", product: "Sunglasses", amount: "$199", status: "pending" },
];

const topProducts = [
  { name: "Luxury Watch Collection", sales: 234, revenue: "$304,866" },
  { name: "Designer Shoes", sales: 189, revenue: "$30,051" },
  { name: "Premium Shirts", sales: 156, revenue: "$13,884" },
  { name: "Fashion Accessories", sales: 142, revenue: "$28,400" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.getAdminStatsOverview();
        setStats(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard statistics",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  const formatChange = (change) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change?.toFixed(1)}%`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* <div>
          <h1 className="text-3xl font-bold text-secondary">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
        </div> */}
        {/* {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-32" />
              </Card>
            ))}
          </div>
        ) : stats ? ( */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats?.total_users?.toString() || "0"}
              change={formatChange(stats?.users_change)}
              icon={Users2}
              trend={stats?.users_change >= 0 ? "up" : "down"}
            />
            <StatCard
              title="Total Products"
              value={stats?.total_products?.toString() || "0"}
              change={formatChange(stats?.products_change)}
              icon={Package2}
              trend={stats?.products_change >= 0 ? "up" : "down"}
            />
            <StatCard
              title="Pending Verifications"
              value={stats?.pending_verifications?.toString() || "0"}
              change="—"
              icon={AlertCircle}
              trend="up"
            />
            <StatCard
              title="Flagged Content"
              value={stats?.flagged_content_count?.toString() || "0"}
              change="—"
              icon={Flag}
              trend="up"
            />
          </div>
        {/* ) : null} */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table className="text-sm text-[hsl(var(--foreground))]">
                <TableHeader>
                    <TableRow className="text-xs font-semibold text-muted-foreground">
                      <TableHead className="p-3 text-xs">Order ID</TableHead>
                      <TableHead className="p-3 text-xs">Customer</TableHead>
                      <TableHead className="p-3 text-xs">Product</TableHead>
                      <TableHead className="p-3 text-xs">Amount</TableHead>
                      <TableHead className="p-3 text-right text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="border-b border-border/80 bg-white last:border-0  hover:bg-muted/60 transition-colors"
                    >
                      <TableCell className="p-3 font-semibold text-[hsl(var(--primary))]">{order.id}</TableCell>
                      <TableCell className="p-3">{order.customer}</TableCell>
                      <TableCell className="p-3">{order.product}</TableCell>
                      <TableCell className="p-3 font-medium text-right">{order.amount}</TableCell>
                      <TableCell className="p-3 text-right">
                        <Badge
                          variant={
                            SUCCESS_ORDER_STATUSES.includes((order.status || "").toLowerCase())
                              ? "success"
                              : "destructive"
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
                Top Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                {topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg gradient-driptyard flex items-center justify-center">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-current text-accent" />
                          {product.sales} sales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{product.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

