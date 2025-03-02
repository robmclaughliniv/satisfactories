"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { userApi, worldApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, World } from "@/lib/api";

export default function UserDetailPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const { userId } = params;
  
  const [user, setUser] = useState<User | null>(null);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await userApi.getUser(userId);
        setUser(userData);
        
        const worldsData = await worldApi.getWorlds(userId);
        setWorlds(worldsData);
        
        setError(null);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  const handleDeleteUser = async () => {
    if (window.confirm("Are you sure you want to delete this user? This will also delete all associated worlds and data.")) {
      try {
        await userApi.deleteUser(userId);
        router.push("/users");
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to delete user. Please try again.");
      }
    }
  };
  
  const handleDeleteWorld = async (worldId: string) => {
    if (window.confirm("Are you sure you want to delete this world?")) {
      try {
        await worldApi.deleteWorld(worldId);
        setWorlds(worlds.filter(world => world.id !== worldId));
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
          <p className="text-lg">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || "User not found"}</p>
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
        <Link href="/users" className="mr-4">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{user.name || "Unnamed User"}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Details about this user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p>{user.name || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/users/${userId}/edit`}>
                <Button variant="outline">Edit User</Button>
              </Link>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Delete User
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Worlds</h2>
            <Link href={`/worlds/new?userId=${userId}`}>
              <Button>Create New World</Button>
            </Link>
          </div>
          
          {worlds.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">This user has no worlds yet.</p>
              <p className="text-gray-500 text-sm mt-2">Create a new world to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {worlds.map((world) => (
                <Card key={world.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>{world.name}</CardTitle>
                    {world.description && (
                      <CardDescription>{world.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(world.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Link href={`/worlds/${world.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    <div className="space-x-2">
                      <Link href={`/worlds/${world.id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteWorld(world.id)}
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
  );
} 