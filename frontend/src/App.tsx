import { useState } from 'react'
import './App.css'
import React from 'react';


function App() {
    const [email, setEmail] = useState('test@epitech.eu');
    const [password, setPassword] = useState('*********');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://api.midnightops.soigneux.works/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Login failed');
            }

            const data = await response.json();
            console.log('Login successful:', data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

return (
    <main className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="p-4 border rounded w-80 space-y-3">
        <h1 className="text-lg font-bold">MidnightOps Login</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label className="block text-sm">Email</label>
          <input
            className="border rounded w-full px-2 py-1"
            type="email"
            placeholder={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input
            className="border rounded w-full px-2 py-1"
            type="password"
            placeholder={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button
          className="w-full bg-blue-600 text-white rounded py-1"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </main>
  );    
}

export default App
