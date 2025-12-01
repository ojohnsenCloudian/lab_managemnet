import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminGuidesPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/guides");
  }

  const guides = await db.labGuide.findMany({
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Lab Guides</h1>
        <Link href="/admin/guides/new">
          <Button>Create New Guide</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <Card key={guide.id}>
            <CardHeader>
              <CardTitle>{guide.title}</CardTitle>
              <CardDescription>
                {guide.isPublished ? "Published" : "Draft"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Created by {guide.createdBy.name || guide.createdBy.email}
              </div>
              <Link href={`/admin/guides/${guide.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      {guides.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No lab guides yet. Create your first one!
        </div>
      )}
    </div>
  );
}
