import { Suspense } from 'react';
import UserSelectionModal from './components/UserSelectionModal';

export default function UserSelectionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <UserSelectionModal />
      </Suspense>
    </div>
  );
} 