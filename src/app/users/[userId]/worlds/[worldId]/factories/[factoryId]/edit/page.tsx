import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// This would normally come from an API call based on the factoryId
const mockFactory = { 
  id: "1", 
  name: "Iron Processing", 
  description: "Processes iron ore into iron ingots", 
  location: "North Plains",
  inputs: [{ id: "1", itemName: "Iron Ore", rate: 120 }],
  outputs: [{ id: "1", itemName: "Iron Ingot", rate: 60 }],
};

export default function EditFactoryPage({ params }: { params: { userId: string, worldId: string, factoryId: string } }) {
  const { userId, worldId, factoryId } = params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/users/${userId}/worlds/${worldId}/factories/${factoryId}`} className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Factory</h1>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Factory Information</CardTitle>
            <CardDescription>Edit the details for this factory.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input id="name" defaultValue={mockFactory.name} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Input id="description" defaultValue={mockFactory.description} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location
                  </label>
                  <Input id="location" defaultValue={mockFactory.location} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Inputs</h3>
                {mockFactory.inputs.map((input, index) => (
                  <div key={input.id} className="grid grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <label htmlFor={`input-item-${index}`} className="text-sm font-medium">
                        Item
                      </label>
                      <Input id={`input-item-${index}`} defaultValue={input.itemName} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={`input-rate-${index}`} className="text-sm font-medium">
                        Rate (per min)
                      </label>
                      <Input id={`input-rate-${index}`} type="number" defaultValue={input.rate.toString()} />
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" className="w-full" type="button">Remove</Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" type="button" className="w-full mt-2">Add Input</Button>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Outputs</h3>
                {mockFactory.outputs.map((output, index) => (
                  <div key={output.id} className="grid grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <label htmlFor={`output-item-${index}`} className="text-sm font-medium">
                        Item
                      </label>
                      <Input id={`output-item-${index}`} defaultValue={output.itemName} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={`output-rate-${index}`} className="text-sm font-medium">
                        Rate (per min)
                      </label>
                      <Input id={`output-rate-${index}`} type="number" defaultValue={output.rate.toString()} />
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" className="w-full" type="button">Remove</Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" type="button" className="w-full mt-2">Add Output</Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href={`/users/${userId}/worlds/${worldId}/factories/${factoryId}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 