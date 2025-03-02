import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// This would normally come from an API call based on the userId
const mockUser = { id: "1", name: "John Doe", email: "john@example.com" };

export default function NewWorldPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/users/${userId}/worlds`} className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New World for {mockUser.name}</h1>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>World Information</CardTitle>
            <CardDescription>Enter the details for the new world.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input id="name" placeholder="Enter world name" />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input id="description" placeholder="Enter world description" />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href={`/users/${userId}/worlds`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button>Create World</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 