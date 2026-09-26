import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './pages/Home';
import { Lobbies } from './pages/Lobbies';
import { CreateGame } from './pages/CreateGame';
import { Game } from './pages/Game/Game';
import { Packs } from './pages/Packs';
import { PackDetails } from './pages/PackDetails';
import { Profile } from './pages/Profile';
import { ActiveGameGuard } from './components/ActiveGameGuard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Runs on every render — checks /games/active and redirects if needed */}
        <ActiveGameGuard />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobbies" element={<Lobbies />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/game/new" element={<CreateGame />} />
          <Route path="/game/:sessionId" element={<Game />} />
          <Route path="/packs" element={<Packs />}>
            <Route path=":packId" element={<PackDetails />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
