import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// This would normally come from an API call based on the userId
const mockUser = { id: "1", name: "John Doe", email: "john@example.com" };
const mockWorlds = [
  { id: "1", name: "Desert World", description: "A desert-themed factory world", factoryCount: 3 },
  { id: "2", name: "Forest World", description: "A forest-themed factory world", factoryCount: 2 },
  { id: "3", name: "Mountain World", description: "A mountain-themed factory world", factoryCount: 1 },
];

export default function UserWorldsPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/users" className="mr-4">
          <Button variant="outline" size="sm">
            Back to Users
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{mockUser.name}'s Worlds</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your Satisfactory game worlds and track your progress.
          </p>
        </div>
        <Link href={`/users/${userId}/worlds/new`}>
          <Button>Create New World</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockWorlds.map((world) => (
          <Card key={world.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{world.name}</CardTitle>
              <CardDescription>{world.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {world.factoryCount} {world.factoryCount === 1 ? "factory" : "factories"}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/users/${userId}/worlds/${world.id}`}>
                <Button variant="outline">View Details</Button>
              </Link>
              <Link href={`/users/${userId}/worlds/${world.id}/factories`}>
                <Button>View Factories</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 