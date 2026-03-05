import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

// Layouts
import { ProtectedRoute, UserLayout, AdminLayout } from "./layouts/AppLayout";

// Placeholder Pages - To be created
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GymList from "./pages/GymList";
import GymDetails from "./pages/GymDetails";
import UserDashboard from "./pages/UserDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TrainerDashboard from "./pages/TrainerDashboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#fafafa",
              border: "1px solid #27272a",
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/gyms" element={<GymList />} />
            <Route path="/gyms/:id" element={<GymDetails />} />

            {/* Protected User Routes */}
            <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
              <Route path="/dashboard" element={<UserDashboard />} />
            </Route>
          </Route>

          {/* Protected Owner Routes */}
          <Route element={<AdminLayout />}>
            <Route element={<ProtectedRoute allowedRoles={["GYM_OWNER"]} />}>
              <Route path="/owner" element={<OwnerDashboard />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Protected Trainer Routes */}
            <Route element={<ProtectedRoute allowedRoles={["TRAINER"]} />}>
              <Route path="/trainer" element={<TrainerDashboard />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
