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
    setDemoLoading(true);
    try {
      await demoLogin();
    } catch (err: any) {
      setError(err.message);
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#faf6ee] via-[#fcfaf5] to-[#f2ecd9]">
      {/* Soft rose-gold ambient glows */}
      <div
        aria-hidden
        className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-[#e8c4a0]/40"
        style={{ filter: 'blur(80px)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-[#c89968]/25"
        style={{ filter: 'blur(90px)' }}
      />

      {/* Decorative flowing gold lines */}
      <div aria-hidden className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="xMidYMid slice">
          <path d="M0 200C300 100 600 300 1200 200M0 400C300 300 600 500 1200 400M0 600C300 500 900 700 1200 600" stroke="#c89968" strokeWidth="1" />
        </svg>
      </div>

      {/* Subtle staff lines (music) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 opacity-[0.10] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 6px, #c89968 6px, #c89968 7px)',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          {/* Music motif — VCPMC logo as the treble clef on a 5-line staff */}
          <div className="relative mx-auto h-24 w-full max-w-[320px] mb-5">
            {/* Staff lines (full width, behind logo) */}
            <svg viewBox="0 0 320 96" fill="none" className="absolute inset-0 w-full h-full" aria-hidden preserveAspectRatio="none">
              <g stroke="#c89968" strokeOpacity="0.4" strokeWidth="0.6">
                <line x1="0" y1="36" x2="320" y2="36" />
                <line x1="0" y1="46" x2="320" y2="46" />
                <line x1="0" y1="56" x2="320" y2="56" />
                <line x1="0" y1="66" x2="320" y2="66" />
                <line x1="0" y1="76" x2="320" y2="76" />
              </g>
            </svg>

            {/* Notes & sparkles overlay */}
            <svg viewBox="0 0 320 96" fill="none" className="absolute inset-0 w-full h-full" aria-hidden>
              {/* Notes left */}
              <g fill="#c89968">
                <ellipse cx="40" cy="64" rx="5" ry="3.6" transform="rotate(-20 40 64)" />
                <rect x="43.5" y="40" width="1.2" height="24" />
                <ellipse cx="78" cy="58" rx="5" ry="3.6" transform="rotate(-20 78 58)" />
                <rect x="81.5" y="32" width="1.2" height="26" />
                <path d="M44.5 40 Q 63 30, 82.5 32" stroke="#c89968" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </g>
              {/* Notes right */}
              <g fill="#c89968">
                <ellipse cx="240" cy="64" rx="5" ry="3.6" transform="rotate(-20 240 64)" />
                <rect x="243.5" y="40" width="1.2" height="24" />
                <ellipse cx="278" cy="58" rx="5" ry="3.6" transform="rotate(-20 278 58)" />
                <rect x="281.5" y="32" width="1.2" height="26" />
                <path d="M244.5 40 Q 263 30, 282.5 32" stroke="#c89968" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </g>
              {/* Sparkles */}
              <g fill="#e8c4a0">
                <circle cx="14" cy="14" r="1.2" />
                <circle cx="22" cy="86" r="0.9" />
                <circle cx="110" cy="10" r="0.8" />
                <circle cx="210" cy="86" r="1" />
                <circle cx="300" cy="12" r="1.2" />
                <circle cx="310" cy="68" r="0.8" />
                <circle cx="6" cy="50" r="0.9" />
              </g>
            </svg>

            {/* VCPMC logo centered as the clef */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-[#9c6d3e]/30 ring-1 ring-inset ring-[#c89968]/60 overflow-hidden">
              <img src={vcpmcLogo} alt="VCPMC" className="h-full w-full object-cover" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#c89968] shadow-[0_0_10px_rgba(200,153,104,0.9)]" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c89968]/10 border border-[#c89968]/25">
            <MusicIcon className="h-3 w-3 text-[#9c6d3e]" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#9c6d3e] uppercase">
              Quyền tác giả Âm nhạc Việt Nam
            </span>
          </div>
          <p className="mt-3 text-[#6b6661] text-sm">
            Hệ thống quản lý hợp đồng và giấy chứng nhận
          </p>
        </div>

        <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl ring-1 ring-[#e3d2b3] shadow-[0_20px_50px_-20px_rgba(200,153,104,0.25)] p-7 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c89968]/60 to-transparent" />
          <form onSubmit={handleSubmit} className="space-y-5">
            {error &&
            <div className="p-3 rounded-lg bg-rose-50 ring-1 ring-rose-200/70 text-rose-700 text-sm flex items-start gap-2">
                <ShieldIcon className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            }

            <div>
              <label className="block text-[12px] font-semibold text-[#5a5450] mb-1.5 tracking-wide">
                Tài khoản
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white text-[#2d2926] ring-1 ring-[#e3d2b3] hover:ring-[#c89968]/60 focus:outline-none focus:ring-2 focus:ring-[#c89968]/50 transition-shadow placeholder:text-[#a89888] text-sm"
                placeholder="admin@vcpmc.org" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-semibold text-[#5a5450] tracking-wide">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-[#9c6d3e] hover:text-[#7a4a22] hover:underline transition-colors font-medium">
                  Quên mật khẩu?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white text-[#2d2926] ring-1 ring-[#e3d2b3] hover:ring-[#c89968]/60 focus:outline-none focus:ring-2 focus:ring-[#c89968]/50 transition-shadow placeholder:text-[#a89888] text-sm"
                placeholder="••••••••" />
            </div>

            <div className="flex items-center">
              <Checkbox
                checked={remember}
                onChange={setRemember}
                label={
                <span className="text-[#5a5450] text-sm">
                    Ghi nhớ đăng nhập
                  </span>
                } />
            </div>

            <button
              type="submit"
              disabled={loading || devLoading || demoLoading}
              className="group w-full h-11 rounded-xl bg-gradient-to-r from-[#c89968] to-[#9c6d3e] hover:from-[#d4a878] hover:to-[#a87a4a] active:from-[#b88858] active:to-[#8a5d33] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_25px_-5px_rgba(200,153,104,0.5)] ring-1 ring-inset ring-[#f0d4a8]/50">
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
              className="w-full h-10 rounded-lg bg-[#101816] hover:bg-[#0a1210] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ring-1 ring-[#101816]/20 shadow-[0_8px_20px_-8px_rgba(16,24,22,0.5)]">
              {demoLoading ?
              <Loader2Icon className="h-4 w-4 animate-spin" /> :
              <>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  Preview UI / Demo Mode
                </>
              }
            </button>

            {showDevLogin &&
            <button
              type="button"
              disabled={loading || devLoading || demoLoading}
              onClick={handleDevLogin}
              className="w-full h-10 rounded-lg bg-white hover:bg-[#fcfaf5] text-[#9c6d3e] font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ring-1 ring-[#e3d2b3] hover:ring-[#c89968]/60">
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

        <div className="mt-8 text-center text-xs text-[#9c8569]">
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
