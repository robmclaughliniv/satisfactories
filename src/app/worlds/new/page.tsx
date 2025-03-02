"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { worldApi, userApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "@/lib/api";

export default function NewWorldPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');
  
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    userId: initialUserId || "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    userId?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userApi.getUsers();
        setUsers(data);
        
        // If no userId is provided in the URL and we have users, select the first one
        if (!initialUserId && data.length > 0) {
          setFormData(prev => ({
            ...prev,
            userId: data[0].id,
          }));
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setErrors({
          general: "Failed to load users. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [initialUserId]);
  
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
    
    if (!formData.userId) {
      newErrors.userId = "User is required";
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
      const world = await worldApi.createWorld({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        userId: formData.userId,
      });
      
      // Redirect to the world detail page on success
      router.push(`/worlds/${world.id}`);
    } catch (err) {
      console.error("Error creating world:", err);
      setErrors({
        general: err instanceof Error ? err.message : "Failed to create world. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={initialUserId ? `/users/${initialUserId}` : "/worlds"} className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New World</h1>
      </div>
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>World Information</CardTitle>
            <CardDescription>Enter the details for the new world.</CardDescription>
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
                <div className="space-y-2">
                  <label htmlFor="userId" className="text-sm font-medium">
                    User
                  </label>
                  <select
                    id="userId"
                    name="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading || !!initialUserId}
                  >
                    {loading ? (
                      <option value="">Loading users...</option>
                    ) : users.length === 0 ? (
                      <option value="">No users available</option>
                    ) : (
                      <>
                        <option value="">Select a user</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.email}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {errors.userId && (
                    <p className="text-sm text-red-500">{errors.userId}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={initialUserId ? `/users/${initialUserId}` : "/worlds"}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? "Creating..." : "Create World"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 