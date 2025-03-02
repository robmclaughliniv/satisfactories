"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { factoryApi, worldApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { World } from "@/lib/api";

export default function NewFactoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialWorldId = searchParams.get('worldId');
  
  const [worlds, setWorlds] = useState<World[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    worldId: initialWorldId || "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    worldId?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchWorlds = async () => {
      try {
        setLoading(true);
        const data = await worldApi.getWorlds();
        setWorlds(data);
        
        // If no worldId is provided in the URL and we have worlds, select the first one
        if (!initialWorldId && data.length > 0) {
          setFormData(prev => ({
            ...prev,
            worldId: data[0].id,
          }));
        }
      } catch (err) {
        console.error("Error fetching worlds:", err);
        setErrors({
          general: "Failed to load worlds. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorlds();
  }, [initialWorldId]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.worldId) {
      newErrors.worldId = "World is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const factory = await factoryApi.createFactory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        worldId: formData.worldId,
      });
      
      // Redirect to the factory detail page on success
      router.push(`/factories/${factory.id}`);
    } catch (err) {
      console.error("Error creating factory:", err);
      setErrors({
        general: err instanceof Error ? err.message : "Failed to create factory. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={initialWorldId ? `/worlds/${initialWorldId}` : "/factories"} className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Factory</h1>
      </div>
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Factory Information</CardTitle>
            <CardDescription>Enter the details for the new factory.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-4">
                {errors.general && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{errors.general}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input 
                    id="name" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter factory name" 
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Textarea 
                    id="description" 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter factory description" 
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location (Optional)
                  </label>
                  <Input 
                    id="location" 
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter factory location" 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="worldId" className="text-sm font-medium">
                    World
                  </label>
                  <select
                    id="worldId"
                    name="worldId"
                    value={formData.worldId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading || !!initialWorldId}
                  >
                    {loading ? (
                      <option value="">Loading worlds...</option>
                    ) : worlds.length === 0 ? (
                      <option value="">No worlds available</option>
                    ) : (
                      <>
                        <option value="">Select a world</option>
                        {worlds.map((world) => (
                          <option key={world.id} value={world.id}>
                            {world.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {errors.worldId && (
                    <p className="text-sm text-red-500">{errors.worldId}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={initialWorldId ? `/worlds/${initialWorldId}` : "/factories"}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? "Creating..." : "Create Factory"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 