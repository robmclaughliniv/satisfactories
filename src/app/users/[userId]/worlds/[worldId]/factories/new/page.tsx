import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// This would normally come from an API call based on the worldId
const mockWorld = { id: "1", name: "Desert World" };

export default function NewFactoryPage({ params }: { params: { userId: string, worldId: string } }) {
  const { userId, worldId } = params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/users/${userId}/worlds/${worldId}`} className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Factory for {mockWorld.name}</h1>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Factory Information</CardTitle>
            <CardDescription>Enter the details for the new factory.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input id="name" placeholder="Enter factory name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Input id="description" placeholder="Enter factory description" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location
                  </label>
                  <Input id="location" placeholder="Enter factory location" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Inputs</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <label htmlFor="input-item-0" className="text-sm font-medium">
                      Item
                    </label>
                    <Input id="input-item-0" placeholder="Select item" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="input-rate-0" className="text-sm font-medium">
                      Rate (per min)
                    </label>
                    <Input id="input-rate-0" type="number" placeholder="Enter rate" />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full" type="button">Remove</Button>
                  </div>
                </div>
                <Button variant="outline" type="button" className="w-full mt-2">Add Input</Button>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Outputs</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <label htmlFor="output-item-0" className="text-sm font-medium">
                      Item
                    </label>
                    <Input id="output-item-0" placeholder="Select item" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="output-rate-0" className="text-sm font-medium">
                      Rate (per min)
                    </label>
                    <Input id="output-rate-0" type="number" placeholder="Enter rate" />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full" type="button">Remove</Button>
                  </div>
                </div>
                <Button variant="outline" type="button" className="w-full mt-2">Add Output</Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href={`/users/${userId}/worlds/${worldId}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button>Create Factory</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 