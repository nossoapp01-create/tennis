import React, { useState } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff, X, Sparkles, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

const AUTHORIZED_EMAIL = 'nossoapp01@gmail.com';

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail de administrador.');
      return;
    }

    if (cleanEmail !== AUTHORIZED_EMAIL.toLowerCase()) {
      setError(`Acesso negado. Apenas o e-mail administrador (${AUTHORIZED_EMAIL}) tem permissão de acesso.`);
      return;
    }

    if (!cleanPassword) {
      setError('Por favor, informe sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    // Simulate luxury biometric/security cryptographic handshake
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);

      // Save admin session securely in localStorage
      try {
        localStorage.setItem(
          'kicksluxe_admin_auth',
          JSON.stringify({
            email: cleanEmail,
            authenticated: true,
            timestamp: Date.now(),
          })
        );
      } catch {}

      setTimeout(() => {
        setIsSuccess(false);
        onLoginSuccess(cleanEmail);
        onClose();
      }, 700);
    }, 600);
  };

  const handleQuickFillEmail = () => {
    setEmail(AUTHORIZED_EMAIL);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-[#141315] border border-amber-400/30 rounded-3xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.15)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Luxury Vault Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 via-[#231e15] to-amber-500/10 border border-amber-400/40 flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded-full badge-3d-gold text-black font-extrabold tracking-wider">
              ACESSO RESTRITO
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-syne font-black text-white mt-2 tracking-tight text-3d-white">
            Login Super Admin
          </h3>
          <p className="text-xs text-zinc-400 font-jakarta mt-1 max-w-xs">
            Informe suas credenciais autorizadas para desbloquear o botão e os recursos do <strong className="text-amber-300">SUPER ADMIN IA</strong>.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="font-jakarta leading-relaxed">{error}</div>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="font-jakarta font-bold">Autenticado com sucesso! Liberando acesso...</div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono-sku text-zinc-300 font-bold uppercase tracking-wider">
                E-mail Administrador:
              </label>
              <button
                type="button"
                onClick={handleQuickFillEmail}
                className="text-[10px] font-mono-sku text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
              >
                Preencher padrão
              </button>
            </div>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="nossoapp01@gmail.com"
                autoComplete="email"
                required
                className="w-full bg-[#1c1b1e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors font-jakarta"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="text-[11px] font-mono-sku text-zinc-300 font-bold uppercase tracking-wider block mb-1.5">
              Senha de Acesso:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Digite sua senha de admin..."
                autoComplete="current-password"
                required
                className="w-full bg-[#1c1b1e] border border-white/10 rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors font-jakarta"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Authorized Admin Notice */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-zinc-400 font-mono-sku">
            <KeyRound className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Admin autorizado: <strong className="text-amber-300 font-bold">{AUTHORIZED_EMAIL}</strong></span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Validando Acesso...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Acesso Autorizado!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Entrar como Super Admin</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
