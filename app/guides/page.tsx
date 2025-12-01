import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/lib/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function GuidesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const guides = await db.labGuide.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { name: true },
      },
    },
  });

  type GuideType = (typeof guides)[0];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Lab Guides</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {session.user.isAdmin && (
              <Link href="/admin">
                <Button variant="outline">Admin Dashboard</Button>
              </Link>
            )}
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="ghost">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guides.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No lab guides available yet.
              </CardContent>
            </Card>
          ) : (
            guides.map((guide: GuideType) => (
              <Card key={guide.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {guide.title}
                  </CardTitle>
                  <CardDescription>
                    {guide.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/guides/${guide.id}`}>
                    <Button className="w-full">View Guide</Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

