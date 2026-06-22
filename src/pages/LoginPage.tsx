import React, { useState } from 'react';
import { ShieldIcon, Loader2Icon, ArrowRightIcon, LockIcon, MusicIcon } from 'lucide-react';
import vcpmcLogo from '../assets/vcpmc-logo-animated.webp';
import { useAuth } from '../lib/auth';
import { Modal } from '../components/app-ui/Modal';
import { Button } from '../components/app-ui/Button';
import { Input } from '../components/app-ui/Input';
import { Checkbox } from '../components/app-ui/Checkbox';
export function LoginPage() {
  const { devLogin, login, demoLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const showDevLogin = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };
  const handleDevLogin = async () => {
    setError('');
    setDevLoading(true);
    try {
      await devLogin();
    } catch (err: any) {
      setError(err.message);
      setDevLoading(false);
    }
  };
  const handleDemoLogin = async () => {
    setError('');
    setUsername('demo@vcpmc.local');
    setPassword('admin');
    setDemoLoading(true);
    try {
      await demoLogin();
    } catch (err: any) {
      setError(err.message);
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#050505]">
      {/* Aurora glows — indigo + emerald */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[640px] w-[640px] rounded-full bg-indigo-600/25"
        style={{ filter: 'blur(120px)' }}
      />
      <div
        aria-hidden
        className="absolute top-[12%] left-[18%] h-[320px] w-[320px] rounded-full bg-emerald-500/15"
        style={{ filter: 'blur(100px)' }}
      />
      <div
        aria-hidden
        className="absolute bottom-[8%] right-[14%] h-[360px] w-[360px] rounded-full bg-violet-600/20"
        style={{ filter: 'blur(110px)' }}
      />

      {/* Faint grid lines for depth */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          {/* Logo with animated indigo→emerald glow ring */}
          <div className="relative mx-auto mb-6 inline-flex">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-indigo-500 to-emerald-400 opacity-40 blur-xl animate-pulse" />
            <div className="relative h-24 w-24 rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
              <img src={vcpmcLogo} alt="VCPMC" className="h-full w-full object-cover" />
            </div>
          </div>

          {/* Equalizer bars */}
          <div className="mt-1 mb-5 flex items-end justify-center gap-1 h-6">
            <span className="w-1 rounded-full bg-indigo-400 h-3 animate-bounce" style={{ animationDelay: '0.1s' }} />
            <span className="w-1 rounded-full bg-indigo-300 h-6 animate-bounce" style={{ animationDelay: '0.3s' }} />
            <span className="w-1 rounded-full bg-emerald-400 h-4 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 rounded-full bg-emerald-300 h-5 animate-bounce" style={{ animationDelay: '0.4s' }} />
            <span className="w-1 rounded-full bg-indigo-500 h-2 animate-bounce" style={{ animationDelay: '0.15s' }} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 ring-1 ring-white/10 backdrop-blur-md">
            <MusicIcon className="h-3 w-3 text-emerald-300" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-300 uppercase">
              Quyền tác giả Âm nhạc Việt Nam
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
            Hệ thống quản lý{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-emerald-300">
              Quyền tác giả
            </span>
          </h1>
          <p className="mt-2 text-zinc-400 text-sm">
            Hợp đồng và giấy chứng nhận — minh bạch, bảo mật, chuyên nghiệp.
          </p>
        </div>

        <div className="relative bg-zinc-900/70 backdrop-blur-xl rounded-2xl ring-1 ring-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] p-7 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
          <form onSubmit={handleSubmit} className="space-y-5">
            {error &&
            <div className="p-3 rounded-lg bg-rose-500/10 ring-1 ring-rose-400/30 text-rose-200 text-sm flex items-start gap-2">
                <ShieldIcon className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            }

            <div>
              <label className="block text-[12px] font-semibold text-zinc-300 mb-1.5 tracking-wide">
                Tài khoản
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-zinc-950/60 text-white ring-1 ring-white/10 hover:ring-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 transition-shadow placeholder:text-zinc-500 text-sm"
                placeholder="admin@vcpmc.org" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-semibold text-zinc-300 tracking-wide">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-indigo-300 hover:text-indigo-200 hover:underline transition-colors font-medium">
                  Quên mật khẩu?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-zinc-950/60 text-white ring-1 ring-white/10 hover:ring-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 transition-shadow placeholder:text-zinc-500 text-sm"
                placeholder="••••••••" />
            </div>

            <div className="flex items-center">
              <Checkbox
                checked={remember}
                onChange={setRemember}
                label={
                <span className="text-zinc-300 text-sm">
                    Ghi nhớ đăng nhập
                  </span>
                } />
            </div>

            <button
              type="submit"
              disabled={loading || devLoading || demoLoading}
              className="group w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 active:from-indigo-600 active:to-emerald-600 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_-8px_rgba(99,102,241,0.6)] ring-1 ring-inset ring-white/15">
              {loading ?
              <Loader2Icon className="h-4 w-4 animate-spin" /> :
              <>
                  Đăng nhập <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              }
            </button>

            <button
              type="button"
              disabled={loading || devLoading || demoLoading}
              onClick={handleDemoLogin}
              className="w-full h-10 rounded-lg bg-white text-zinc-900 hover:bg-zinc-100 font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_-8px_rgba(255,255,255,0.25)]">
              {demoLoading ?
              <Loader2Icon className="h-4 w-4 animate-spin" /> :
              <>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  Preview UI / Demo Mode
                </>
              }
            </button>

            {showDevLogin &&
            <button
              type="button"
              disabled={loading || devLoading || demoLoading}
              onClick={handleDevLogin}
              className="w-full h-10 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ring-1 ring-white/10">
              {devLoading ?
              <Loader2Icon className="h-4 w-4 animate-spin" /> :
              <>
                  Dev UI validation login <ShieldIcon className="h-4 w-4" />
                </>
              }
            </button>
            }

          </form>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-500">
          <p>Đăng nhập bằng tài khoản hiện có trong hệ thống.</p>
        </div>
      </div>

      <ForgotPasswordModal
        open={showForgot}
        onClose={() => setShowForgot(false)} />
    </div>);

}
function ForgotPasswordModal({
  open,
  onClose



}: {open: boolean;onClose: () => void;}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };
  return (
    <Modal open={open} onClose={onClose} title="Quên mật khẩu" maxWidth="sm">
      <div className="p-6">
        {submitted ?
        <div className="text-center py-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <LockIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 mb-2">
              Kiểm tra email
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã
              được gửi.
            </p>
            <Button variant="primary" className="w-full" onClick={onClose}>
              Đóng
            </Button>
          </div> :

        <form onSubmit={handleSubmit}>
            <p className="text-sm text-zinc-500 mb-4">
              Nhập email liên kết với tài khoản của bạn để nhận hướng dẫn đặt
              lại mật khẩu.
            </p>
            <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@vcpmc.org"
            className="mb-6" />
          
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                Gửi hướng dẫn
              </Button>
            </div>
          </form>
        }
      </div>
    </Modal>);

}
