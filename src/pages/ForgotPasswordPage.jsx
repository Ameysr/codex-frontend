import { useState } from 'react';
import { Link, useNavigate } from 'react-router'; // Fixed import
import axiosClient from '../utils/axiosClient';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // Added useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axiosClient.post('/user/forgot-password', {
        emailId: email
      });
      
      // Navigate to OTP verification with email state
      navigate('/verify-otp', { state: { email } });
    } catch (error) {
      // Handle error response properly
      if (error.response) {
        setMessage(error.response.data);
      } else {
        setMessage('Failed to send OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-3xl mb-6">Reset Password</h2>
          
          {message && (
            <div className="alert alert-info mb-4">
              <span>{message}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-control mt-8">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-6">
            <Link to="/login" className="link link-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;