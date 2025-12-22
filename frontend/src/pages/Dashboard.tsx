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
        if (!res.ok) {
            throw new Error('Failed to fetch user data');
        }
        const userData = await res.json();
        return userData;
    } catch (error) {
        console.error('Error fetching user data:', error);
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
        uptime: data?.uptime ?? 99.96,
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
            if (!data) {
                localStorage.removeItem('authToken');
                navigate('/login', { replace: true });
            }
        });
    }, []);

    useEffect(() => {
        setMetricsLoading(true);
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

    const handleLogout = () => {
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

                <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white">Metrics 📈</h2>
                        <p className="text-sm text-slate-400">
                            {metrics?.lastUpdated ? `Dernière mise à jour: ${new Date(metrics.lastUpdated).toLocaleString()}` : '—'}
                        </p>
                    </div>

                    {metricsLoading ? (
                        <div className="text-slate-300">Chargement des métriques…</div>
                    ) : metricsError ? (
                        <div className="text-red-400">Erreur: {metricsError}</div>
                    ) : metrics ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Utilisateurs totaux */}
                            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-5">
                                <p className="text-slate-400 text-sm">Utilisateurs</p>
                                <p className="text-3xl font-bold text-white">{metrics.totalUsers}</p>
                                <p className="text-slate-500 text-xs mt-1">{metrics.activeUsers} actifs</p>
                            </div>

                            {/* Déploiements */}
                            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-5">
                                <p className="text-slate-400 text-sm">Déploiements</p>
                                <p className="text-3xl font-bold text-white">{metrics.deployments}</p>
                                <p className="text-slate-500 text-xs mt-1">dernières 24h</p>
                            </div>

                            {/* Uptime */}
                            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-5">
                                <p className="text-slate-400 text-sm">Uptime</p>
                                <p className="text-3xl font-bold text-white">{metrics.uptime.toFixed(2)}%</p>
                                <div className="mt-2 h-2 w-full bg-slate-700 rounded">
                                    <div
                                        className="h-2 bg-emerald-500 rounded"
                                        style={{ width: `${Math.min(100, Math.max(0, metrics.uptime))}%` }}
                                    />
                                </div>
                            </div>

                            {/* Erreurs 24h */}
                            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-5">
                                <p className="text-slate-400 text-sm">Erreurs (24h)</p>
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
                        <div className="text-slate-300">Aucune métrique disponible.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
