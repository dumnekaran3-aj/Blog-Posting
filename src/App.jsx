import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BlogDetail from "./pages/BlogDetail";
import CreatePost from "./pages/CreatePost";
import PrivateRoute from "./routes/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import EditPost from "./pages/EditPost";
import Categories from "./pages/Categories";
import CategoryPosts from "./pages/CategoryPosts";

//legal process pages

import AboutUs from "./pages/legal/AboutUs";
import ContactUs from "./pages/legal/ContactUs";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import EditorialPolicy from "./pages/legal/EditorialPolicy";
import Disclaimer from "./pages/legal/Disclaimer";
import CorrectionsPolicy from "./pages/legal/CorrectionsPolicy";
import WriteForUs from "./pages/legal/WriteForUs";
import PublicProfile from "./pages/PublicProfile";




function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
          <Route path="/signup" element={<Signup />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />

          <Route path="/create"element={ <PrivateRoute>  <CreatePost />
          </PrivateRoute> } />



        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;