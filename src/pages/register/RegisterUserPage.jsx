import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/RegisterUserPage.css';
import supabase from '../../services/supabase';
import { Eye, RefreshCw, User, CheckCircle, XCircle } from 'lucide-react';

export default function RegisterUserPage({ onNavigateHome }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResend, setShowResend] = useState(false);
  
  // Estados para a lista de usuários
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState('');

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este email já está cadastrado');
        } else if (error.message.includes('invalid email')) {
          setError('Por favor, insira um email válido');
        } else if (error.message.includes('password')) {
          setError('A senha é muito fraca');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data?.user) {
        if (data.user.identities?.length === 0) {
          setError('Este email já está cadastrado');
          return;
        }

        if (!data.session) {
          setSuccess('Cadastro realizado! Verifique seu email para confirmar a conta.');
          setShowResend(true);
        } else {
          setSuccess('Cadastro realizado com sucesso!');
        }

        setEmail('');
        setPassword('');
        setConfirmPassword('');

        // Recarregar lista de usuários após cadastro
        fetchUsers();
        
        setTimeout(() => {
          if (onNavigateHome) {
            onNavigateHome();
          } else {
            navigate('/home');
          }
        }, 3000);
      }
    } catch (err) {
      setError('Erro ao processar solicitação');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMagicLink() {
    if (!email) {
      setError('Informe o email para reenviar o link');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOtp({ email: email.trim() });
      setLoading(false);
      if (error) {
        console.error('Error sending magic link:', error);
        setError(error.message || 'Erro ao enviar email');
        return;
      }
      setSuccess('Email enviado! Verifique sua caixa de entrada para entrar.');
      setShowResend(false);
    } catch (err) {
      setLoading(false);
      console.error('Unexpected error sending magic link:', err);
      setError('Erro ao enviar email. Tente novamente.');
    }
  }

  const handleGoBack = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate(-1);
    }
  };

  // Função para buscar usuários
  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUserError('');
    
    try {
      // Tente buscar da tabela auth.users (usuários do Supabase)
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authUsers?.users) {
        // Formatar dados dos usuários do Supabase
        const formattedUsers = authUsers.users.map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          confirmed_at: user.confirmed_at,
          last_sign_in_at: user.last_sign_in_at,
          isActive: user.confirmed_at !== null
        }));
        
        setUsers(formattedUsers);
        return;
      }
      
      // Se não conseguir buscar do auth, tente de uma tabela personalizada
      const { data: tableUsers, error: tableError } = await supabase
        .from('usuarios') // Altere para o nome da sua tabela
        .select('*')
        .order('created_at', { ascending: false });

      if (!tableError && tableUsers) {
        setUsers(tableUsers.map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          confirmed_at: user.created_at,
          last_sign_in_at: user.ultimo_login,
          isActive: user.ativo
        })));
        return;
      }

      setUserError('Não foi possível carregar a lista de usuários');
      setUsers([]);
      
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setUserError('Erro ao carregar usuários');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Buscar usuários quando o componente é montado
  useEffect(() => {
    fetchUsers();
  }, []);

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="register-page-container">
      <div className="register-content">
        {/* Card de Cadastro */}
        <div className="login-card">
          {/* Cabeçalho com botão de voltar */}
          <div className="login-header">
            <button 
              type="button"
              onClick={handleGoBack}
              className="back-button"
              disabled={loading}
              aria-label="Voltar"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M15 10H5M5 10L10 5M5 10L10 15" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              Voltar
            </button>
            
            <h1 className="login-title">Criar Conta</h1>
            <p className="login-subtitle">Preencha os dados abaixo para se registrar</p>
          </div>

          {/* Mensagens de status */}
          {error && (
            <div className="alert alert-error" role="alert">
              <svg className="alert-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="alert-message">{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              <svg className="alert-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16.6667 5L7.50001 14.1667L3.33334 10"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="alert-message">{success}</span>
            </div>
          )}
          
          {showResend && (
            <div style={{ marginTop: 8 }}>
              <button type="button" className="link-button" onClick={handleSendMagicLink} disabled={loading}>
                {loading ? 'Enviando...' : 'Reenviar link de confirmação / Entrar com magic link'}
              </button>
            </div>
          )}

          {/* Formulário */}
          <form className="login-form" onSubmit={handleRegister}>
            {/* Campo Email */}
            <div className="form-field">
              <label htmlFor="email" className="form-label">
                Email
                <span className="required-indicator">*</span>
              </label>
              <div className="input-group">
                <div className="input-prefix">
                  <User size={20} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  className="form-control"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="form-field">
              <label htmlFor="password" className="form-label">
                Senha
                <span className="required-indicator">*</span>
              </label>
              <div className="input-group">
                <div className="input-prefix">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M14.1667 9.16667V6.66667C14.1667 4.36548 12.3012 2.5 10 2.5C7.69881 2.5 5.83334 4.36548 5.83334 6.66667V9.16667M5.5 17.5H14.5C15.9001 17.5 16.6002 17.5 17.135 17.2275C17.6054 16.9878 17.9878 16.6054 18.2275 16.135C18.5 15.6002 18.5 14.9001 18.5 13.5V12.1667C18.5 10.7665 18.5 10.0665 18.2275 9.53169C17.9878 9.06129 17.6054 8.67883 17.135 8.43914C16.6002 8.16667 15.9001 8.16667 14.5 8.16667H5.5C4.09987 8.16667 3.3998 8.16667 2.86502 8.43914C2.39462 8.67883 2.01217 9.06129 1.77248 9.53169C1.5 10.0665 1.5 10.7665 1.5 12.1667V13.5C1.5 14.9001 1.5 15.6002 1.77248 16.135C2.01217 16.6054 2.39462 16.9878 2.86502 17.2275C3.3998 17.5 4.09987 17.5 5.5 17.5Z"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength="6"
                  disabled={loading}
                  className="form-control"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-hint">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 12H8.01M8 8V10M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mínimo 6 caracteres
              </div>
            </div>

            {/* Campo Confirmar Senha */}
            <div className="form-field">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar Senha
                <span className="required-indicator">*</span>
              </label>
              <div className="input-group">
                <div className="input-prefix">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M14.1667 9.16667V6.66667C14.1667 4.36548 12.3012 2.5 10 2.5C7.69881 2.5 5.83334 4.36548 5.83334 6.66667V9.16667M5.5 17.5H14.5C15.9001 17.5 16.6002 17.5 17.135 17.2275C17.6054 16.9878 17.9878 16.6054 18.2275 16.135C18.5 15.6002 18.5 14.9001 18.5 13.5V12.1667C18.5 10.7665 18.5 10.0665 18.2275 9.53169C17.9878 9.06129 17.6054 8.67883 17.135 8.43914C16.6002 8.16667 15.9001 8.16667 14.5 8.16667H5.5C4.09987 8.16667 3.3998 8.16667 2.86502 8.43914C2.39462 8.67883 2.01217 9.06129 1.77248 9.53169C1.5 10.0665 1.5 10.7665 1.5 12.1667V13.5C1.5 14.9001 1.5 15.6002 1.77248 16.135C2.01217 16.6054 2.39462 16.9878 2.86502 17.2275C3.3998 17.5 4.09987 17.5 5.5 17.5Z"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength="6"
                  disabled={loading}
                  className="form-control"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Botão de submit */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Processando...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Usuários Existente */}
        <div className="users-list-section">
          <div className="users-list-header">
            <h2 className="users-list-title">
              <Eye size={20} />
              Usuários Registrados
            </h2>
            <button 
              onClick={fetchUsers} 
              className="refresh-button"
              disabled={loadingUsers}
              title="Atualizar lista"
            >
              <RefreshCw size={18} className={loadingUsers ? 'spinning' : ''} />
              {loadingUsers ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {userError && (
            <div className="user-error-message">
              {userError}
            </div>
          )}

          {loadingUsers ? (
            <div className="loading-users">
              <div className="loading-spinner"></div>
              <p>Carregando usuários...</p>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Data de Registro</th>
                      <th>Último Acesso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="user-row">
                        <td className="user-email">
                          <User size={16} />
                          {user.email}
                        </td>
                        <td>
                          <span className={`user-status ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? (
                              <>
                                <CheckCircle size={14} />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle size={14} />
                                Pendente
                              </>
                            )}
                          </span>
                        </td>
                        <td className="user-date">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="user-date">
                          {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Nunca acessou'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="users-summary">
                <p className="total-users">
                  Total de usuários: <strong>{users.length}</strong>
                  <span className="active-users">
                    ({users.filter(u => u.isActive).length} ativos)
                  </span>
                </p>
              </div>
            </>
          ) : (
            <div className="no-users">
              <p>Nenhum usuário registrado ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}