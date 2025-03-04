'use client';

import { Card, CardContent } from '../../../components/ui/card';
import { User } from 'lucide-react';

type UserCardProps = {
  user: {
    id: string;
    name: string;
    worldCount: number;
    avatarUrl?: string;
  };
  onClick: (userId: string) => void;
};

export default function UserCard({ user, onClick }: UserCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(user.id)}
    >
      <CardContent className="p-6 flex items-center">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <User className="h-6 w-6 text-blue-600" />
          )}
        </div>
        <div>
          <h3 className="font-medium text-lg">{user.name}</h3>
          <p className="text-sm text-gray-500">
            {user.worldCount} {user.worldCount === 1 ? 'world' : 'worlds'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 