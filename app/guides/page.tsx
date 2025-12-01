import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { db } from "@/src/lib/db";
import { LogOut } from "lucide-react";

export default async function GuidesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const guides = await db.labGuide.findMany({
    where: {
      isPublished: true,
    },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Lab Management</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {session.user.isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  Admin
                </Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Published Lab Guides</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Link key={guide.id} href={`/guides/${guide.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{guide.title}</CardTitle>
                  <CardDescription>
                    {guide.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Created by {guide.createdBy.name || "Unknown"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {guides.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No published lab guides available.
          </div>
        )}
      </main>
    </div>
  );
}
