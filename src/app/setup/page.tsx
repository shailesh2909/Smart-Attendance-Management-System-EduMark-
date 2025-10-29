'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const setupDemoData = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/setup-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to setup demo data');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const checkDatabase = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/setup-demo', {
        method: 'GET',
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to create admin account');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            Database Setup
          </h1>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={checkDatabase}
                disabled={loading}
                className="w-full"
                variant="secondary"
              >
                {loading ? 'Checking...' : 'Check Database Status'}
              </Button>
              
              <Button
                onClick={setupDemoData}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Setting up...' : 'Setup Demo Data'}
              </Button>

              <Button
                onClick={createAdmin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
              >
                {loading ? 'Creating...' : 'Create Admin Account'}
              </Button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}

            {result && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <h3 className="font-bold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click "Setup Demo Data" to add users to Firestore database</li>
                <li>Go to Firebase Console → Authentication → Users</li>
                <li>Manually create these accounts:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>admin@pict.edu (password: password123)</li>
                    <li>faculty@pict.edu (password: password123)</li>
                    <li>student@pict.edu (password: password123)</li>
                  </ul>
                </li>
                <li>Then you can login with these credentials</li>
              </ol>
            </div>

            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <h3 className="font-bold mb-2">Firebase Console Links:</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <a 
                    href="https://console.firebase.google.com/project/edumark-ff569/firestore" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Firestore Database
                  </a>
                </li>
                <li>
                  <a 
                    href="https://console.firebase.google.com/project/edumark-ff569/authentication/users" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Authentication Users
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}