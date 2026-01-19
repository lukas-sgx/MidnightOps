import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

type Metrics = {
    totalUsers: number;
    activeUsers: number;
    deployments: number;
    uptime: number;
    errors24h: number;
    cpu: number;
    memory: number;
    lastUpdated: string;
};

type Incident = {
    id: string;
    title: string;
    status: 'OPEN' | 'ACKED' | 'RESOLVED';
    severity: 1 | 2 | 3;
    createdAt: string;
};

type Alert = {
    id: string | number;
    message: string;
    type: 'info' | 'warning' | 'error';
    timestamp: string;
};

function normalizeMetrics(data: any): Metrics {
    const toIsoDate = (timestamp: any) => {
        if (timestamp === undefined || timestamp === null) return new Date().toISOString();

        const numericTs = Number(timestamp);
        if (Number.isFinite(numericTs)) {
            const ms = numericTs > 1e12 ? numericTs : numericTs * 1000;
            return new Date(ms).toISOString();
        }

        const parsedDate = new Date(timestamp);
        return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
    };

    return {
        totalUsers: data?.totalUsers ?? 128,
        activeUsers: data?.activeUsers ?? 37,
        deployments: data?.deployments ?? 12,
        uptime: Number(data?.uptime) || 0,
        errors24h: data?.errors ?? 2,
        cpu: data?.cpu ?? 34,
        memory: data?.memory ?? 61,
        lastUpdated: toIsoDate(data?.timestamp),
    };
}

function formatUptime(seconds: number) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}


async function fetchIncidents(): Promise<Incident[]> {
    try {
        const res = await fetch('/api/v1/incidents', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        if (!res.ok) throw new Error('Failed to fetch incidents');
        const json = await res.json();
        
        return (json.incidents || []).map((inc: any) => ({
            id: inc.id,
            title: inc.title,
            status: inc.status,
            severity: inc.severity,
            createdAt: inc.created_at || inc.createdAt || inc
        }));
    } catch (err) {
        console.error('Error fetching incidents:', err);
        return [];
    }
}

async function fetchAlerts(): Promise<Alert[]> {
    try {
        const res = await fetch('/api/v1/alerts', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        if (!res.ok) throw new Error('Failed to fetch alerts');
        const json = await res.json();
        
        return (json.alerts || []).map((alert: any) => {
            let displayMessage = alert.message || `Alert ${alert.correlation_key || alert.external_id || alert.source || 'Unknown'}`;
            if (!alert.message && alert.payload && alert.payload.metric) {
                displayMessage = `${alert.payload.metric}: ${alert.payload.value}`;
            } else if (!alert.message && alert.payload && alert.payload.status) {
                displayMessage = `${alert.correlation_key || alert.external_id}: ${alert.payload.status}`;
            }
            let severity: 'info' | 'warning' | 'error' = 'info';
            if (alert.severity) {
                 if (String(alert.severity) === 'critical' || String(alert.severity) === 'high' || alert.severity === 1) severity = 'error';
                 else if (String(alert.severity) === 'warning' || String(alert.severity) === 'medium' || alert.severity === 2) severity = 'warning';
            } else if (alert.status === 'OPEN') {
                severity = 'error';
            } else if (alert.status === 'CLOSED') {
                severity = 'info';
            }

            return {
                id: alert.id,
                message: displayMessage,
                type: severity,
                timestamp: alert.created_at || new Date().toISOString(),
            };
        });
    } catch (err) {
        console.error('Error fetching alerts:', err);
        return [];
    }
}

async function fetchMetrics(): Promise<Metrics | null> {
    try {
        const res = await fetch('/api/v1/metrics', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        if (!res.ok) throw new Error('Failed to fetch metrics');
        const json = await res.json();
        return normalizeMetrics(json);
    } catch (err) {
        console.error('Error fetching metrics:', err);
        return normalizeMetrics(null);
    }
}

export default function Dashboard() {
    const [showMenu, setShowMenu] = useState(false);
    const [initials, setInitials] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [metricsLoading, setMetricsLoading] = useState(true);
    const [metricsError, setMetricsError] = useState<string | null>(null);

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);

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

    useEffect(() => {
        setMetricsLoading(true);
        
        fetchIncidents().then(setIncidents);
        fetchAlerts().then(setAlerts);

        fetchMetrics()
            .then(m => setMetrics(m))
            .catch(err => setMetricsError(String(err)))
            .finally(() => setMetricsLoading(false));

        const interval = setInterval(() => {
            fetchMetrics()
                .then(m => setMetrics(m))
                .catch(err => setMetricsError(String(err)));
        }, 10000);

        return () => clearInterval(interval);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="mx-auto max-w-7xl px-10 py-8">
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
            
                {/* Section Incidents & Alertes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    
                    {/* Incidents Panel */}
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-white">Active Incidents 🚨</h2>
                            <button className="text-sm text-blue-400 hover:text-blue-300 transition" onClick={() => navigate('/incidents')}>View All</button>
                        </div>
                        
                        <div className="space-y-4">
                            {incidents.length === 0 ? (
                                <p className="text-slate-400 text-sm">No active incidents.</p>
                            ) : (
                                incidents.map((inc) => (
                                    <a href={`/incidents`} key={inc.id} className="block hover:bg-slate-700/50 rounded-lg transition">
                                    <div key={inc.id} className="bg-slate-900/40 border border-slate-700 rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                    inc.severity === 3 ? 'bg-red-900/50 text-red-400 border border-red-900' :
                                                    inc.severity === 2 ? 'bg-orange-900/50 text-orange-400 border border-orange-900' :
                                                    'bg-blue-900/50 text-blue-400 border border-blue-900'
                                                }`}>
                                                    {inc.severity === 3 ? 'Critical' : inc.severity === 2 ? 'Major' : 'Minor'}
                                                </span>
                                                <span className="text-slate-500 text-xs">{inc.id}</span>
                                            </div>
                                            <p className="text-white font-medium">{inc.title}</p>
                                            <p className="text-slate-400 text-xs mt-1">Opened: {new Date(inc.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-semibold ${
                                                inc.status === 'RESOLVED' ? 'text-emerald-400' : inc.status === 'ACKED' ? 'text-amber-400' : 'text-red-400'
                                            }`}>
                                                {inc.status}
                                            </span>
                                        </div>
                                    </div>
                                    </a>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Alerts Panel */}
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-white">Recent Alerts 🔔</h2>
                            <button className="text-sm text-slate-400 hover:text-white transition" onClick={() => {setAlerts([]);}}>Clear</button>
                        </div>

                        <div className="space-y-0 divide-y divide-slate-700/50 pannel">
                            {alerts.length === 0 ?
                                (
                                    <div className="py-3 flex items-center justify-center align-middle">
                                        <p className="text-slate-400 text-xl text-center">No recent alerts.</p>
                                    </div>
                                )
                                : alerts.map((alert) => (
                                    <div key={alert.id} className="py-3 flex items-start gap-3">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                            alert.type === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                                                alert.type === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                                                'bg-blue-500'
                                            }`} />
                                            <div className="flex-1">
                                                <p className="text-slate-200 text-sm">{alert.message}</p>
                                                <p className="text-slate-500 text-xs mt-0.5">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    )
                                )
                            }
                        </div>
                    </div>
                </div>
                {/* Section Metrics */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white">Metrics 📈</h2>
                        <p className="text-sm text-slate-400">
                            {metrics?.lastUpdated ? `Dernière mise à jour: ${new Date(metrics.lastUpdated).toLocaleString()}` : '—'}
                        </p>
                    </div>

                    {metricsLoading ? (
                        <div className="text-slate-300">Loading metrics…</div>
                    ) : metricsError ? (
                        <div className="text-red-400">Errors: {metricsError}</div>
                    ) : metrics ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-5">
                                <p className="text-slate-400 text-sm">Users</p>
                                <p className="text-3xl font-bold text-white">{metrics.totalUsers}</p>
                                <p className="text-slate-500 text-xs mt-1">{metrics.activeUsers} online</p>
                            </div>

                            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-5">
                                <p className="text-slate-400 text-sm">Deployments</p>
                                <p className="text-3xl font-bold text-white">{metrics.deployments}</p>
                                <p className="text-slate-500 text-xs mt-1">last 24h</p>
                            </div>

                            {/* Uptime */}
                            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-5">
                                <p className="text-slate-400 text-sm">Uptime</p>
                                <p className="text-3xl font-bold text-white">{formatUptime(metrics.uptime)}</p>
                            </div>

                            {/* Erreurs 24h */}
                            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-5">
                                <p className="text-slate-400 text-sm">Errors (24h)</p>
                                <p className="text-3xl font-bold text-white">{metrics.errors24h}</p>
                            </div>

                            {/* CPU */}
                            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-5">
                                <p className="text-slate-400 text-sm">CPU</p>
                                <p className="text-3xl font-bold text-white">{metrics.cpu}%</p>
                                <div className="mt-2 h-2 w-full bg-slate-700 rounded">
                                    <div
                                        className={`h-2 rounded ${metrics.cpu > 75 ? 'bg-red-500' : metrics.cpu > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${metrics.cpu}%` }}
                                    />
                                </div>
                            </div>

                            {/* RAM */}
                            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-5">
                                <p className="text-slate-400 text-sm">RAM</p>
                                <p className="text-3xl font-bold text-white">{metrics.memory}%</p>
                                <div className="mt-2 h-2 w-full bg-slate-700 rounded">
                                    <div
                                        className={`h-2 rounded ${metrics.memory > 75 ? 'bg-red-500' : metrics.memory > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${metrics.memory}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-300">No metrics available.</div>
                    )}
                </div>
            </div>
        </div>
    );
}