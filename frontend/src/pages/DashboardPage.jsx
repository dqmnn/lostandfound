import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getMyItems } from '../api/items';
import { getMyClaims } from '../api/claims';
import { mockPay, verifyOtp, getTransaction, getTransactionByItem } from '../api/payments';
import { Link } from 'react-router-dom';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const STATUS_STYLES = {
  unclaimed:         'bg-gray-100 text-gray-600',
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

const CLAIM_STATUS_CONFIG = {
  pending:  { label: 'Pending Admin Review',       style: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved — Awaiting Payment', style: 'bg-green-100 text-green-600'  },
  rejected: { label: 'Rejected',                   style: 'bg-red-100 text-red-500'       },
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
// The Found variant gains Stage 5 handoff UI when status === 'ready_for_handoff'

const ItemCard = ({ item, type, onResolved }) => {
  const [txData,     setTxData]     = useState(null);   // transaction payload from backend
  const [txLoading,  setTxLoading]  = useState(false);
  const [otpInput,   setOtpInput]   = useState('');
  const [verifying,  setVerifying]  = useState(false);
  const [verifyErr,  setVerifyErr]  = useState('');
  const [localStatus, setLocalStatus] = useState(item.status);

  // Fetch transaction as soon as a found item enters ready_for_handoff
  useEffect(() => {
    if (type !== 'found' || localStatus !== 'ready_for_handoff') return;

    const fetchTx = async () => {
      setTxLoading(true);
      try {
        const res = await getTransactionByItem(item._id);
        setTxData(res.data);
      } catch {
        // transaction not yet created or network error — silently fail,
        // user can refresh; item status badge still shows correctly
      } finally {
        setTxLoading(false);
      }
    };
    fetchTx();
  }, [item._id, type, localStatus]);

  const handleVerifyOtp = async () => {
    if (!otpInput.trim()) return;
    setVerifying(true);
    setVerifyErr('');
    try {
      await verifyOtp(txData.claimId, otpInput.trim());
      setLocalStatus('resolved');
      onResolved?.();           // bubble up so parent can refresh counts
    } catch (err) {
      setVerifyErr(err.response?.data?.message || 'Verification failed. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${
        type === 'lost' ? 'border-rose-100' : 'border-teal-100'
      }`}
    >
      {/* ── Header row ── */}
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
            STATUS_STYLES[localStatus] || 'bg-gray-100 text-gray-500'
          }`}
        >
          {localStatus === 'resolved'
            ? '✅ Resolved'
            : localStatus?.replace(/_/g, ' ')}
        </span>
      </div>

      {/* ── Meta row ── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
        {item.category && <span>📂 {item.category}</span>}
        {item.locationGeneral && <span>📍 {item.locationGeneral}</span>}
        <span>🗓 {formatDate(item.dateReported)}</span>
        
        {item.rewardAmount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-amber-600 font-medium">
              🏆 KES {item.rewardAmount} Offered
            </span>
            <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              💸 Payout: KES {(item.rewardAmount * 0.8).toFixed(0)}
            </span>
          </div>
        )}
      </div>

      {/* ── Private fields (own item) ── */}
      {(item.locationExact || item.privateDescription) && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2 space-y-0.5 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
            🔒 Private — only you see this
          </p>
          {item.locationExact      && <p className="text-xs text-gray-500">📍 {item.locationExact}</p>}
          {item.privateDescription && <p className="text-xs text-gray-500">📝 {item.privateDescription}</p>}
        </div>
      )}

      {/* ── Stage 5: Finder handoff panel ── */}
      {type === 'found' && localStatus === 'ready_for_handoff' && (
        <div className="mt-3 border border-teal-200 rounded-xl overflow-hidden">

          {/* Section header */}
          <div className="bg-teal-50 px-4 py-2 border-b border-teal-100">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
              🤝 Handoff Ready — Owner has paid
            </p>
          </div>

          <div className="px-4 py-3 space-y-4">

            {/* Owner contact */}
            {txLoading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : txData?.owner ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Owner — call to arrange meetup
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  📞 {txData.owner.name} · {txData.owner.phone}
                </p>
              </div>
            ) : null}

            {/* OTP input */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                Handshake Code
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Meet the owner, hand over the item, then ask them to read you the code.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => {
                    setVerifyErr('');
                    setOtpInput(e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder="Enter 4-digit code"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpInput.length !== 4 || verifying}
                  className="px-4 py-2 bg-teal-600 text-black text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {verifying ? 'Verifying…' : 'Verify & Release Funds'}
                </button>
              </div>
              {verifyErr && (
                <p className="text-xs text-red-500 mt-1.5">{verifyErr}</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Resolved state ── */}
      {type === 'found' && localStatus === 'resolved' && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-green-700">
            ✅ Item resolved — payout sent to your M-Pesa.
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Claim Card ───────────────────────────────────────────────────────────────
// Stage 5: approved claims get a real Pay Reward button.
// After payment, shows Finder's phone + OTP in large bold text.

const ClaimCard = ({ claim, onResolved }) => {
  const { foundItem, lostItem, status, message, adminNote, createdAt } = claim;
  const statusConfig = CLAIM_STATUS_CONFIG[status] || { label: status, style: 'bg-gray-100 text-gray-500' };

  const [paying,      setPaying]      = useState(false);
  const [payErr,      setPayErr]      = useState('');
  const [txData,      setTxData]      = useState(null);   // populated after payment
  const [txLoading,   setTxLoading]   = useState(false);
  const [localStatus, setLocalStatus] = useState(status); // 'approved' | 'escrowed' | 'released'

  // If the transaction is already escrowed from a previous session, fetch it on mount
  useEffect(() => {
    if (localStatus !== 'approved') return;
    // Check if the found item is already in a post-payment state
    // (e.g. user refreshed mid-flow). We optimistically try to fetch
    // the transaction; if it exists and is escrowed we surface the OTP panel.
    const tryFetch = async () => {
      setTxLoading(true);
      try {
        const res = await getTransaction(claim._id);
        if (res.data.status === 'escrowed' || res.data.status === 'released') {
          setTxData(res.data);
          setLocalStatus(res.data.status);
        }
      } catch {
        // No transaction yet — that's fine, user hasn't paid yet
      } finally {
        setTxLoading(false);
      }
    };
    tryFetch();
  }, [claim._id, localStatus]);

  const handlePay = async () => {
    setPaying(true);
    setPayErr('');
    try {
      await mockPay(claim._id);
      // Fetch the transaction immediately to get the OTP and Finder's phone
      const res = await getTransaction(claim._id);
      setTxData(res.data);
      setLocalStatus('escrowed');
    } catch (err) {
      setPayErr(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  // Derive a display label that reflects live local status
  const displayConfig = (() => {
    if (localStatus === 'escrowed')  return { label: 'Escrowed — Awaiting Handoff', style: 'bg-teal-100 text-teal-700' };
    if (localStatus === 'released')  return { label: 'Resolved',                    style: 'bg-green-100 text-green-700' };
    return statusConfig;
  })();

  // Right above your return statement:
console.log("--- DEBUGGING CLAIM DATA ---");
console.log("Full Claim Object:", claim); // Or whatever your prop/variable is named
console.log("Found Item Data:", foundItem);
console.log("Lost Item Data:", lostItem);
console.log("Reward Calculation:", foundItem?.rewardAmount ?? lostItem?.rewardAmount ?? "FALLBACK TO 0");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">

      {/* ── Header row ── */}
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
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${displayConfig.style}`}>
          {displayConfig.label}
        </span>
      </div>

      {/* ── Linked lost report ── */}
      {lostItem && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-3">
          <span className="text-gray-400">Matched to your lost report:</span>
          <span className="font-medium text-gray-700">{lostItem.title}</span>
        </div>
      )}

      {/* ── Proof message summary ── */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
          Your proof
        </p>
        <p className="text-xs text-gray-600 line-clamp-2">{message}</p>
      </div>

      {/* ── Admin rejection note ── */}
      {status === 'rejected' && adminNote && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-0.5">
            Admin note
          </p>
          <p className="text-xs text-red-600">{adminNote}</p>
        </div>
      )}

      {/* ── Stage 5: Pay Reward button (approved, not yet paid) ── */}
      {localStatus === 'approved' && !txLoading && !txData && (
        <div className="mt-3">
          {payErr && (
            <p className="text-xs text-red-500 mb-2">{payErr}</p>
          )}
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full py-2.5 bg-[#6C63FF] text-black text-sm font-semibold rounded-xl hover:bg-[#574fd6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {paying ? 'Processing payment…' : `💳 Pay Reward — KES ${foundItem?.rewardAmount || lostItem?.rewardAmount || 9}`}
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">
            Funds are held in escrow until you receive your item.
          </p>
        </div>
      )}

      {/* Skeleton while checking for existing transaction on mount */}
      {localStatus === 'approved' && txLoading && (
        <div className="mt-3 h-10 bg-gray-100 rounded-xl animate-pulse" />
      )}

      {/* ── Stage 5: Post-payment OTP panel (Owner) ── */}
      {(localStatus === 'escrowed' || localStatus === 'released') && txData && (
        <div className="mt-3 border border-purple-200 rounded-xl overflow-hidden">

          {/* Section header */}
          <div className="bg-purple-50 px-4 py-2 border-b border-purple-100">
            <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
              💰 Payment Escrowed — Ready for Handoff
            </p>
          </div>

          <div className="px-4 py-3 space-y-4">

            {/* Finder contact */}
            {txData.finder && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Finder — call to arrange meetup
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  📞 {txData.finder.name} · {txData.finder.phone}
                </p>
              </div>
            )}

            {/* OTP code — large and bold for easy reading during handoff */}
            {localStatus === 'escrowed' && txData.otpCode && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Your Handshake Code
                </p>
                <div className="bg-[#FFF8E7] border-2 border-[#FFD166] rounded-xl px-4 py-3 text-center">
                  <p className="text-4xl font-black tracking-[0.25em] text-gray-900">
                    {txData.otpCode}
                  </p>
                </div>
                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2">
                  ⚠️ Only read this code to the Finder <strong>after</strong> you have inspected and received your item.
                </p>
              </div>
            )}

            {/* Resolved state */}
            {localStatus === 'released' && (
              <p className="text-sm font-semibold text-green-700">
                ✅ Handshake verified — item returned and payout sent.
              </p>
            )}

          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <p className="text-[10px] text-gray-400 mt-3">Submitted {formatDate(createdAt)}</p>
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

  const fetchAll = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
              : <div className="space-y-3">{foundItems.map(item => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    type="found"
                    onResolved={fetchAll}
                  />
                ))}</div>
        )}

        {/* Tab 2 — My Active Claims */}
        {activeTab === 2 && (
          loading
            ? <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
            : claims.length === 0
              ? <EmptyClaimsState />
              : <div className="space-y-3">{claims.map(claim => (
                  <ClaimCard
                    key={claim._id}
                    claim={claim}
                    onResolved={fetchAll}
                  />
                ))}</div>
        )}

      </main>
    </div>
  );
};

export default DashboardPage;