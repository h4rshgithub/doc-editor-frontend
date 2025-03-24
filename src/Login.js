import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const login = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => navigate('/')) // Login ke baad home pe redirect
      .catch((err) => alert(err.message));
  };

  const register = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => navigate('/')) // Register ke baad home pe redirect
      .catch((err) => alert(err.message));
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/'); // Google login ke baad home pe redirect
    } catch (error) {
      alert("Google login mein lafda: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          DocSync
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          Login or Register to continue
        </p>

        {/* Email Input */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="mb-4 p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Password Input */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mb-6 p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Login and Register Buttons */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={login}
            className="flex-1 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
          >
            Login
          </button>
          <button
            onClick={register}
            className="flex-1 bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition"
          >
            Register
          </button>
        </div>

        {/* Google Login Button */}
        <button
          onClick={signInWithGoogle}
          className="w-full bg-white text-gray-800 border border-gray-300 p-3 rounded-lg flex items-center justify-center hover:bg-gray-100 transition"
        >
          <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.04.69-2.36 1.1-3.71 1.1-2.85 0-5.27-1.92-6.13-4.5H2.25v2.82C4.06 20.42 7.73 23 12 23z" />
            <path fill="#FBBC05" d="M5.87 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.25C1.2 8.88.68 10.87.68 12.99c0 2.12.52 4.11 1.57 5.92l3.62-2.82z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.73 1 4.06 3.58 2.25 7.07l3.62 2.82C6.73 7.31 9.15 5.38 12 5.38z" />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;