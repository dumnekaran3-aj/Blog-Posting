import Navbar from "./Navbar";
import Footer from "./Footer";
import renderMarkdownLite from "../../utils/renderMarkdownLite";

export default function StaticPageLayout({ content }) {
  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {renderMarkdownLite(content)}
      </div>
      <Footer />
    </div>
  );
}