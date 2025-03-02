"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { resourceApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { Resource } from "@/lib/api";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const resourcesData = await resourceApi.getResources();
        setResources(resourcesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching resources:", err);
        setError("Failed to load resources. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResources();
  }, []);
  
  const handleDeleteResource = async (resourceId: string) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await resourceApi.deleteResource(resourceId);
        setResources(resources.filter(resource => resource.id !== resourceId));
      } catch (err) {
        console.error("Error deleting resource:", err);
        alert("Failed to delete resource. Please try again.");
      }
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-40">
          <p className="text-lg">Loading resources...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Resources</h1>
        <Link href="/resources/new">
          <Button>New Resource</Button>
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {resources.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first resource.</p>
          <Link href="/resources/new">
            <Button>Add Resource</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardHeader>
                <CardTitle>{resource.type}</CardTitle>
                <CardDescription>
                  Purity: {resource.purity}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">World:</span>{" "}
                  <Link href={`/worlds/${resource.worldId}`} className="text-blue-500 hover:underline">
                    {resource.world?.name || resource.worldId}
                  </Link>
                </div>
                {resource.location && (
                  <div className="text-sm text-gray-500 mt-2">
                    <span className="font-medium">Location:</span> {resource.location}
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-2">
                  <span className="font-medium">Added:</span> {new Date(resource.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/resources/${resource.id}`}>
                  <Button variant="outline">View</Button>
                </Link>
                <div className="space-x-2">
                  <Link href={`/resources/${resource.id}/edit`}>
                    <Button variant="outline">Edit</Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteResource(resource.id)}
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