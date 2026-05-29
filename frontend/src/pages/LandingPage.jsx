/* import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar 
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <span className="text-xl font-bold text-gray-800">📦 Smart Lost & Found</span>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-gray-600 font-medium hover:text-blue-600 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero 
      <main className="flex flex-col items-center justify-center text-center px-6 py-32 gap-6">
        <h1 className="text-5xl font-extrabold text-gray-900 max-w-2xl leading-tight">
          Lost something on campus?
        </h1>
        <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
          A secure platform to reunite lost items with their owners — with escrow payments,
          verified handoffs, and zero scams.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mt-2">
          <Link
            to="/register"
            className="bg-red-500 text-white font-bold text-base px-8 py-3 rounded-xl hover:bg-red-600 transition-colors"
          >
            I Lost Something
          </Link>
          <Link
            to="/register"
            className="bg-green-600 text-white font-bold text-base px-8 py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            I Found Something
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LandingPage; */

import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex flex-col items-center justify-center text-center px-6 py-32 gap-6">
        <h1 className="text-5xl font-extrabold text-gray-900 max-w-2xl leading-tight">
          Lost something on campus?
        </h1>
        <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
          A secure platform to reunite lost items with their owners — with escrow payments,
          verified handoffs, and zero scams.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mt-2">
          <Link
            to="/register"
            className="bg-red-500 text-white font-bold text-base px-8 py-3 rounded-xl hover:bg-red-600 transition-colors"
          >
            I Lost Something
          </Link>
          <Link
            to="/register"
            className="bg-green-600 text-white font-bold text-base px-8 py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            I Found Something
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;