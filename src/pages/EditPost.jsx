import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import PostForm from "../components/editor/PostForm";
import api from "../services/api";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/posts/id/${id}`);
        setPost(data.post);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleSubmit = async (form, status) => {
    const { data } = await api.put(`/posts/${id}`, { ...form, status });
    navigate(`/blog/${data.post.slug}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <h1 className="text-xl font-medium text-textDark mb-6">Edit post</h1>

        {loading && <p className="text-sm text-textMuted">Loading...</p>}
        {!loading && notFound && (
          <p className="text-sm text-textMuted">
            This post could not be found, or you don't have permission to edit it.
          </p>
        )}
        {!loading && post && (
          <PostForm mode="edit" initialData={post} onSubmit={handleSubmit} />
        )}
      </div>
      <Footer />
    </div>
  );
}