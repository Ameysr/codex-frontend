import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';

const ContestResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [results, setResults] = useState([]);
  const [currentUserResult, setCurrentUserResult] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchContestResults = async () => {
      try {
        // Fetch contest details and results
        const [contestResponse, resultsResponse] = await Promise.all([
          axiosClient.get(`/contest/fetchById/${id}`),
          axiosClient.get(`/contest/${id}/results`)
        ]);
        
        setContest(contestResponse.data.contest);
        setResults(resultsResponse.data.results || []);
        
        // Find current user's result
        const currentUserId = contestResponse.data.participantData?.user?._id;
        if (currentUserId) {
          const userResult = resultsResponse.data.results.find(
            r => r.user._id === currentUserId
          );
          setCurrentUserResult(userResult);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching contest results:', error);
        setLoading(false);
      }
    };

    fetchContestResults();
  }, [id]);

  const getTrophyIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-oklch(0.145 0 0) text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-oklch(0.145 0 0) text-white p-8 text-center">
        <h2 className="text-2xl mb-4">Contest not found</h2>
        <Link to="/" className="text-blue-400 hover:underline">Return to homepage</Link>
      </div>
    );
  }

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
      <Link
        to="/"
        className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors duration-200"
      >
        CodeEx
      </Link>
    </nav>

    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Panel - Contest Details */}
        <div className="md:w-1/3">
          <div
            className="rounded-xl p-6 mb-6 shadow-lg transition-all duration-200 hover:shadow-xl"
            style={{
              backgroundColor: "#131516",
              border: "0.1px solid oklch(1 0 0 / 0.3)",
              color: "oklch(0.8 0 0)",
            }}
          >
            <h1 className="text-2xl font-bold mb-4 text-blue-400">{contest.title}</h1>
            <p className="mb-6 text-gray-300 leading-relaxed">{contest.description}</p>

            <div className="space-y-4 mb-6">
              <div className="p-3 rounded-lg" style={{ backgroundColor: "oklch(0.145 0 0)" }}>
                <h3 className="text-green-400 text-sm font-semibold mb-1">START DATE</h3>
                <p className="font-mono text-white">{new Date(contest.startDate).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "oklch(0.145 0 0)" }}>
                <h3 className="text-red-400 text-sm font-semibold mb-1">END DATE</h3>
                <p className="font-mono text-white">{new Date(contest.endDate).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "oklch(0.145 0 0)" }}>
                <h3 className="text-yellow-400 text-sm font-semibold mb-1">DURATION</h3>
                <p className="font-mono text-white">
                  {Math.floor(
                    (new Date(contest.endDate) - new Date(contest.startDate)) /
                      (1000 * 60)
                  )}{" "}
                  minutes
                </p>
              </div>
            </div>

            <div
              className="rounded-lg p-4 shadow-md"
              style={{
                backgroundColor: "oklch(0.145 0 0)",
                border: "0.1px solid oklch(1 0 0 / 0.2)",
                color: "oklch(0.8 0 0)",
              }}
            >
              <h3 className="font-bold mb-3 text-lg text-purple-400">Instructions</h3>
              <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                <li>As you start the contest, the timer will start automatically</li>
                <li>Only first attempt result will be considered</li>
                <li>You cannot pause once started</li>
              </ol>
              <div className="mt-4 pt-3 border-t border-gray-700">
                <p className="text-center text-lg font-bold text-green-400">
                  All the best! 🚀
                </p>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  await axiosClient.post(`/contest/${id}/start`);
                  if (contest && contest.problems && contest.problems.length > 0) {
                    const firstProblemId = contest.problems[0]._id;
                    navigate(`/contest/${id}/problem/${firstProblemId}`);
                  } else {
                    alert("This contest has no problems yet");
                  }
                } catch (error) {
                  console.error("Failed to start contest:", error);
                  alert(
                    `Failed to start contest: ${
                      error.response?.data?.message || error.message
                    }`
                  );
                }
              }}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Start Contest
            </button>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="md:w-2/3">
          <div
            className="rounded-xl p-6 shadow-lg"
            style={{
              backgroundColor: "#131516",
              border: "0.1px solid oklch(1 0 0 / 0.3)",
              color: "oklch(0.8 0 0)",
            }}
          >
            <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-gray-700 text-orange-400">
              Contest Results 🏆
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-left text-blue-400 font-semibold">Rank</th>
                    <th className="py-3 px-4 text-left text-blue-400 font-semibold">Participant</th>
                    <th className="py-3 px-4 text-center text-blue-400 font-semibold">Solved</th>
                    <th className="py-3 px-4 text-center text-blue-400 font-semibold">Score</th>
                    <th className="py-3 px-4 text-center text-blue-400 font-semibold">Time</th>
                    <th className="py-3 px-4 text-center text-blue-400 font-semibold">Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr
                      key={result.user._id}
                      className={`border-b border-gray-800 transition-all duration-200 hover:bg-gray-800/50 ${
                        index < 3 ? "bg-gray-800/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="mr-2 font-mono text-lg">{index + 1}</span>
                          {getTrophyIcon(index + 1)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="font-medium text-white">
                            {result.user.firstName} {result.user.lastName}
                          </span>
                          {currentUserResult &&
                            result.user._id === currentUserResult.user._id && (
                              <span className="ml-2 bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-mono">
                          {result.solved}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 font-mono">
                          {result.totalScore}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-mono">
                          {Math.floor(result.totalTime / 60)}m{" "}
                          {result.totalTime % 60}s
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-mono">
                          {result.attempts}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {currentUserResult && (
              <div
                className="mt-8 p-6 rounded-lg shadow-lg"
                style={{
                  backgroundColor: "oklch(0.145 0 0)",
                  border: "0.1px solid oklch(1 0 0 / 0.3)",
                  color: "oklch(0.8 0 0)",
                }}
              >
                <h3 className="font-bold text-lg mb-4 text-green-400">Your Performance 📊</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    className="p-4 rounded-lg text-center transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: "#131516",
                      border: "0.1px solid oklch(1 0 0 / 0.3)",
                    }}
                  >
                    <div className="text-blue-400 font-medium text-sm mb-1">Rank</div>
                    <div className="font-mono text-2xl mt-1 text-white">
                      #{results.findIndex(
                        (r) => r.user._id === currentUserResult.user._id
                      ) + 1}
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-lg text-center transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: "#131516",
                      border: "0.1px solid oklch(1 0 0 / 0.3)",
                    }}
                  >
                    <div className="text-green-400 font-medium text-sm mb-1">Solved</div>
                    <div className="font-mono text-2xl mt-1 text-white">
                      {currentUserResult.solved}
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-lg text-center transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: "#131516",
                      border: "0.1px solid oklch(1 0 0 / 0.3)",
                    }}
                  >
                    <div className="text-purple-400 font-medium text-sm mb-1">Score</div>
                    <div className="font-mono text-2xl mt-1 text-white">
                      {currentUserResult.totalScore}
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-lg text-center transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: "#131516",
                      border: "0.1px solid oklch(1 0 0 / 0.3)",
                    }}
                  >
                    <div className="text-yellow-400 font-medium text-sm mb-1">Time Taken</div>
                    <div className="font-mono text-2xl mt-1 text-white">
                      {Math.floor(currentUserResult.totalTime / 60)}m{" "}
                      {currentUserResult.totalTime % 60}s
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

};

export default ContestResultsPage;