import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700 space-y-8">
          
          {/* Notifications Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Notifications</h2>
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium">Email Alerts</p>
                <p className="text-sm text-gray-400">Receive emails for critical incidents</p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  emailNotifications ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    emailNotifications ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Appearance Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Appearance</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-gray-700'
                      : 'border-gray-600 bg-gray-700/30 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-600"></div>
                  <span className="text-sm font-medium">Dark Mode</span>
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    theme === 'light'
                      ? 'border-blue-500 bg-gray-100 text-gray-900'
                      : 'border-gray-600 bg-gray-700/30 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-300"></div>
                  <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Light Mode</span>
                </button>
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-gray-700">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
