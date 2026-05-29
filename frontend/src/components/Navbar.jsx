import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
      <Link to={user ? '/dashboard' : '/'} className="text-xl font-bold text-gray-800">
        📦 Smart Lost & Found
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/feed" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
          Browse Feed
        </Link>

        {user ? (
          <>
            <Link to="/report/lost" className="text-sm font-medium text-gray-600 hover:text-rose-500 transition-colors">
              Report Lost
            </Link>
            <Link to="/report/found" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors">
              Report Found
            </Link>
            <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
             {user.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors">
                Admin Panel
              </Link>
            )}
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              user.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role === 'admin' ? '🛡 Admin' : '👤 ' + user.name.split(' ')[0]}
            </span>
           
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Login
            </Link>
            <Link to="/register" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;