import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Landing } from './components/Landing';
import { Account } from './components/Account';
import { PublicForm } from './pages/PublicForm';
import { FormResponsesNew as FormResponses } from './pages/FormResponsesNew';
import { FormAnalyticsNew as FormAnalytics } from './pages/FormAnalyticsNew';
import { FormPlanner } from './components/steps/FormPlanner';
import { FormBuilder } from './components/steps/FormBuilder';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { I18nProvider } from './i18n';
import { AuthPage } from './pages/AuthPage';

function FormBuilderPage() {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state = location.state as any;
    if (state?.formId) {
      loadExistingForm(state.formId);
    }
  }, [location.state]);

  const loadExistingForm = async (formId: string) => {
    setLoading(true);
    try {
      const { insforge } = await import('./config');
      const { data } = await insforge.database.query('forms', {
        filter: { id: formId },
        select: '*, form_questions(*), conditional_rules(*)'
      });
      if (data?.[0]) {
        setFormData(data[0]);
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
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {renderStep()}
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  
  const showSidebar = isAuthenticated && ![
    '/',
    '/auth',
    '/account'
  ].includes(location.pathname) && !location.pathname.startsWith('/forms/');

  const isPublicFormPath = /^\/forms\/[^\/]+$/.test(location.pathname);
  const showNavbar = !isPublicFormPath;

  if (loading) {
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
