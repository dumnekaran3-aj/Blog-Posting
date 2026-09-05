import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { ADMIN_PATH } from "./constants/adminPath";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/Forgotpassword";
import ResetPassword from "./pages/Resetpassword";
import Signup from "./pages/Signup";
import BlogDetail from "./pages/BlogDetail";
import CreatePost from "./pages/CreatePost";
import PrivateRoute from "./routes/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";
import EditPost from "./pages/EditPost";
import Categories from "./pages/Categories";
import CategoryPosts from "./pages/CategoryPosts";
import PublicProfile from "./pages/PublicProfile";
import Settings from  "./pages/Settings";
import ScrollToTop from "./components/common/ScrollToTop";

import AboutUs from "./pages/legal/AboutUs";
import ContactUs from "./pages/legal/ContactUs";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import EditorialPolicy from "./pages/legal/EditorialPolicy";
import Disclaimer from "./pages/legal/Disclaimer";
import CorrectionsPolicy from "./pages/legal/CorrectionsPolicy";
import WriteForUs from "./pages/legal/WriteForUs";

import AdminPrivateRoute from "./routes/AdminPrivateRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminCreatePost from "./pages/admin/AdminCreatePost";
import AdminComments from "./pages/admin/AdminComments";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminAccounts from "./pages/admin/AdminAccounts";

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>

            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/editorial-policy" element={<EditorialPolicy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/corrections-policy" element={<CorrectionsPolicy />} />
            <Route path="/write-for-us" element={<WriteForUs />} />
            <Route path="/profile/:id" element={<PublicProfile />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Notifications />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <PrivateRoute>
                  <EditPost />
                </PrivateRoute>
              }
            />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category/:slug" element={<CategoryPosts />} />

            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />

            <Route
              path="/create"
              element={
                <PrivateRoute>
                  <CreatePost />
                </PrivateRoute>
              }
            />

            {/* Admin panel — path comes from VITE_ADMIN_PATH, never hardcoded "/admin" */}
            <Route path={`/${ADMIN_PATH}/login`} element={<AdminLogin />} />
            <Route
              path={`/${ADMIN_PATH}`}
              element={
                <AdminPrivateRoute>
                  <AdminLayout />
                </AdminPrivateRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="posts/new" element={<AdminCreatePost />} />
              <Route path="comments" element={<AdminComments />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="logs" element={<AdminAuditLogs />} />
              <Route path="accounts" element={<AdminAccounts />} />
            </Route>

          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;