import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Activity,
  Pill,
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  HeartHandshake,
  Clock,
  LucideIcon,
} from "lucide-react";

const STAT_ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  Pill,
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  HeartHandshake,
  Clock,
};

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  iconName: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  subtitle?: string;
}

export function DashboardStatCard({
  label,
  value,
  change,
  trend,
  iconName,
  variant = "default",
  subtitle,
}: DashboardStatCardProps) {
  const IconComponent = STAT_ICON_MAP[iconName] || Activity;

  const variantStyles = {
    default: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      iconBg: "bg-teal-50 text-teal-700",
    },
    success: {
      bg: "bg-emerald-50/50",
      text: "text-emerald-900",
      border: "border-emerald-200",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    warning: {
      bg: "bg-amber-50/50",
      text: "text-amber-900",
      border: "border-amber-200",
      iconBg: "bg-amber-100 text-amber-700",
    },
    danger: {
      bg: "bg-red-50/50",
      text: "text-red-900",
      border: "border-red-200",
      iconBg: "bg-red-100 text-red-700",
    },
    info: {
      bg: "bg-blue-50/50",
      text: "text-blue-900",
      border: "border-blue-200",
      iconBg: "bg-blue-100 text-blue-700",
    },
  };

  const style = variantStyles[variant];

  return (
    <Card className={cn("overflow-hidden border", style.border)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              style.iconBg
            )}
          >
            <IconComponent className="h-6 w-6" />
          </div>
        </div>

        {(change || subtitle) && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            {change && (
              <span
                className={cn(
                  "font-semibold",
                  trend === "up" && "text-emerald-700",
                  trend === "down" && "text-red-700",
                  trend === "neutral" && "text-slate-600"
                )}
              >
                {change}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-500">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
