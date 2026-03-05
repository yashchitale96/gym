import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Dumbbell,
  LogOut,
  LayoutDashboard,
  Search,
  QrCode,
} from "lucide-react";
import { Link } from "react-router-dom";

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Redirect to their default dashboard/home
  }

  return <Outlet />;
};

export const UserLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full glass transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
              FitFind
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/gyms"
              className="text-foreground/80 hover:text-primary transition-colors flex items-center space-x-1"
            >
              <Search className="h-4 w-4" />
              <span>Discover</span>
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-foreground/80 hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="transition-colors text-red-400/80 hover:text-red-400 flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-full font-semibold hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 mt-auto bg-black/20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-foreground/50">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Dumbbell className="h-5 w-5 text-primary/50" />
            <span className="font-bold text-lg tracking-tight text-foreground/50">
              FitFind
            </span>
          </div>
          © {new Date().getFullYear()} FitFind. Empowering fitness everywhere.
        </div>
      </footer>
    </div>
  );
};

export const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full glass transition-all duration-300 text-foreground">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to={
              user?.role === "SUPER_ADMIN"
                ? "/admin"
                : user?.role === "TRAINER"
                  ? "/trainer"
                  : "/owner"
            }
            className="flex items-center space-x-2 group"
          >
            <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
              FitFind{" "}
              {user?.role === "SUPER_ADMIN"
                ? "Admin"
                : user?.role === "TRAINER"
                  ? "Trainer"
                  : "Owner"}
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <button
              onClick={logout}
              className="transition-colors text-red-400/80 hover:text-red-400 flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};
