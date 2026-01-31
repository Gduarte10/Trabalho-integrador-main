import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabaseClient from '../../services/supabase';
import '../../styles/loginpage.css';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password: senha,
    });

    setLoading(false);

    if (error) {
      setErro('Email ou senha inválidos');
      return;
    }

    // login OK → home
    navigate('/home');
  }

  async function handleResetSenha() {
    if (!email) {
      setErro('Informe o email para redefinir a senha');
      return;
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

    if (error) {
      setErro('Erro ao enviar email de redefinição');
    } else {
      alert('Email de redefinição enviado!');
    }
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <h2>Entrar</h2>

        {erro && <p className="login-error">{erro}</p>}

        <label>Email</label>
        <input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Senha</label>
        <input
          type="password"
          placeholder="Digite sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="login-links">
          <button
            type="button"
            className="link-button"
            onClick={handleResetSenha}
          >
            Esqueci minha senha
          </button>

          <button
            type="button"
            className="link-button"
            onClick={() => navigate('/register')}
          >
            Criar conta
          </button>
        </div>
      </form>
    </div>
  );
}