import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getStats, getAdminItems, deleteItem, getUsers, updateUser } from '../api/admin';
import { getPendingClaims, reviewClaim } from '../api/admin';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLES = {
  unclaimed:         'bg-gray-100 text-gray-500',
  searching:         'bg-blue-100 text-blue-600',
  pending_review:    'bg-yellow-100 text-yellow-700',
  claim_pending:     'bg-orange-100 text-orange-600',
  awaiting_payment:  'bg-orange-100 text-orange-600',
  claim_approved:    'bg-green-100 text-green-600',
  ready_for_handoff: 'bg-teal-100 text-teal-600',
  awaiting_handoff:  'bg-teal-100 text-teal-600',
  resolved:          'bg-green-100 text-green-700',
  disputed:          'bg-red-100 text-red-600',
};

// ─── Reusable sub-components ──────────────────────────────────────────────────

const SkeletonRow = ({ cols }) => (
  <tr className="border-t border-gray-100">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
      </td>
    ))}
  </tr>
);

const Badge = ({ label, color }) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
    {label}
  </span>
);

const StatCard = ({ label, value, accent }) => (
  <div className={`bg-white rounded-xl border p-5 ${accent}`}>
    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-800">{value ?? '—'}</p>
  </div>
);

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
      <p className="text-sm text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// ─── Tab: Overview ────────────────────────────────────────────────────────────

const OverviewTab = () => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    getStats()
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load stats.'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  const cards = [
    { label: 'Total Users',     value: stats?.totalUsers,        accent: 'border-purple-100' },
    { label: 'Total Items',     value: stats?.totalItems,        accent: 'border-gray-200'   },
    { label: 'Lost Items',      value: stats?.lostCount,         accent: 'border-rose-100'   },
    { label: 'Found Items',     value: stats?.foundCount,        accent: 'border-teal-100'   },
    { label: 'Resolved',        value: stats?.resolvedCount,     accent: 'border-green-100'  },
    { label: 'Pending Review',  value: stats?.pendingReviewCount,accent: 'border-yellow-100' },
    { label: 'Claim Pending',   value: stats?.claimPendingCount, accent: 'border-orange-100' },
    { label: 'Disputed',        value: stats?.disputedCount,     accent: 'border-red-100'    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map(({ label, value, accent }) => (
        loading
          ? <div key={label} className="bg-white rounded-xl border p-5 animate-pulse h-24" />
          : <StatCard key={label} label={label} value={value} accent={accent} />
      ))}
    </div>
  );
};

// ─── Tab: Items ───────────────────────────────────────────────────────────────

const ItemsTab = () => {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [typeFilter, setFilter] = useState('');
  const [confirm, setConfirm]   = useState(null);

  const fetchItems = useCallback(() => {
    setLoading(true);
    getAdminItems(typeFilter)
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load items.'))
      .finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      await deleteItem(confirm._id);
      setItems((prev) => prev.filter((i) => i._id !== confirm._id));
    } catch {
      setError('Delete failed. Try again.');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      {confirm && (
        <ConfirmModal
          message={`Delete "${confirm.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex gap-2 mb-4">
        {['', 'lost', 'found'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === t
                ? t === 'lost'  ? 'bg-rose-500 text-white'
                : t === 'found' ? 'bg-teal-500 text-white'
                :                 'bg-gray-800 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Posted By</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Private Details</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              : items.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No items found.
                  </td>
                </tr>
              )
              : items.map((item) => (
                <tr key={item._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-700 max-w-[160px] truncate">
                    {item.title}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={item.type}
                      color={item.type === 'lost' ? 'bg-rose-50 text-rose-500' : 'bg-teal-50 text-teal-600'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={item.status?.replace(/_/g, ' ')}
                      color={STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-500'}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.postedBy?.name || '—'}
                    <span className="block text-xs text-gray-400">{item.postedBy?.email}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {formatDate(item.dateReported)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[180px]">
                    {item.privateDescription
                      ? <span className="text-gray-600">{item.privateDescription}</span>
                      : <span className="italic">none</span>
                    }
                    {item.locationExact && (
                      <span className="block text-gray-500">📍 {item.locationExact}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirm(item)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </>
  );
};

// ─── Tab: Users ───────────────────────────────────────────────────────────────

const UsersTab = () => {
  const { user: currentUser }   = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    getUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (id, data) => {
    setUpdating(id);
    try {
      const res = await updateUser(id, data);
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data : u)));
    } catch {
      setError('Update failed. Try again.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : users.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No users found.
                  </td>
                </tr>
              )
              : users.map((u) => {
                const isSelf    = u._id === currentUser?._id;
                const isLoading = updating === u._id;
                return (
                  <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={u.role}
                        color={u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={u.isBanned ? 'Banned' : 'Active'}
                        color={u.isBanned ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-gray-300 italic">you</span>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            disabled={isLoading}
                            onClick={() => handleUpdate(u._id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                            className="text-xs text-purple-500 hover:text-purple-700 font-medium disabled:opacity-40"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </button>
                          <button
                            disabled={isLoading}
                            onClick={() => handleUpdate(u._id, { isBanned: !u.isBanned })}
                            className={`text-xs font-medium disabled:opacity-40 ${
                              u.isBanned
                                ? 'text-green-500 hover:text-green-700'
                                : 'text-red-400 hover:text-red-600'
                            }`}
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </>
  );
};

// ─── Tab: Claims ──────────────────────────────────────────────────────────────

const ClaimsTab = () => {
  const [claims,    setClaims]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [expanded,  setExpanded]  = useState(null);   // claim._id that is open
  const [adminNote, setAdminNote] = useState('');
  const [acting,    setActing]    = useState(null);   // claim._id being approved/rejected

  useEffect(() => {
    getPendingClaims()
      .then((res) => setClaims(res.data))
      .catch(() => setError('Could not load pending claims.'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (id) => {
    setExpanded(prev => prev === id ? null : id);
    setAdminNote('');
  };

  const handleVerdict = async (claimId, verdict) => {
    setActing(claimId);
    setError('');
    try {
      await reviewClaim(claimId, { verdict, adminNote });
      // Remove from queue — it's no longer pending
      setClaims(prev => prev.filter(c => c._id !== claimId));
      setExpanded(null);
      setAdminNote('');
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed. Try again.');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {claims.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm font-medium text-gray-500">No pending claims. Queue is clear.</p>
        </div>
      )}

      <div className="space-y-3">
        {claims.map(claim => {
          const isOpen    = expanded === claim._id;
          const isActing  = acting === claim._id;
          const { foundItem, lostItem, claimant, message, createdAt } = claim;

          return (
            <div
              key={claim._id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Collapsed header row — always visible */}
              <button
                onClick={() => handleToggle(claim._id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {foundItem?.title || 'Unknown item'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Claimed by <span className="text-gray-600 font-medium">{claimant?.name}</span>
                      {' · '}{formatDate(createdAt)}
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 text-sm shrink-0 ml-3">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded review panel */}
              {isOpen && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4">

                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

                    {/* LEFT — Finder's evidence */}
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500 mb-3">
                        🔍 Finder's Evidence
                      </p>

                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Item</p>
                      <p className="text-sm font-bold text-gray-800 mb-3">{foundItem?.title}</p>

                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Category & Location</p>
                      <p className="text-xs text-gray-600 mb-3">
                        {foundItem?.category} · {foundItem?.locationGeneral}
                      </p>

                      {foundItem?.locationExact && (
                        <>
                          <p className="text-xs font-semibold text-gray-600 mb-0.5">Exact location found</p>
                          <p className="text-xs text-gray-600 mb-3">{foundItem.locationExact}</p>
                        </>
                      )}

                      {foundItem?.privateDescription && (
                        <>
                          <p className="text-xs font-semibold text-gray-600 mb-0.5">Private description</p>
                          <p className="text-xs text-gray-600 mb-3">{foundItem.privateDescription}</p>
                        </>
                      )}

                      {foundItem?.privatePhoto && (
                        <img
                          src={foundItem.privatePhoto}
                          alt="Private photo"
                          className="w-full rounded-lg mt-1 object-cover max-h-36"
                        />
                      )}
                    </div>

                    {/* RIGHT — Owner's proof */}
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-3">
                        🙋 Owner's Proof
                      </p>

                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Claimant</p>
                      <p className="text-sm font-bold text-gray-800 mb-0.5">{claimant?.name}</p>
                      <p className="text-xs text-gray-400 mb-3">{claimant?.email}</p>

                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Linked lost report</p>
                      <p className="text-xs text-gray-600 mb-3">
                        {lostItem?.title || '—'}
                      </p>

                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Proof message</p>
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {message}
                      </p>
                    </div>
                  </div>

                  {/* Admin note */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                      Admin note (optional — shown to claimant if rejected)
                    </label>
                    <textarea
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      rows={2}
                      placeholder="e.g. Proof does not match item description."
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      disabled={isActing}
                      onClick={() => handleVerdict(claim._id, 'approved')}
                      className="flex-1 text-sm font-semibold text-white bg-green-500 rounded-xl py-2.5 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActing ? 'Processing…' : '✅ Approve'}
                    </button>
                    <button
                      disabled={isActing}
                      onClick={() => handleVerdict(claim._id, 'rejected')}
                      className="flex-1 text-sm font-semibold text-white bg-red-500 rounded-xl py-2.5 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActing ? 'Processing…' : '✕ Reject'}
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { label: '📊 Overview', key: 'overview' },
  { label: '📦 Items',    key: 'items'    },
  { label: '👥 Users',    key: 'users'    },
  { label: '🤝 Claims',   key: 'claims'   },
];

const AdminPage = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/', { replace: true });
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
          <p className="text-sm text-gray-400 mt-1">
            Logged in as <span className="text-purple-600 font-medium">{user.email}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-1">
          {TABS.map(({ label, key }, i) => (
            <button
              key={key}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 0 && <OverviewTab />}
        {activeTab === 1 && <ItemsTab />}
        {activeTab === 2 && <UsersTab />}
        {activeTab === 3 && <ClaimsTab />}

      </main>
    </div>
  );
};

export default AdminPage;

/* import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getStats, getAdminItems, deleteItem, getUsers, updateUser } from '../api/admin';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLES = {
  unclaimed:         'bg-gray-100 text-gray-500',
  searching:         'bg-blue-100 text-blue-600',
  pending_review:    'bg-yellow-100 text-yellow-700',
  claim_pending:     'bg-orange-100 text-orange-600',
  awaiting_payment:  'bg-orange-100 text-orange-600',
  claim_approved:    'bg-green-100 text-green-600',
  ready_for_handoff: 'bg-teal-100 text-teal-600',
  awaiting_handoff:  'bg-teal-100 text-teal-600',
  resolved:          'bg-green-100 text-green-700',
  disputed:          'bg-red-100 text-red-600',
};

// ─── Reusable sub-components ────────────────────────────────────────────────

const SkeletonRow = ({ cols }) => (
  <tr className="border-t border-gray-100">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
      </td>
    ))}
  </tr>
);

const Badge = ({ label, color }) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
    {label}
  </span>
);

const StatCard = ({ label, value, accent }) => (
  <div className={`bg-white rounded-xl border p-5 ${accent}`}>
    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-800">{value ?? '—'}</p>
  </div>
);

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
      <p className="text-sm text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// ─── Tab: Overview ───────────────────────────────────────────────────────────

const OverviewTab = () => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    getStats()
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load stats.'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  const cards = [
    { label: 'Total Users',     value: stats?.totalUsers,        accent: 'border-purple-100' },
    { label: 'Total Items',     value: stats?.totalItems,        accent: 'border-gray-200'   },
    { label: 'Lost Items',      value: stats?.lostCount,         accent: 'border-rose-100'   },
    { label: 'Found Items',     value: stats?.foundCount,        accent: 'border-teal-100'   },
    { label: 'Resolved',        value: stats?.resolvedCount,     accent: 'border-green-100'  },
    { label: 'Pending Review',  value: stats?.pendingReviewCount,accent: 'border-yellow-100' },
    { label: 'Claim Pending',   value: stats?.claimPendingCount, accent: 'border-orange-100' },
    { label: 'Disputed',        value: stats?.disputedCount,     accent: 'border-red-100'    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map(({ label, value, accent }) => (
        loading
          ? <div key={label} className="bg-white rounded-xl border p-5 animate-pulse h-24" />
          : <StatCard key={label} label={label} value={value} accent={accent} />
      ))}
    </div>
  );
};

// ─── Tab: Items ───────────────────────────────────────────────────────────────

const ItemsTab = () => {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [typeFilter, setFilter] = useState('');
  const [confirm, setConfirm]   = useState(null); // item to delete

  const fetchItems = useCallback(() => {
    setLoading(true);
    getAdminItems(typeFilter)
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load items.'))
      .finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      await deleteItem(confirm._id);
      setItems((prev) => prev.filter((i) => i._id !== confirm._id));
    } catch {
      setError('Delete failed. Try again.');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      {confirm && (
        <ConfirmModal
          message={`Delete "${confirm.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Filter 
      <div className="flex gap-2 mb-4">
        {['', 'lost', 'found'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === t
                ? t === 'lost'  ? 'bg-rose-500 text-white'
                : t === 'found' ? 'bg-teal-500 text-white'
                :                 'bg-gray-800 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Posted By</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Private Details</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              : items.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No items found.
                  </td>
                </tr>
              )
              : items.map((item) => (
                <tr key={item._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-700 max-w-[160px] truncate">
                    {item.title}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={item.type}
                      color={item.type === 'lost' ? 'bg-rose-50 text-rose-500' : 'bg-teal-50 text-teal-600'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={item.status?.replace(/_/g, ' ')}
                      color={STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-500'}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.postedBy?.name || '—'}
                    <span className="block text-xs text-gray-400">{item.postedBy?.email}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {formatDate(item.dateReported)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[180px]">
                    {item.privateDescription
                      ? <span className="text-gray-600">{item.privateDescription}</span>
                      : <span className="italic">none</span>
                    }
                    {item.locationExact && (
                      <span className="block text-gray-500">📍 {item.locationExact}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirm(item)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </>
  );
};

// ─── Tab: Users ───────────────────────────────────────────────────────────────

const UsersTab = () => {
  const { user: currentUser }   = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [updating, setUpdating] = useState(null); // id of row being updated

  useEffect(() => {
    getUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (id, data) => {
    setUpdating(id);
    try {
      const res = await updateUser(id, data);
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data : u)));
    } catch {
      setError('Update failed. Try again.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : users.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No users found.
                  </td>
                </tr>
              )
              : users.map((u) => {
                const isSelf    = u._id === currentUser?._id;
                const isLoading = updating === u._id;

                return (
                  <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={u.role}
                        color={u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={u.isBanned ? 'Banned' : 'Active'}
                        color={u.isBanned ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-gray-300 italic">you</span>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            disabled={isLoading}
                            onClick={() => handleUpdate(u._id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                            className="text-xs text-purple-500 hover:text-purple-700 font-medium disabled:opacity-40"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </button>
                          <button
                            disabled={isLoading}
                            onClick={() => handleUpdate(u._id, { isBanned: !u.isBanned })}
                            className={`text-xs font-medium disabled:opacity-40 ${
                              u.isBanned
                                ? 'text-green-500 hover:text-green-700'
                                : 'text-red-400 hover:text-red-600'
                            }`}
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { label: '📊 Overview', key: 'overview' },
  { label: '📦 Items',    key: 'items'    },
  { label: '👥 Users',    key: 'users'    },
];

const AdminPage = () => {
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Hard guard — redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/', { replace: true });
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Header 
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
          <p className="text-sm text-gray-400 mt-1">
            Logged in as <span className="text-purple-600 font-medium">{user.email}</span>
          </p>
        </div>

        {/* Tabs 
        <div className="flex border-b border-gray-200 mb-6 gap-1">
          {TABS.map(({ label, key }, i) => (
            <button
              key={key}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content 
        {activeTab === 0 && <OverviewTab />}
        {activeTab === 1 && <ItemsTab />}
        {activeTab === 2 && <UsersTab />}

      </main>
    </div>
  );
};

export default AdminPage; */