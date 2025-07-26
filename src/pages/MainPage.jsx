import { useState, useEffect } from 'react';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';

const PromoItem = ({ promo }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosClient.get(`/userPromo/click/${promo._id}`);
      window.open(response.data.targetUrl, '_blank');
    } catch (err) {
      console.error('Promo click error:', err);
      setError(err.message || 'Failed to record click');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group cursor-pointer relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/30" onClick={handleClick}>
      {loading && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white font-medium">Loading...</span>
          </div>
        </div>
      )}
      
      <div className="relative overflow-hidden">
        <img 
          src={promo.imageUrl} 
          alt={promo.title}
          className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <div className="bg-blue-500/90 backdrop-blur-sm text-white p-2 rounded-full shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-300 transition-colors duration-200">{promo.title}</h3>
        <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">{promo.description}</p>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">Active</span>
          </div>
          <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
            Click to view
          </div>
        </div>
      </div>
      
      {error && (
        <div className="absolute bottom-0 left-0 right-0 text-red-400 text-sm p-3 bg-red-900/20 backdrop-blur-sm border-t border-red-500/30">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const MianPage = ({ user, handleLogout }) => {
  const [showEditor, setShowEditor] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoaded, setUserLoaded] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [newBlog, setNewBlog] = useState({
    title: '',
    content: ''
  });
  const [commentInputs, setCommentInputs] = useState({});

  // Track when user data is available
  useEffect(() => {
    if (user) {
      setUserLoaded(true);
    }
  }, [user]);

  // Fetch promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await axiosClient.get('/userPromo/active');
        setPromotions(response.data);
      } catch (error) {
        console.error('Failed to fetch promotions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPromotions();
  }, []);

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setBlogLoading(true);
        const response = await axiosClient.get('/blog');
        // Handle both response structures
        const blogsData = response.data.data || response.data;
        setBlogs(Array.isArray(blogsData) ? blogsData : []);
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
      } finally {
        setBlogLoading(false);
      }
    };
    
    fetchBlogs();
  }, []);

  const handleBlogChange = (e) => {
    const { name, value } = e.target;
    setNewBlog(prev => ({ ...prev, [name]: value }));
  };

  const handleCommentChange = (blogId, value) => {
    setCommentInputs(prev => ({ ...prev, [blogId]: value }));
  };

  const createBlog = async () => {
    try {
      const response = await axiosClient.post('/blog', {
        title: newBlog.title,
        content: newBlog.content
      });
      
      // Handle both response structures
      const newBlogData = response.data.data || response.data;
      
      setBlogs(prev => [newBlogData, ...prev]);
      setNewBlog({ title: '', content: '' });
      setShowEditor(false);
    } catch (error) {
      console.error('Failed to create blog:', {
        error: error.message,
        response: error.response?.data
      });
      alert('Failed to create blog: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const addComment = async (blogId) => {
    const text = commentInputs[blogId]?.trim();
    if (!text) return;

    try {
      const response = await axiosClient.post(`/blog/${blogId}/comments`, { text });
      
      // Handle both response structures
      const updatedBlog = response.data.data || response.data;
      
      setBlogs(prev => prev.map(blog => 
        blog._id === blogId ? updatedBlog : blog
      ));
      
      // Clear comment input
      handleCommentChange(blogId, '');
    } catch (error) {
      console.error('Failed to add comment:', {
        error: error.message,
        response: error.response?.data
      });
    }
  };

  const toggleLike = async (blogId) => {
    try {
      const response = await axiosClient.post(`/blog/${blogId}/like`);
      
      // Handle both response structures
      const updatedBlog = response.data.data || response.data;
      
      setBlogs(prev => prev.map(blog => 
        blog._id === blogId ? updatedBlog : blog
      ));
    } catch (error) {
      console.error('Failed to toggle like:', {
        error: error.message,
        response: error.response?.data
      });
    }
  };

  // Check if user has liked a blog
  const hasLiked = (blog) => {
    if (!user || !blog.likes) return false;
    
    return blog.likes.some(like => {
      // Handle both string IDs and populated user objects
      const likeId = typeof like === 'object' ? like._id : like;
      return likeId === user._id;
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Top Navigation Bar */}
      <nav className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#131516]">
        <div className="text-xl font-bold text-white">CodeMaster</div>

        <div className="flex items-center gap-4">
          <NavLink
            to="/home"
            className="px-4 py-2 rounded-lg font-medium bg-yellow-500/80 hover:bg-yellow-600/80 text-white text-sm transition-all duration-200 hover:scale-105"
          >
            Problems
          </NavLink>

          <NavLink
            to="/interview"
            className="px-4 py-2 rounded-lg font-medium bg-purple-500/80 hover:bg-purple-600/80 text-white text-sm transition-all duration-200 hover:scale-105"
          >
            Virtual Interview
          </NavLink>

          <NavLink
            to="/dashboard"
            className="px-4 py-2 rounded-lg font-medium bg-green-500/80 hover:bg-green-600/80 text-white text-sm transition-all duration-200 hover:scale-105"
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/promote"
            className="px-4 py-2 rounded-lg font-medium bg-blue-500/80 hover:bg-blue-600/80 text-white text-sm transition-all duration-200 hover:scale-105"
          >
            Promote
          </NavLink>

          {userLoaded && (
            <div className="relative group">
              <div
                tabIndex={0}
                className="px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-gray-600/50 transition-all duration-200"
                style={{ color: "oklch(0.8 0 0)" }}
              >
                {user?.firstName || "User"} ▾
              </div>
              <ul
                className="absolute right-0 mt-2 w-48 py-2 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                style={{
                  backgroundColor: "#131516",
                  border: "0.1px solid oklch(1 0 0 / 0.3)",
                }}
              >
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-600/50 transition-colors"
                    style={{ color: "oklch(0.8 0 0)" }}
                  >
                    Logout
                  </button>
                </li>
                {user?.role === "admin" && (
                  <li>
                    <NavLink
                      to="/admin"
                      className="block px-4 py-2 hover:bg-gray-600/50 transition-colors"
                      style={{ color: "oklch(0.8 0 0)" }}
                    >
                      Admin
                    </NavLink>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row">
        {/* Left Column - Blog Section */}
        <div className="w-full md:w-2/3 md:pr-6 mb-8 md:mb-0">
          {/* Blog Posts Feed */}
          <div className="space-y-6">
            {blogLoading ? (
              // Blog loading skeleton
              [1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="bg-[#131516] border-[0.1px] border-[oklch(1_0_0_/0.3)] rounded-xl p-6"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-700 mr-3 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-1/4 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/3 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-gray-700 rounded w-3/4 mb-3 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-700 rounded w-5/6 animate-pulse"></div>
                    <div className="h-3 bg-gray-700 rounded w-4/5 animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : blogs.length > 0 ? (
              // Actual blog posts
              blogs.map((blog) => (
                <div 
                  key={blog._id} 
                  className="bg-[#131516] border-[0.1px] border-[oklch(1_0_0_/0.3)] rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-white/5 hover:border-indigo-500/30 group"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mr-3 flex items-center justify-center text-white font-semibold shadow-lg">
                      {blog.author?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors duration-200">
                        {blog.author?.firstName || 'Unknown'} {blog.author?.lastName || ''}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {formatDate(blog.createdAt)}
                      </p>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors duration-200">
                    {blog.title}
                  </h2>
                  <p className="text-gray-200 mb-4 whitespace-pre-line leading-relaxed">
                    {blog.content}
                  </p>
                  <div className="flex space-x-4 text-gray-400">
                    <button 
                      className="flex items-center hover:text-white hover:bg-gray-700/50 px-2 py-1 rounded-lg transition-all duration-200 group/like"
                      onClick={() => toggleLike(blog._id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 mr-1 transition-all duration-200 group-hover/like:scale-110 ${hasLiked(blog) ? 'text-red-500' : ''}`}
                        fill={hasLiked(blog) ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                      <span className="font-medium">{blog.likes?.length || 0}</span>
                    </button>
                    <button className="flex items-center hover:text-white hover:bg-gray-700/50 px-2 py-1 rounded-lg transition-all duration-200 group/comment">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1 transition-all duration-200 group-hover/comment:scale-110"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      <span className="font-medium">{blog.comments?.length || 0}</span>
                    </button>
                  </div>
                  
                  {/* Comment Section */}
                  <div className="mt-4">
                    <div className="flex items-start mt-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 mr-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            className="bg-gray-800 text-white placeholder-gray-400 rounded-l-lg px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-gray-700 transition-all duration-200"
                            value={commentInputs[blog._id] || ''}
                            onChange={(e) => handleCommentChange(blog._id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && commentInputs[blog._id]?.trim()) {
                                addComment(blog._id);
                              }
                            }}
                          />
                          <button 
                            className="bg-indigo-600 text-white px-3 rounded-r-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30"
                            onClick={() => addComment(blog._id)}
                            disabled={!commentInputs[blog._id]?.trim()}
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Existing Comments */}
                    {blog.comments?.slice(0, 3).map((comment, idx) => (
                      <div key={`${blog._id}-comment-${idx}`} className="flex mt-3 group/comment-item">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 mr-2 flex-shrink-0 flex items-center justify-center text-xs text-white font-medium">
                          {comment.user?.firstName?.charAt(0) || 'U'}
                        </div>
                        <div className="bg-gray-800 rounded-lg px-3 py-2 flex-1 group-hover/comment-item:bg-gray-750 transition-colors duration-200">
                          <div className="font-medium text-white">
                            {comment.user?.firstName || 'Unknown'} {comment.user?.lastName || ''}
                          </div>
                          <div className="text-gray-200">{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">✍️</div>
                <p className="text-lg font-medium text-white mb-2">No blogs found</p>
                <p className="text-gray-400">Be the first to share your insights!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Enhanced Promotions */}
        <div className="w-full md:w-1/3">
          <div
            className="rounded-xl shadow-2xl sticky top-4 backdrop-blur-sm border-2 border-gray-700/30"
            style={{
              background: "linear-gradient(145deg, #131516 0%, #1a1d1f 50%, #131516 100%)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm p-6 rounded-t-xl border-b border-gray-700/50">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Promoted Courses
                </h2>
              </div>
              <p className="text-center text-gray-400 text-sm">Discover premium learning content</p>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className="h-40 rounded-xl bg-gradient-to-br from-gray-700/30 to-gray-800/30 animate-pulse backdrop-blur-sm"
                    ></div>
                  ))}
                </div>
              ) : promotions.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {promotions.map((promo, index) => (
                    <div key={promo._id} className="transform transition-all duration-300 hover:scale-[1.01]">
                      <PromoItem promo={promo} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <svg className="w-16 h-16 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-gray-400 font-medium mb-1">No promotions available</p>
                  <p className="text-gray-500 text-sm">Check back later for new courses!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Create Blog Button */}
      <button
        onClick={() => setShowEditor(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-110 z-50 group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 mx-auto group-hover:rotate-90 transition-transform duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Blog Editor Popup */}
      {showEditor && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4"
          onClick={() => setShowEditor(false)}
        >
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl border border-gray-700/50 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Create New Post</h2>
              </div>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-2 rounded-xl transition-all duration-200 hover:rotate-90"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Enter your post title..."
                className="bg-gray-700/50 text-white placeholder-gray-400 p-4 rounded-xl border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-gray-600/50 transition-all duration-200 text-lg font-medium"
                value={newBlog.title}
                onChange={handleBlogChange}
              />
              <textarea
                name="content"
                className="flex-1 bg-gray-700/50 text-white placeholder-gray-400 p-4 rounded-xl border border-gray-600/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-gray-600/50 transition-all duration-200 leading-relaxed"
                placeholder="Share your thoughts, code snippets, or insights with the community..."
                value={newBlog.content}
                onChange={handleBlogChange}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-b-2xl">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Auto-save enabled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Markdown supported</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={createBlog}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 font-medium transform hover:scale-105 disabled:hover:scale-100"
                  disabled={!newBlog.title || !newBlog.content}
                >
                  Publish Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.6);
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.8);
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-black border-t border-gray-700/50 mt-12">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">CodeMaster</h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                Empowering developers with cutting-edge coding challenges, virtual interviews, and a vibrant community platform to share knowledge and grow together.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                  <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                  <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                  <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Problems</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Virtual Interview</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Dashboard</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Promote</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Community</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:codex7devteam@gmail.com" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Contact Support</span>
                  </a>
                </li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">API Reference</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Status Page</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 CodeMaster. All rights reserved. Built with ❤️ by the Codex7 Dev Team.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Cookie Policy</a>
            </div>
          </div>

          {/* Support Email Highlight */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-700/30">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Need Help? Contact Our Support Team</p>
                <a href="mailto:codex7devteam@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-medium">
                  codex7devteam@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MianPage;