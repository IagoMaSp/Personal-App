import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { NotesPage } from './pages/NotesPage';
import { BooksPage } from './pages/BooksPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { EventsPage } from './pages/EventsPage';
import { FinancesPage } from './pages/FinancesPage';
import { AuthGuard } from './components/auth/AuthGuard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }>
            <Route index element={<HomePage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="books" element={<BooksPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="finances" element={<FinancesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
