import { FormEvent, useState } from 'react';
import { LockKeyhole, LogIn, Mail, ShieldCheck, UserRound } from 'lucide-react';

type AuthRole = 'admin' | 'seller';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  image?: string | null;
  cart?: string[];
  role: 'member' | 'seller' | 'admin';
  status: string;
}

export interface AuthSession {
  token: string;
  tokenType?: string;
  expiresIn?: string;
  user: AuthUser;
}

interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
  requiredRole: AuthRole;
}

export default function LoginPage({ onLogin, requiredRole }: LoginPageProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const portalLabel = requiredRole === 'admin' ? 'Admin' : 'Seller';
  const loginUrl = `http://localhost:3000/${requiredRole}/auth/login`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Dang nhap that bai.');
      }

      if (data.user?.role !== requiredRole) {
        throw new Error(`Tai khoan nay khong co quyen ${portalLabel}.`);
      }

      if (!data['jwt-token']) {
        throw new Error('Dang nhap thanh cong nhung server khong tra ve jwt-token.');
      }

      onLogin({
        token: data['jwt-token'],
        tokenType: data.tokenType,
        expiresIn: data.expiresIn,
        user: data.user,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Khong the dang nhap.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="analytics-typography min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      <section className="hidden lg:flex flex-1 bg-slate-950 text-white px-14 py-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xl">V</div>
          <div>
            <h1 className="text-lg font-extrabold">Velocart {portalLabel}</h1>
            <p className="text-xs text-slate-400 font-semibold">Operations control center</p>
          </div>
        </div>

        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-200 border border-blue-400/20 text-xs font-bold mb-6">
            <ShieldCheck className="w-4 h-4" />
            Role based access
          </div>
          <h2 className="text-4xl font-black leading-tight mb-5">
            Dang nhap {portalLabel} de quan ly san pham, don hang va khach hang.
          </h2>
          <p className="text-sm leading-6 text-slate-300 max-w-lg">
            He thong chi chap nhan tai khoan co role {requiredRole} tai cong dang nhap nay.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          {['Products', 'Orders', 'Support'].map((item) => (
            <div key={item} className="border border-white/10 bg-white/5 rounded-lg px-4 py-3">
              <span className="block text-slate-400 font-semibold">Module</span>
              <span className="block mt-1 font-extrabold">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full lg:w-[480px] bg-white border-l border-slate-200 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white">V</div>
            <div>
              <h1 className="text-base font-extrabold">Velocart {portalLabel}</h1>
              <p className="text-xs text-slate-400 font-semibold">Dang nhap he thong</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-xs font-extrabold text-blue-600 uppercase mb-2">Welcome back</p>
            <h2 className="text-2xl font-black text-slate-950">Dang nhap {portalLabel}</h2>
            <p className="text-sm text-slate-500 mt-2">Chi tai khoan co role {requiredRole} moi duoc truy cap.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-extrabold text-slate-700 mb-1.5">Username hoac email</span>
              <div className="relative">
                <UserRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={usernameOrEmail}
                  onChange={(event) => setUsernameOrEmail(event.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder={requiredRole === 'admin' ? 'admin' : 'seller_demo'}
                  autoCapitalize="none"
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-xs font-extrabold text-slate-700 mb-1.5">Password</span>
              <div className="relative">
                <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  className="w-full h-11 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="Nhap password"
                  autoComplete="current-password"
                />
              </div>
            </label>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-blue-600 text-white text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Dang dang nhap...' : 'Dang nhap'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
            <Mail className="w-3.5 h-3.5" />
            {loginUrl}
          </div>
        </div>
      </section>
    </main>
  );
}

