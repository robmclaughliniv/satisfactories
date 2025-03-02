import Link from "next/link";

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <Link href="/users/new">
          <button className="px-4 py-2 bg-blue-500 text-white rounded">Create New User</button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <p>User list will appear here</p>
      </div>
    </div>
  );
} 