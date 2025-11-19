"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingBag, Users2, Package2 } from "lucide-react";

function Analytics() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-driptyard-text">Analytics</h1>
          <p className="text-muted-foreground">View store performance and key metrics</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="w-10 h-10 rounded-full gradient-driptyard flex items-center justify-center shadow-lg">
                <Users2 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,234</div>
              <p className="text-xs text-muted-foreground">+19% from last month</p>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline">8,450 Buyers</Badge>
                <Badge variant="outline">3,784 Sellers</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <div className="w-10 h-10 rounded-full gradient-driptyard flex items-center justify-center shadow-lg">
                <Package2 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5,847</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline">234 Pending</Badge>
                <Badge variant="outline">89 Flagged</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <div className="w-10 h-10 rounded-full gradient-driptyard flex items-center justify-center shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$284,567</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline">2,350 Orders</Badge>
                <Badge className="bg-green-500">$28,456 Commission</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-80">
            <p className="text-muted-foreground">Chart visualization will be displayed here</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <Analytics />
    </ProtectedRoute>
  );
}
