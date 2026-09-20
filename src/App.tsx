import { Dashboard } from './components/Dashboard';
import { SignIn } from './components/SignIn';
import { ToastProvider } from './components/Toast';
import { useAuth } from './hooks/useAuth';

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
      <AppContent />
    </ToastProvider>
  );
}

export default App;