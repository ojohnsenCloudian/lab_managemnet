import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function GuideViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const guide = await db.labGuide.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
      sshConfigs: true,
    },
  });

  if (!guide) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card>
          <CardHeader>
            <CardTitle>Guide Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The guide you're looking for doesn't exist.</p>
            <Link href="/guides">
              <Button className="mt-4">Back to Guides</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/guides">
          <Button variant="ghost" className="mb-4">← Back to Guides</Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{guide.title}</CardTitle>
            {guide.description && (
              <p className="text-muted-foreground">{guide.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: guide.content }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
