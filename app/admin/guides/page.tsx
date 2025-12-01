import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit } from "lucide-react";
import { db } from "@/src/lib/db";
import { DeleteGuideButton } from "./delete-button";

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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Guide
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <Card key={guide.id}>
            <CardHeader>
              <CardTitle>{guide.title}</CardTitle>
              <CardDescription>
                {guide.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {guide.isPublished ? (
                    <span className="text-green-600">Published</span>
                  ) : (
                    <span className="text-gray-600">Draft</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/guides/${guide.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <DeleteGuideButton guideId={guide.id} />
                </div>
              </div>
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
