import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import Editor from "@monaco-editor/react";
import axiosClient from "../utils/axiosClient";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Split from "react-split";
import SubmissionHistory from "../components/SubmissionHistory";
import { BeatLoader } from "react-spinners";
import { saveContestCode } from "../contestCodeSlice";
import { useSelector, useDispatch } from 'react-redux';

const langMap = {
  cpp: "C++",
  java: "Java",
  javascript: "JavaScript",
};

const ContestEditorPage = () => {
  const navigate = useNavigate();
  const { contestId, problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("cpp");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState("description");
  const [activeRightTab, setActiveRightTab] = useState("code");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [contest, setContest] = useState(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const editorRef = useRef(null);
  const [participantData, setParticipantData] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [problems, setProblems] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const dispatch = useDispatch();
  const contestCodeStore = useSelector(state => state.contestCode.contestCodeStore);
  const timerRef = useRef(null);

  // Fixed timer implementation
  useEffect(() => {
    if (participantData?.startTime && !participantData?.endTime) {
      // Calculate initial elapsed time
      const start = new Date(participantData.startTime);
      const now = new Date();
      const initialElapsed = Math.floor((now - start) / 1000);
      setElapsedTime(initialElapsed);
      
      // Set up interval
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [participantData]);

  // Fetch contest and problem data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch contest data
        const contestResponse = await axiosClient.get(`/contest/fetchById/${contestId}`);
        const { contest, participantData } = contestResponse.data;
        
        setContest(contest);
        setParticipantData(participantData || null);
        setProblems(contest.problems || []);
        
        // Find current problem index
        if (contest && contest.problems) {
          const index = contest.problems.findIndex(p => p._id === problemId);
          setCurrentProblemIndex(index !== -1 ? index : 0);
        }
        
        // Fetch problem data with saved code logic
        if (problemId) {
          const problemResponse = await axiosClient.get(`/problem/problemById/${problemId}`);
          const problem = problemResponse.data;

          const savedCode = contestCodeStore[contestId]?.[problemId]?.[selectedLanguage];
          const initialCode = problem.startCode?.find(
            sc => sc.language === langMap[selectedLanguage]
          )?.initialCode || "";

          setProblem(problem);
          setCode(savedCode || initialCode);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setIsNavigating(false);
      }
    };

    fetchData();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [contestId, problemId, selectedLanguage]);

  const handleEditorChange = (value) => {
    const newCode = value || "";
    setCode(newCode);
    dispatch(saveContestCode({
      contestId,
      problemId,
      language: selectedLanguage,
      code: newCode
    }));
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Fixed language switching without spinner
  const handleLanguageChange = (language) => {
    // Save current code before switching languages
    dispatch(saveContestCode({
      contestId,
      problemId,
      language: selectedLanguage,
      code: code
    }));
    
    // Check if we have saved code for the new language
    const savedCode = contestCodeStore[contestId]?.[problemId]?.[language];
    
    if (savedCode) {
      setCode(savedCode);
    } else if (problem) {
      const initialCodeObj = problem.startCode.find(
        sc => sc.language === langMap[language]
      );
      
      if (initialCodeObj) {
        setCode(initialCodeObj.initialCode);
      } else {
        console.error(`Initial code not found for language: ${language}`);
        setCode("");
      }
    }
    
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setRunResult(null);

    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage,
      });

      setRunResult(response.data);
    } catch (error) {
      console.error("Error running code:", error);
      setRunResult({
        success: false,
        error: "Internal server error",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (contest) {
      const contestTimeLeft = (new Date(contest.endDate).getTime() - Date.now()) / 1000;
      if (contestTimeLeft <= 0) {
        alert("Contest has ended. Submissions are closed.");
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const submitResponse = await axiosClient.post(`/contest/submit/${problemId}`, {
        code: code,
        language: selectedLanguage,
        contestId: contestId
      });

      setSubmitResult(submitResponse.data);
      setActiveRightTab("result");
    } catch (error) {
      console.error("Full error:", error);
      
      // Improved error handling
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Submission failed";
      
      console.error("Detailed error:", errorMessage);
      
      setSubmitResult({
        accepted: false,
        error: errorMessage
      });
      setActiveRightTab("result");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case "javascript":
        return "javascript";
      case "java":
        return "java";
      case "cpp":
        return "cpp";
      default:
        return "javascript";
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "hard":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  // Navigation functions
  const goToNextProblem = () => {
    dispatch(saveContestCode({
      contestId,
      problemId,
      language: selectedLanguage,
      code: code
    }));

    if (contest && currentProblemIndex < contest.problems.length - 1) {
      setIsNavigating(true);
      const nextProblemId = contest.problems[currentProblemIndex + 1]._id;
      navigate(`/contest/${contestId}/problem/${nextProblemId}`);
    }
  };

  const goToPrevProblem = () => {
    dispatch(saveContestCode({
      contestId,
      problemId,
      language: selectedLanguage,
      code: code
    }));

    if (contest && currentProblemIndex > 0) {
      setIsNavigating(true);
      const prevProblemId = contest.problems[currentProblemIndex - 1]._id;
      navigate(`/contest/${contestId}/problem/${prevProblemId}`);
    }
  };

  // Handle leave contest
  const handleLeaveContest = async () => {
    setIsLeaving(true);
    try {
      await axiosClient.post(`/contest/${contestId}/end`, {
        timeTaken: elapsedTime
      });
      navigate(`/contest/${contestId}/results`);
    } catch (err) {
      console.error('Failed to end contest:', err);
      alert('Failed to end contest: ' + err.message);
    } finally {
      setIsLeaving(false);
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-oklch(0.145 0 0) text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

return (
    <div className="h-screen flex flex-col overflow-hidden" style={{backgroundColor:"oklch(0.145 0 0)"}}>
      {/* TOP BAR */}
      <div 
        className="w-full flex justify-between items-center px-6 py-4 shadow-lg" 
        style={{ 
          backgroundColor: "#131516",
          borderBottom:"0.1px solid oklch(1 0 0 / 0.3)"
        }}
      >
        <div className="flex items-center gap-4">
          {problem && (
            <>
              <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${getDifficultyColor(problem.difficulty)} shadow-lg`}>
                {problem.difficulty.toUpperCase()}
              </span>
              
              <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-lg font-medium shadow-lg">
                Timer: {formatTime(elapsedTime)}
              </div>
              
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all duration-200 border border-red-500 hover:border-red-400 shadow-lg transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                onClick={() => setShowLeaveConfirmation(true)}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <>
                    <span>🚪</span>
                    Leave Contest
                  </>
                )}
              </button>
              
              {/* Navigation Controls */}
              <div className="flex gap-2">
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gray-800 hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-gray-500 shadow-lg transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                  onClick={goToPrevProblem}
                  disabled={!contest || currentProblemIndex === 0 || isNavigating}
                >
                  <ArrowLeft size={16} />
                </button>
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gray-800 hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-gray-500 shadow-lg transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={goToNextProblem}
                  disabled={!contest || currentProblemIndex === contest.problems.length - 1 || isNavigating}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
              
              {/* Problem Counter */}
              {contest && contest.problems.length > 0 && (
                <div className="ml-2 text-sm text-gray-300 bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700">
                  Problem {currentProblemIndex + 1} of {contest.problems.length}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="flex flex-col items-end">
          {contest && (
            <div className="text-sm font-semibold text-blue-400">
              {contest.title}
            </div>
          )}
          {contest && (
            <div className="text-xs text-gray-400">
              Ends: {new Date(contest.endDate).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>  
          )}
        </div>
      </div>

      {/* RESIZABLE SPLIT BELOW */}
      <Split
        className="flex flex-1 overflow-hidden"
        sizes={[50, 50]}
        minSize={200}
        expandToMin={false}
        gutterSize={4}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={2}
        direction="horizontal"
        gutter={(index, direction) => {
          const gutter = document.createElement("div");

          gutter.className = `${
            direction === "horizontal" ? "cursor-col-resize" : "cursor-row-resize"
          }`;
          gutter.style.backgroundColor = "#374151";
          gutter.style.transition = "all 0.2s ease";
          gutter.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";

          if (direction === "horizontal") {
            gutter.style.width = "4px";
            gutter.style.height = "40px";
            gutter.style.margin = "auto";
          } else {
            gutter.style.height = "4px";
            gutter.style.width = "40px";
            gutter.style.margin = "auto";
          }

          gutter.onmouseover = () => {
            gutter.style.backgroundColor = "#1D4ED8";
            if (direction === "horizontal") {
              gutter.style.height = "100%";
            } else {
              gutter.style.width = "100%";
            }
          };

          gutter.onmouseout = () => {
            gutter.style.backgroundColor = "#374151";
            if (direction === "horizontal") {
              gutter.style.height = "40px";
            } else {
              gutter.style.width = "40px";
            }
          };

          return gutter;
        }}
      >
        {/* LEFT PANEL - PROBLEM DESCRIPTION */}
        <div 
          style={{ 
            backgroundColor: "#131516",
            border: "0.1px solid oklch(1 0 0 / 0.3)"
          }} 
          className="flex flex-col mr-1 overflow-hidden rounded-l-lg"
        >
          <div 
            className="flex gap-2 p-4 overflow-x-auto whitespace-nowrap items-center shadow-sm" 
            style={{
              backgroundColor:"#131516", 
              borderBottom: "0.1px solid oklch(1 0 0 / 0.3)"
            }}
          >
            {["description", "submissions"].map((tab) => (
              <button
                key={tab}
                className={`text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeLeftTab === tab 
                    ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
                onClick={() => setActiveLeftTab(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6" style={{ color: "oklch(0.8 0 0)" }}>
            {problem && (
              <>
                {activeLeftTab === "description" && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-700 pb-4">
                      <h1 className="text-3xl font-bold text-blue-400 mb-2">{problem.title}</h1>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="px-2 py-1 bg-gray-800 rounded-md">Contest Problem</span>
                      </div>
                    </div>
                    <div className="prose max-w-none">
                      <div className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: problem.description }} />
                    </div>
                  </div>
                )}
                
                {activeLeftTab === "submissions" && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-700 pb-4">
                      <h2 className="text-2xl font-bold text-orange-400 mb-2">My Submissions</h2>
                      <p className="text-gray-400">Your submission history for this contest problem</p>
                    </div>
                    <div className="text-gray-300">
                      <SubmissionHistory problemId={problemId} contestId={contestId} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - EDITOR AND RESULTS */}
        <div 
          style={{ 
            backgroundColor: "#131516",
            border: "0.1px solid oklch(1 0 0 / 0.3)"
          }} 
          className="flex flex-col ml-1 overflow-hidden rounded-r-lg"
        >
          <div 
            className="flex gap-2 p-4 overflow-x-auto whitespace-nowrap items-center shadow-sm" 
            style={{
              backgroundColor:"#131516",
              borderBottom: "0.1px solid oklch(1 0 0 / 0.3)"
            }}
          >
            {/* Language Selection Tabs */}
            <div className="flex gap-1 mr-8">
              {["cpp", "java", "javascript"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 ${
                    selectedLanguage === lang
                      ? "text-blue-400 bg-blue-500/20 border-b-2 border-blue-400"
                      : "text-gray-500 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {lang === "cpp" 
                    ? "C++" 
                    : lang === "javascript" 
                      ? "JavaScript" 
                      : "Java"}
                </button>
              ))}
            </div>
            
            {/* Tabs */}
            {["code", "result"].map((tab) => (
              <button
                key={tab}
                className={`text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeRightTab === tab 
                    ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
                onClick={() => setActiveRightTab(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {activeRightTab === "code" && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Combined scroll container */}
                <div 
                  className="flex-1 overflow-y-auto" 
                  style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#374151 transparent',
                  }}
                >
                  {/* Editor */}
                  <div
                    className="mx-4 mt-4 overflow-hidden border border-gray-600 bg-[#1e1e1e] rounded-lg shadow-lg"
                    style={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                  >
                    <Editor
                      height="50vh"
                      width="100%"
                      language={getLanguageForMonaco(selectedLanguage)}
                      value={code}
                      onChange={handleEditorChange}
                      onMount={handleEditorDidMount}
                      theme="vs-dark"
                      options={{
                        fontSize: 16,
                        minimap: { enabled: false },
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        tabSize: 4,
                        automaticLayout: true,
                        cursorBlinking: "smooth",
                        renderLineHighlight: "line",
                        cursorStyle: "line",
                        lineNumbersMinChars: 3,
                        lineDecorationsWidth: 8,
                        scrollbar: {
                          verticalScrollbarSize: 6,
                          horizontalScrollbarSize: 6,
                          useShadows: false,
                          verticalSliderSize: 6,
                          horizontalSliderSize: 6,
                        },
                      }}
                    />
                  </div>

                  {/* Test Case Section */}
                  <div className="p-4">
                    <h3 className="font-semibold mb-6 text-lg text-yellow-400 flex items-center gap-2">
                      <span>🧪</span>
                      Example Test Cases
                    </h3>
                    
                    {!runResult && problem.visibleTestCases?.map((testCase, index) => (
                      <div key={index} className="mb-6 p-6 bg-gray-800/30 rounded-xl border border-gray-700 shadow-lg">
                        <div className="mb-4">
                          <span className="text-sm font-medium text-blue-400 mb-2 block">Input:</span>
                          <pre className="bg-gray-900 p-4 text-sm mt-1 overflow-x-auto rounded-lg border border-gray-700">
                            <code className="text-gray-300">{testCase.input}</code>
                          </pre>
                        </div>
                        
                        <div className="mb-4">
                          <span className="text-sm font-medium text-green-400 mb-2 block">Expected Output:</span>
                          <pre className="bg-gray-900 p-4 text-sm mt-1 overflow-x-auto rounded-lg border border-gray-700">
                            <code className="text-gray-300">{testCase.output}</code>
                          </pre>
                        </div>
                        
                        {testCase.explanation && (
                          <div>
                            <span className="text-sm font-medium text-purple-400 mb-2 block">Explanation:</span>
                            <pre className="bg-gray-900 p-4 text-sm mt-1 overflow-x-auto rounded-lg border border-gray-700">
                              <code className="text-gray-300">{testCase.explanation}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Run results display */}
                    {runResult && (
                      <div className={`p-6 rounded-xl border shadow-lg ${
                        runResult.success 
                          ? 'bg-green-900/20 border-green-500/30' 
                          : 'bg-red-900/20 border-red-500/30'
                      }`}>
                        <h4 className="font-bold mb-4 text-lg flex items-center gap-2">
                          {runResult.success 
                            ? <><span className="text-green-400">✅</span> All test cases passed!</>
                            : <><span className="text-red-400">❌</span> Some test cases failed</>
                          }
                        </h4>
                        
                        {runResult.testCases?.map((tc, i) => (
                          <div key={i} className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <div className="flex items-center mb-3">
                              <span className={`mr-2 text-lg ${tc.status_id === 3 ? 'text-green-400' : 'text-red-400'}`}>
                                {tc.status_id === 3 ? '✓' : '✗'}
                              </span>
                              <span className="font-medium">Test Case {i+1}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <span className="text-blue-400 font-medium block mb-1">Input:</span> 
                                <div className="text-gray-300 font-mono text-xs break-all">{tc.stdin}</div>
                              </div>
                              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <span className="text-green-400 font-medium block mb-1">Expected:</span> 
                                <div className="text-gray-300 font-mono text-xs">{tc.expected_output}</div>
                              </div>
                              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <span className="text-purple-400 font-medium block mb-1">Output:</span> 
                                <div className="text-gray-300 font-mono text-xs">{tc.stdout || "No output"}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {runResult.success && (
                          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="text-yellow-400">
                                <span className="font-medium">Runtime:</span> 
                                <span className="ml-2 font-mono">{runResult.runtime} sec</span>
                              </div>
                              <div className="text-cyan-400">
                                <span className="font-medium">Memory:</span> 
                                <span className="ml-2 font-mono">{runResult.memory} KB</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {isRunning && (
                      <div className="flex justify-center my-6">
                        <BeatLoader color="#1D4ED8" size={12} />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Fixed buttons at bottom */}
                <div className="flex gap-3 p-4 border-t border-gray-700 bg-gray-800/30">
                  <button
                    className="flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                    style={{ backgroundColor: "#1D4ED8", color: "white", minWidth: "100px" }}
                    onClick={handleRun}
                    disabled={isRunning}
                  >
                    {isRunning ? (
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                    ) : (
                      <span className="mr-2">▶️</span>
                    )}
                    Run
                  </button>

                  <button
                    className="flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                    style={{ backgroundColor: "#059669", color: "white", minWidth: "100px" }}
                    onClick={handleSubmitCode}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                    ) : (
                      <span className="mr-2">🚀</span>
                    )}
                    Submit
                  </button>
                </div>
              </div>
            )}
            
            {activeRightTab === 'testcase' && (
              <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="font-semibold mb-6 text-lg text-yellow-400 flex items-center gap-2">
                  <span>🧪</span>
                  Test Results
                </h3>
                {runResult ? (
                  <div className={`rounded-xl p-6 border shadow-lg ${
                    runResult.success 
                      ? 'bg-green-900/20 border-green-500/30' 
                      : 'bg-red-900/20 border-red-500/30'
                  }`}>
                    <div>
                      {runResult.success ? (
                        <div>
                          <h4 className="font-bold text-xl text-green-400 flex items-center gap-2">
                            <span>✅</span>
                            All test cases passed!
                          </h4>
                          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="text-yellow-400">
                                <span className="font-medium">Runtime:</span> 
                                <span className="ml-2 font-mono">{runResult.runtime} sec</span>
                              </div>
                              <div className="text-cyan-400">
                                <span className="font-medium">Memory:</span> 
                                <span className="ml-2 font-mono">{runResult.memory} KB</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            {runResult.testCases.map((tc, i) => (
                              <div key={i} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-xs">
                                <div className="font-mono space-y-2">
                                  <div className="text-blue-400"><strong>Input:</strong> <span className="text-gray-300">{tc.stdin}</span></div>
                                  <div className="text-green-400"><strong>Expected:</strong> <span className="text-gray-300">{tc.expected_output}</span></div>
                                  <div className="text-purple-400"><strong>Output:</strong> <span className="text-gray-300">{tc.stdout}</span></div>
                                  <div className={'text-green-600 font-medium'}>
                                    {'✓ Passed'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-bold text-xl text-red-400 flex items-center gap-2">
                            <span>❌</span>
                            Test Failed
                          </h4>
                          <div className="mt-4 space-y-2">
                            {runResult.testCases.map((tc, i) => (
                              <div key={i} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-xs">
                                <div className="font-mono space-y-2">
                                  <div className="text-blue-400"><strong>Input:</strong> <span className="text-gray-300">{tc.stdin}</span></div>
                                  <div className="text-green-400"><strong>Expected:</strong> <span className="text-gray-300">{tc.expected_output}</span></div>
                                  <div className="text-purple-400"><strong>Output:</strong> <span className="text-gray-300">{tc.stdout}</span></div>
                                  <div className={tc.status_id==3 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {tc.status_id==3 ? '✓ Passed' : '✗ Failed'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-700 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Click "Run" to test your code with the example test cases.
                  </div>
                )}
              </div>
            )}
            
            {activeRightTab === 'result' && (
            <div className="flex-1 p-6 overflow-y-auto text-white" style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#374151 transparent'
            }}>
              <h3 className="font-semibold text-2xl mb-6 border-b border-gray-700 pb-3 text-orange-400 flex items-center gap-2">
                <span>📊</span>
                Submission Result
              </h3>
              
              {submitResult ? (
                <div className={`rounded-xl p-6 border shadow-lg ${
                  submitResult.accepted 
                    ? 'bg-green-900/20 border-green-500/30' 
                    : 'bg-red-900/20 border-red-500/30'
                }`}>
                  {submitResult.accepted ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">🎉</div>
                        <div>
                          <h4 className="font-bold text-3xl text-green-400">Accepted</h4>
                          <div className="flex flex-wrap gap-3 mt-3">
                            <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                              <span className="text-gray-400">Test Cases: </span>
                              <span className="font-mono text-green-400">{submitResult.passedTestCases}/{submitResult.totalTestCases}</span>
                            </div>
                            <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                              <span className="text-gray-400">Runtime: </span>
                              <span className="font-mono text-yellow-400">{submitResult.runtime}s</span>
                            </div>
                            <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                              <span className="text-gray-400">Memory: </span>
                              <span className="font-mono text-cyan-400">{submitResult.memory}KB</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Success Message */}
                      <div className="mt-6 p-6 bg-gray-800/50 rounded-xl border border-gray-700 shadow-lg">
                        <p className="text-green-400 font-medium text-lg flex items-center gap-2">
                          <span>🎉</span>
                          Congratulations! Your solution passed all test cases.
                        </p>
                        <p className="mt-2 text-gray-300">
                          Your solution is efficient and correct. Keep up the great work in the contest!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-bold text-xl text-red-400 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {submitResult.error || "Submission Failed"}
                      </h4>
                      <div className="mt-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-gray-300">
                          Test Cases Passed: 
                          <span className="font-mono ml-2 text-red-400">
                            {submitResult.passedTestCases || 0}/{submitResult.totalTestCases || 0}
                          </span>
                        </p>
                        {submitResult.errorMessage && (
                          <div className="mt-3 p-3 bg-gray-900 rounded text-red-400 font-mono text-sm border border-gray-700">
                            {submitResult.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-700 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Click "Submit" to evaluate your solution
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </Split>

      {/* Leave Contest Confirmation Modal */}
      {showLeaveConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-red-400 flex items-center gap-2">
              <span>⚠️</span>
              Leave Contest
            </h3>
            <p className="mb-6 text-gray-300 leading-relaxed">
              Are you sure you want to leave the contest? Your current progress and time will be recorded.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-all duration-200 border border-gray-600 hover:border-gray-500"
                onClick={() => setShowLeaveConfirmation(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all duration-200 border border-red-500 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleLeaveContest}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                ) : (
                  <span className="mr-2">🚪</span>
                )}
                Confirm Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestEditorPage;