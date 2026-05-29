import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getMyItems } from '../api/items';
import { getMyClaims } from '../api/claims';
import { Link } from 'react-router-dom';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const STATUS_STYLES = {
  unclaimed:        'bg-gray-100 text-gray-600',
  searching:        'bg-blue-100 text-blue-600',
  pending_review:   'bg-yellow-100 text-yellow-700',
  claim_pending:    'bg-orange-100 text-orange-600',
  awaiting_payment: 'bg-orange-100 text-orange-600',
  claim_approved:   'bg-green-100 text-green-600',
  ready_for_handoff:'bg-teal-100 text-teal-600',
  awaiting_handoff: 'bg-teal-100 text-teal-600',
  resolved:         'bg-green-100 text-green-700',
  disputed:         'bg-red-100 text-red-600',
};

const CLAIM_STATUS_CONFIG = {
  pending:  { label: 'Pending Admin Review',      style: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved — Awaiting Payment', style: 'bg-green-100 text-green-600'  },
  rejected: { label: 'Rejected',                  style: 'bg-red-100 text-red-500'       },
};

const CATEGORY_EMOJI = {
  Electronics: '💻',
  'ID/Cards':  '🪪',
  Clothing:    '👕',
  Books:       '📚',
  Other:       '📦',
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
    <div className="flex justify-between mb-3">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-100 rounded w-1/5" />
    </div>
    <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-1/2" />
  </div>
);

// ─── Empty States ─────────────────────────────────────────────────────────────

const EmptyState = ({ type }) => (
  <div className="text-center py-16 text-gray-400">
    <p className="text-4xl mb-3">{type === 'lost' ? '🔍' : '📦'}</p>
    <p className="text-sm font-medium text-gray-500">No {type} reports yet.</p>
    <Link
      to={`/report/${type}`}
      className={`text-xs underline mt-2 inline-block ${
        type === 'lost' ? 'text-rose-500' : 'text-teal-600'
      }`}
    >
      Report a {type} item →
    </Link>
  </div>
);

const EmptyClaimsState = () => (
  <div className="text-center py-16 text-gray-400">
    <p className="text-4xl mb-3">🤝</p>
    <p className="text-sm font-medium text-gray-500 mb-1">No active claims yet.</p>
    <p className="text-xs text-gray-400">
      Browse the{' '}
      <Link to="/" className="text-teal-600 underline">Found Items feed</Link>
      {' '}and claim something that looks like yours.
    </p>
  </div>
);

// ─── Item Card (Lost / Found tabs) ────────────────────────────────────────────

const ItemCard = ({ item, type }) => (
  <div
    className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${
      type === 'lost' ? 'border-rose-100' : 'border-teal-100'
    }`}
  >
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`shrink-0 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
            type === 'lost' ? 'bg-rose-50 text-rose-500' : 'bg-teal-50 text-teal-600'
          }`}
        >
          {type}
        </span>
        <h3 className="font-semibold text-gray-800 text-sm truncate">{item.title}</h3>
      </div>
      <span
        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
          STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-500'
        }`}
      >
        {item.status?.replace(/_/g, ' ')}
      </span>
    </div>

    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
      {item.category       && <span>📂 {item.category}</span>}
      {item.locationGeneral && <span>📍 {item.locationGeneral}</span>}
      <span>🗓 {formatDate(item.dateReported)}</span>
      {item.rewardAmount > 0 && (
        <span className="text-amber-600 font-medium">🏆 KES {item.rewardAmount}</span>
      )}
    </div>

    {(item.locationExact || item.privateDescription) && (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
          🔒 Private — only you see this
        </p>
        {item.locationExact      && <p className="text-xs text-gray-500">📍 {item.locationExact}</p>}
        {item.privateDescription && <p className="text-xs text-gray-500">📝 {item.privateDescription}</p>}
      </div>
    )}
  </div>
);

// ─── Claim Card ───────────────────────────────────────────────────────────────

const ClaimCard = ({ claim }) => {
  const { foundItem, lostItem, status, message, adminNote, createdAt } = claim;
  const statusConfig = CLAIM_STATUS_CONFIG[status] || { label: status, style: 'bg-gray-100 text-gray-500' };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">
            {CATEGORY_EMOJI[foundItem?.category] || '📦'}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-sm truncate">
              {foundItem?.title || 'Unknown item'}
            </h3>
            <p className="text-xs text-gray-400">
              📍 {foundItem?.locationGeneral} · 📂 {foundItem?.category}
            </p>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.style}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Linked lost report */}
      {lostItem && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-3">
          <span className="text-gray-400">Matched to your lost report:</span>
          <span className="font-medium text-gray-700">{lostItem.title}</span>
        </div>
      )}

      {/* Proof message summary */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
          Your proof
        </p>
        <p className="text-xs text-gray-600 line-clamp-2">{message}</p>
      </div>

      {/* Admin note — only shown on rejection */}
      {status === 'rejected' && adminNote && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-0.5">
            Admin note
          </p>
          <p className="text-xs text-red-600">{adminNote}</p>
        </div>
      )}

      {/* Stage 5 placeholder — Pay Reward button goes here when approved */}
      {status === 'approved' && (
        <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-green-700 font-medium">
            ✅ Claim approved. Payment flow coming in Stage 5.
          </p>
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-gray-400 mt-1">Submitted {formatDate(createdAt)}</p>
    </div>
  );
};

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { label: 'My Lost Reports',  key: 'lost'   },
  { label: 'My Found Reports', key: 'found'  },
  { label: 'My Active Claims', key: 'claims' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab,  setActiveTab]  = useState(0);
  const [lostItems,  setLostItems]  = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [claims,     setClaims]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [lostRes, foundRes, claimsRes] = await Promise.all([
          getMyItems('lost'),
          getMyItems('found'),
          getMyClaims(),
        ]);
        setLostItems(lostRes.data);
        setFoundItems(foundRes.data);
        setClaims(claimsRes.data);
      } catch {
        setError('Could not load your data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const tabCounts = {
    lost:   lostItems.length,
    found:  foundItems.length,
    claims: claims.length,
  };

  const tabBadgeStyle = {
    lost:   'bg-rose-100 text-rose-500',
    found:  'bg-teal-100 text-teal-600',
    claims: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* Profile */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Welcome, {user?.name}
        </h2>
        <div className="flex flex-col gap-1 text-sm text-gray-500 mb-8">
          <p>Email: <span className="text-gray-700">{user?.email}</span></p>
          {user?.phone && (
            <p>Phone: <span className="text-gray-700">{user.phone}</span></p>
          )}
          <p>
            Role:{' '}
            <span className={`font-semibold ${user?.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
              {user?.role}
            </span>
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-1">
          {TABS.map(({ label, key }, i) => (
            <button
              key={key}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
              {!loading && tabCounts[key] > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${tabBadgeStyle[key]}`}>
                  {tabCounts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 0 — My Lost Reports */}
        {activeTab === 0 && (
          loading
            ? <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
            : lostItems.length === 0
              ? <EmptyState type="lost" />
              : <div className="space-y-3">{lostItems.map(item => <ItemCard key={item._id} item={item} type="lost" />)}</div>
        )}

        {/* Tab 1 — My Found Reports */}
        {activeTab === 1 && (
          loading
            ? <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
            : foundItems.length === 0
              ? <EmptyState type="found" />
              : <div className="space-y-3">{foundItems.map(item => <ItemCard key={item._id} item={item} type="found" />)}</div>
        )}

        {/* Tab 2 — My Active Claims */}
        {activeTab === 2 && (
          loading
            ? <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
            : claims.length === 0
              ? <EmptyClaimsState />
              : <div className="space-y-3">{claims.map(claim => <ClaimCard key={claim._id} claim={claim} />)}</div>
        )}

      </main>
    </div>
  );
};

export default DashboardPage;

/* import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header 
      <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <span className="text-xl font-bold text-gray-800">📦 Smart Lost & Found</span>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              user?.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {user?.role === 'admin' ? '🛡 Admin' : '👤 User'}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main 
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Welcome, {user?.name}
        </h2>

        <div className="flex flex-col gap-1 text-sm text-gray-500">
          <p>Email: <span className="text-gray-700">{user?.email}</span></p>
          <p>Phone: <span className="text-gray-700">{user?.phone}</span></p>
          <p>
            Role:{' '}
            <span
              className={`font-semibold ${
                user?.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
              }`}
            >
              {user?.role}
            </span>
          </p>
        </div>

        <div className="mt-10 bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <p className="text-lg font-semibold text-gray-600 mb-2">
            🚧 Dashboard tabs coming in Stage 3
          </p>
          <p className="text-sm text-gray-400">
            My Lost Reports &nbsp;|&nbsp; My Found Reports &nbsp;|&nbsp; My Active Claims
            {user?.role === 'admin' && ' \u00a0|\u00a0 Admin Panel'}
          </p>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Welcome, {user?.name}
        </h2>

        <div className="flex flex-col gap-1 text-sm text-gray-500">
          <p>Email: <span className="text-gray-700">{user?.email}</span></p>
          <p>Phone: <span className="text-gray-700">{user?.phone}</span></p>
          <p>
            Role:{' '}
            <span className={`font-semibold ${user?.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
              {user?.role}
            </span>
          </p>
        </div>

        <div className="mt-10 bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <p className="text-lg font-semibold text-gray-600 mb-2">
            🚧 Dashboard tabs coming in Stage 3
          </p>
          <p className="text-sm text-gray-400">
            My Lost Reports &nbsp;|&nbsp; My Found Reports &nbsp;|&nbsp; My Active Claims
            {user?.role === 'admin' && ' \u00a0|\u00a0 Admin Panel'}
          </p>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; */
/* 
//this
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getMyItems } from '../api/items';
import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  unclaimed:        'bg-gray-100 text-gray-600',
  searching:        'bg-blue-100 text-blue-600',
  pending_review:   'bg-yellow-100 text-yellow-700',
  claim_pending:    'bg-orange-100 text-orange-600',
  awaiting_payment: 'bg-orange-100 text-orange-600',
  claim_approved:   'bg-green-100 text-green-600',
  ready_for_handoff:'bg-teal-100 text-teal-600',
  awaiting_handoff: 'bg-teal-100 text-teal-600',
  resolved:         'bg-green-100 text-green-700',
  disputed:         'bg-red-100 text-red-600',
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
    <div className="flex justify-between mb-3">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-100 rounded w-1/5" />
    </div>
    <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-1/2" />
  </div>
);

const EmptyState = ({ type }) => (
  <div className="text-center py-16 text-gray-400">
    <p className="text-4xl mb-3">{type === 'lost' ? '🔍' : '📦'}</p>
    <p className="text-sm font-medium text-gray-500">No {type} reports yet.</p>
    
    <Link 
      to={`/report/${type}`}
      className={`text-xs underline mt-2 inline-block ${
        type === 'lost' ? 'text-rose-500' : 'text-teal-600'
      }`}
    >
      Report a {type} item →
    </Link>
  </div>
);

const ItemCard = ({ item, type }) => (
  <div
    className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${
      type === 'lost' ? 'border-rose-100' : 'border-teal-100'
    }`}
  >
    {/* Header 
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`shrink-0 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
            type === 'lost' ? 'bg-rose-50 text-rose-500' : 'bg-teal-50 text-teal-600'
          }`}
        >
          {type}
        </span>
        <h3 className="font-semibold text-gray-800 text-sm truncate">{item.title}</h3>
      </div>
      <span
        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
          STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-500'
        }`}
      >
        {item.status?.replace(/_/g, ' ')}
      </span>
    </div>

    {/* Meta 
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
      {item.category      && <span>📂 {item.category}</span>}
      {item.locationGeneral && <span>📍 {item.locationGeneral}</span>}
      <span>🗓 {formatDate(item.dateReported)}</span>
      {item.rewardAmount > 0 && (
        <span className="text-amber-600 font-medium">🏆 KES {item.rewardAmount}</span>
      )}
    </div>

    {/* Private details — owner only 
    {(item.locationExact || item.privateDescription) && (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
          🔒 Private — only you see this
        </p>
        {item.locationExact      && <p className="text-xs text-gray-500">📍 {item.locationExact}</p>}
        {item.privateDescription && <p className="text-xs text-gray-500">📝 {item.privateDescription}</p>}
      </div>
    )}
  </div>
);

const TABS = [
  { label: 'My Lost Reports',  key: 'lost'   },
  { label: 'My Found Reports', key: 'found'  },
  { label: 'My Active Claims', key: 'claims' },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab]   = useState(0);
  const [lostItems, setLostItems]   = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError('');
      try {
        const [lostRes, foundRes] = await Promise.all([
          getMyItems('lost'),
          getMyItems('found'),
        ]);
        setLostItems(lostRes.data);
        setFoundItems(foundRes.data);
      } catch {
        setError('Could not load your items. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const tabCounts = {
    lost:   lostItems.length,
    found:  foundItems.length,
    claims: 0, // wired in Stage 4
  };

  const tabBadgeStyle = {
    lost:   'bg-rose-100 text-rose-500',
    found:  'bg-teal-100 text-teal-600',
    claims: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* Profile 
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Welcome, {user?.name}
        </h2>
        <div className="flex flex-col gap-1 text-sm text-gray-500 mb-8">
          <p>Email: <span className="text-gray-700">{user?.email}</span></p>
          {user?.phone && (
            <p>Phone: <span className="text-gray-700">{user.phone}</span></p>
          )}
          <p>
            Role:{' '}
            <span className={`font-semibold ${user?.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
              {user?.role}
            </span>
          </p>
        </div>

        {/* Error banner 
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs 
        <div className="flex border-b border-gray-200 mb-6 gap-1">
          {TABS.map(({ label, key }, i) => (
            <button
              key={key}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
              {!loading && tabCounts[key] > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${tabBadgeStyle[key]}`}>
                  {tabCounts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content 
        {activeTab === 0 && (
          loading
            ? <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
            : lostItems.length === 0
              ? <EmptyState type="lost" />
              : <div className="space-y-3">{lostItems.map(item => <ItemCard key={item._id} item={item} type="lost" />)}</div>
        )}

        {activeTab === 1 && (
          loading
            ? <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
            : foundItems.length === 0
              ? <EmptyState type="found" />
              : <div className="space-y-3">{foundItems.map(item => <ItemCard key={item._id} item={item} type="found" />)}</div>
        )}

        {activeTab === 2 && (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-3xl mb-3">🤝</p>
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Active Claims — coming in Stage 4
            </p>
            <p className="text-xs text-gray-400">
              Once you claim a matched item, it will appear here.
            </p>
          </div>
        )}

      </main>
    </div>
  );
};

export default DashboardPage; */