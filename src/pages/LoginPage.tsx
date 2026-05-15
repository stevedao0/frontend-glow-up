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

          {/* Music motif — treble clef + notes on a staff */}
          <div className="relative mx-auto h-16 w-full max-w-[260px] mb-3">
            <svg viewBox="0 0 260 64" fill="none" className="w-full h-full" aria-hidden>
              {/* Staff lines */}
              <g stroke="#c89968" strokeOpacity="0.35" strokeWidth="0.6">
                <line x1="0" y1="20" x2="260" y2="20" />
                <line x1="0" y1="28" x2="260" y2="28" />
                <line x1="0" y1="36" x2="260" y2="36" />
                <line x1="0" y1="44" x2="260" y2="44" />
                <line x1="0" y1="52" x2="260" y2="52" />
              </g>

              {/* Treble clef — properly proportioned */}
              <g transform="translate(118, 2) scale(0.11)" fill="#9c6d3e">
                <path d="M119.4 0c-2.3 0-4.6.8-6.5 2.4-15.7 13-25.2 32.7-25.2 52.5 0 11.6 3 23.1 7 34.1L65.5 130c-21.7 22.2-32.5 49.3-32.5 78 0 41.7 28 76.7 67.5 87.6 4.6 22.7 9.3 45.7 12.7 68.7 1.3 9-.4 18.3-7.6 24.5-9.6 8.3-25 9.6-34.5-.5-7-7.5-3.5-19.7 5.7-23.7 4.5-2 12.4-1.4 14.4 4.3 1.5 4.3-2.5 7.6-6 9.4-3 1.5-7 2-10 .2 1.8 8 12.5 13 21 11.7 14.3-2.2 19.4-19.5 14.6-31.7-5-12.5-19.6-19.4-32.5-19.5-19.4-.3-37.7 14.7-39 34.4-1.6 22.5 19 41 41.5 41.5 23 .5 44-15.5 49.6-37.5 4.7-18.5 1-37.5-2.5-55.7l-7.7-39c4.6.6 9.3 1 14 1 49.7 0 89.5-35.7 89.5-83.5 0-37.7-22.6-66.7-56.8-83.7l-7.7-39c-2.7-13.7-3.6-30.8 6.6-41.6 4.4-4.6 11.4-7 17-3.5 9.6 5.6 9.6 19.7 5.7 28.7-4.7 11-13.6 19.6-22.4 27.4l5.7 28c19-6.7 33-23 33-44C156.5 22 138.7 0 119.4 0zm9.4 196c.3 1.5 1.3 6.5 2.6 13.5 8.6 0 16-2.7 22.4-7.6 13.7-10.4 19.4-29 13.6-44.7-4.7-12.6-17-21.6-30.5-22.5l9 60.7c-7-1-13-5-15.5-12-3-9 4-17 12-15.4 13 2.6 21.6 16.7 18.6 29.6-3 13-15.6 21-28 19.5l-4.3-21z"/>
              </g>

              {/* Notes left of clef */}
              <g fill="#c89968">
                <ellipse cx="40" cy="40" rx="4" ry="3" transform="rotate(-20 40 40)" />
                <rect x="43" y="22" width="1.1" height="18" />
                <ellipse cx="68" cy="36" rx="4" ry="3" transform="rotate(-20 68 36)" />
                <rect x="71" y="16" width="1.1" height="20" />
                <path d="M44 22 Q 58 14, 72 16" stroke="#c89968" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              </g>

              {/* Notes right of clef */}
              <g fill="#c89968">
                <ellipse cx="190" cy="40" rx="4" ry="3" transform="rotate(-20 190 40)" />
                <rect x="193" y="22" width="1.1" height="18" />
                <ellipse cx="218" cy="36" rx="4" ry="3" transform="rotate(-20 218 36)" />
                <rect x="221" y="16" width="1.1" height="20" />
                <path d="M194 22 Q 208 14, 222 16" stroke="#c89968" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              </g>

              {/* Sparkles */}
              <g fill="#e8c4a0">
                <circle cx="14" cy="10" r="1" />
                <circle cx="24" cy="58" r="0.8" />
                <circle cx="92" cy="6" r="0.7" />
                <circle cx="160" cy="58" r="0.9" />
                <circle cx="240" cy="8" r="1" />
                <circle cx="252" cy="46" r="0.7" />
                <circle cx="6" cy="34" r="0.8" />
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
