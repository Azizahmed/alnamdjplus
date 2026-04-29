import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { I18nProvider } from './i18n';
import { api } from './services/api';

const Landing = lazy(() => import('./components/Landing').then((module) => ({ default: module.Landing })));
const Account = lazy(() => import('./components/Account').then((module) => ({ default: module.Account })));
const PublicForm = lazy(() => import('./pages/PublicForm').then((module) => ({ default: module.PublicForm })));
const FormResponses = lazy(() => import('./pages/FormResponsesNew').then((module) => ({ default: module.FormResponsesNew })));
const FormAnalytics = lazy(() => import('./pages/FormAnalyticsNew').then((module) => ({ default: module.FormAnalyticsNew })));
const FormPlanner = lazy(() => import('./components/steps/FormPlanner').then((module) => ({ default: module.FormPlanner })));
const FormBuilder = lazy(() => import('./components/steps/FormBuilder').then((module) => ({ default: module.FormBuilder })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })));

const PageFallback = () => (
  <div style={{
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div className="loading-spinner" style={{ width: 40, height: 40 }} />
  </div>
);

function FormBuilderPage() {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state = location.state as any;
    if (state?.createNew) {
      setFormData(null);
      setCurrentStep(0);
      return;
    }

    if (state?.formId) {
      loadExistingForm(state.formId);
    }
  }, [location.state]);

  const loadExistingForm = async (formId: string) => {
    setLoading(true);
    try {
      const { data } = await api.forms.get(formId);
      if (data) {
        setFormData(data);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Failed to load form:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <FormPlanner
            onComplete={(data) => {
              setFormData(data);
              setCurrentStep(1);
            }}
          />
        );
      case 1:
        return (
          <FormBuilder
            formData={formData}
            onBack={() => setCurrentStep(0)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<PageFallback />}>
      <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {renderStep()}
      </div>
    </Suspense>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, hasCheckedUser, checkUser } = useAuth();
  const isAuthenticated = !!user;
  const isPublicFormPath = /^\/forms\/[^/]+$/.test(location.pathname);
  const isProtectedPath = location.pathname === '/build'
    || location.pathname === '/account'
    || /^\/forms\/[^/]+\/(responses|analytics)$/.test(location.pathname);
  const hasOAuthCallback = location.search.includes('insforge_code=');
  const shouldCheckAuth = (isProtectedPath || hasOAuthCallback) && !isAuthenticated && !hasCheckedUser;
  
  const showSidebar = isAuthenticated && ![
    '/',
    '/auth',
    '/account'
  ].includes(location.pathname) && !isPublicFormPath;

  const showNavbar = !isPublicFormPath;

  useEffect(() => {
    if (shouldCheckAuth && !loading) {
      void checkUser();
    }
  }, [checkUser, loading, shouldCheckAuth]);

  if (loading || shouldCheckAuth) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <>
      {showNavbar && <Navbar onAccountClick={() => navigate('/account')} />}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row', minHeight: 0 }}>
        {showSidebar && <Sidebar />}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={isAuthenticated ? <Navigate to="/build" replace /> : <AuthPage />} />
              <Route 
                path="/build" 
                element={isAuthenticated ? <FormBuilderPage /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/forms/:formId/responses" 
                element={isAuthenticated ? <FormResponses /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/forms/:formId/analytics" 
                element={isAuthenticated ? <FormAnalytics /> : <Navigate to="/" replace />} 
              />
              <Route path="/forms/:token" element={<PublicForm />} />
              <Route 
                path="/account" 
                element={isAuthenticated ? <Account onClose={() => navigate(-1)} /> : <Navigate to="/" replace />} 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <I18nProvider>
        <NotificationProvider>
          <SidebarProvider>
            <AuthProvider>
              <div className="app-container">
                <AppRoutes />
              </div>
            </AuthProvider>
          </SidebarProvider>
        </NotificationProvider>
      </I18nProvider>
    </Router>
  );
}
