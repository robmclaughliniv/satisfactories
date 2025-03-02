"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { userApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/api";

export default function EditUserPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const { userId } = params;
  
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await userApi.getUser(userId);
        setUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email,
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        setErrors({
          general: "Failed to load user data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [userId]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
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
      await userApi.updateUser(userId, {
        name: formData.name || undefined, // Don't send empty string
        email: formData.email,
      });
      
      // Redirect to user detail page on success
      router.push(`/users/${userId}`);
    } catch (err) {
      console.error("Error updating user:", err);
      setErrors({
        general: err instanceof Error ? err.message : "Failed to update user. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-40">
          <p className="text-lg">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  if (!user && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>User not found</p>
        </div>
        <div className="mt-4">
          <Link href="/users">
            <Button variant="outline">Back to Users</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/users/${userId}`} className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit User</h1>
      </div>
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Update the user details.</CardDescription>
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
                    placeholder="Enter user name" 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address" 
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/users/${userId}`}>
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