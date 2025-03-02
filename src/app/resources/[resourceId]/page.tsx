"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { resourceApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Resource } from "@/lib/api";

export default function ResourceDetailPage({ params }: { params: { resourceId: string } }) {
  const router = useRouter();
  const { resourceId } = params;
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchResourceData = async () => {
      try {
        setLoading(true);
        const resourceData = await resourceApi.getResource(resourceId);
        setResource(resourceData);
        setError(null);
      } catch (err) {
        console.error("Error fetching resource data:", err);
        setError("Failed to load resource data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResourceData();
  }, [resourceId]);
  
  const handleDeleteResource = async () => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await resourceApi.deleteResource(resourceId);
        router.push(resource?.worldId ? `/worlds/${resource.worldId}` : "/resources");
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
          <p className="text-lg">Loading resource data...</p>
        </div>
      </div>
    );
  }
  
  if (error || !resource) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || "Resource not found"}</p>
        </div>
        <div className="mt-4">
          <Link href="/resources">
            <Button variant="outline">Back to Resources</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={resource.worldId ? `/worlds/${resource.worldId}` : "/resources"} className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{resource.type}</h1>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Resource Information</CardTitle>
            <CardDescription>Details about this resource node</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Type</p>
                <p>{resource.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Purity</p>
                <p>{resource.purity}</p>
              </div>
              {resource.location && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p>{resource.location}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">World</p>
                <p>
                  <Link href={`/worlds/${resource.worldId}`} className="text-blue-500 hover:underline">
                    {resource.world?.name || resource.worldId}
                  </Link>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p>{new Date(resource.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href={`/resources/${resourceId}/edit`}>
              <Button variant="outline">Edit Resource</Button>
            </Link>
            <Button variant="destructive" onClick={handleDeleteResource}>
              Delete Resource
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 