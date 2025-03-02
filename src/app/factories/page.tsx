"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { factoryApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { Factory } from "@/lib/api";

export default function FactoriesPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchFactories = async () => {
      try {
        setLoading(true);
        const factoriesData = await factoryApi.getFactories();
        setFactories(factoriesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching factories:", err);
        setError("Failed to load factories. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchFactories();
  }, []);
  
  const handleDeleteFactory = async (factoryId: string) => {
    if (window.confirm("Are you sure you want to delete this factory? This will also delete all associated buildings.")) {
      try {
        await factoryApi.deleteFactory(factoryId);
        setFactories(factories.filter(factory => factory.id !== factoryId));
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
          <p className="text-lg">Loading factories...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Factories</h1>
        <Link href="/factories/new">
          <Button>New Factory</Button>
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {factories.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No factories found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first factory.</p>
          <Link href="/factories/new">
            <Button>Create Factory</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {factories.map((factory) => (
            <Card key={factory.id}>
              <CardHeader>
                <CardTitle>{factory.name}</CardTitle>
                <CardDescription>
                  World: {factory.world?.name || factory.worldId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {factory.description && <p className="text-gray-600 mb-2">{factory.description}</p>}
                {factory.location && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Location:</span> {factory.location}
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-2">
                  <span className="font-medium">Buildings:</span> {factory.buildings?.length || 0}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/factories/${factory.id}`}>
                  <Button variant="outline">View</Button>
                </Link>
                <div className="space-x-2">
                  <Link href={`/factories/${factory.id}/edit`}>
                    <Button variant="outline">Edit</Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteFactory(factory.id)}
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
  );
} 