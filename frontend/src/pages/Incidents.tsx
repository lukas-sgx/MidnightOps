import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Incident = {
    id: number;
    title: string;
    description: string;
    status: string;
    severity: number;
    created_at: string;
};


async function fetchMe() {
    try {
        const res = await fetch('/api/v1/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });

        if (res.status === 401) {
            return null;
        }
        if (!res.ok) {
            throw new Error(`Error ${res.status}`);
        }

        const userData = await res.json();
        return userData;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return undefined;
    }
}

export default function Incidents() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [_, setError] = useState<string | null>(null);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState(3);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchIncidents();
    }, []);

    async function fetchIncidents() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const res = await fetch('/api/v1/incidents', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                navigate('/login');
                return;
            }

            if (!res.ok) throw new Error('Failed to fetch incidents');
            
            const data = await res.json();
            setIncidents(data.incidents || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        try {
             const token = localStorage.getItem('authToken');
             const res = await fetch('/api/v1/incidents', {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}`
                 },
                 body: JSON.stringify({ title, description, severity })
             });
             
             if (!res.ok) throw new Error('Failed to create incident');
             
             setTitle('');
             setDescription('');
             setSeverity(3);
             fetchIncidents();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    }

    async function handleResolve(id: number) {
        if (!confirm('Resolve this incident?')) return;
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`/api/v1/incidents/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'RESOLVED' })
            });

            if (!res.ok) throw new Error('Failed to resolve incident');
            fetchIncidents();
        } catch (err: any) {
            alert(err.message);
        }
    }

    const [showMenu, setShowMenu] = useState(false);
        const [initials, setInitials] = useState('');
        const [firstName, setFirstName] = useState('');
        const [lastName, setLastName] = useState('');
        const [email, setEmail] = useState('');
    
        useEffect(() => {
            fetchMe().then(data => {
                if (data) {
                    const firstName = data.user.name.split(" ")[0];
                    const lastName = data.user.name.split(" ")[1];
                    setFirstName(firstName);
                    setLastName(lastName);
                    setInitials(firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase());
                    setEmail(data.user.email);
                }
                if (data === null) {
                    localStorage.removeItem('authToken');
                    navigate('/login', { replace: true });
                }
            });
        }, []);
    
        const handleLogout = async () => {
            await fetch('/api/v1/auth/logout', {
                method: 'POST',
                headers: {
                   'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
            });
            localStorage.removeItem('authToken');
            navigate('/');
        };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans text-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <a href="/dashboard">
                            <h1 className="text-3xl font-bold text-white justify-center flex items-center">
                                <img src="/midnightops.png" alt="MidnightOps Logo" className="inline-block w-9 h-9 mr-2" />
                                Dashboard
                            </h1>
                        </a>
                        <p className="text-slate-400 mt-1">Welcome to MidnightOps</p>
                    </div>

                    {/* Profile Icon + Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="rounded-full border border-slate-700 p-3 w-12 h-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 cursor-pointer transition text-white font-semibold"
                        >
                            {initials}
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-50 bg-slate-800 rounded-lg border border-slate-700 shadow-lg z-50">
                                <div className="p-4 border-b border-slate-700">
                                    <p className="text-white font-semibold">{firstName} {lastName.charAt(0)}.</p>
                                    <p className="text-slate-400 text-sm">{email}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        navigate('/profile');
                                    }}
                                    className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 transition rounded-none"
                                >
                                    👤 Profile
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        navigate('/settings');
                                    }}
                                    className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 transition rounded-none"
                                >
                                    ⚙️ Settings
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        handleLogout();
                                    }}
                                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/20 transition rounded-b-lg rounded-t-none"
                                >
                                    🚪 Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Incident Management</h1>
                    <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition">
                        &larr; Back to Dashboard
                    </button>
                </div>

                {/* Create Form */}
                <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
                    <h2 className="text-xl font-semibold mb-4">Report New Incident</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                            <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                rows={3}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Severity</label>
                            <select 
                                value={severity}
                                onChange={e => setSeverity(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value={1}>Minor (1)</option>
                                <option value={2}>Major (2)</option>
                                <option value={3}>Critical (3)</option>
                            </select>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                disabled={creating}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create Incident'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Severity</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                            ) : incidents.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No open incidents found.</td></tr>
                            ) : (
                                incidents.map(inc => (
                                    <tr key={inc.id} className="hover:bg-slate-700/30 transition">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                inc.status.toLowerCase() === 'open' ? 'bg-green-900/50 text-green-400 border border-green-900' :
                                                'bg-slate-700 text-slate-300'
                                            }`}>
                                                {inc.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                inc.severity === 3 ? 'bg-red-900/50 text-red-400 border border-red-900' :
                                                inc.severity === 2 ? 'bg-orange-900/50 text-orange-400 border border-orange-900' :
                                                'bg-blue-900/50 text-blue-400 border border-blue-900'
                                            }`}>
                                                {inc.severity === 1 ? 'Minor' : inc.severity === 2 ? 'Major' : 'Critical'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white">{inc.title}</div>
                                            <div className="text-sm text-slate-400 mt-1">{inc.description}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {new Date(inc.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {inc.status !== 'RESOLVED' && (
                                                <button 
                                                    onClick={() => handleResolve(inc.id)}
                                                    className="text-sm bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-900/50 px-3 py-1 rounded transition"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
