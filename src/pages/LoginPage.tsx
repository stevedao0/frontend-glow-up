import React, { useState } from 'react';
import { ShieldIcon, Loader2Icon, ArrowRightIcon, LockIcon, MusicIcon } from 'lucide-react';
import vcpmcLogo from '../assets/vcpmc-logo-animated.webp';
import { useAuth } from '../lib/auth';
import { Modal } from '../components/app-ui/Modal';
import { Button } from '../components/app-ui/Button';
import { Input } from '../components/app-ui/Input';
import { Checkbox } from '../components/app-ui/Checkbox';
export function LoginPage() {
  const { devLogin, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
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
          <div className="relative inline-flex h-16 w-16 rounded-2xl bg-white items-center justify-center shadow-lg shadow-[#9c6d3e]/25 mb-5 ring-1 ring-inset ring-[#c89968]/50 overflow-hidden">
            <img src={vcpmcLogo} alt="VCPMC" className="h-full w-full object-cover" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#c89968] shadow-[0_0_8px_rgba(200,153,104,0.9)]" />
          </div>

          {/* Music motif — treble clef + scattered notes & sparkles */}
          <div className="relative mx-auto h-14 w-full max-w-[220px] mb-3">
            <svg viewBox="0 0 220 56" fill="none" className="w-full h-full" aria-hidden>
              {/* Staff lines */}
              <g stroke="#c89968" strokeOpacity="0.35" strokeWidth="0.6">
                <line x1="0" y1="18" x2="220" y2="18" />
                <line x1="0" y1="26" x2="220" y2="26" />
                <line x1="0" y1="34" x2="220" y2="34" />
                <line x1="0" y1="42" x2="220" y2="42" />
              </g>
              {/* Treble clef (centered) */}
              <g transform="translate(102, 8)" stroke="#9c6d3e" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 0 C 14 6, 14 16, 8 22 C 2 28, 2 38, 8 42 C 14 44, 18 40, 16 34 C 14 28, 6 28, 6 36 C 6 42, 12 46, 16 44" />
                <line x1="9" y1="2" x2="9" y2="46" />
                <circle cx="9" cy="48" r="1.6" fill="#9c6d3e" />
              </g>
              {/* Notes left */}
              <g fill="#c89968">
                <circle cx="40" cy="34" r="3.2" />
                <rect x="42.6" y="20" width="0.9" height="14" />
                <circle cx="64" cy="30" r="3.2" />
                <rect x="66.6" y="14" width="0.9" height="16" />
              </g>
              {/* Notes right */}
              <g fill="#c89968">
                <circle cx="160" cy="34" r="3.2" />
                <rect x="162.6" y="20" width="0.9" height="14" />
                <circle cx="184" cy="30" r="3.2" />
                <rect x="186.6" y="14" width="0.9" height="16" />
                <path d="M43.5 20 Q 56 14, 67.5 14" stroke="#c89968" strokeWidth="1" fill="none" />
                <path d="M163.5 20 Q 176 14, 187.5 14" stroke="#c89968" strokeWidth="1" fill="none" />
              </g>
              {/* Sparkles */}
              <g fill="#e8c4a0">
                <circle cx="20" cy="10" r="0.9" />
                <circle cx="30" cy="48" r="0.7" />
                <circle cx="80" cy="6" r="0.6" />
                <circle cx="140" cy="50" r="0.8" />
                <circle cx="200" cy="8" r="0.9" />
                <circle cx="210" cy="40" r="0.6" />
                <circle cx="6" cy="30" r="0.7" />
              </g>
            </svg>
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
              disabled={loading || devLoading}
              className="group w-full h-11 rounded-xl bg-gradient-to-r from-[#c89968] to-[#9c6d3e] hover:from-[#d4a878] hover:to-[#a87a4a] active:from-[#b88858] active:to-[#8a5d33] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_25px_-5px_rgba(200,153,104,0.5)] ring-1 ring-inset ring-[#f0d4a8]/50">
              {loading ?
              <Loader2Icon className="h-4 w-4 animate-spin" /> :
              <>
                  Đăng nhập <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              }
            </button>
            {showDevLogin &&
            <button
              type="button"
              disabled={loading || devLoading}
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
