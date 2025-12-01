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

  const [guidesCount, usersCount, sshCount, oauthEnabled] = await Promise.all([
    db.labGuide.count(),
    db.user.count(),
    db.sSHCredential.count(),
    db.oAuthProvider.findFirst({ where: { isEnabled: true } }),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Lab Guides
            </CardTitle>
            <CardDescription>Total lab guides</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{guidesCount}</div>
            <Link href="/admin/guides">
              <Button variant="link" className="p-0 mt-2">
                Manage guides →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
            <CardDescription>Total users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usersCount}</div>
            <Link href="/admin/users">
              <Button variant="link" className="p-0 mt-2">
                Manage users →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              SSH Credentials
            </CardTitle>
            <CardDescription>Total SSH credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sshCount}</div>
            <Link href="/admin/ssh">
              <Button variant="link" className="p-0 mt-2">
                Manage credentials →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              OAuth
            </CardTitle>
            <CardDescription>OAuth provider status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {oauthEnabled ? "Enabled" : "Disabled"}
            </div>
            <Link href="/admin/oauth">
              <Button variant="link" className="p-0 mt-2">
                Configure →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
