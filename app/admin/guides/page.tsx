import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { DeleteGuideButton } from "./delete-button";

export default async function AdminGuidesPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/guides");
  }

  const guides = await db.labGuide.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Lab Guides</h1>
        <Link href="/admin/guides/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Guide
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {guides.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No lab guides yet. Create your first guide to get started.
            </CardContent>
          </Card>
        ) : (
          guides.map((guide) => (
            <Card key={guide.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{guide.title}</CardTitle>
                    <CardDescription>
                      Created by {guide.createdBy.name || guide.createdBy.email} on{" "}
                      {new Date(guide.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/guides/${guide.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteGuideButton guideId={guide.id} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {guide.description || "No description"}
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className={guide.isPublished ? "text-green-600" : "text-muted-foreground"}>
                    {guide.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

