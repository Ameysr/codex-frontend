import {Routes, Route ,Navigate} from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { useEffect } from "react";
import AdminPanel from "./components/AdminPanel";
import ProblemPage from "./pages/ProblemPage"
import ContestEditorPage from "./pages/ContestEditorPage";
import Admin from "./pages/Admin";
import AdminDelete from "./components/AdminDelete"
import Contest from "./components/Contestt";
import ContestResultsPage from "./pages/ContestResultsPage";
import DashboardPage from "./pages/DashboardPage";
import Interview from "./pages/Interview";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyOTPPage from "./pages/VerifyOTPPage";
import AdminVideo from "./components/AdminVideo";
import AdminUpload from "./components/AdminUpload";
import PromotePage from "./pages/PromotePage";
import MianPage from "./pages/MainPage";


function App(){
  
  const dispatch = useDispatch();
  const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);

  // check initial authentication
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  return(
  <>
    <Routes>
      <Route path="/" element={isAuthenticated ?<MianPage></MianPage>:<Navigate to="/signup" />}></Route>
      <Route path="/home" element={isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" />}></Route>
      <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login></Login>}></Route>
      <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<Signup></Signup>}></Route>
      <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
      <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
      <Route path="/admin/delete" element={isAuthenticated && user?.role === 'admin' ? <AdminDelete /> : <Navigate to="/" />} />
      <Route path="/problem/:problemId" element={<ProblemPage/>}></Route>
      <Route path="/contest/:contestId/problem/:problemId" element={<ContestEditorPage />} />
      <Route path="/admin/contest" element={isAuthenticated && user?.role === 'admin' ? <Contest /> : <Navigate to="/" />}/>
      <Route path="/contest/:id/results" element={<ContestResultsPage />} />
      <Route path="/dashboard" element={ <DashboardPage/>} />
      <Route path="/interview" element={ <Interview/>} />

      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-otp" element={<VerifyOTPPage />} />
      <Route path="/promote" element={<PromotePage />} />

      <Route path="/admin/video" element={isAuthenticated && user?.role === 'admin' ? <AdminVideo /> : <Navigate to="/" />} />
      <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminUpload /> : <Navigate to="/" />} />
    </Routes>
  </>
  )
}

export default App;