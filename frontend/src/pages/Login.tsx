import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [verifcode, setVerifcode] = useState(false);
    const [code, setCode] = useState('');
    const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem('authToken')) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            setVerifcode(true);
            setLoading(false);
            const response = await fetch(`/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        }
    };

    const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch(`/api/v1/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed, please try again later.');
            }

            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard')
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (val: string, idx: number) => {
        if (!/^\d?$/.test(val)) return;
        const arr = code.split('').slice(0, 6);
        arr[idx] = val;
        const merged = arr.join('').padEnd(6, '').slice(0, 6);
        setCode(merged);
        if (val && idx < 5) codeRefs.current[idx + 1]?.focus();
    };

    const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
        if (e.key === 'Backspace' && !code[idx] && idx > 0) {
            codeRefs.current[idx - 1]?.focus();
        }
    };

    const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        setCode(pasted);
        codeRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 justify-center flex items-center"><img src="/midnightops.png" alt="MidnightOps Logo" className="inline-block w-10 h-10 mr-2" /> MidnightOps</h1>
                    <p className="text-slate-400">Incident Management System</p>
                </div>

                {/* Form Card */}
                <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
                    <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                        Welcome Back
                    </h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                            <p className="text-green-300 text-sm">Login successful! Redirecting...</p>
                        </div>
                    )}

                    <form onSubmit={!verifcode ? handleSubmit : handleVerifyCode} className="space-y-5">
                        {verifcode ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Verification Code
                                </label>
                                <div className="flex justify-between gap-2">
                                    {[0,1,2,3,4,5].map(i => (
                                        <input
                                            key={i}
                                            ref={(el) => { codeRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={code[i] ?? ''}
                                            onChange={(e) => handleCodeChange(e.target.value, i)}
                                            onKeyDown={(e) => handleCodeKeyDown(e, i)}
                                            onPaste={handleCodePaste}
                                            className="w-12 h-12 text-center text-xl font-semibold bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition"
                                            disabled={loading}
                                            autoComplete="one-time-code"
                                        />
                                    ))}
                                </div>
                                <p className="text-slate-500 text-xs mt-2">Enter the 6-digit code sent to your email.</p>
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@epitech.eu"
                                    autoComplete="email"
                                    required
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition"
                                />
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading || (!verifcode ? !email : code.length !== 6)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {verifcode ? 'Verifying...' : 'Sending...'}
                                </>
                            ) : (
                                verifcode ? 'Verify Code' : 'Send Code'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 text-sm mt-6">
                        Use your Epitech email to log in
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-xs mt-8">
                    © 2025 - {new Date().getFullYear()} MidnightOps. All rights reserved.
                </p>
            </div>
        </div>
    );
}
