"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back!</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Phone: </span>
              <span>{user?.phone}</span>
            </div>
            <div>
              <span className="font-medium">Role: </span>
              <span className="capitalize">{user?.role}</span>
            </div>
            <div>
              <span className="font-medium">Account Created: </span>
              <span>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>What would you like to do?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">
              Dashboard content will be added here...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
