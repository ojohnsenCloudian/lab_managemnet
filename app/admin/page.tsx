import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Settings, Terminal, Users } from "lucide-react";
import { db } from "@/src/lib/db";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/guides");
  }

  const [guidesCount, usersCount, sshCount] = await Promise.all([
    db.labGuide.count(),
    db.user.count(),
    db.sSHCredential.count(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Lab Guides</CardTitle>
            <CardDescription>Total guides in system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guidesCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Total users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>SSH Credentials</CardTitle>
            <CardDescription>Total SSH credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sshCount}</div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/admin/guides">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Lab Guides
              </CardTitle>
              <CardDescription>Manage lab guides</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/oauth">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                OAuth Settings
              </CardTitle>
              <CardDescription>Configure OAuth provider</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/ssh">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                SSH Credentials
              </CardTitle>
              <CardDescription>Manage SSH credentials</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users
              </CardTitle>
              <CardDescription>View all users</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
