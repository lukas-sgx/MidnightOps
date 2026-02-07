import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Incident = {
    id: number;
    title: string;
    description: string;
    status: string;
    severity: number;
    created_at: string;
    acknowledged_at?: string;
    resolved_at?: string;
    service_name?: string;
    team_name?: string;
    acknowledged_by_name?: string;
    postmortem?: string;
};

type Team = {
    id: number;
    name: string;
};

type Service = {
    id: number;
    name: string;
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
    const [teams, setTeams] = useState<Team[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [_, setError] = useState<string | null>(null);
    
    // Filter state
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
    const [filterTeam, setFilterTeam] = useState('');

    // Selected Incident for Detail View
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [postmortemEdit, setPostmortemEdit] = useState('');

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState(3);
    const [serviceId, setServiceId] = useState<number | ''>('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchIncidents();
        fetchTeams();
        fetchServices();
    }, [filterStatus, filterSeverity, filterTeam]);

    async function fetchServices() {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/v1/services', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setServices(data.services || []);
            }
        } catch (err) {
            console.error('Failed to fetch services', err);
        }
    }

    async function fetchTeams() {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/v1/teams', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTeams(data.teams || []);
            }
        } catch (err) {
            console.error('Failed to fetch teams', err);
        }
    }

    async function fetchIncidents() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const queryParams = new URLSearchParams();
            if (filterStatus) queryParams.append('status', filterStatus);
            if (filterSeverity) queryParams.append('severity', filterSeverity);
            if (filterTeam) queryParams.append('team_id', filterTeam);

            const res = await fetch(`/api/v1/incidents?${queryParams.toString()}`, {
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
                 body: JSON.stringify({ title, description, severity, service_id: serviceId })
             });
             
             if (!res.ok) throw new Error('Failed to create incident');
             
             setTitle('');
             setDescription('');
             setSeverity(3);
             setServiceId('');
             fetchIncidents();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    }

    async function handleAcknowledge(id: number) {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`/api/v1/incidents/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'ACKNOWLEDGED' })
            });

            if (!res.ok) throw new Error('Failed to acknowledge incident');
            fetchIncidents();
            if (selectedIncident?.id === id) {
                const data = await res.json();
                setSelectedIncident(data.incident);
            }
        } catch (err: any) {
            alert(err.message);
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
            if (selectedIncident?.id === id) {
                const data = await res.json();
                setSelectedIncident(data.incident);
            }
        } catch (err: any) {
            alert(err.message);
        }
    }

    async function handleSavePostmortem() {
        if (!selectedIncident) return;
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`/api/v1/incidents/${selectedIncident.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ postmortem: postmortemEdit })
            });

            if (!res.ok) throw new Error('Failed to save postmortem');
            const data = await res.json();
            setSelectedIncident(data.incident);
            fetchIncidents();
            alert('Postmortem saved!');
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
                                <option value={1}>Minor (P3)</option>
                                <option value={2}>Major (P2)</option>
                                <option value={3}>Critical (P1)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Service</label>
                            <select 
                                value={serviceId}
                                onChange={e => setServiceId(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">Select Service (optional)</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
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

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Status</label>
                        <select 
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="ACKNOWLEDGED">Acknowledged</option>
                            <option value="RESOLVED">Resolved</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Severity</label>
                        <select 
                            value={filterSeverity}
                            onChange={e => setFilterSeverity(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">All Severities</option>
                            <option value="1">Minor (1)</option>
                            <option value="2">Major (2)</option>
                            <option value="3">Critical (3)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Team</label>
                        <select 
                            value={filterTeam}
                            onChange={e => setFilterTeam(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">All Teams</option>
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Severity</th>
                                <th className="px-6 py-4">Incident</th>
                                <th className="px-6 py-4">Team</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                            ) : incidents.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No open incidents found.</td></tr>
                            ) : (
                                incidents.map(inc => (
                                    <tr 
                                        key={inc.id} 
                                        onClick={() => {
                                            setSelectedIncident(inc);
                                            setPostmortemEdit(inc.postmortem || '');
                                        }}
                                        className="hover:bg-slate-700/30 transition cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                inc.status.toLowerCase() === 'open' ? 'bg-red-900/50 text-red-400 border border-red-900' :
                                                inc.status.toLowerCase() === 'acknowledged' ? 'bg-orange-900/50 text-orange-400 border border-orange-900' :
                                                'bg-green-900/50 text-green-400 border border-green-900'
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
                                            <div className="text-sm text-slate-400 mt-1 line-clamp-1">{inc.description}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {inc.team_name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {new Date(inc.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                {inc.status === 'OPEN' && (
                                                    <button 
                                                        onClick={() => handleAcknowledge(inc.id)}
                                                        className="text-sm bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-900/50 px-3 py-1 rounded transition"
                                                    >
                                                        Ack
                                                    </button>
                                                )}
                                                {inc.status !== 'RESOLVED' && (
                                                    <button 
                                                        onClick={() => handleResolve(inc.id)}
                                                        className="text-sm bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-900/50 px-3 py-1 rounded transition"
                                                    >
                                                        Resolve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Incident Detail Modal */}
            {selectedIncident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                        selectedIncident.status === 'OPEN' ? 'bg-red-950 text-red-400 border-red-900' :
                                        selectedIncident.status === 'ACKNOWLEDGED' ? 'bg-orange-950 text-orange-400 border-orange-900' :
                                        'bg-green-950 text-green-400 border-green-900'
                                    }`}>
                                        {selectedIncident.status}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                        selectedIncident.severity === 3 ? 'bg-red-950 text-red-400 border-red-900' :
                                        selectedIncident.severity === 2 ? 'bg-orange-950 text-orange-400 border-orange-900' :
                                        'bg-blue-950 text-blue-400 border-blue-900'
                                    }`}>
                                        P{selectedIncident.severity} - {selectedIncident.severity === 3 ? 'Critical' : selectedIncident.severity === 2 ? 'Major' : 'Minor'}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-white">Incident #{selectedIncident.id}: {selectedIncident.title}</h2>
                            </div>
                            <button 
                                onClick={() => setSelectedIncident(null)}
                                className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-700 rounded-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-slate-200 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 leading-relaxed">
                                    {selectedIncident.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-1">Team / Service</h3>
                                    <p className="text-slate-300">{selectedIncident.team_name || 'N/A'} {selectedIncident.service_name ? `(${selectedIncident.service_name})` : ''}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-1">Assignee / Ack by</h3>
                                    <p className="text-slate-300">{selectedIncident.acknowledged_by_name || 'Unassigned'}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Event Timeline</h3>
                                <div className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-blue-500"></div>
                                        <p className="text-sm font-medium text-slate-200">Incident Created</p>
                                        <p className="text-xs text-slate-500">{new Date(selectedIncident.created_at).toLocaleString()}</p>
                                    </div>
                                    
                                    {selectedIncident.acknowledged_at && (
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-orange-500"></div>
                                            <p className="text-sm font-medium text-slate-200">Acknowledged by {selectedIncident.acknowledged_by_name}</p>
                                            <p className="text-xs text-slate-500">{new Date(selectedIncident.acknowledged_at).toLocaleString()}</p>
                                        </div>
                                    )}

                                    {selectedIncident.resolved_at && (
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-emerald-500"></div>
                                            <p className="text-sm font-medium text-slate-200">Resolved</p>
                                            <p className="text-xs text-slate-500">{new Date(selectedIncident.resolved_at).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700/50">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Postmortem / Notes</h3>
                                <textarea 
                                    value={postmortemEdit}
                                    onChange={e => setPostmortemEdit(e.target.value)}
                                    placeholder="Add root cause, impact, and follow-up actions..."
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-blue-500 min-h-[100px] text-sm"
                                />
                                <div className="flex justify-end mt-2">
                                    <button 
                                        onClick={handleSavePostmortem}
                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                                    >
                                        Save Notes
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900/50 border-t border-slate-700 flex justify-end gap-3">
                            {selectedIncident.status === 'OPEN' && (
                                <button 
                                    onClick={() => handleAcknowledge(selectedIncident.id)}
                                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition shadow-lg shadow-orange-900/20"
                                >
                                    Acknowledge
                                </button>
                            )}
                            {selectedIncident.status !== 'RESOLVED' && (
                                <button 
                                    onClick={() => handleResolve(selectedIncident.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition shadow-lg shadow-emerald-900/20"
                                >
                                    Resolve Incident
                                </button>
                            )}
                            <button 
                                onClick={() => setSelectedIncident(null)}
                                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
