import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function DataSeeder() {
  const [loading, setLoading] = useState(false);

  const seedDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://arena-watch-backend-1.onrender.com/api/channels/seed', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to seed');
      
      toast.success("MongoDB Atlas seeded successfully! Refresh the page.");
    } catch (error) {
      console.error("Error seeding DB:", error);
      toast.error("Failed to seed database. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      <Toaster position="top-right" />
      <h2 className="text-xl font-bold text-accent-green">Database Empty</h2>
      <p className="text-gray-400 text-sm max-w-md">
        Click below to inject the mock channels into your MongoDB Atlas database via your Express backend.
      </p>
      <button 
        onClick={seedDatabase} 
        disabled={loading}
        className="btn btn-outline border-accent-green text-accent-green hover:bg-accent-green hover:text-black"
      >
        {loading ? "Seeding Atlas..." : "Seed MongoDB Atlas"}
      </button>
    </div>
  );
}