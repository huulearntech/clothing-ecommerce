import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import RootLayout from '../../layouts/root.layout';
import { authService } from '../../services/auth.service';
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState<string>('');
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendMsg, setResendMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing activation token in request. Please check your activation link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await authService.verifyEmail({ token });
        setStatus('success');
        setMessage(res.message || 'Account activated successfully! You can now log in.');
      } catch (err: any) {
        setStatus('error');
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to activate account. The activation link may be invalid or expired.';
        setMessage(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResendLoading(true);
    setResendMsg(null);

    try {
      const res = await authService.resendVerification({ email: resendEmail.trim() });
      setResendMsg({ type: 'success', text: res.message });
      setResendEmail('');
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to resend activation link. Please try again.';
      setResendMsg({ type: 'error', text: Array.isArray(errMsg) ? errMsg.join(', ') : errMsg });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <RootLayout>
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Verifying Your Account
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Please wait while we validate your activation link...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-6 text-emerald-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Account Activated!
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-8 max-w-md leading-relaxed">
                {message}
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center py-4">
              <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center mb-6 text-rose-500">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Activation Failed
              </h2>
              <p className="text-rose-600 dark:text-rose-400 text-sm mb-8 max-w-md leading-relaxed">
                {message}
              </p>

              {/* Resend Activation Email Section */}
              <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-left mb-6">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm mb-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span>Request New Activation Link</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Enter your email address to receive a fresh activation link.
                </p>

                {resendMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs mb-4 ${
                      resendMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    {resendMsg.text}
                  </div>
                )}

                <form onSubmit={handleResend} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-medium rounded-xl text-xs transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {resendLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Resend Activation Link</span>
                    )}
                  </button>
                </form>
              </div>

              <Link
                to="/auth"
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          )}

        </div>
      </div>
    </RootLayout>
  );
}
