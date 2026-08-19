import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BlogDetail from "./pages/BlogDetail";
import CreatePost from "./pages/CreatePost";
import PrivateRoute from "./routes/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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