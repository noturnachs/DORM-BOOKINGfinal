import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import DormDetails from "./components/DormDetails";
import ForgotPassword from "./components/ForgotPassword";
import AdminRoute from "./components/AdminRoute";
import AdminDorms from "./pages/admin/AdminDorms";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminUsers from "./pages/admin/AdminUsers";
import About from "./components/AboutSection";
import Contact from "./components/ContactSection";

const ProtectedRoute = ({ children }) => {
  const auth = useAuth();

  if (!auth) {
    return <Navigate to="/login" />;
  }

  const { user, loading } = auth;

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/dorms"
              element={
                <AdminRoute>
                  <AdminDorms />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <AdminRoute>
                  <AdminBookings />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dorms/:id"
              element={
                <ProtectedRoute>
                  <DormDetails />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
