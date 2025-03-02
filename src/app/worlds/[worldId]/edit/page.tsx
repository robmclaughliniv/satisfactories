"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { worldApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { World } from "@/lib/api";

export default function EditWorldPage({ params }: { params: { worldId: string } }) {
  const router = useRouter();
  const { worldId } = params;
  
  const [world, setWorld] = useState<World | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchWorld = async () => {
      try {
        setLoading(true);
        const worldData = await worldApi.getWorld(worldId);
        setWorld(worldData);
        setFormData({
          name: worldData.name,
          description: worldData.description || "",
        });
      } catch (err) {
        console.error("Error fetching world:", err);
        setErrors({
          general: "Failed to load world data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorld();
  }, [worldId]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      await worldApi.updateWorld(worldId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      
      // Redirect to world detail page on success
      router.push(`/worlds/${worldId}`);
    } catch (err) {
      console.error("Error updating world:", err);
      setErrors({
        general: err instanceof Error ? err.message : "Failed to update world. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
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
  
  if (!world && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>World not found</p>
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
        <Link href={`/worlds/${worldId}`} className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit World</h1>
      </div>
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>World Information</CardTitle>
            <CardDescription>Update the world details.</CardDescription>
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
                    placeholder="Enter world name" 
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
                    placeholder="Enter world description" 
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/worlds/${worldId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 