import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/guides");
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      oauthProvider: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Users</h1>
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle>{user.name || user.email}</CardTitle>
              <CardDescription>
                {user.email} • {user.isAdmin ? "Admin" : "User"} •{" "}
                {user.oauthProvider || "Local"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Joined: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

