import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TerminalComponent } from "@/components/terminal/terminal-component";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
      sshConfigs: true,
    },
  });

  if (!guide) {
    redirect("/guides");
  }

  if (!guide.isPublished && !session.user.isAdmin) {
    redirect("/guides");
  }

  let steps: string[] = [];
  try {
    steps = JSON.parse(guide.steps || "[]");
  } catch {
    steps = [];
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link href="/guides">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Guides
          </Button>
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">{guide.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {guide.description && (
              <p className="text-muted-foreground mb-4">{guide.description}</p>
            )}
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: guide.content }}
            />
          </CardContent>
        </Card>

        {steps.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                {steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {guide.sshConfigs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">SSH Terminal</h2>
            {guide.sshConfigs.map((config) => (
              <div key={config.id}>
                <h3 className="text-lg font-semibold mb-2">{config.name}</h3>
                <TerminalComponent credentialId={config.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
