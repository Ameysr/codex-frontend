import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

// ✅ Define helper first
const getDifficultyBadgeColor = (difficulty) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'badge-success';
    case 'medium': return 'badge-warning';
    case 'hard': return 'badge-error';
    default: return 'badge-neutral';
  }
};

// Circular progress component for goal visualization
const CircularProgress = ({ value, max, size = 120, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(0.2 0 0)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A8CD8"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold">{value}/{max}</div>
        <div className="text-xs text-gray-400 mt-1">solved</div>
      </div>
    </div>
  );
};

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate(); 

  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [problemsPerPage] = useState(7);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);

  const [showGoalPopup, setShowGoalPopup] = useState(false);
  const [goalData, setGoalData] = useState({
    dailyProblems: 1,
    duration: 7,
    startDate: new Date().toISOString().split('T')[0],
    tags: [],
    difficulty: 'all',
  });
  const [todaysGoal, setTodaysGoal] = useState(null);
  const [goalProgress, setGoalProgress] = useState({
    solvedToday: 0,
    target: 0,
  });
  const availableTags = ['array', 'linkedList', 'graph', 'dp', 'string', 'tree', 'hashTable'];
  const [contests, setContests] = useState([]);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const res = await axiosClient.get('/contest/fetchAll');
        setContests(res.data.contests);
      } catch (err) {
        console.error('Error fetching contests', err);
      }
    };
    fetchContests();
  }, []);

  // Fetch problems with pagination
  const fetchProblems = async () => {
    try {
      const { data } = await axiosClient.get('/problem/getAllProblem', {
        params: {
          page: currentPage,
          limit: problemsPerPage
        }
      });
      setProblems(data.problems);
      setTotalPages(data.totalPages);
      setTotalProblems(data.totalProblems);
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  };

  const fetchSolvedProblems = async () => {
    try {
      const { data: remoteSolved } = await axiosClient.get('/problem/problemSolvedByUser');
      const localSolved = JSON.parse(localStorage.getItem('solvedProblems') || '[]');

      const merged = [
        ...remoteSolved,
        ...localSolved.filter(localItem =>
          !remoteSolved.some(remoteItem => remoteItem._id === localItem.id)
        ),
      ];

      setSolvedProblems(merged);
    } catch (error) {
      console.error('Error fetching solved problems:', error);
    }
  };

  useEffect(() => {
    fetchProblems();
    if (user) fetchSolvedProblems();
  }, [user, currentPage]); // Add currentPage as dependency

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };
     
  const filteredProblems = problems.filter((problem) => {
    const difficultyMatch =
      filters.difficulty === 'all' || problem.difficulty === filters.difficulty;

    const tagMatch =
      filters.tag === 'all' || 
      (Array.isArray(problem.tags) && problem.tags.includes(filters.tag));

    const statusMatch =
      filters.status === 'all' ||
      solvedProblems.some(
        (sp) => sp._id === problem._id || sp.id === problem._id
      );

    return difficultyMatch && tagMatch && statusMatch;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.difficulty, filters.tag, filters.status]);

  useEffect(() => {
    const savedGoal = localStorage.getItem('codingGoal');
    if (savedGoal) {
      setTodaysGoal(JSON.parse(savedGoal));
      setGoalProgress({
        target: JSON.parse(savedGoal).dailyProblems,
        solvedToday: 0,
      });
    }
  }, []);

  useEffect(() => {
    if (!todaysGoal || !user) return;

    const calculateProgress = () => {
      const today = new Date().toISOString().split('T')[0];
      const localSolved = JSON.parse(localStorage.getItem('solvedProblems') || '[]');

      const relevantSolved = localSolved.filter((problem) => {
        if (problem.date !== today) return false;
        if (todaysGoal.difficulty !== 'all' && problem.difficulty !== todaysGoal.difficulty) {
          return false;
        }
        if (
          todaysGoal.tags.length > 0 &&
          !todaysGoal.tags.some((tag) => problem.tags.includes(tag))
        ) {
          return false;
        }
        return true;
      });

      setGoalProgress({
        solvedToday: relevantSolved.length,
        target: todaysGoal.dailyProblems,
      });
    };

    calculateProgress();

    const handleProblemSolved = () => {
      calculateProgress();
    };

    window.addEventListener('problemSolved', handleProblemSolved);
    return () => {
      window.removeEventListener('problemSolved', handleProblemSolved);
    };
  }, [todaysGoal, user]);

  const handleCreateGoal = () => {
    setShowGoalPopup(true);
  };

  const handleSaveGoal = () => {
    const newGoal = {
      ...goalData,
      endDate: calculateEndDate(goalData.startDate, goalData.duration),
    };

    setTodaysGoal(newGoal);
    localStorage.setItem('codingGoal', JSON.stringify(newGoal));

    setGoalProgress({
      target: goalData.dailyProblems,
      solvedToday: 0,
    });

    setShowGoalPopup(false);
  };

  const calculateEndDate = (start, days) => {
    const date = new Date(start);
    date.setDate(date.getDate() + parseInt(days));
    return date.toISOString().split('T')[0];
  };

  // Pagination controls
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers with ellipsis
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => goToPage(1)}
          className={`px-3 py-1 rounded-lg font-medium ${1 === currentPage ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="px-2 text-gray-400">
            ...
          </span>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 rounded-lg font-medium ${i === currentPage ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          {i}
        </button>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-2 text-gray-400">
            ...
          </span>
        );
      }
      
      pages.push(
        <button
          key={totalPages}
          onClick={() => goToPage(totalPages)}
          className={`px-3 py-1 rounded-lg font-medium ${totalPages === currentPage ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          {totalPages}
        </button>
      );
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "oklch(0.145 0 0)", color: "oklch(0.8 0 0)" }}>
      {/* Top Navigation Bar */}
      <nav
        className="border-b py-4 px-6 flex justify-between items-center shadow-lg"
        style={{
          backgroundColor: "#131516",
          borderBottom: "0.1px solid oklch(1 0 0 / 0.3)",
          color: "oklch(0.8 0 0)",
        }}
      >
        <NavLink
          to="/"
          className="text-2xl font-bold text-gray-300 hover:text-white transition-colors duration-200"
        >
          LeetCode
        </NavLink>
        
        <div className="flex items-center gap-4">
          {/* Virtual Interview Button */}
          <NavLink 
            to="/interview" 
            className="px-4 py-2 rounded-lg font-medium bg-purple-500/80 hover:bg-purple-600/80 text-white text-sm transition-all duration-200 hover:scale-105"
          >
            Virtual Interview
          </NavLink>

          {/* Dashboard Button */}
          <NavLink 
            to="/dashboard" 
            className="px-4 py-2 rounded-lg font-medium bg-green-500/80 hover:bg-green-600/80 text-white text-sm transition-all duration-200 hover:scale-105"
          >
            Dashboard
          </NavLink>

          {/* Promote Button */}
          <NavLink 
            to="/promote" 
            className="px-4 py-2 rounded-lg font-medium bg-blue-500/80 hover:bg-blue-600/80 text-white text-sm transition-all duration-200 hover:scale-105"
          >
            Promote
          </NavLink>

          {/* User Dropdown */}
          <div className="relative group">
            <div 
              tabIndex={0} 
              className="px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-gray-600/50 transition-all duration-200"
              style={{ color: "oklch(0.8 0 0)" }}
            >
              {user?.firstName} ▾
            </div>
            <ul className="absolute right-0 mt-2 w-48 py-2 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                style={{ backgroundColor: "#131516", border: "0.1px solid oklch(1 0 0 / 0.3)" }}>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-600/50 transition-colors"
                  style={{ color: "oklch(0.8 0 0)" }}
                >
                  Logout
                </button>
              </li>
              {user.role === 'admin' && (
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
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Panel - Goal & Course Details */}
          <div className="md:w-1/3">
            {/* Goal Section */}
            {/* Daily Goal Section */}
            <div
              className="rounded-xl p-6 mb-6 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
              style={{
                backgroundColor: "#131516",
                border: "0.1px solid oklch(1 0 0 / 0.3)",
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-white">Today's Goal</h1>
                <button
                  onClick={handleCreateGoal}
                  className="text-sm bg-gray-700 hover:bg-gray-600 hover:scale-105 px-3 py-1 rounded transition-all duration-200 text-white font-medium"
                >
                  {todaysGoal ? "Edit" : "Create"}
                </button>
              </div>

              {todaysGoal ? (
                <div className="flex flex-col items-center">
                  <CircularProgress
                    value={goalProgress.solvedToday}
                    max={goalProgress.target}
                  />

                  <div className="mt-6 w-full">
                    <div className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-white">
                        {Math.round(
                          (goalProgress.solvedToday / goalProgress.target) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                        style={{
                          width: `${(goalProgress.solvedToday / goalProgress.target) * 100
                            }%`,
                        }}
                      ></div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-all duration-200 hover:scale-105 border border-transparent hover:border-blue-500/30">
                        <h3 className="text-gray-400 text-xs uppercase mb-1">
                          Daily Target
                        </h3>
                        <p className="font-medium text-white">
                          {todaysGoal?.dailyProblems || 0} problems
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-all duration-200 hover:scale-105 border border-transparent hover:border-blue-500/30">
                        <h3 className="text-gray-400 text-xs uppercase mb-1">
                          Duration
                        </h3>
                        <p className="font-medium text-white">{todaysGoal?.duration || 0} days</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-all duration-200 border border-transparent hover:border-blue-500/30">
                      <h3 className="text-gray-400 text-xs uppercase mb-2">
                        Focus Areas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {todaysGoal?.tags?.length > 0 ? (
                          todaysGoal.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded text-xs bg-gray-700 text-white hover:bg-blue-600 transition-all duration-200 cursor-pointer hover:scale-105"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">None set</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No goal set for today</p>
                  <button
                    onClick={handleCreateGoal}
                    className="bg-blue-500 hover:bg-blue-600 hover:scale-105 text-white px-4 py-2 rounded transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25"
                  >
                    Create Goal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Problems & Contests */}
          <div className="md:w-2/3">
            {/* Contests Section - Now at the top */}
          <div
            className="rounded-xl p-6 mb-6"
            style={{
              backgroundColor: "#131516",
              border: "0.1px solid oklch(1 0 0 / 0.3)",
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Ongoing Contests</h2>
      
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contests.map((contest) => (
                <div
                  key={contest._id}
                  className="p-4 rounded-lg border border-gray-700 hover:border-blue-400 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10"
                  onClick={() => navigate(`/contest/${contest._id}/results`)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-white hover:text-blue-300 transition-colors duration-200">
                      {contest.title}
                    </h3>
                    <span className="px-3 py-1 bg-blue-900 text-blue-200 text-xs rounded-full hover:bg-blue-800 transition-colors duration-200">
                      Active
                    </span>
                  </div>
                  <div className="flex mt-3 text-sm text-gray-300">
                    <div className="mr-6">
                      <div className="text-xs uppercase mb-1 text-gray-400">Starts</div>
                      <div className="text-white">
                        {new Date(contest.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase mb-1 text-gray-400">Ends</div>
                      <div className="text-white">
                        {new Date(contest.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {contests.length === 0 && (
                <div className="text-center py-8 text-gray-400 col-span-full">
                  No active contests at the moment
                </div>
              )}
            </div>
          </div>


  {/* Problems Section - Moved below contests */}
  <div
    className="rounded-xl p-6 shadow-lg"
    style={{
      backgroundColor: "#131516",
      border: "0.1px solid oklch(1 0 0 / 0.3)",
      color: "oklch(0.8 0 0)",
    }}
  >
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold pb-2 border-b border-gray-700 text-orange-400">
        All Problems
      </h2>
      <div className="text-gray-400">
        Showing {problems.length} of {totalProblems} problems
      </div>
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-4 my-6">
      <select 
        className="px-4 py-2 rounded-lg font-medium border-0 focus:ring-2 focus:ring-blue-500 transition-all"
        style={{ backgroundColor: "oklch(0.145 0 0)", color: "oklch(0.8 0 0)" }}
        value={filters.status}
        onChange={(e) => setFilters({...filters, status: e.target.value})}
      >
        <option value="all">All Problems</option>
        <option value="solved">Solved Problems</option>
      </select>

      <select 
        className="px-4 py-2 rounded-lg font-medium border-0 focus:ring-2 focus:ring-blue-500 transition-all"
        style={{ backgroundColor: "oklch(0.145 0 0)", color: "oklch(0.8 0 0)" }}
        value={filters.difficulty}
        onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
      >
        <option value="all">All Difficulties</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <select 
        className="px-4 py-2 rounded-lg font-medium border-0 focus:ring-2 focus:ring-blue-500 transition-all"
        style={{ backgroundColor: "oklch(0.145 0 0)", color: "oklch(0.8 0 0)" }}
        value={filters.tag}
        onChange={(e) => setFilters({...filters, tag: e.target.value})}
      >
        <option value="all">All Tags</option>
        <option value="array">Array</option>
        <option value="linkedList">Linked List</option>
        <option value="graph">Graph</option>
        <option value="dp">DP</option>
      </select>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="py-3 px-4 text-left text-gray-300 font-semibold">Problem</th>
            <th className="py-3 px-4 text-center text-gray-300 font-semibold">Difficulty</th>
            <th className="py-3 px-4 text-center text-gray-300 font-semibold">Tags</th>
            <th className="py-3 px-4 text-center text-gray-300 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredProblems.map((problem, index) => (
            <tr
              key={problem._id}
              className={`border-b border-gray-800 transition-all duration-200 hover:bg-gray-800/50`}
            >
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <span className="mr-2 font-mono text-lg text-gray-400">
                    {(currentPage - 1) * problemsPerPage + index + 1}
                  </span>
                  <NavLink 
                    to={`/problem/${problem._id}`} 
                    className="font-medium text-white hover:text-blue-400 transition-colors"
                  >
                    {problem.title}
                  </NavLink>
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`px-3 py-1 rounded-full text-white text-sm ${getDifficultyBadgeColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="px-3 py-1 bg-blue-500/80 text-white text-sm rounded-full">
                  {problem.tags}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                {solvedProblems.some(sp => sp._id === problem._id) ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-green-500/80 text-white text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Solved
                  </div>
                ) : (
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full">
                    Not Solved
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Pagination controls */}
    <div className="flex justify-between items-center mt-6">
      <div className="text-gray-400 text-sm">
        Page {currentPage} of {totalPages}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            currentPage === 1 
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Previous
        </button>
        
        <div className="flex gap-1">
          {renderPageNumbers()}
        </div>
        
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            currentPage === totalPages 
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  </div>
</div>
        </div>
      </div>

      {/* Goal Creation Popup */}
      {showGoalPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="rounded-xl shadow-2xl p-6 w-full max-w-md m-4" style={{ backgroundColor: "#131516", border: "0.1px solid oklch(1 0 0 / 0.3)", color: "oklch(0.8 0 0)" }}>
            <h2 className="text-xl font-bold mb-6 text-blue-400">Set Your Coding Goal</h2>
            
            <div className="space-y-4">
              {/* Daily Problems */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Problems per day
                </label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ backgroundColor: "oklch(0.145 0 0)", color: "oklch(0.8 0 0)" }}
                  value={goalData.dailyProblems}
                  onChange={(e) => setGoalData({...goalData, dailyProblems: e.target.value})}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num} problem{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Duration (days)
                </label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ backgroundColor: "oklch(0.145 0 0)", color: "oklch(0.8 0 0)" }}
                  value={goalData.duration}
                  onChange={(e) => setGoalData({...goalData, duration: e.target.value})}
                >
                  {[3, 7, 14, 21, 30].map(days => (
                    <option key={days} value={days}>{days} days</option>
                  ))}
                </select>
              </div>
              
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Difficulty Focus
                </label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ backgroundColor: "oklch(0.145 0 0)", color: "oklch(0.8 0 0)" }}
                  value={goalData.difficulty}
                  onChange={(e) => setGoalData({...goalData, difficulty: e.target.value})}
                >
                  <option value="all">Any Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Focus Topics
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        checked={goalData.tags.includes(tag)}
                        onChange={(e) => {
                          const newTags = e.target.checked
                            ? [...goalData.tags, tag]
                            : goalData.tags.filter(t => t !== tag);
                          setGoalData({...goalData, tags: newTags});
                        }}
                      />
                      <span className="text-sm capitalize text-gray-300">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ backgroundColor: "oklch(0.145 0 0)", color: "oklch(0.8 0 0)" }}
                  value={goalData.startDate}
                  onChange={(e) => setGoalData({...goalData, startDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button 
                className="px-4 py-2 rounded-lg font-medium bg-gray-600/80 hover:bg-gray-700/80 text-white transition-all duration-200"
                onClick={() => setShowGoalPopup(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 rounded-lg font-medium bg-blue-500/80 hover:bg-blue-600/80 text-white transition-all duration-200"
                onClick={handleSaveGoal}
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Homepage;