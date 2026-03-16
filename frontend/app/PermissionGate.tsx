"use client";

import { ReactNode } from "react";
import { useAuthStore } from "./authStore";

type Role = "admin" | "inventory_manager" | "warehouse_staff" | "viewer" | "staff";

interface PermissionGateProps {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGate({ roles, children, fallback = null }: PermissionGateProps) {
  const { user } = useAuthStore();
  const userRole = (user?.role as Role) || "staff";

  // Admin always has access
  if (userRole === "admin" || roles.includes(userRole)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export function hasPermission(userRole: string | undefined, allowedRoles: Role[]): boolean {
  const role = (userRole as Role) || "staff";
  return role === "admin" || allowedRoles.includes(role);
}
