"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { factoryApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Factory, Building } from "@/lib/api";

export default function FactoryDetailPage({ params }: { params: { factoryId: string } }) {
  const router = useRouter();
  const { factoryId } = params;
  
  const [factory, setFactory] = useState<Factory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchFactoryData = async () => {
      try {
        setLoading(true);
        const factoryData = await factoryApi.getFactory(factoryId);
        setFactory(factoryData);
        setError(null);
      } catch (err) {
        console.error("Error fetching factory data:", err);
        setError("Failed to load factory data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchFactoryData();
  }, [factoryId]);
  
  const handleDeleteFactory = async () => {
    if (window.confirm("Are you sure you want to delete this factory? This will also delete all associated buildings.")) {
      try {
        await factoryApi.deleteFactory(factoryId);
        router.push(factory?.worldId ? `/worlds/${factory.worldId}` : "/factories");
      } catch (err) {
        console.error("Error deleting factory:", err);
        alert("Failed to delete factory. Please try again.");
      }
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-40">
          <p className="text-lg">Loading factory data...</p>
        </div>
      </div>
    );
  }
  
  if (error || !factory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || "Factory not found"}</p>
        </div>
        <div className="mt-4">
          <Link href="/factories">
            <Button variant="outline">Back to Factories</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={factory.worldId ? `/worlds/${factory.worldId}` : "/factories"} className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{factory.name}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Factory Information</CardTitle>
              <CardDescription>Details about this factory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p>{factory.name}</p>
                </div>
                {factory.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p>{factory.description}</p>
                  </div>
                )}
                {factory.location && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p>{factory.location}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">World</p>
                  <p>
                    <Link href={`/worlds/${factory.worldId}`} className="text-blue-500 hover:underline">
                      {factory.world?.name || factory.worldId}
                    </Link>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p>{new Date(factory.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/factories/${factoryId}/edit`}>
                <Button variant="outline">Edit Factory</Button>
              </Link>
              <Button variant="destructive" onClick={handleDeleteFactory}>
                Delete Factory
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Buildings</h2>
              <Link href={`/buildings/new?factoryId=${factoryId}`}>
                <Button>Add Building</Button>
              </Link>
            </div>
            
            {!factory.buildings || factory.buildings.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">This factory has no buildings yet.</p>
                <p className="text-gray-500 text-sm mt-2">Add buildings to start production.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {factory.buildings.map((building) => (
                  <Card key={building.id}>
                    <CardHeader className="pb-2">
                      <CardTitle>{building.name}</CardTitle>
                      <CardDescription>Type: {building.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="font-medium text-gray-500">Quantity</p>
                          <p>{building.quantity}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Clock Speed</p>
                          <p>{building.clockSpeed}%</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Link href={`/buildings/${building.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      <div className="space-x-2">
                        <Link href={`/buildings/${building.id}/edit`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => alert("Delete functionality will be implemented in the building detail page")}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 