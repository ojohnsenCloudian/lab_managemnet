import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/src/lib/db";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/guides");
  }

  const users = await db.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Users</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle>{user.name || "Unnamed User"}</CardTitle>
              <CardDescription>{user.email || "No email"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Role: </span>
                  {user.isAdmin ? (
                    <span className="text-red-600">Admin</span>
                  ) : (
                    <span className="text-gray-600">User</span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Provider: </span>
                  {user.oauthProvider || "Credentials"}
                </div>
                <div>
                  <span className="font-medium">Created: </span>
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
