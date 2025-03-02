import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// This would normally come from an API call based on the factoryId
const mockFactory = { 
  id: "1", 
  name: "Iron Processing", 
  description: "Processes iron ore into iron ingots", 
  location: "North Plains",
  inputs: [{ id: "1", itemName: "Iron Ore", rate: 120 }],
  outputs: [{ id: "1", itemName: "Iron Ingot", rate: 60 }],
  buildings: [
    { id: "1", name: "Miner Mk.2", type: "Miner", quantity: 2, clockSpeed: 100 },
    { id: "2", name: "Smelter", type: "Smelter", quantity: 4, clockSpeed: 100 },
    { id: "3", name: "Conveyor Belt Mk.3", type: "Conveyor", quantity: 8, clockSpeed: 100 },
  ],
  recipes: [
    { id: "1", name: "Iron Ingot", craftTime: 2, inputs: [{ itemName: "Iron Ore", quantity: 30 }], outputs: [{ itemName: "Iron Ingot", quantity: 30 }] }
  ],
  powerUsage: 40,
  efficiency: 98,
};

export default function FactoryDetailPage({ params }: { params: { userId: string, worldId: string, factoryId: string } }) {
  const { userId, worldId, factoryId } = params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/users/${userId}/worlds/${worldId}`} className="mr-4">
          <Button variant="outline" size="sm">
            Back to World
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{mockFactory.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Factory Overview</CardTitle>
              <CardDescription>{mockFactory.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Location</h3>
                  <p className="text-gray-600 dark:text-gray-400">{mockFactory.location}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Buildings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockFactory.buildings.map((building) => (
                      <div key={building.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <div className="font-medium">{building.name}</div>
                        <div className="text-sm text-gray-500">
                          {building.quantity}x • {building.clockSpeed}% Clock Speed
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Recipes</h3>
                  <div className="space-y-3">
                    {mockFactory.recipes.map((recipe) => (
                      <div key={recipe.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <div className="font-medium">{recipe.name}</div>
                        <div className="text-sm text-gray-500 mb-2">
                          Craft Time: {recipe.craftTime}s
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-1">Inputs</div>
                            {recipe.inputs.map((input, idx) => (
                              <div key={idx} className="text-sm text-gray-500">
                                {input.itemName}: {input.quantity}/min
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-1">Outputs</div>
                            {recipe.outputs.map((output, idx) => (
                              <div key={idx} className="text-sm text-gray-500">
                                {output.itemName}: {output.quantity}/min
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Factory Stats</CardTitle>
              <CardDescription>Performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Power Usage</div>
                  <div className="text-2xl font-bold">{mockFactory.powerUsage} MW</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Efficiency</div>
                  <div className="text-2xl font-bold">{mockFactory.efficiency}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Building Count</div>
                  <div className="text-2xl font-bold">{mockFactory.buildings.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Resource Flow</CardTitle>
              <CardDescription>Inputs and outputs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Inputs</h3>
                  {mockFactory.inputs.map((input) => (
                    <div key={input.id} className="flex justify-between items-center mb-2">
                      <span className="text-sm">{input.itemName}</span>
                      <span className="text-sm font-medium">{input.rate}/min</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Outputs</h3>
                  {mockFactory.outputs.map((output) => (
                    <div key={output.id} className="flex justify-between items-center mb-2">
                      <span className="text-sm">{output.itemName}</span>
                      <span className="text-sm font-medium">{output.rate}/min</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/users/${userId}/worlds/${worldId}/factories/${factoryId}/edit`} className="w-full">
                <Button className="w-full">Edit Factory</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 