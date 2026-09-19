import { Dashboard } from './components/Dashboard';
import { SignIn } from './components/SignIn';
import { useAuth } from './hooks/useAuth';

function App() {
  const { currentWorker } = useAuth();

  if (!currentWorker) {
    return <SignIn />;
  }

  return <Dashboard />;
}

export default App;