import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PortfolioProvider } from './context/PortfolioContext';
import AuthGuard    from './components/Auth/AuthGuard';
import Layout       from './components/Layout/Layout';
import Login        from './pages/Login';
import Home         from './pages/Home';
import BarReplay    from './pages/BarReplay';
import Portfolio    from './pages/Portfolio';
import Education    from './pages/Education';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortfolioProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes — all wrapped in AuthGuard */}
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Layout />
                </AuthGuard>
              }
            >
              <Route index           element={<Home />}      />
              <Route path="replay"   element={<BarReplay />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="education" element={<Education />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PortfolioProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;