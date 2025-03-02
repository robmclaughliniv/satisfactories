import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// This would normally come from an API call based on the userId and worldId
const mockUser = { id: "1", name: "John Doe", email: "john@example.com" };
const mockWorld = { 
  id: "1", 
  name: "Desert World", 
  description: "A desert-themed factory world",
  resources: [
    { id: "1", type: "Iron", purity: "Normal", location: "North" },
    { id: "2", type: "Copper", purity: "Pure", location: "East" },
    { id: "3", type: "Coal", purity: "Impure", location: "South" },
  ]
};
const mockFactories = [
  { 
    id: "1", 
    name: "Iron Processing", 
    description: "Processes iron ore into iron ingots", 
    location: "North Plains",
    inputs: [{ id: "1", itemName: "Iron Ore", rate: 120 }],
    outputs: [{ id: "1", itemName: "Iron Ingot", rate: 60 }]
  },
  { 
    id: "2", 
    name: "Steel Production", 
    description: "Produces steel ingots from iron and coal", 
    location: "Central Valley",
    inputs: [
      { id: "1", itemName: "Iron Ore", rate: 45 },
      { id: "2", itemName: "Coal", rate: 45 }
    ],
    outputs: [{ id: "1", itemName: "Steel Ingot", rate: 15 }]
  },
  { 
    id: "3", 
    name: "Copper Processing", 
    description: "Processes copper ore into copper ingots", 
    location: "Eastern Hills",
    inputs: [{ id: "1", itemName: "Copper Ore", rate: 60 }],
    outputs: [{ id: "1", itemName: "Copper Ingot", rate: 30 }]
  },
];

export default function WorldDetailPage({ params }: { params: { userId: string, worldId: string } }) {
  const { userId, worldId } = params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/users/${userId}/worlds`} className="mr-4">
          <Button variant="outline" size="sm">
            Back to Worlds
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{mockWorld.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>World Overview</CardTitle>
              <CardDescription>{mockWorld.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Resources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockWorld.resources.map((resource) => (
                      <div key={resource.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <div className="font-medium">{resource.type}</div>
                        <div className="text-sm text-gray-500">
                          {resource.purity} • {resource.location}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Factories</h3>
                    <Link href={`/users/${userId}/worlds/${worldId}/factories/new`}>
                      <Button size="sm">Add Factory</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Global Stats</CardTitle>
              <CardDescription>Overall production statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Total Factories</div>
                  <div className="text-2xl font-bold">{mockFactories.length}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Resource Nodes</div>
                  <div className="text-2xl font-bold">{mockWorld.resources.length}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Top Production</div>
                  <div className="text-xl font-medium">Iron Ingot: 60/min</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Factories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockFactories.map((factory) => (
          <Card key={factory.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{factory.name}</CardTitle>
              <CardDescription>{factory.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">Location</div>
                  <div className="text-sm text-gray-500">{factory.location}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Inputs</div>
                  {factory.inputs.map((input) => (
                    <div key={input.id} className="text-sm text-gray-500">
                      {input.itemName}: {input.rate}/min
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Outputs</div>
                  {factory.outputs.map((output) => (
                    <div key={output.id} className="text-sm text-gray-500">
                      {output.itemName}: {output.rate}/min
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/users/${userId}/worlds/${worldId}/factories/${factory.id}`} className="w-full">
                <Button variant="outline" className="w-full">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 