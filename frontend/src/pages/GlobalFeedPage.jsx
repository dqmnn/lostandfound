import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchFoundItems, fetchLostItems, getMyItems } from '../api/items';
import { createClaim } from '../api/claims';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const CATEGORIES = ['Electronics', 'ID/Cards', 'Clothing', 'Books', 'Other'];
const LOCATIONS  = [
  'Main Library', 'Science Block', 'Cafeteria', 'Sports Complex',
  'Admin Block', 'Lecture Hall', 'Student Centre', 'Parking Lot', 'Other',
];

const CATEGORY_EMOJI = {
  Electronics: '💻',
  'ID/Cards':  '🪪',
  Clothing:    '👕',
  Books:       '📚',
  Other:       '📦',
};

// Category-specific proof hints shown inside the claim modal textarea
const PROOF_HINTS = {
  Electronics: 'Tell us: What is the lock screen wallpaper or passcode hint? What is the serial number or IMEI? Any scratches, dents, stickers, or custom case?',
  'ID/Cards':  'Tell us: What is the full name printed on the ID? What is the ID or card number? What institution or organization issued it?',
  Clothing:    'Tell us: What is the brand label? What size is it? Any unique marks, tears, stains, or custom alterations inside?',
  Books:       'Tell us: What is written on the inside cover or first page? Any handwritten notes, highlights, or page bookmarks? Who is the author?',
  Other:       'Tell us: Describe any unique features, engravings, custom markings, or identifying details that only the true owner would know.',
};

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const styles = {
    unclaimed:      'bg-green-100 text-green-700',
    searching:      'bg-yellow-100 text-yellow-700',
    pending_review: 'bg-blue-100 text-blue-700',
    resolved:       'bg-gray-100 text-gray-500',
  };
  const labels = {
    unclaimed:      'Unclaimed',
    searching:      'Searching',
    pending_review: 'Under Review',
    resolved:       'Resolved',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
      {labels[status] || status}
    </span>
  );
}

// ─── Claim Modal ─────────────────────────────────────────────────────────────

function ClaimModal({ foundItem, onClose, onSuccess }) {
  const [myLostItems,    setMyLostItems]    = useState([]);
  const [loadingItems,   setLoadingItems]   = useState(true);
  const [selectedLostId, setSelectedLostId] = useState('');
  const [message,        setMessage]        = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState('');

  // Fetch the user's lost items that are still actively searching
  useEffect(() => {
    getMyItems('lost')
      .then(res => {
        const searching = res.data.filter(i => i.status === 'searching');
        setMyLostItems(searching);
      })
      .catch(() => setError('Could not load your lost reports.'))
      .finally(() => setLoadingItems(false));
  }, []);

  const handleSubmit = async () => {
    if (!selectedLostId) {
      setError('Please select which of your lost reports this matches.');
      return;
    }
    if (!message.trim()) {
      setError('Please describe your proof of ownership.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createClaim({
        foundItemId: foundItem._id,
        lostItemId:  selectedLostId,
        message:     message.trim(),
      });
      onSuccess(foundItem._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hint = PROOF_HINTS[foundItem.category] || PROOF_HINTS.Other;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">Claim This Item</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {foundItem.title} · {foundItem.locationGeneral}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none font-medium"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Found item summary strip */}
          <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-xl p-3">
            <span className="text-2xl shrink-0">
              {CATEGORY_EMOJI[foundItem.category] || '📦'}
            </span>
            <div>
              <p className="text-sm font-semibold text-teal-800">{foundItem.title}</p>
              <p className="text-xs text-teal-600">
                📍 {foundItem.locationGeneral} · 📂 {foundItem.category}
              </p>
            </div>
          </div>

          {/* Select matching lost report */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">
              Which of your lost reports is this? *
            </label>

            {loadingItems ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : myLostItems.length === 0 ? (
              <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-4 py-3">
                You have no active lost reports.{' '}
                <Link to="/report/lost" className="text-teal-600 underline font-medium">
                  Report your lost item first →
                </Link>
              </div>
            ) : (
              <select
                value={selectedLostId}
                onChange={e => setSelectedLostId(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                <option value="">— Select a lost report —</option>
                {myLostItems.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.title} · {item.category}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Proof message */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">
              Proof of Ownership *
            </label>
            <p className="text-xs text-gray-400 italic mb-2">{hint}</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              maxLength={500}
              placeholder="Describe your proof here..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{message.length} / 500</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || loadingItems || myLostItems.length === 0}
              className="flex-1 text-sm font-semibold text-white bg-teal-500 rounded-xl py-2.5 hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({ item, type, onClaimClick }) {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const handleClaim = () => {
    if (!user) { navigate('/login'); return; }
    onClaimClick(item);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
      <div className={`h-1 w-full ${type === 'found' ? 'bg-teal-500' : 'bg-rose-500'}`} />

      <div className="h-36 bg-gray-100 flex items-center justify-center">
        {item.photo ? (
          <img src={item.photo} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl">{CATEGORY_EMOJI[item.category] || '📦'}</span>
        )}
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <StatusBadge status={item.status} />
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {item.category}
          </span>
        </div>

        <h3 className="text-sm font-bold text-gray-800 truncate mb-2">{item.title}</h3>

        <div className="flex flex-col gap-1 mb-3">
          <span className="text-xs text-gray-500">📍 {item.locationGeneral}</span>
          <span className="text-xs text-gray-500">
            📅 {new Date(item.dateReported || item.createdAt).toLocaleDateString('en-KE', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>

        {type === 'lost' && item.rewardAmount > 0 && (
          <div className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5 mb-3">
            <span>Payout:</span>
            <span className="font-bold">KES {(item.rewardAmount * 0.8).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        )}

        {type === 'found' && (
          <button
            onClick={handleClaim}
            className="w-full text-sm font-semibold text-teal-600 border border-teal-500 rounded-lg py-1.5 hover:bg-teal-500 hover:text-white transition-colors"
          >
            Claim This Item
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Global Feed Page ─────────────────────────────────────────────────────────

export default function GlobalFeedPage() {
  const { user } = useAuth();

  const [activeTab,       setActiveTab]       = useState('found');
  const [items,           setItems]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [category,        setCategory]        = useState('');
  const [locationGeneral, setLocationGeneral] = useState('');
  const [dateFrom,        setDateFrom]        = useState('');
  const [dateTo,          setDateTo]          = useState('');

  // Claim modal state
  const [claimTarget,  setClaimTarget]  = useState(null); // found item being claimed
  const [claimSuccess, setClaimSuccess] = useState('');   // success message after submit

  const hasActiveFilters = category || locationGeneral || dateFrom || dateTo;

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (category)        filters.category        = category;
      if (locationGeneral) filters.locationGeneral = locationGeneral;
      if (dateFrom)        filters.dateFrom        = dateFrom;
      if (dateTo)          filters.dateTo          = dateTo;

      const res = activeTab === 'found'
        ? await fetchFoundItems(filters)
        : await fetchLostItems(filters);
      setItems(res.data);
    } catch {
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, category, locationGeneral, dateFrom, dateTo]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const clearFilters = () => {
    setCategory(''); setLocationGeneral(''); setDateFrom(''); setDateTo('');
  };

  const handleClaimSuccess = (claimedFoundItemId) => {
    // Remove the item from the feed — it's now pending_review and hidden from public
    setItems(prev => prev.filter(i => i._id !== claimedFoundItemId));
    setClaimTarget(null);
    setClaimSuccess('Claim submitted! An admin will review your proof shortly. Check My Active Claims in your dashboard.');
    setTimeout(() => setClaimSuccess(''), 7000);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      {/* Hero */}
      <div className="bg-white border-b border-gray-200 px-8 py-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Campus Lost & Found</h1>
        <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
          Browse items found across campus. Spot yours? Submit a claim and we'll verify it.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            to="/report/lost"
            className="bg-rose-500 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-rose-600 transition-colors"
          >
            ✕ I Lost Something
          </Link>
          <Link
            to="/report/found"
            className="bg-teal-500 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-teal-600 transition-colors"
          >
            ✓ I Found Something
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 flex">
          <button
            onClick={() => setActiveTab('found')}
            className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'found'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Found Items
            <span className="ml-2 text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
              {activeTab === 'found' ? items.length : '—'}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('lost')}
            className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'lost'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Lost Items
            <span className="ml-2 text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
              {activeTab === 'lost' ? items.length : '—'}
            </span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-8 py-6 flex gap-6 items-start">

        {/* Filter sidebar */}
        <aside className="w-56 flex-shrink-0 bg-white border border-gray-200 rounded-2xl p-5 sticky top-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            Filter
            {hasActiveFilters && <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />}
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Location</label>
              <select
                value={locationGeneral}
                onChange={e => setLocationGeneral(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">All locations</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">From date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">To date</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-semibold text-red-500 hover:text-red-600 border border-gray-200 rounded-lg py-2 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* Items grid */}
        <section className="flex-1 min-w-0">

          {/* Success banner */}
          {claimSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <span>✅</span>
              <span>{claimSuccess}</span>
            </div>
          )}

          <p className="text-xs text-gray-400 font-semibold mb-4">
            {loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
          </p>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-20">
              <p className="text-2xl mb-2">⚠️</p>
              <p className="text-sm font-semibold text-gray-600">{error}</p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">{activeTab === 'found' ? '📭' : '🔎'}</p>
              <p className="text-sm font-semibold text-gray-600 mb-1">No {activeTab} items yet</p>
              <p className="text-xs text-gray-400">
                {hasActiveFilters ? 'Try adjusting your filters.' : 'Nothing has been reported yet.'}
              </p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => (
                <ItemCard
                  key={item._id}
                  item={item}
                  type={activeTab}
                  onClaimClick={setClaimTarget}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Claim Modal — rendered at root level to avoid z-index issues */}
      {claimTarget && (
        <ClaimModal
          foundItem={claimTarget}
          onClose={() => setClaimTarget(null)}
          onSuccess={handleClaimSuccess}
        />
      )}

    </div>
  );
}
