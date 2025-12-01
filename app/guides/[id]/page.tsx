import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TerminalComponent } from "@/components/terminal/terminal-component";

export default async function GuideViewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const guide = await db.labGuide.findUnique({
    where: { id: params.id },
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

  const steps = guide.steps ? JSON.parse(guide.steps) : [];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/guides">
            <Button variant="ghost">← Back to Guides</Button>
          </Link>
          <form action="/api/auth/signout" method="POST">
            <Button type="submit" variant="ghost">
              Sign Out
            </Button>
          </form>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{guide.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: guide.content }}
                />
              </CardContent>
            </Card>

            {steps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2">
                    {steps.map((step: string, index: number) => (
                      <li key={index} className="text-sm">
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            {guide.sshConfigs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Terminal Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <TerminalComponent credentialId={guide.sshConfigs[0].id} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

