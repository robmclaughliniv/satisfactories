"use client";

import Link from "next/link";
import { userApi } from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { User } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userApi.getUsers();
        setUsers(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userApi.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to delete user. Please try again.");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <Link href="/users/new">
          <Button className="px-4 py-2 bg-blue-500 text-white rounded">Create New User</Button>
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-lg">Loading users...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">No users found. Create your first user!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{user.name || "Unnamed User"}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Created: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Link href={`/users/${user.id}`}>
                  <Button variant="outline" size="sm">View</Button>
                </Link>
                <div className="space-x-2">
                  <Link href={`/users/${user.id}/edit`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
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