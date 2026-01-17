import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import RepoDetail from './pages/RepoDetail';
import ReaderPage from './pages/ReaderPage';

const ShareRedirect: React.FC = () => {
    // In a real app this would verify token. Here we just redirect to a mock read-only view 
    // or reusing RepoDetail with a flag.
    // For simplicity, redirecting to the first repo as demo.
    return <Navigate to="/repo/repo-1" replace />;
};

const App: React.FC = () => {
  // Parse the initial hash from the window location to allow deep linking (e.g. for share URLs)
  // while using MemoryRouter to avoid browser security restrictions on navigation in sandboxed/blob environments.
  const initialPath = window.location.hash.length > 1 ? window.location.hash.substring(1) : '/';

  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/repo/:repoId" element={<RepoDetail />} />
        <Route path="/repo/:repoId/reader" element={<ReaderPage />} />
        <Route path="/share/:token" element={<ShareRedirect />} />
      </Routes>
    </MemoryRouter>
  );
};

export default App;