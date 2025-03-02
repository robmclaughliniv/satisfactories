"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { resourceApi, worldApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { World } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewResourcePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const worldIdParam = searchParams.get('worldId');
  
  const [worlds, setWorlds] = useState<World[]>([]);
  const [formData, setFormData] = useState({
    type: "",
    purity: "Normal",
    worldId: worldIdParam || "",
    location: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchWorlds = async () => {
      try {
        setLoading(true);
        const worldsData = await worldApi.getWorlds();
        setWorlds(worldsData);
        
        // If worldId is provided in URL and it exists in the fetched worlds, use it
        if (worldIdParam && worldsData.some(world => world.id === worldIdParam)) {
          setFormData(prev => ({ ...prev, worldId: worldIdParam }));
        } else if (worldsData.length > 0 && !formData.worldId) {
          // If no worldId is set and we have worlds, set the first one as default
          setFormData(prev => ({ ...prev, worldId: worldsData[0].id }));
        }
      } catch (err) {
        console.error("Error fetching worlds:", err);
        alert("Failed to load worlds. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorlds();
  }, [worldIdParam]);
  
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
      const newResource = await resourceApi.createResource({
        type,
        purity,
        worldId,
        location: location || undefined
      });
      
      router.push(`/resources/${newResource.id}`);
    } catch (err) {
      console.error("Error creating resource:", err);
      alert("Failed to create resource. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-40">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/resources" className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Resource</h1>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add Resource</CardTitle>
            <CardDescription>Create a new resource node</CardDescription>
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
                {worlds.length === 0 && (
                  <p className="text-amber-500 text-sm">
                    No worlds available. <Link href="/worlds/new" className="underline">Create a world</Link> first.
                  </p>
                )}
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
              <Link href="/resources">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || worlds.length === 0}>
                {isSubmitting ? "Creating..." : "Create Resource"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 