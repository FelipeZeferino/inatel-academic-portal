"use client";

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, User, Lock, AlertCircle, Loader } from 'lucide-react';
import { authClient } from '@/server/better-auth/client';

export default function LoginPage() { 
  const [userType, setUserType] = useState<'aluno' | 'professor'>('aluno');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await authClient.signIn.email({ email, password });

      if (response.error) {
        setError(response.error.message ?? 'Erro ao fazer login');
        setLoading(false);
        return;
      }

      const meResponse = await fetch('/api/auth/me');
      const me = await meResponse.json() as { role?: string };

      if (userType === 'professor') {
        if (me.role === 'PROFESSOR' || me.role === 'ADMIN') {
          router.push('/professor/dashboard');
        } else {
          setError('Você não tem permissão de acesso como professor.');
          setLoading(false);
        }
      } else {
        if (me.role === 'ALUNO') {
          router.push('/aluno/dashboard');
        } else {
          setError('Você não tem permissão de acesso como aluno.');
          setLoading(false);
        }
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-full mb-4">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Portal Acadêmico Inatel</h1>
          <p className="text-gray-600 text-sm mt-1">Sistema Integrado de Gestão</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setUserType('aluno')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              userType === 'aluno'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Aluno
          </button>
          <button
            type="button"
            onClick={() => setUserType('professor')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              userType === 'professor'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Professor
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@inatel.br"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <a href="#" className="text-sm text-blue-600 hover:underline block">
            Esqueci minha senha
          </a>
          <p className="text-sm text-gray-600 pt-4 border-t border-gray-200 mt-4">
            Novo aqui?{" "}
            <a href="/signup" className="text-blue-600 hover:underline font-medium">
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}