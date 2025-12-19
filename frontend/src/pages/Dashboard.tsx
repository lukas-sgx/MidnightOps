import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white justify-center flex items-center"> <img src="/midnightops.png" alt="MidnightOps Logo" className="inline-block w-9 h-9 mr-2" /> Dashboard</h1>
            <p className="text-slate-400 mt-1">Welcome to MidnightOps</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Logout
          </button>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
          <p className="text-slate-400">Dashboard content coming soon...</p>
        </div>
      </div>
    </div>
  );
}
