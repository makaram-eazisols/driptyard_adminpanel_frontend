"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export const StatCard = ({ title, value, change, icon: Icon, trend, href }) => {
  const router = useRouter();
  
  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };

  const cardContent = (
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
            trend === "up" 
              ? "bg-accent/10 text-accent" 
              : "bg-secondary/10 text-secondary"
          }`}>
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">{title}</p>
        <h3 className="text-3xl font-bold text-primary">{value}</h3>
      </div>
    </CardContent>
  );

  if (href) {
    return (
      <Card 
        className="border border-border/50 bg-white hover:border-border hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={handleClick}
      >
        {cardContent}
      </Card>
    );
  }

  return (
    <Card className="border border-border/50 bg-white hover:border-border hover:shadow-md transition-all duration-200">
      {cardContent}
    </Card>
  );
};

