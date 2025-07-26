import { useEffect, useState } from "react";
import axiosClient from "../utils/axiosClient";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streakHistory, setStreakHistory] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosClient.get('/dashboard/info');
        setDashboardData(response.data);
        
        // Generate streak history from dashboard data
        if (response.data.streak) {
          generateStreakHistory(response.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fixed streak history generation
  const generateStreakHistory = (data) => {
    const history = [];
    const today = new Date();
    const lastActive = new Date(data.streak.lastActive);
    const submissions = data.recentSubmissions || [];
    
    // Create a set of submission dates (YYYY-MM-DD format)
    const submissionDates = new Set();
    submissions.forEach(sub => {
      const dateStr = new Date(sub.createdAt).toISOString().split('T')[0];
      submissionDates.add(dateStr);
    });

    // Create 14-day history from today to 13 days ago
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Format date to match submission format
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if this date has a submission
      const hasSubmission = submissionDates.has(dateStr);
      
      history.unshift({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        day: date.getDate(),
        active: hasSubmission ? 1 : 0
      });
    }

    setStreakHistory(history);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <span className="loading loading-spinner loading-lg text-blue-500"></span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-10 bg-gray-900 text-gray-300 h-screen">
        No dashboard data available
      </div>
    );
  }

  const { user, streak } = dashboardData;

  const difficultyData = [
    { name: 'Easy', value: dashboardData.solvedByDifficulty.easy || 0 },
    { name: 'Medium', value: dashboardData.solvedByDifficulty.medium || 0 },
    { name: 'Hard', value: dashboardData.solvedByDifficulty.hard || 0 }
  ];

  const COLORS = ['#10B981', '#FBBF24', '#EF4444'];

  // Custom tooltip for dark theme
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded-md shadow-lg">
          <p className="text-gray-200">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  // Streak visualization component
  const StreakVisualization = () => (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-100">
          {/* Simple SVG fire icon */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="inline-block mr-2 text-orange-500" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12.23 15.5c-.93 0-1.69-.76-1.69-1.69 0-.93.76-1.69 1.69-1.69s1.69.76 1.69 1.69c0 .93-.76 1.69-1.69 1.69zm6.77-6.68c-.74-.33-1.59.22-1.59 1.03 0 .37.19.7.5.88v.06c0 .69-.56 1.25-1.25 1.25s-1.25-.56-1.25-1.25v-.09c-.76-.08-1.5-.28-2.18-.6-1.01-.48-1.85-1.24-2.43-2.18-.52-.86-.79-1.83-.77-2.83h-1.51c-.05 1.02.21 2.02.75 2.89.5.82 1.2 1.48 2.02 1.92.45.25.94.42 1.45.5.23.04.45.07.67.09.18.02.34.03.51.03.69 0 1.34-.17 1.92-.5.58-.33 1.02-.8 1.34-1.37.32-.57.48-1.21.48-1.88 0-1.31-.68-2.47-1.7-3.13-.74-.47-1.63-.6-2.48-.46-.68.12-1.31.43-1.82.9-.51.47-.88 1.07-1.07 1.73h-1.52c.23-1.05.74-2 1.47-2.73s1.68-1.24 2.73-1.47c1.05-.23 2.13-.14 3.11.25 1.11.45 2.03 1.27 2.62 2.33.59 1.06.82 2.29.65 3.5-.17 1.21-.73 2.33-1.58 3.2z"/>
          </svg>
          Your Coding Activity
        </h2>
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{streak.current}</div>
            <div className="text-gray-400 text-sm">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{streak.longest}</div>
            <div className="text-gray-400 text-sm">Longest Streak</div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-gray-300 mb-3">Last 14 Days</h3>
        <div className="flex justify-between">
          {streakHistory.map((day, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                day.active ? 'bg-orange-500' : 'bg-gray-700'
              }`}>
                <span className={`text-xs ${day.active ? 'text-white' : 'text-gray-500'}`}>
                  {day.day}
                </span>
              </div>
              <span className="text-xs text-gray-500">{day.date}</span>
            </div>
          ))}
        </div>
      </div>
      
      {streak.lastActive && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-400">Last active:</span>
            <span className="text-gray-300">
              {new Date(streak.lastActive).toLocaleDateString()} at{' '}
              {new Date(streak.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}
    </div>
  );


 return (
  <div className="min-h-screen" style={{ backgroundColor: "oklch(0.145 0 0)", color: "oklch(0.8 0 0)" }}>
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Coding Dashboard</h1>
        <p className="text-gray-400 text-lg">Your coding journey at a glance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <div
            className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl"
            style={{
              backgroundColor: "#131516",
              border: "0.1px solid oklch(1 0 0 / 0.3)",
              color: "oklch(0.8 0 0)",
            }}
          >
            <div className="flex flex-col items-center">
              <div 
                className="w-20 h-20 rounded-xl mb-4 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "oklch(0.145 0 0)", border: "0.1px solid oklch(1 0 0 / 0.2)" }}
              >
                <span className="text-2xl font-bold text-blue-400">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-400 mb-6">{user.email}</p>

              <div className="w-full space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: "oklch(0.145 0 0)" }}>
                  <h3 className="text-gray-300 text-sm font-semibold mb-3">ACCOUNT DETAILS</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Joined:</span>
                      <span className="text-gray-300 font-mono text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Role:</span>
                      <span className="text-blue-400 font-medium text-sm capitalize">{user.role}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Problems Solved:</span>
                      <span className="font-bold text-green-400 text-lg">
                        {dashboardData.totalSolved}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: "oklch(0.145 0 0)" }}>
                  <h3 className="text-gray-300 text-sm font-semibold mb-3">STREAK INFO</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Current Streak:</span>
                      <span className="font-bold text-orange-400 text-lg">
                        {streak.current} days
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Longest Streak:</span>
                      <span className="font-bold text-purple-400 text-lg">
                        {streak.longest} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <div className="lg:col-span-3">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div
              className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
              style={{
                backgroundColor: "#131516",
                border: "0.1px solid oklch(1 0 0 / 0.3)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {dashboardData.totalSolved}
                  </div>
                  <h3 className="text-gray-300 font-medium">Problems Solved</h3>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
              style={{
                backgroundColor: "#131516",
                border: "0.1px solid oklch(1 0 0 / 0.3)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {dashboardData.totalActiveDays}
                  </div>
                  <h3 className="text-gray-300 font-medium">Active Days</h3>
                </div>
                <div className="p-3 rounded-lg bg-green-500/20">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
              style={{
                backgroundColor: "#131516",
                border: "0.1px solid oklch(1 0 0 / 0.3)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {dashboardData.totalContests}
                  </div>
                  <h3 className="text-gray-300 font-medium">Contests Given</h3>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Visualization - Only show if streak exists */}
          {streak.current > 0 && (
            <div
              className="rounded-xl p-6 shadow-lg mb-6 transition-all duration-200 hover:shadow-xl"
              style={{
                backgroundColor: "#131516",
                border: "0.1px solid oklch(1 0 0 / 0.3)",
              }}
            >
              <h2 className="text-xl font-bold text-orange-400 mb-4">
                Coding Streak
              </h2>
              <StreakVisualization />
            </div>
          )}

          {/* Pie Chart */}
          <div
            className="rounded-xl p-6 shadow-lg mb-6 transition-all duration-200 hover:shadow-xl"
            style={{
              backgroundColor: "#131516",
              border: "0.1px solid oklch(1 0 0 / 0.3)",
            }}
          >
            <h2 className="text-xl font-bold text-yellow-400 mb-6">
              Problems Solved by Difficulty
            </h2>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-full lg:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => (
                        <text 
                          fill="white"
                          x={0}
                          y={0}
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          {`${name}: ${(percent * 100).toFixed(0)}%`}
                        </text>
                      )}
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ color: '#fff' }}
                      formatter={(value) => <span className="text-gray-300">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full lg:w-1/2">
                <div className="space-y-4">
                  {difficultyData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "oklch(0.145 0 0)" }}>
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: COLORS[index] }}
                        ></div>
                        <span className="font-medium text-gray-300 capitalize">{item.name}</span>
                      </div>
                      <span className="text-gray-400 font-mono text-lg">{item.value}</span>
                    </div>
                  ))}
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-300">Total Problems:</span>
                      <span className="text-blue-400 font-bold text-xl">{dashboardData.totalSolved}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl"
            style={{
              backgroundColor: "#131516",
              border: "0.1px solid oklch(1 0 0 / 0.3)",
            }}
          >
            <h2 className="text-xl font-bold text-green-400 mb-6">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {dashboardData.recentSubmissions && dashboardData.recentSubmissions.length > 0 ? (
                dashboardData.recentSubmissions.map((submission, index) => (
                  <div
                    key={submission._id}
                    className="p-4 rounded-lg border-l-4 transition-all duration-200 hover:bg-gray-800/30"
                    style={{ 
                      backgroundColor: "oklch(0.145 0 0)",
                      borderLeftColor: submission.status === 'accepted' ? '#10b981' : '#ef4444'
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-white text-lg mb-2">
                          {submission.problem.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              submission.status === 'accepted'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {submission.status.toUpperCase()}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              submission.problem.difficulty === 'easy'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : submission.problem.difficulty === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {submission.problem.difficulty.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm font-mono">
                        {new Date(submission.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-lg">No recent activity</p>
                  <p className="text-gray-600 text-sm mt-2">Start solving problems to see your activity here!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default DashboardPage;