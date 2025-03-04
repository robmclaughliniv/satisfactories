'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Globe, Plus } from 'lucide-react';

type WorldSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
};

type World = {
  id: string;
  name: string;
  description: string;
};

export default function WorldSelectionModal({ 
  isOpen, 
  onClose, 
  userId,
  userName 
}: WorldSelectionModalProps) {
  const router = useRouter();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorlds = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}/worlds`);
        if (!response.ok) {
          throw new Error('Failed to fetch worlds');
        }
        const data = await response.json();
        setWorlds(data);
      } catch (error) {
        console.error('Error fetching worlds:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorlds();
  }, [userId]);

  const handleWorldSelect = (worldId: string) => {
    router.push(`/users/${userId}/worlds/${worldId}`);
    onClose();
  };

  const handleCreateWorld = () => {
    router.push(`/users/${userId}/worlds/new`);
    onClose();
  };

  const handleViewAllWorlds = () => {
    router.push(`/users/${userId}/worlds`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Select World for {userName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading worlds...</p>
            </div>
          ) : worlds.length > 0 ? (
            <>
              {worlds.map(world => (
                <Card 
                  key={world.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleWorldSelect(world.id)}
                >
                  <CardContent className="p-6 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                      <Globe className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{world.name}</h3>
                      <p className="text-sm text-gray-500">{world.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="col-span-full text-center py-4">
              <p className="text-gray-600">No worlds found</p>
            </div>
          )}
          
          <div 
            className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors" 
            onClick={handleCreateWorld}
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-medium text-lg">Create New World</h3>
          </div>
        </div>
        
        {worlds.length > 0 && (
          <div className="mt-4 text-center">
            <button 
              onClick={handleViewAllWorlds}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All Worlds
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 