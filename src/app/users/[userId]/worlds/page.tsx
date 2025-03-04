'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Globe, Plus, ArrowLeft } from 'lucide-react';

type World = {
  id: string;
  name: string;
  description: string | null;
};

type User = {
  id: string;
  name: string;
  worldCount: number;
};

export default function WorldsPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const [worlds, setWorlds] = useState<World[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user details
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user');
        }
        const userData = await userResponse.json();
        setUser(userData);
        
        // Fetch worlds
        const worldsResponse = await fetch(`/api/users/${userId}/worlds`);
        if (!worldsResponse.ok) {
          throw new Error('Failed to fetch worlds');
        }
        const worldsData = await worldsResponse.json();
        setWorlds(worldsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleWorldSelect = (worldId: string) => {
    router.push(`/users/${userId}/worlds/${worldId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {isLoading ? 'Loading...' : user ? `${user.name}'s Worlds` : 'Worlds'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading worlds...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {worlds.length > 0 ? (
            worlds.map((world) => (
              <Card 
                key={world.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleWorldSelect(world.id)}
              >
                <CardContent className="p-6 flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <Globe className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{world.name}</h3>
                    {world.description && (
                      <p className="text-sm text-gray-500">{world.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">No worlds found</p>
              <p className="text-gray-500">Create your first world to get started</p>
            </div>
          )}

          <Card className="border border-dashed hover:bg-gray-50 cursor-pointer transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full" onClick={() => router.push(`/users/${userId}/worlds/new`)}>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-lg">Create New World</h3>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 