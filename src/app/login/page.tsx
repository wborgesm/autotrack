"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Wrench, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModernLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 to-gray-700">
      {/* Lado esquerdo - Ilustração / Boas-vindas */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden p-12">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-20 w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white" />
          <div className="absolute top-1/3 right-20 w-48 h-48 rounded-full bg-white" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full text-white">
          <div>
            {/* Logo completa */}
            <div className="mb-8">
              <img 
                src="https://autotrack.pt/gps/img/logoatpng.png" 
                alt="Autotrack" 
                className="h-24 w-auto object-contain filter brightness(0) dark:filter dark:brightness(100)"
              />
            </div>

            <h1 className="text-4xl font-bold leading-tight mb-4">
              Gestão inteligente<br />para a sua oficina
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-md">
              Controle de ordens de serviço, stock, financeiro e muito mais num só lugar.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <span className="text-blue-50">Gestão completa de OS</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-blue-50">Rastreamento GPS em tempo real</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4" />
                </div>
                <span className="text-blue-50">Programa de fidelidade integrado</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-blue-200">
            © 2026 Autotrack. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <img 
              src="https://autotrack.pt/gps/img/logoatpng.png" 
              alt="Autotrack" 
              className="h-[9rem] w-auto object-contain"
            />
          </div>

          <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Faça login para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400",
                      "bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition duration-200"
                    )}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400",
                      "bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition duration-200"
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-300">Lembrar-me</span>
                </label>
                <a href="#" className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                  Esqueceu a senha?
                </a>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-gray-900 dark:text-white font-medium",
                  "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800",
                  "transition-all duration-200 shadow-lg shadow-blue-600/25",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
