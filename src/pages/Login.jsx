import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { unwrapResult } from '@reduxjs/toolkit';
import { loginUser } from "../authSlice";

const loginSchema = z.object({
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(1, "Password is required") 
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authError = useSelector((state) => state.auth.error);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const result = await dispatch(loginUser(data));
      unwrapResult(result);
      navigate('/');
    } catch (error) {
      // Handle 401 specifically
      if (error?.payload?.status === 401) {
        // Keep the error in Redux state for display
      } else {
        // For other errors, preserve form data by not resetting
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-3xl mb-6">Leetcode</h2>
          
          {authError && (
            <div className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {authError.includes('401') 
                  ? 'Invalid email or password' 
                  : authError}
              </span>
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault(); // Prevent default browser behavior
            handleSubmit(onSubmit)(e);
          }}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className={`input input-bordered w-full ${errors.emailId ? 'input-error' : ''}`} 
                {...register('emailId')}
              />
              {errors.emailId && (
                <span className="text-error text-sm mt-1">{errors.emailId.message}</span>
              )}
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 btn btn-ghost btn-sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <span className="text-error text-sm mt-1">{errors.password.message}</span>
              )}
            </div>

            <div className="form-control mt-8">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-6">
            <span className="text-sm">
              Don't have an account?{' '}
              <NavLink to="/signup" className="link link-primary">
                Sign Up
              </NavLink>
            </span>
            <div className="text-center mt-4">
              <NavLink to="/forgot-password" className="link link-primary">
                Forgot Password?
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;