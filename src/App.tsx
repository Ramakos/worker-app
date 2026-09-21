import { Dashboard } from './components/Dashboard';
import { SignIn } from './components/SignIn';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './hooks/useAuth';

function AppContent() {
  const { currentWorker } = useAuth();

  if (!currentWorker) {
    return <SignIn />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;