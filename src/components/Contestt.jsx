import React, { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';

function Contest() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [contestData, setContestData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  // Fetch all problems once
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (err) {
        console.error('Failed to fetch problems', err);
      }
    };
    fetchProblems();
  }, []);

  // Toggle selection
  const handleProblemToggle = (id) => {
    setSelectedProblems(prev =>
      prev.includes(id)
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    );
  };

  // Submit
  const handleCreateContest = async () => {
    if (!contestData.title || !contestData.startDate || !contestData.endDate) {
      alert('Please fill all required fields!');
      return;
    }
    if (selectedProblems.length === 0) {
      alert('Please select at least one problem!');
      return;
    }

    try {
      await axiosClient.post('/contest/create', {
        ...contestData,
        problems: selectedProblems
      });
      alert('Contest created successfully!');
      navigate('/admin');
    } catch (err) {
      console.error('Error creating contest:', err);
      alert('Something went wrong.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Contest</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block mb-2 font-semibold">Title</label>
          <input
            className="input input-bordered w-full"
            placeholder="Contest Title"
            value={contestData.title}
            onChange={(e) =>
              setContestData({ ...contestData, title: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Description</label>
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Contest Description"
            value={contestData.description}
            onChange={(e) =>
              setContestData({ ...contestData, description: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Start Date & Time</label>
          <input
            type="datetime-local"
            className="input input-bordered w-full"
            value={contestData.startDate}
            onChange={(e) =>
              setContestData({ ...contestData, startDate: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">End Date & Time</label>
          <input
            type="datetime-local"
            className="input input-bordered w-full"
            value={contestData.endDate}
            onChange={(e) =>
              setContestData({ ...contestData, endDate: e.target.value })
            }
          />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Select Problems</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {problems.map(problem => (
          <div
            key={problem._id}
            className={`card p-4 border rounded-lg cursor-pointer ${selectedProblems.includes(problem._id) ? 'bg-primary text-primary-content' : 'bg-base-100'}`}
            onClick={() => handleProblemToggle(problem._id)}
          >
            <h3 className="font-semibold mb-2">{problem.title}</h3>
            <p className="text-sm text-gray-500">{problem.difficulty}</p>
            <p className="text-xs">{problem.tags}</p>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary"
        onClick={handleCreateContest}
      >
        Create Contest
      </button>
    </div>
  );
}

export default Contest;
