import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Policy = {
    id: number;
    name: string;
    description: string;
    service_id: number;
    service_name: string;
};

type Schedule = {
    id: number;
    name: string;
    description: string;
    team_id: number;
};

type Service = {
    id: number;
    name: string;
    description: string;
    team_name: string;
};

export default function Management() {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        const token = localStorage.getItem('authToken');
        try {
            const [pRes, sRes, svRes] = await Promise.all([
                fetch('/api/v1/escalation-policies', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/v1/oncall/schedules', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/v1/services', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (pRes.ok) setPolicies((await pRes.json()).policies || []);
            if (sRes.ok) setSchedules((await sRes.json()).schedules || []);
            if (svRes.ok) setServices((await svRes.json()).services || []);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-white">Ops Management</h1>
                    <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition">
                        &larr; Back to Dashboard
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Services */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 md:col-span-2">
                        <h2 className="text-xl font-bold text-indigo-400 mb-4">Services</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {services.map((s: Service) => (
                                <div key={s.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex justify-between items-center hover:border-indigo-500/50 transition">
                                    <div>
                                        <p className="font-semibold text-white">{s.name}</p>
                                        <p className="text-xs text-slate-500">{s.team_name || 'No team'}</p>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            if (confirm('Delete service?')) {
                                                await fetch(`/api/v1/services/${s.id}`, { 
                                                    method: 'DELETE',
                                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                                                });
                                                fetchData();
                                            }
                                        }}
                                        className="text-xs text-slate-400 hover:text-red-400"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                            <button className="p-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-900/30 transition font-medium border-dashed flex items-center justify-center gap-2">
                                + Add Service
                            </button>
                        </div>
                    </div>

                    {/* Escalation Policies */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-blue-400 mb-4">Escalation Policies</h2>
                        <div className="space-y-4">
                            {policies.map((p: Policy) => (
                                <div key={p.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-white">{p.name}</p>
                                        <p className="text-xs text-slate-500">{p.service_name || 'No service'}</p>
                                    </div>
                                    <button className="text-xs text-slate-400 hover:text-red-400">Delete</button>
                                </div>
                            ))}
                            {policies.length === 0 && <p className="text-slate-500 italic">No policies defined.</p>}
                            <button className="w-full mt-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg border border-blue-900/50 transition font-medium">
                                + Create Policy
                            </button>
                        </div>
                    </div>

                    {/* On-Call Schedules */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-emerald-400 mb-4">On-Call Schedules</h2>
                        <div className="space-y-4">
                            {schedules.map((s: Schedule) => (
                                <div key={s.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-white">{s.name}</p>
                                        <p className="text-xs text-slate-500">Schedule ID: {s.id}</p>
                                    </div>
                                    <button className="text-xs text-slate-400 hover:text-red-400">Delete</button>
                                </div>
                            ))}
                            {schedules.length === 0 && <p className="text-slate-500 italic">No schedules defined.</p>}
                            <button className="w-full mt-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg border border-emerald-900/50 transition font-medium">
                                + Create Schedule
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
                    <p className="text-sm text-slate-400">
                        <span className="font-bold text-amber-500 mr-2">Note:</span> 
                        The background escalation worker is active and processing incidents every 60 seconds. 
                        SEV1 and SEV2 incidents follow the linked policies, while SEV3 and SEV4 notify once.
                    </p>
                </div>
            </div>
        </div>
    );
}
