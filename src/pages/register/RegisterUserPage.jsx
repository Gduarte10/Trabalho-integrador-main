import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/RegisterUserPage.css';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrvlludmkeytytiymzlu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydmxsdWRta2V5dHl0aXltemx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTk3MDAsImV4cCI6MjA2NDEzNTcwMH0.ws26ZPPy_cKSA21ZDmtV06rZJf8ogwxhATuNSWSSiX0';


const supabase = createClient(supabaseUrl, supabaseKey);

export default function RegisterUserPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      // pode remover isso se desativar confirmação de email
      options: {
        emailRedirectTo:
          'https://SEU_USUARIO.github.io/projeto-integrador-web-master-gh-try/#/login',
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess('Cadastro realizado com sucesso!');
    setTimeout(() => navigate('/login'), 2000);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Criar conta</h2>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}

        <form onSubmit={handleRegister}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
