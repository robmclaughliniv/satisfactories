import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// This would normally come from an API call
const mockUsers = [
  { id: "1", name: "John Doe", email: "john@example.com", worldCount: 3 },
  { id: "2", name: "Jane Smith", email: "jane@example.com", worldCount: 2 },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", worldCount: 1 },
];

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <Link href="/users/new">
          <Button>Create New User</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {user.worldCount} {user.worldCount === 1 ? "world" : "worlds"}
              </p>
            </CardContent>
            <CardFooter>
              <Link href={`/users/${user.id}/worlds`} className="w-full">
                <Button variant="outline" className="w-full">View Worlds</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 