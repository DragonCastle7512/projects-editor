import React from 'react';
import { Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (password: string) => void;
  error: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0d1117] text-white">
      <div className="bg-[#161b22] p-8 rounded-lg shadow-xl border border-gray-800 w-full max-w-md">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="bg-blue-600 p-3 rounded-full">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold">Protected Area</h1>
          <p className="text-gray-400 text-sm">Enter password to access the editor</p>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          const val = (e.currentTarget.elements.namedItem('pwd') as HTMLInputElement).value;
          onLogin(val);
        }}>
          <input
            type="password"
            name="pwd"
            placeholder="Password"
            autoFocus
            className="w-full bg-[#0d1117] border border-gray-700 rounded-md py-2 px-4 mb-4 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-md font-semibold transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};
