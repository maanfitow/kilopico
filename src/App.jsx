import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nProvider, useI18n } from './i18n/I18nContext.jsx';
import Header from './components/Header.jsx';
import Calculator from './components/Calculator.jsx';

const Theory = lazy(() => import('./components/Theory.jsx'));
const Downloads = lazy(() => import('./components/Downloads.jsx'));
const Footer = lazy(() => import('./components/Footer.jsx'));

function AppLayout() {
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('app.skipToContent')}
      </a>
      <Header />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Navigate to="/calculator" replace />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/theory" element={<Theory />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="*" element={<Navigate to="/calculator" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <HashRouter>
        <AppLayout />
      </HashRouter>
    </I18nProvider>
  );
}
