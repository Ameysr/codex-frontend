import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../utils/axiosClient'; // Update the path if needed
import { useNavigate } from 'react-router';
import * as nsfwjs from 'nsfwjs';

const PromotePage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetUrl: '',
    promoDuration: '1month'
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moderationResult, setModerationResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [nsfwModel, setNsfwModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const navigate = useNavigate();

  // Load NSFWJS model once
  useEffect(() => {
    const loadModel = async () => {
      setModelLoading(true);
      try {
        const model = await nsfwjs.load();
        setNsfwModel(model);
      } catch (err) {
        console.error('Failed to load NSFW model:', err);
        setError('Failed to load content moderation system');
      } finally {
        setModelLoading(false);
      }
    };
    loadModel();
  }, []);

  // Function to check image content
  const checkImage = async (image) => {
    if (!nsfwModel) throw new Error('Model not loaded');

    if (image instanceof File) {
      const img = new Image();
      img.src = URL.createObjectURL(image);
      await img.decode();
      return nsfwModel.classify(img);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      if (nsfwModel) {
        const predictions = await checkImage(file);
        const explicitClasses = ['Porn', 'Hentai', 'Sexy'];
        const isExplicit = predictions.some(pred =>
          explicitClasses.includes(pred.className) && pred.probability > 0.85
        );

        if (isExplicit) {
          setError('Selected image contains explicit content. Please choose another.');
          setModerationResult(predictions);
          setImageFile(null);
          setPreviewUrl('');
          fileInputRef.current.value = '';
        } else {
          setModerationResult(predictions);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setModerationResult(null);

    try {
      const formPayload = new FormData();
      formPayload.append('title', formData.title);
      formPayload.append('description', formData.description);
      formPayload.append('targetUrl', formData.targetUrl);
      formPayload.append('promoDuration', formData.promoDuration);

      if (imageFile) {
        formPayload.append('imageFile', imageFile);
      } else {
        throw new Error('Please provide an image file');
      }

      const response = await axiosClient.post('/userPromo/promo', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success && response.data.order) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          const options = {
            key: "rzp_test_nh2y4OogGF5UHN",
            amount: response.data.order.amount,
            currency: 'INR',
            name: 'LeetCode Promotion',
            description: `Promoting: ${formData.title}`,
            order_id: response.data.order.id,
            handler: async function(paymentResponse) {
              try {
                await axiosClient.post(`/userPromo/${response.data.promo._id}/verify`, {
                  order_id: paymentResponse.razorpay_order_id,
                  payment_id: paymentResponse.razorpay_payment_id,
                  signature: paymentResponse.razorpay_signature
                }, {
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                  }
                });
                alert('Payment successful! Your course is now promoted.');
                navigate('/', { state: { promoSuccess: true } });
              } catch (err) {
                console.error('Payment verification failed:', err);
                alert('Payment verification failed. Please contact support.');
              }
            },
            theme: { color: '#2563eb' },
            modal: {
              ondismiss: function() {
                alert('Payment was cancelled. You can try again later.');
              }
            },
            method: {
              netbanking: true,
              card: true,
              upi: true,
              wallet: true
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create promotion';
      setError(errorMsg);
      console.error('Promotion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pricing = {
    '1day': 100,
    '1week': 500,
    '1month': 1500
  };

  if (modelLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading content safety system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: "oklch(0.145 0 0)", color: "oklch(0.8 0 0)" }}>
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: white;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #e5e5e5;
        }
      `}</style>

      {/* Top Navigation Bar */}
      <div style={{
        backgroundColor: "#131516",
        borderBottom: "0.1px solid oklch(1 0 0 / 0.3)",
        color: "oklch(0.8 0 0)",
      }} className="px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/home')}
            className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-all duration-300 hover:scale-105 cursor-pointer"
          >
            Codex7
          </button>
          <div className="text-sm text-gray-400">
            Course Promotion Platform
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Left Panel - Instructions & Analysis */}
        <div className="w-72 p-4 overflow-y-auto" style={{ borderRight: "0.1px solid oklch(1 0 0 / 0.3)" }}>
          <div className="rounded-lg p-3 mb-4 border hover:shadow-lg transition-all duration-300" style={{ 
            backgroundColor: "#131516", 
            border: "0.1px solid oklch(1 0 0 / 0.3)" 
          }}>
            <h3 className="text-base font-semibold text-blue-400 mb-2">📋 Instructions</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <p className="hover:text-gray-200 transition-colors">• Upload high-quality course images</p>
              <p className="hover:text-gray-200 transition-colors">• Keep descriptions concise and engaging</p>
              <p className="hover:text-gray-200 transition-colors">• Ensure all links are HTTPS secured</p>
              <p className="hover:text-gray-200 transition-colors">• Images are automatically scanned for content safety</p>
            </div>
          </div>

          {/* Content Analysis */}
          {moderationResult && (
            <div className="rounded-lg p-3 border hover:shadow-lg transition-all duration-300" style={{ 
              backgroundColor: "#131516",
              border: "0.1px solid oklch(1 0 0 / 0.3)"
            }}>
              <h4 className="text-sm font-semibold text-green-400 mb-2">🛡️ Content Analysis</h4>
              <div className="space-y-1">
                {moderationResult.filter(pred => pred.className !== 'Sexy').map((pred, index) => (
                  <div key={index} className="flex justify-between items-center hover:bg-gray-800/50 p-1 rounded transition-colors">
                    <span className="text-xs text-gray-400">{pred.className}</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-8 bg-gray-700 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-300 ${
                            pred.probability > 0.7 ? 'bg-red-500' :
                            pred.probability > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${pred.probability * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${
                        pred.probability > 0.7 ? 'text-red-400' :
                        pred.probability > 0.4 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {(pred.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto h-full">
            <div className="rounded-xl shadow-xl p-4 border hover:shadow-2xl transition-all duration-300 h-full" style={{ 
              backgroundColor: "#131516",
              border: "0.1px solid oklch(1 0 0 / 0.3)"
            }}>
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold text-blue-400 mb-1">Promote Your Course</h1>
                <p className="text-gray-400 text-sm">Reach thousands of developers on our platform</p>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-2 mb-3 text-sm">
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              <div className="space-y-3 h-full">
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-3">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Course Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm hover:border-blue-500 focus:border-blue-400 transition-all duration-300"
                        placeholder="Advanced Algorithm Course"
                        required
                        maxLength={100}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm hover:border-blue-500 focus:border-blue-400 transition-all duration-300 resize-none"
                        rows={4}
                        placeholder="Describe your course in 2-3 sentences..."
                        required
                        maxLength={500}
                      />
                    </div>

                    {/* Target URL */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Course Link</label>
                      <input
                        type="url"
                        name="targetUrl"
                        value={formData.targetUrl}
                        onChange={handleChange}
                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm hover:border-blue-500 focus:border-blue-400 transition-all duration-300"
                        placeholder="https://yourcourse.com"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be a secure HTTPS link</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    {/* Image Upload */}
                    <div className="border rounded-lg p-3 hover:shadow-md transition-all duration-300" style={{ 
                      border: "0.1px solid oklch(1 0 0 / 0.3)"
                    }}>
                      <h3 className="text-sm font-semibold mb-2 text-gray-300">Promotion Image</h3>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="w-full text-xs text-gray-400
                          file:mr-2 file:py-1 file:px-3
                          file:rounded file:border-0
                          file:text-xs file:font-semibold
                          file:bg-blue-600 file:text-white
                          hover:file:bg-blue-700 file:transition-all file:duration-300 cursor-pointer"
                        required={!previewUrl}
                      />
                      {previewUrl && (
                        <div className="mt-2">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-24 object-cover rounded hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => window.open(previewUrl, '_blank')}
                          />
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="border rounded-lg p-3 hover:shadow-md transition-all duration-300" style={{ 
                      border: "0.1px solid oklch(1 0 0 / 0.3)"
                    }}>
                      <h3 className="text-sm font-semibold mb-2 text-gray-300">Duration & Pricing</h3>
                      <div className="space-y-1">
                        {Object.entries(pricing).map(([duration, price]) => (
                          <label
                            key={duration}
                            className={`flex items-center p-2 rounded cursor-pointer transition-all duration-300 hover:scale-105 ${
                              formData.promoDuration === duration
                                ? 'bg-blue-900/30 border border-blue-500 shadow-md'
                                : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                            }`}
                          >
                            <input
                              type="radio"
                              name="promoDuration"
                              value={duration}
                              checked={formData.promoDuration === duration}
                              onChange={handleChange}
                              className="mr-2"
                            />
                            <div className="flex-1 flex justify-between">
                              <span className="text-sm text-gray-200">{duration}</span>
                              <span className="text-sm font-medium text-blue-400">₹{price}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      'Promote Now'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotePage;