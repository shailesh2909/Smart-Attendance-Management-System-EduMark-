'use client';

import { useState } from 'react';
import { auth, db } from '@/lib/firebaseClient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const createAdminComplete = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Creating complete admin account...');

      // Step 1: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        'admin@pict.edu', 
        'password123'
      );
      
      const user = userCredential.user;
      console.log('Firebase Auth user created:', user.uid);

      // Step 2: Create Firestore document
      const adminData = {
        id: user.uid,
        email: 'admin@pict.edu',
        name: 'System Administrator',
        role: 'admin',
        status: 'approved',
        department: 'Administration',
        employeeId: 'ADM001',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), adminData);
      console.log('Firestore document created');

      setResult({
        success: true,
        message: 'Admin account created successfully!',
        credentials: {
          email: 'admin@pict.edu',
          password: 'password123',
          uid: user.uid
        },
        nextSteps: [
          'Admin account is ready!',
          'Go to /login',
          'Use: admin@pict.edu / password123',
          'You will have full admin access!'
        ]
      });

    } catch (error: any) {
      console.error('Error creating admin:', error);
      
      let errorMessage = 'Failed to create admin account';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Admin account already exists! You can login with admin@pict.edu / password123';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            Admin Account Setup
          </h1>
          
          <div className="space-y-6">
            <div className="text-center">
              <Button
                onClick={createAdminComplete}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-lg py-4"
              >
                {loading ? 'Creating Admin Account...' : 'Create Complete Admin Account'}
              </Button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}

            {result && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <h3 className="font-bold mb-2">✅ Success!</h3>
                <p className="mb-3">{result.message}</p>
                
                <div className="bg-white p-3 rounded border">
                  <p className="font-semibold">Admin Credentials:</p>
                  <p>Email: {result.credentials?.email}</p>
                  <p>Password: {result.credentials?.password}</p>
                  <p>UID: {result.credentials?.uid}</p>
                </div>

                <div className="mt-3">
                  <p className="font-semibold">Next Steps:</p>
                  <ul className="list-disc list-inside">
                    {result.nextSteps?.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 text-center">
                  <a 
                    href="/login" 
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Go to Login Page
                  </a>
                </div>
              </div>
            )}

            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <h3 className="font-bold mb-2">What this does:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Creates Firebase Authentication user (admin@pict.edu)</li>
                <li>Creates Firestore user document with admin role</li>
                <li>Sets up complete admin account ready for login</li>
                <li>No manual Firebase Console steps needed!</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}