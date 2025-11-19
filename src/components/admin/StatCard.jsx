"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const StatCard = ({ title, value, change, icon: Icon, trend }) => {
  return (
    <Card className="border border-border/50 bg-white hover:border-border hover:shadow-md transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-lg bg-[#E0B74F] flex items-center justify-center">
            <Icon className="h-5 w-5 text-[#0B0B0D]" strokeWidth={2} />
          </div>
          {change && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
              trend === "up" 
                ? "bg-[#2ECC71]/10 text-[#2ECC71]" 
                : "bg-[#E74C3C]/10 text-[#E74C3C]"
            }`}>
              {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-[#0B0B0D]">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
};

