import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Charges } from './components/Charges/Charges';
import { Expenses } from './components/Expenses/Expenses';
import { BottomNav } from './components/shared/BottomNav';
import { supabase } from './lib/supabase';

type View = 'dashboard' | 'charges' | 'expenses' | 'more';

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
    setLoading(false);
  }

  async function handleSignIn() {
    const email = prompt('Email:');
    const password = prompt('Senha:');

    if (!email || !password) return;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert('Erro ao entrar: ' + error.message);
    }
  }

  async function handleSignUp() {
    const email = prompt('Email:');
    const password = prompt('Senha:');
    const fullName = prompt('Nome completo:');

    if (!email || !password || !fullName) return;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      alert('Erro ao criar conta: ' + error.message);
    } else {
      alert('Conta criada com sucesso! Faça login para continuar.');
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Duka</h1>
          <p className="auth-subtitle">Gestão de imóveis simplificada</p>
          <div className="auth-buttons">
            <button className="btn btn-primary btn-full" onClick={handleSignIn}>
              Entrar
            </button>
            <button className="btn btn-secondary btn-full" onClick={handleSignUp}>
              Criar conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {activeView === 'dashboard' && <Dashboard />}
      {activeView === 'charges' && <Charges />}
      {activeView === 'expenses' && <Expenses />}
      {activeView === 'more' && (
        <div className="more-container">
          <div className="more-header">
            <h1 className="more-title">Mais opções</h1>
          </div>
          <div className="more-content">
            <button
              className="more-option"
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
            >
              Sair da conta
            </button>
          </div>
        </div>
      )}

      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </>
  );
}

export default App;
