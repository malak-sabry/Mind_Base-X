import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HRProvider } from "@/contexts/HRContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeDetails from "./pages/EmployeeDetails";
import TasksPage from "./pages/TasksPage";
import AttendancePage from "./pages/AttendancePage";
import PayrollPage from "./pages/PayrollPage";
import EmployeePortal from "./pages/EmployeePortal";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import LeaveRequestsPage from "./pages/LeaveRequestsPage";
import ReportsPage from "./pages/ReportsPage";
import { CrmProvider } from "@/contexts/CrmContext";
import CrmDashboard from "./pages/crm/CrmDashboard";
import AccountsPage from "./pages/crm/AccountsPage";
import ContactsPage from "./pages/crm/ContactsPage";
import DealsPage from "./pages/crm/DealsPage";
import PipelinePage from "./pages/crm/PipelinePage";
import ActivitiesPage from "./pages/crm/ActivitiesPage";
import EmployeePerformancePage from "./pages/crm/EmployeePerformancePage";
import MicromanagePage from "./pages/MicromanagePage";
import ErpSystemPage from "./pages/ErpSystemPage";
import SlaSystemPage from "./pages/SlaSystemPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-cairo">جاري التحميل...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.mustChangePassword && window.location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  const isManager = user?.role === "manager";

  return (
    <HRProvider>
      <CrmProvider>
        <AppLayout>
          <Routes>
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {isManager ? (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/employees/:id" element={<EmployeeDetails />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/leave-requests" element={<LeaveRequestsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/crm/performance" element={<EmployeePerformancePage />} />
              </>
            ) : (
              <Route path="/" element={<EmployeePortal />} />
            )}
            <Route path="/crm" element={<CrmDashboard />} />
            <Route path="/crm/accounts" element={<AccountsPage />} />
            <Route path="/crm/contacts" element={<ContactsPage />} />
            <Route path="/crm/deals" element={<DealsPage />} />
            <Route path="/crm/pipeline" element={<PipelinePage />} />
            <Route path="/crm/activities" element={<ActivitiesPage />} />
            <Route path="/micromanage" element={<MicromanagePage />} />
            <Route path="/erp" element={<ErpSystemPage />} />
            <Route path="/sla" element={<SlaSystemPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </CrmProvider>
    </HRProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-cairo">جاري التحميل...</div>;
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
