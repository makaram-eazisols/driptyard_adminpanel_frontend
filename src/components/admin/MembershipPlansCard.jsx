"use client";

import { Crown, Users, Star, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const MembershipPlansCard = ({ stats }) => {
  const basicCount = stats?.membership_plan_counts?.basic || 0;
  const premiumCount = stats?.membership_plan_counts?.premium || 0;
  const businessCount = stats?.membership_plan_counts?.business || 0;
  const totalCount = basicCount + premiumCount + businessCount;

  // Calculate percentages for the progress bar
  const basicWidth = totalCount > 0 ? (basicCount / totalCount) * 100 : 33.33;
  const premiumWidth = totalCount > 0 ? (premiumCount / totalCount) * 100 : 33.33;
  const businessWidth = totalCount > 0 ? (businessCount / totalCount) * 100 : 33.34;

  const tiers = [
    {
      name: "BASIC",
      count: basicCount,
      icon: Users,
      bgColor: "bg-[#EBF2FF]",
      textColor: "text-[#2563EB]",
      iconColor: "text-[#2563EB]",
    },
    {
      name: "PREMIUM",
      count: premiumCount,
      icon: Star,
      bgColor: "bg-[#FFF7ED]",
      textColor: "text-[#F97316]",
      iconColor: "text-[#F97316]",
    },
    {
      name: "BUSINESS",
      count: businessCount,
      icon: Briefcase,
      bgColor: "bg-[#F0FDF4]",
      textColor: "text-[#16A34A]",
      iconColor: "text-[#16A34A]",
    },
  ];

  return (
    <Card className="border border-border/50 bg-white hover:border-border hover:shadow-md transition-all duration-200 h-full">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#EBF2FF] flex items-center justify-center flex-shrink-0">
            <Crown className="h-6 w-6 text-[#2563EB]" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#0B0B0D] font-playfair">Membership Plans</h3>
            <p className="text-sm text-muted-foreground font-medium">
              Distribution of users across membership tiers
            </p>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="h-2.5 w-full flex rounded-full overflow-hidden mb-8">
          <div 
            className="h-full bg-[#1F4E79] transition-all duration-500" 
            style={{ width: `${basicWidth}%` }}
          />
          <div 
            className="h-full bg-[#F97316] transition-all duration-500" 
            style={{ width: `${premiumWidth}%` }}
          />
          <div 
            className="h-full bg-[#16A34A] transition-all duration-500" 
            style={{ width: `${businessWidth}%` }}
          />
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {tiers.map((tier) => (
            <div 
              key={tier.name}
              className={`${tier.bgColor} rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 duration-200`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <tier.icon className={`h-4 w-4 ${tier.iconColor}`} strokeWidth={2.5} />
                <span className={`text-[10px] font-bold tracking-wider ${tier.textColor}`}>
                  {tier.name}
                </span>
              </div>
              <span className={`text-3xl font-bold ${tier.textColor}`}>
                {tier.count}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border/50 flex justify-between items-center text-sm">
          <span className="text-muted-foreground font-medium">Total members</span>
          <span className="font-bold text-[#0B0B0D] text-lg">{totalCount || stats?.total_users || 0}</span>
        </div>
      </CardContent>
    </Card>
  );
};
