"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { resourceApi, worldApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Resource, World } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditResourcePage({ params }: { params: { resourceId: string } }) {
  const router = useRouter();
  const { resourceId } = params;
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [formData, setFormData] = useState({
    type: "",
    purity: "",
    worldId: "",
    location: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch resource and worlds in parallel
        const [resourceData, worldsData] = await Promise.all([
          resourceApi.getResource(resourceId),
          worldApi.getWorlds()
        ]);
        
        setResource(resourceData);
        setWorlds(worldsData);
        
        setFormData({
          type: resourceData.type,
          purity: resourceData.purity,
          worldId: resourceData.worldId,
          location: resourceData.location || ""
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("Failed to load resource data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [resourceId]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user makes a selection
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.type.trim()) {
      newErrors.type = "Resource type is required";
    }
    
    if (!formData.purity.trim()) {
      newErrors.purity = "Purity is required";
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
    
    try {
      setIsSubmitting(true);
      
      const { type, purity, worldId, location } = formData;
      await resourceApi.updateResource(resourceId, {
        type,
        purity,
        worldId,
        location: location || undefined
      });
      
      router.push(`/resources/${resourceId}`);
    } catch (err) {
      console.error("Error updating resource:", err);
      alert("Failed to update resource. Please try again.");
    } finally {
      setIsSubmitting(false);
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
  
  if (!resource) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Resource not found</p>
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
        <Link href={`/resources/${resourceId}`} className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Resource</h1>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Resource</CardTitle>
            <CardDescription>Update the resource information</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Resource Type <span className="text-red-500">*</span>
                </label>
                <Input
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  placeholder="Iron Ore, Copper Ore, Coal, etc."
                  className={errors.type ? "border-red-500" : ""}
                />
                {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="purity" className="text-sm font-medium">
                  Purity <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.purity}
                  onValueChange={(value: string) => handleSelectChange("purity", value)}
                >
                  <SelectTrigger className={errors.purity ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select purity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Impure">Impure</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Pure">Pure</SelectItem>
                  </SelectContent>
                </Select>
                {errors.purity && <p className="text-red-500 text-sm">{errors.purity}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="worldId" className="text-sm font-medium">
                  World <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.worldId}
                  onValueChange={(value: string) => handleSelectChange("worldId", value)}
                >
                  <SelectTrigger className={errors.worldId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a world" />
                  </SelectTrigger>
                  <SelectContent>
                    {worlds.map((world) => (
                      <SelectItem key={world.id} value={world.id}>
                        {world.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.worldId && <p className="text-red-500 text-sm">{errors.worldId}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Coordinates or description (optional)"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/resources/${resourceId}`}>
                <Button variant="outline" type="button">Cancel</Button>
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