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

export default function Dashboard() {
  const [showMenu, setShowMenu] = useState(false);
  const [initials, setInitials] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

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
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
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
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg border border-slate-700 shadow-lg z-50">
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
          <p className="text-slate-400">Dashboard content coming soon...</p>
        </div>
      </div>
    </div>
  );
}
