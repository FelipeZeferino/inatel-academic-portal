import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/app/login/page';
import { authClient } from '@/server/better-auth/client';
import { useRouter } from 'next/navigation';


vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/server/better-auth/client', () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
}));

global.fetch = vi.fn();

describe('LoginPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
  });

  it('deve renderizar os campos de email, senha e botão de login corretamente', () => {
    render(<LoginPage />);
    
    expect(screen.getByPlaceholderText('seu.email@inatel.br')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite sua senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aluno/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /professor/i })).toBeInTheDocument();
  });

  it('deve alternar a seleção visual entre os botões de Aluno e Professor', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    const btnAluno = screen.getByRole('button', { name: 'Aluno' });
    const btnProfessor = screen.getByRole('button', { name: 'Professor' });

    expect(btnAluno.className).toContain('bg-blue-600');
    expect(btnProfessor.className).not.toContain('bg-blue-600');

    await user.click(btnProfessor);

    expect(btnProfessor.className).toContain('bg-blue-600');
    expect(btnAluno.className).not.toContain('bg-blue-600');
  });

  it('deve exibir mensagem de erro quando as credenciais forem inválidas', async () => {
    const user = userEvent.setup();
    
    (authClient.signIn.email as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      error: { message: 'Credenciais inválidas' }
    });

    render(<LoginPage />);
    
    await user.type(screen.getByPlaceholderText('seu.email@inatel.br'), 'teste@inatel.br');
    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });

  it('deve realizar login como aluno e redirecionar para o dashboard de aluno', async () => {
    const user = userEvent.setup();
    
    (authClient.signIn.email as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: { id: 1 } },
      error: null
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ role: 'ALUNO' })
    });

    render(<LoginPage />);
    
    await user.type(screen.getByPlaceholderText('seu.email@inatel.br'), 'aluno@inatel.br');
    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha123');
    
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(authClient.signIn.email).toHaveBeenCalledWith({
        email: 'aluno@inatel.br',
        password: 'senha123'
      });
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me');
      expect(mockPush).toHaveBeenCalledWith('/aluno/dashboard');
    });
  });

  it('deve realizar login como professor e redirecionar para o dashboard de professor', async () => {
    const user = userEvent.setup();
    
    (authClient.signIn.email as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: { id: 2 } },
      error: null
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ role: 'PROFESSOR' })
    });

    render(<LoginPage />);
    
    await user.click(screen.getByRole('button', { name: 'Professor' }));
    
    await user.type(screen.getByPlaceholderText('seu.email@inatel.br'), 'prof@inatel.br');
    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha123');
    
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(authClient.signIn.email).toHaveBeenCalledWith({
        email: 'prof@inatel.br',
        password: 'senha123'
      });
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me');
      expect(mockPush).toHaveBeenCalledWith('/professor/dashboard'); 
    });
  });

  it('deve lidar com erro caso a busca pelo perfil (/api/auth/me) falhe após o login', async () => {
    const user = userEvent.setup();
    
    (authClient.signIn.email as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { user: { id: 3 } },
      error: null
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Erro interno no servidor')
    );

    render(<LoginPage />);
    
    await user.type(screen.getByPlaceholderText('seu.email@inatel.br'), 'teste@inatel.br');
    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});