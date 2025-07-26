import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';

function ResetPasswordPage() {
  const { state } = useLocation();
  const [email] = useState(state?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage("Passwords don't match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axiosClient.post('/user/reset-password', {
        emailId: email,
        newPassword
      });
      
      setMessage(response.data);
      
      if (response.status === 200) {
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      // Handle error response properly
      if (error.response) {
        setMessage(error.response.data);
      } else {
        setMessage('Failed to reset password');
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
            <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-error'} mb-4`}>
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
                className="input input-bordered w-full"
                value={email}
                readOnly
              />
            </div>
            
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">New Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Confirm Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default ResetPasswordPage;