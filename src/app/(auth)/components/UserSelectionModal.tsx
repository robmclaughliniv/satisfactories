'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import UserCard from './UserCard';
import SearchBar from './SearchBar';
import WorldSelectionModal from './WorldSelectionModal';
import { Plus } from 'lucide-react';

type User = {
  id: string;
  name: string;
  worldCount: number;
};

export default function UserSelectionModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser({ id: user.id, name: user.name });
    }
  };

  const handleCreateUser = () => {
    router.push('/users/new');
  };

  const handleCloseWorldModal = () => {
    setSelectedUser(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Select User</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search users..."
              onClear={() => setSearchQuery('')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {isLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <>
                {filteredUsers.map(user => (
                  <UserCard 
                    key={user.id}
                    user={user}
                    onClick={() => handleUserSelect(user.id)}
                  />
                ))}
              </>
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600">No users found</p>
              </div>
            )}
            
            <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors" onClick={handleCreateUser}>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-lg">Create New User</h3>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedUser && (
        <WorldSelectionModal
          isOpen={!!selectedUser}
          onClose={handleCloseWorldModal}
          userId={selectedUser.id}
          userName={selectedUser.name}
        />
      )}
    </>
  );
} 