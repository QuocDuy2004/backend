import { FormEvent, useState } from 'react';
import { LockKeyhole, LogIn, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { authApi, getAppBaseUrl } from '../../lib/api';

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
  status?: string;
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

export function LoginPage({ onLogin, requiredRole }: LoginPageProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const portalLabel = requiredRole === 'admin' ? 'Quản trị viên' : 'Người bán';
  const portalShortLabel = requiredRole === 'admin' ? 'Admin' : 'Seller';
  const loginUrl = `${getAppBaseUrl()}/${requiredRole}/auth/login`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await authApi.login({ usernameOrEmail, password });

      if (data.user?.role !== requiredRole) {
        throw new Error(`Tài khoản này không có quyền ${portalLabel}.`);
      }

      if (!data['jwt-token']) {
        throw new Error('Đăng nhập thành công nhưng server không trả về jwt-token.');
      }

      onLogin({
        token: data['jwt-token'],
        tokenType: data.tokenType,
        expiresIn: data.expiresIn,
        user: data.user,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể đăng nhập.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="analytics-typography flex min-h-screen bg-[#F6F8FB] text-slate-900">
      <section className="relative hidden flex-1 overflow-hidden bg-slate-950 px-14 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
          <div className="absolute bottom-[-18%] right-[-8%] h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:44px_44px]" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-black shadow-lg shadow-blue-950/30">V</div>
          <div>
            <h1 className="text-lg font-extrabold">VeloCart {portalShortLabel}</h1>
            <p className="text-xs font-semibold text-slate-400">Trung tâm vận hành</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-100">
            <ShieldCheck className="w-4 h-4" />
            Truy cập theo phân quyền
          </div>
          <h2 className="mb-5 max-w-2xl text-4xl font-black leading-tight tracking-normal">
            Đăng nhập {portalLabel} để quản lý sản phẩm, đơn hàng và khách hàng.
          </h2>
          <p className="max-w-lg text-sm leading-6 text-slate-300">
            Hệ thống chỉ cho phép tài khoản có đúng vai trò truy cập vào cổng này. Mọi thao tác quản trị được ghi nhận để đảm bảo an toàn vận hành.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-3 text-xs">
          {[
            ['Sản phẩm', 'Kho hàng'],
            ['Đơn hàng', 'Thanh toán'],
            ['Hỗ trợ', 'Khách hàng'],
          ].map(([title, subtitle]) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm backdrop-blur">
              <span className="block font-semibold text-slate-400">{subtitle}</span>
              <span className="mt-1 block font-extrabold">{title}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex w-full items-center justify-center border-l border-slate-200 bg-white p-5 sm:p-8 lg:w-[500px]">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-sm">V</div>
            <div>
              <h1 className="text-base font-extrabold">VeloCart {portalShortLabel}</h1>
              <p className="text-xs font-semibold text-slate-400">Đăng nhập hệ thống</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-xs font-extrabold uppercase text-blue-600">Chào mừng quay lại</p>
            <h2 className="text-3xl font-black text-slate-950">Đăng nhập {portalLabel}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Chỉ tài khoản có vai trò <span className="font-bold text-slate-700">{requiredRole}</span> mới được truy cập cổng này.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold text-slate-700">Tên đăng nhập hoặc email</span>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={usernameOrEmail}
                  onChange={(event) => setUsernameOrEmail(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder={requiredRole === 'admin' ? 'admin' : 'seller_demo'}
                  autoCapitalize="none"
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold text-slate-700">Mật khẩu</span>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{loginUrl}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
