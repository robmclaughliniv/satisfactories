"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { worldApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { World, Factory, Resource } from "@/lib/api";

export default function WorldDetailPage({ params }: { params: { worldId: string } }) {
  const router = useRouter();
  const { worldId } = params;
  
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchWorldData = async () => {
      try {
        setLoading(true);
        const worldData = await worldApi.getWorld(worldId);
        setWorld(worldData);
        setError(null);
      } catch (err) {
        console.error("Error fetching world data:", err);
        setError("Failed to load world data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorldData();
  }, [worldId]);
  
  const handleDeleteWorld = async () => {
    if (window.confirm("Are you sure you want to delete this world? This will also delete all associated factories and resources.")) {
      try {
        await worldApi.deleteWorld(worldId);
        router.push(world?.userId ? `/users/${world.userId}` : "/worlds");
      } catch (err) {
        console.error("Error deleting world:", err);
        alert("Failed to delete world. Please try again.");
      }
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-40">
          <p className="text-lg">Loading world data...</p>
        </div>
      </div>
    );
  }
  
  if (error || !world) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || "World not found"}</p>
        </div>
        <div className="mt-4">
          <Link href="/worlds">
            <Button variant="outline">Back to Worlds</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={world.userId ? `/users/${world.userId}` : "/worlds"} className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{world.name}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>World Information</CardTitle>
              <CardDescription>Details about this world</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p>{world.name}</p>
                </div>
                {world.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p>{world.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Owner</p>
                  <p>{world.user?.name || world.user?.email || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p>{new Date(world.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/worlds/${worldId}/edit`}>
                <Button variant="outline">Edit World</Button>
              </Link>
              <Button variant="destructive" onClick={handleDeleteWorld}>
                Delete World
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Factories</h2>
              <Link href={`/factories/new?worldId=${worldId}`}>
                <Button>Create New Factory</Button>
              </Link>
            </div>
            
            {!world.factories || world.factories.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">This world has no factories yet.</p>
                <p className="text-gray-500 text-sm mt-2">Create a new factory to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {world.factories.map((factory) => (
                  <Card key={factory.id}>
                    <CardHeader className="pb-2">
                      <CardTitle>{factory.name}</CardTitle>
                      {factory.description && (
                        <CardDescription>{factory.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-2">
                      {factory.location && (
                        <p className="text-sm text-gray-600">Location: {factory.location}</p>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Link href={`/factories/${factory.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      <div className="space-x-2">
                        <Link href={`/factories/${factory.id}/edit`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          // We'll implement this in the factory detail page
                          onClick={() => alert("Delete functionality will be implemented in the factory detail page")}
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
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Resources</h2>
              <Link href={`/resources/new?worldId=${worldId}`}>
                <Button>Add Resource</Button>
              </Link>
            </div>
            
            {!world.resources || world.resources.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">This world has no resources yet.</p>
                <p className="text-gray-500 text-sm mt-2">Add resources to use in your factories.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {world.resources.map((resource) => (
                  <Card key={resource.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{resource.type}</CardTitle>
                      <CardDescription>Purity: {resource.purity}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {resource.location && (
                        <p className="text-sm text-gray-600">Location: {resource.location}</p>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Link href={`/resources/${resource.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      <div className="space-x-2">
                        <Link href={`/resources/${resource.id}/edit`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          // We'll implement this in the resource detail page
                          onClick={() => alert("Delete functionality will be implemented in the resource detail page")}
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