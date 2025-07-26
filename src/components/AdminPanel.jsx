import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';

// Zod schema matching the problem schema
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

function AdminPanel() {
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      startCode: [
        { language: 'C++', initialCode: '' },
        { language: 'Java', initialCode: '' },
        { language: 'JavaScript', initialCode: '' }
      ],
      referenceSolution: [
        { language: 'C++', completeCode: '' },
        { language: 'Java', completeCode: '' },
        { language: 'JavaScript', completeCode: '' }
      ]
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  const onSubmit = async (data) => {
    try {
      await axiosClient.post('/problem/create', data);
      alert('Problem created successfully!');
      navigate('/');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
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
      <div className="text-2xl font-bold text-blue-400">
        CodeEx
      </div>
    </nav>

    <div className="container mx-auto p-4 md:p-8">
      <div
        className="rounded-xl p-6 mb-6 shadow-lg"
        style={{
          backgroundColor: "#131516",
          border: "0.1px solid oklch(1 0 0 / 0.3)",
          color: "oklch(0.8 0 0)",
        }}
      >
        <h1 className="text-3xl font-bold mb-6 text-blue-400">Create New Problem 🚀</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div
            className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl"
            style={{
              backgroundColor: "oklch(0.145 0 0)",
              border: "0.1px solid oklch(1 0 0 / 0.3)",
              color: "oklch(0.8 0 0)",
            }}
          >
            <h2 className="text-xl font-semibold mb-4 text-orange-400 pb-2 border-b border-gray-700">
              Basic Information 📝
            </h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-blue-400 font-semibold">Title</span>
                </label>
                <input
                  {...register('title')}
                  className={`input w-full px-4 py-3 rounded-lg font-mono transition-all duration-200 focus:scale-[1.02] ${
                    errors.title 
                      ? 'border-red-500 bg-red-500/10 text-red-400' 
                      : 'border-gray-600 bg-gray-800/50 text-white focus:border-blue-400'
                  }`}
                  style={{
                    backgroundColor: "#131516",
                    border: "0.1px solid oklch(1 0 0 / 0.3)",
                  }}
                />
                {errors.title && (
                  <span className="text-red-400 text-sm mt-1">{errors.title.message}</span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-blue-400 font-semibold">Description</span>
                </label>
                <textarea
                  {...register('description')}
                  className={`textarea w-full px-4 py-3 rounded-lg font-mono h-32 transition-all duration-200 focus:scale-[1.02] ${
                    errors.description 
                      ? 'border-red-500 bg-red-500/10 text-red-400' 
                      : 'border-gray-600 bg-gray-800/50 text-white focus:border-blue-400'
                  }`}
                  style={{
                    backgroundColor: "#131516",
                    border: "0.1px solid oklch(1 0 0 / 0.3)",
                  }}
                />
                {errors.description && (
                  <span className="text-red-400 text-sm mt-1">{errors.description.message}</span>
                )}
              </div>

              <div className="flex gap-4">
                <div className="form-control w-1/2">
                  <label className="label">
                    <span className="label-text text-blue-400 font-semibold">Difficulty</span>
                  </label>
                  <select
                    {...register('difficulty')}
                    className={`select w-full px-4 py-3 rounded-lg font-mono transition-all duration-200 focus:scale-[1.02] ${
                      errors.difficulty 
                        ? 'border-red-500 bg-red-500/10 text-red-400' 
                        : 'border-gray-600 bg-gray-800/50 text-white focus:border-blue-400'
                    }`}
                    style={{
                      backgroundColor: "#131516",
                      border: "0.1px solid oklch(1 0 0 / 0.3)",
                    }}
                  >
                    <option value="easy" className="bg-gray-800 text-green-400">Easy</option>
                    <option value="medium" className="bg-gray-800 text-yellow-400">Medium</option>
                    <option value="hard" className="bg-gray-800 text-red-400">Hard</option>
                  </select>
                </div>

                <div className="form-control w-1/2">
                  <label className="label">
                    <span className="label-text text-blue-400 font-semibold">Tag</span>
                  </label>
                  <select
                    {...register('tags')}
                    className={`select w-full px-4 py-3 rounded-lg font-mono transition-all duration-200 focus:scale-[1.02] ${
                      errors.tags 
                        ? 'border-red-500 bg-red-500/10 text-red-400' 
                        : 'border-gray-600 bg-gray-800/50 text-white focus:border-blue-400'
                    }`}
                    style={{
                      backgroundColor: "#131516",
                      border: "0.1px solid oklch(1 0 0 / 0.3)",
                    }}
                  >
                    <option value="array" className="bg-gray-800 text-purple-400">Array</option>
                    <option value="linkedList" className="bg-gray-800 text-blue-400">Linked List</option>
                    <option value="graph" className="bg-gray-800 text-green-400">Graph</option>
                    <option value="dp" className="bg-gray-800 text-orange-400">DP</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div
            className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl"
            style={{
              backgroundColor: "oklch(0.145 0 0)",
              border: "0.1px solid oklch(1 0 0 / 0.3)",
              color: "oklch(0.8 0 0)",
            }}
          >
            <h2 className="text-xl font-semibold mb-4 text-orange-400 pb-2 border-b border-gray-700">
              Test Cases 🧪
            </h2>
            
            {/* Visible Test Cases */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-green-400">Visible Test Cases</h3>
                <button
                  type="button"
                  onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  Add Visible Case
                </button>
              </div>
              
              {visibleFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg p-4 space-y-2 transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: "#131516",
                    border: "0.1px solid oklch(1 0 0 / 0.3)",
                  }}
                >
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeVisible(index)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <input
                    {...register(`visibleTestCases.${index}.input`)}
                    placeholder="Input"
                    className="input w-full px-4 py-3 rounded-lg font-mono transition-all duration-200 focus:scale-[1.02] border-gray-600 bg-gray-800/50 text-white focus:border-blue-400"
                    style={{
                      backgroundColor: "oklch(0.145 0 0)",
                      border: "0.1px solid oklch(1 0 0 / 0.2)",
                    }}
                  />
                  
                  <input
                    {...register(`visibleTestCases.${index}.output`)}
                    placeholder="Output"
                    className="input w-full px-4 py-3 rounded-lg font-mono transition-all duration-200 focus:scale-[1.02] border-gray-600 bg-gray-800/50 text-white focus:border-blue-400"
                    style={{
                      backgroundColor: "oklch(0.145 0 0)",
                      border: "0.1px solid oklch(1 0 0 / 0.2)",
                    }}
                  />
                  
                  <textarea
                    {...register(`visibleTestCases.${index}.explanation`)}
                    placeholder="Explanation"
                    className="textarea w-full px-4 py-3 rounded-lg font-mono transition-all duration-200 focus:scale-[1.02] border-gray-600 bg-gray-800/50 text-white focus:border-blue-400"
                    style={{
                      backgroundColor: "oklch(0.145 0 0)",
                      border: "0.1px solid oklch(1 0 0 / 0.2)",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Hidden Test Cases */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-yellow-400">Hidden Test Cases</h3>
                <button
                  type="button"
                  onClick={() => appendHidden({ input: '', output: '' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  Add Hidden Case
                </button>
              </div>
              
              {hiddenFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg p-4 space-y-2 transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: "#131516",
                    border: "0.1px solid oklch(1 0 0 / 0.3)",
                  }}
                >
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeHidden(index)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <input
                    {...register(`hiddenTestCases.${index}.input`)}
                    placeholder="Input"
                    className="input w-full px-4 py-3 rounded-lg font-mono transition-all duration-200 focus:scale-[1.02] border-gray-600 bg-gray-800/50 text-white focus:border-blue-400"
                    style={{
                      backgroundColor: "oklch(0.145 0 0)",
                      border: "0.1px solid oklch(1 0 0 / 0.2)",
                    }}
                  />
                  
                  <input
                    {...register(`hiddenTestCases.${index}.output`)}
                    placeholder="Output"
                    className="input w-full px-4 py-3 rounded-lg font-mono transition-all duration-200 focus:scale-[1.02] border-gray-600 bg-gray-800/50 text-white focus:border-blue-400"
                    style={{
                      backgroundColor: "oklch(0.145 0 0)",
                      border: "0.1px solid oklch(1 0 0 / 0.2)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Code Templates */}
          <div
            className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl"
            style={{
              backgroundColor: "oklch(0.145 0 0)",
              border: "0.1px solid oklch(1 0 0 / 0.3)",
              color: "oklch(0.8 0 0)",
            }}
          >
            <h2 className="text-xl font-semibold mb-4 text-orange-400 pb-2 border-b border-gray-700">
              Code Templates 💻
            </h2>
            
            <div className="space-y-6">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-lg p-4 transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: "#131516",
                    border: "0.1px solid oklch(1 0 0 / 0.3)",
                  }}
                >
                  <h3 className="font-medium text-purple-400 text-lg">
                    {index === 0 ? '🔷 C++' : index === 1 ? '☕ Java' : '🟨 JavaScript'}
                  </h3>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-blue-400 font-semibold">Initial Code</span>
                    </label>
                    <div
                      className="rounded-lg p-4 transition-all duration-200 hover:shadow-md"
                      style={{
                        backgroundColor: "oklch(0.145 0 0)",
                        border: "0.1px solid oklch(1 0 0 / 0.2)",
                      }}
                    >
                      <textarea
                        {...register(`startCode.${index}.initialCode`)}
                        className="w-full bg-transparent font-mono text-white resize-none focus:outline-none"
                        rows={6}
                        style={{ color: "oklch(0.8 0 0)" }}
                      />
                    </div>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-blue-400 font-semibold">Reference Solution</span>
                    </label>
                    <div
                      className="rounded-lg p-4 transition-all duration-200 hover:shadow-md"
                      style={{
                        backgroundColor: "oklch(0.145 0 0)",
                        border: "0.1px solid oklch(1 0 0 / 0.2)",
                      }}
                    >
                      <textarea
                        {...register(`referenceSolution.${index}.completeCode`)}
                        className="w-full bg-transparent font-mono text-white resize-none focus:outline-none"
                        rows={6}
                        style={{ color: "oklch(0.8 0 0)" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg text-lg"
          >
            Create Problem 🎯
          </button>
        </form>
      </div>
    </div>
  </div>
);
}

export default AdminPanel;