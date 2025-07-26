import React, { useState, useEffect, useRef } from "react";
import axiosClient from "../utils/axiosClient";
import { Mic, StopCircle } from 'lucide-react';


const Interview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Click to start interview");
  const [conversation, setConversation] = useState([]);
  const [interviewType, setInterviewType] = useState("frontend");
  const [difficulty, setDifficulty] = useState("easy");
  const [interviewSummary, setInterviewSummary] = useState("");
  const recognitionRef = useRef(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);


const generateSummary = async () => {
  setIsGeneratingSummary(true);
  setStatus("Generating summary...");

  try {
    const response = await axiosClient.post("/interview/virtual", {
      prompt: "summarize",
      history: conversation,
      interviewType,
      difficulty
    });

    console.log("LLM summary response:", response.data);
    setInterviewSummary(response.data.analysis || "No summary returned.");
    setStatus("Summary generated!");
  } catch (error) {
    console.error("Error generating summary:", error);
    setStatus("Error generating summary.");
  } finally {
    setIsGeneratingSummary(false);
  }
};


  // Interview configuration data
  const interviewOptions = [
    { id: "frontend", label: "Frontend", description: "HTML, CSS, React, JavaScript" },
    { id: "backend", label: "Backend", description: "Node.js, Databases, API Design" },
    { id: "dsa", label: "Data Structures", description: "Algorithms, Problem Solving" },
  ];

  const difficultyLevels = [
    { id: "easy", label: "Easy", description: "Basic concepts, entry-level questions" },
    { id: "intermediate", label: "Medium", description: "Practical scenarios, moderate complexity" },
    { id: "hard", label: "Hard", description: "Advanced topics, system design" },
  ];

  // Sample summaries based on difficulty
  const summaryContent = {
    easy: "This interview focuses on fundamental concepts. Ideal for beginners to test core knowledge.",
    intermediate: "Moderate difficulty interview covering practical applications and problem-solving skills.",
    hard: "Challenging interview designed for experienced candidates, featuring complex scenarios and system design."
  };

  // Cleanup on unmount
  useEffect(() => {
    setInterviewSummary(summaryContent[difficulty]);
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, [difficulty]);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setStatus("Browser doesn't support speech recognition");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.timeout = 20000; 

    recognition.start();
    setIsRecording(true);
    setStatus("Listening... Speak now");

    recognition.onresult = async (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setStatus(`Heard: "${transcript}"`);
      console.log("User said:", transcript);
      
      setConversation(prev => [...prev, { role: "user", content: transcript }]);
      await sendToGemini(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        setStatus("No speech detected. Still listening...");
        recognition.start();
      } else if (event.error === 'audio-capture') {
        setStatus("Microphone not available. Check permissions");
      } else {
        setStatus(`Error: ${event.error}. Try again`);
      }
    };

    recognition.onend = () => {
      if (isRecording) recognition.start();
    };
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
    setStatus("Recording stopped");
  };

  const sendToGemini = async (text) => {
    setStatus("Processing your response...");
    
    try {
      const response = await axiosClient.post("/interview/virtual", { 
        prompt: text,
        history: conversation,
        interviewType,
        difficulty
      });

      console.log("LLM response:", response.data);
      
      setConversation(prev => [...prev, { 
        role: "ai", 
        content: response.data.analysis 
      }]);
      
      speak(response.data.analysis);

    } catch (error) {
      console.error("Error talking to Gemini:", error);
      
      let errorMessage = "Network error";
      if (error.response) {
        errorMessage = `API error ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`;
      }
      
      setStatus(`Error: ${errorMessage}`);
      speak("Sorry, I had trouble processing that. Please try again.");
    }
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    setStatus("Speaking...");
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = 1;
    utterance.rate = 1;

    utterance.onend = () => {
      setStatus("Ready for your response");
      if (isRecording && recognitionRef.current) {
        recognitionRef.current.start();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Moved this above the return statement
  const handleToggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
  <div
    className="min-h-screen p-4 relative overflow-hidden"
    style={{ 
      backgroundColor: "oklch(0.145 0 0)", 
      color: "oklch(0.8 0 0)",
      backgroundImage: `
        radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
      `
    }}
  >
    {/* Background decoration */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
    </div>

    <div className="max-w-7xl mx-auto relative z-10">
      {/* Header with gradient text */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          AI Mock Interview
        </h1>
        <p className="text-lg text-gray-400">Practice your skills with our AI-powered interviewer</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Interview Chat */}
        <div className="xl:col-span-2">
          <div
            className="rounded-2xl shadow-2xl p-8 h-full flex flex-col backdrop-blur-sm border-2 transition-all duration-300 hover:shadow-3xl"
            style={{
              backgroundColor: "rgba(19, 21, 22, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "oklch(0.8 0 0)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
          >
            {/* Enhanced Start/Stop Button */}
            <button
              onClick={handleToggleRecording}
              className={`w-full py-6 text-xl rounded-2xl transition-all duration-300 mb-8 flex items-center justify-center font-semibold shadow-lg transform hover:scale-105 active:scale-95 ${
                isRecording
                  ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-500/25"
                  : "bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white shadow-blue-500/25"
              }`}
              style={{
                boxShadow: isRecording 
                  ? "0 10px 30px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(239, 68, 68, 0.1)"
                  : "0 10px 30px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.1)"
              }}
            >
              {isRecording ? (
                <>
                  <StopCircle className="mr-3 animate-pulse" size={28} />
                  <span className="tracking-wide">Stop Interview</span>
                </>
              ) : (
                <>
                  <Mic className="mr-3" size={28} />
                  <span className="tracking-wide">Start Interview</span>
                </>
              )}
            </button>

            {/* Enhanced Status Display */}
            <div
              className="mb-8 p-6 rounded-xl border transition-all duration-300"
              style={{
                backgroundColor: "rgba(20, 23, 26, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)"
              }}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                <p className="text-center font-medium text-lg">{status}</p>
              </div>
            </div>

            {/* Enhanced Chat Container */}
            <div className="space-y-6 flex-grow overflow-y-auto max-h-[500px] pr-4 custom-scrollbar">
              {conversation.map((entry, index) => (
                <div
                  key={index}
                  className={`group transition-all duration-500 transform hover:scale-[1.02] ${
                    entry.role === "user" 
                      ? "ml-8 animate-slide-in-right" 
                      : "mr-8 animate-slide-in-left"
                  }`}
                >
                  <div
                    className={`p-6 rounded-2xl border backdrop-blur-sm ${
                      entry.role === "user"
                        ? "bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-500/30"
                        : "bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30"
                    }`}
                    style={{
                      boxShadow: entry.role === "user"
                        ? "0 8px 25px rgba(59, 130, 246, 0.15)"
                        : "0 8px 25px rgba(139, 92, 246, 0.15)"
                    }}
                  >
                    <div className="flex items-center mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        entry.role === "user" 
                          ? "bg-blue-500 text-white" 
                          : "bg-purple-500 text-white"
                      }`}>
                        {entry.role === "user" ? "U" : "AI"}
                      </div>
                      <strong className="text-lg font-semibold">
                        {entry.role === "user" ? "You" : "AI Interviewer"}
                      </strong>
                    </div>
                    <p className="text-gray-200 leading-relaxed pl-11">{entry.content}</p>
                  </div>
                </div>
              ))}

              {conversation.length === 0 && (
                <div className="text-center py-16">
                  <div className="relative">
                    <div
                      className="border-2 border-dashed rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center transition-all duration-300 hover:scale-110"
                      style={{
                        borderColor: "rgba(255, 255, 255, 0.2)",
                        backgroundColor: "rgba(59, 130, 246, 0.1)"
                      }}
                    >
                      <Mic size={32} className="text-blue-400 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Ready to Start?</h3>
                    <p className="text-gray-400 mb-2">Your interview conversation will appear here</p>
                    <p className="text-sm text-gray-500">
                      Configure your settings and click Start Interview
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Configuration and Summary */}
        <div className="space-y-8">
          {/* Enhanced Configuration Box */}
          <div
            className="rounded-2xl shadow-2xl p-8 backdrop-blur-sm border-2 transition-all duration-300 hover:shadow-3xl"
            style={{
              backgroundColor: "rgba(19, 21, 22, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
          >
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold">⚙️</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Interview Configuration
              </h2>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold mb-4 text-lg text-gray-300 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Interview Type
              </h3>
              <div className="space-y-4">
                {interviewOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      interviewType === option.id
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50 shadow-lg"
                        : "hover:bg-gray-800/50 border-gray-700/50"
                    }`}
                    style={{
                      backgroundColor: interviewType === option.id 
                        ? undefined 
                        : "rgba(20, 23, 26, 0.5)",
                      boxShadow: interviewType === option.id 
                        ? "0 10px 25px rgba(59, 130, 246, 0.2)" 
                        : "none"
                    }}
                    onClick={() => setInterviewType(option.id)}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all duration-300 ${
                          interviewType === option.id
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-500"
                        }`}
                      >
                        {interviewType === option.id && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-white text-lg">{option.label}</span>
                        <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg text-gray-300 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Difficulty Level
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {difficultyLevels.map((level) => (
                  <div
                    key={level.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer text-center transition-all duration-300 transform hover:scale-105 ${
                      difficulty === level.id
                        ? level.id === "easy"
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50 text-green-400 shadow-lg"
                          : level.id === "intermediate"
                          ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-yellow-400 shadow-lg"
                          : "bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-500/50 text-red-400 shadow-lg"
                        : "hover:bg-gray-800/50 border-gray-700/50 text-gray-300"
                    }`}
                    style={{
                      backgroundColor: difficulty === level.id
                        ? undefined
                        : "rgba(20, 23, 26, 0.5)",
                      boxShadow: difficulty === level.id
                        ? level.id === "easy"
                          ? "0 10px 25px rgba(34, 197, 94, 0.2)"
                          : level.id === "intermediate"
                          ? "0 10px 25px rgba(251, 191, 36, 0.2)"
                          : "0 10px 25px rgba(239, 68, 68, 0.2)"
                        : "none"
                    }}
                    onClick={() => setDifficulty(level.id)}
                  >
                    <div className="font-semibold text-lg">{level.label}</div>
                    <div className="text-sm mt-1 opacity-80">{level.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Summary Box */}
          <div
            className="rounded-2xl shadow-2xl p-8 backdrop-blur-sm border-2 transition-all duration-300 hover:shadow-3xl"
            style={{
              backgroundColor: "rgba(19, 21, 22, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
          >
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold">📊</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Interview Summary
              </h2>
            </div>

            <div
              className="rounded-xl p-6 mb-6 border transition-all duration-300"
              style={{
                backgroundColor: "rgba(20, 23, 26, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)"
              }}
            >
              <ul className="space-y-3">
                {interviewSummary
                  .split('\n')
                  .filter(line => line.trim() !== '')
                  .map((line, idx) => (
                    <li key={idx} className="text-gray-200 flex items-start">
                      <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      <span>{line.replace(/^[-*]\s*/, '')}</span>
                    </li>
                  ))}
              </ul>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={generateSummary}
                  disabled={isGeneratingSummary}
                  className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    isGeneratingSummary 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                  }`}
                  style={{
                    boxShadow: isGeneratingSummary 
                      ? "none" 
                      : "0 10px 25px rgba(34, 197, 94, 0.3), 0 0 0 1px rgba(34, 197, 94, 0.1)"
                  }}
                >
                  {isGeneratingSummary ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>📝</span>
                      <span>Generate Summary</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out;
        }
      `}</style>
    </div>
  </div>
)

};

export default Interview;