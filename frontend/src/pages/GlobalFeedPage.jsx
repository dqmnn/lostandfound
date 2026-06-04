import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Laptop, Headphones, CreditCard, Watch, Tag, BookOpen, Pencil,
  Package, MapPin, Calendar, Trophy, SlidersHorizontal, X,
  CheckCircle2, Clock, Search, AlertCircle, Loader2,
  ChevronRight, CircleDot, BadgeCheck, ArrowRight,
} from 'lucide-react';
import { fetchFoundItems, fetchLostItems, getMyItems } from '../api/items';
import { createClaim } from '../api/claims';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Electronics', 'Light Electronics', 'ID/Cards', 'Accessories',
  'Clothing', 'Books', 'Stationery', 'Other',
];

const LOCATIONS = [
  'Main Library', 'Science Block', 'Cafeteria', 'Sports Complex',
  'Admin Block', 'Lecture Hall', 'Student Centre', 'Parking Lot', 'Other',
];

// Icon component reference per category
const CATEGORY_ICON = {
  'Electronics':       Laptop,
  'Light Electronics': Headphones,
  'ID/Cards':          CreditCard,
  'Accessories':       Watch,
  'Clothing':          Tag,
  'Books':             BookOpen,
  'Stationery':        Pencil,
  'Other':             Package,
};

// Coloured icon area styling per category
const CATEGORY_STYLE = {
  'Electronics':       { area: 'bg-blue-50',    icon: 'text-blue-500'    },
  'Light Electronics': { area: 'bg-violet-50',  icon: 'text-violet-500'  },
  'ID/Cards':          { area: 'bg-amber-50',   icon: 'text-amber-600'   },
  'Accessories':       { area: 'bg-rose-50',    icon: 'text-rose-500'    },
  'Clothing':          { area: 'bg-teal-50',    icon: 'text-teal-600'    },
  'Books':             { area: 'bg-emerald-50', icon: 'text-emerald-600' },
  'Stationery':        { area: 'bg-orange-50',  icon: 'text-orange-500'  },
  'Other':             { area: 'bg-gray-100',   icon: 'text-gray-400'    },
};

// Minimum reward bands — mirrors ReportItemPage.jsx
const REWARD_BANDS = {
  'Electronics':       { min: 500  },
  'Light Electronics': { min: 200  },
  'ID/Cards':          { min: 100  },
  'Accessories':       { min: 150  },
  'Clothing':          { min: 100  },
  'Books':             { min: 100  },
  'Stationery':        { min: 50   },
  'Other':             { min: 50   },
};

// Proof hints shown inside the claim modal — all 8 categories
const PROOF_HINTS = {
  'Electronics':       'What is the lock screen wallpaper or PIN hint? Serial number or IMEI? Any scratches, stickers, or custom case?',
  'Light Electronics': 'What brand and model is it? Any serial number? Colour and condition? Any accessories or markings that set it apart?',
  'ID/Cards':          'What is the full name printed on the ID? The ID or card number? Which institution or organization issued it?',
  'Accessories':       'What brand? Any engravings, serial numbers, or unique markings? Describe the colour and condition in detail.',
  'Clothing':          'What is the brand label? What size? Any unique marks, tears, stains, or custom alterations on the inside?',
  'Books':             'What is written on the inside cover or first page? Any handwritten notes, highlights, bookmarks, or annotations?',
  'Stationery':        'What brand? Is any name written on it? Any custom labels, stickers, or markings that identify it as yours?',
  'Other':             'Describe any unique features, engravings, custom markings, or details only the true owner would know.',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const config = {
    unclaimed:      { label: 'Unclaimed',    cls: 'bg-green-100 text-green-700',   Icon: CircleDot     },
    searching:      { label: 'Searching',    cls: 'bg-yellow-100 text-yellow-700', Icon: Search        },
    pending_review: { label: 'Under Review', cls: 'bg-blue-100 text-blue-700',     Icon: Clock         },
    resolved:       { label: 'Resolved',     cls: 'bg-gray-100 text-gray-500',     Icon: BadgeCheck    },
  };
  const { label, cls, Icon } = config[status] ?? {
    label: status, cls: 'bg-gray-100 text-gray-500', Icon: Package,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      <Icon size={10} strokeWidth={2.5} />
      {label}
    </span>
  );
}

// ─── Claim Modal ──────────────────────────────────────────────────────────────

function ClaimModal({ foundItem, onClose, onSuccess }) {
  const [myLostItems,    setMyLostItems]    = useState([]);
  const [loadingItems,   setLoadingItems]   = useState(true);
  const [selectedLostId, setSelectedLostId] = useState('');
  const [message,        setMessage]        = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState('');

  const CategoryIcon  = CATEGORY_ICON[foundItem.category]  ?? Package;
  const categoryStyle = CATEGORY_STYLE[foundItem.category] ?? CATEGORY_STYLE.Other;

  useEffect(() => {
    getMyItems('lost')
      .then(res => {
        setMyLostItems(res.data.filter(i => i.status === 'searching'));
      })
      .catch(() => setError('Could not load your lost reports.'))
      .finally(() => setLoadingItems(false));
  }, []);

  const handleSubmit = async () => {
    if (!selectedLostId) return setError('Please select which of your lost reports this matches.');
    if (!message.trim()) return setError('Please describe your proof of ownership.');
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

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
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Found item summary */}
          <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-xl p-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${categoryStyle.area}`}>
              <CategoryIcon size={20} className={categoryStyle.icon} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-800">{foundItem.title}</p>
              <p className="text-xs text-teal-600 flex items-center gap-2 mt-0.5">
                <MapPin size={11} className="shrink-0" />
                {foundItem.locationGeneral}
                <span className="text-teal-400">·</span>
                {foundItem.category}
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
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-4 py-3">
                <AlertCircle size={14} className="text-gray-400 shrink-0" />
                <span>
                  You have no active lost reports.{' '}
                  <Link to="/report/lost" className="text-teal-600 underline font-medium">
                    Report your lost item first →
                  </Link>
                </span>
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
            <p className="text-xs text-gray-400 italic mb-2 leading-relaxed">
              {PROOF_HINTS[foundItem.category] ?? PROOF_HINTS.Other}
            </p>
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

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-lg">
              <AlertCircle size={14} className="shrink-0" />
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
              className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-teal-500 rounded-xl py-2.5 hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                : <><CheckCircle2 size={14} /> Submit Claim</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({ item, type, onClaimClick }) {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const CategoryIcon  = CATEGORY_ICON[item.category]  ?? Package;
  const categoryStyle = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.Other;
  const band          = REWARD_BANDS[item.category];

  const handleClaim = () => {
    if (!user) { navigate('/login'); return; }
    onClaimClick(item);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col">
      <div className={`h-1 w-full ${type === 'found' ? 'bg-teal-500' : 'bg-rose-500'}`} />

      {/* Category icon area */}
      <div className={`h-32 flex items-center justify-center ${categoryStyle.area}`}>
        {item.photo ? (
          <img src={item.photo} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <CategoryIcon
            size={48}
            className={`${categoryStyle.icon} opacity-60`}
            strokeWidth={1.25}
          />
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <StatusBadge status={item.status} />
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            <CategoryIcon size={10} strokeWidth={2.5} />
            {item.category}
          </span>
        </div>

        <h3 className="text-sm font-bold text-gray-800 truncate mb-2">{item.title}</h3>

        {/* Meta */}
        <div className="flex flex-col gap-1 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            {item.locationGeneral}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={12} className="text-gray-400 shrink-0" />
            {formatDate(item.dateReported || item.createdAt)}
          </span>
        </div>

        <div className="mt-auto space-y-2">
          {/* Lost item — show actual reward (80% payout to finder) */}
          {type === 'lost' && item.rewardAmount > 0 && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-full">
              <Trophy size={13} className="text-amber-500 shrink-0" />
              <span>Finder payout:</span>
              <span className="font-bold ml-auto">
                KES {(item.rewardAmount * 0.8).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}

          {/* Found item — show minimum expected payout based on category band */}
          {type === 'found' && band && (
            <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full">
              <Trophy size={13} className="text-gray-400 shrink-0" />
              <span>Min. payout if claimed:</span>
              <span className="font-semibold text-gray-700 ml-auto">
                KES {(band.min * 0.8).toLocaleString()}
              </span>
            </div>
          )}

          {/* Claim button — found items only */}
          {type === 'found' && (
            <button
              onClick={handleClaim}
              className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-teal-600 border border-teal-500 rounded-lg py-1.5 hover:bg-teal-500 hover:text-white transition-colors"
            >
              Claim This Item
              <ArrowRight size={14} />
            </button>
          )}
        </div>
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

  const [claimTarget,  setClaimTarget]  = useState(null);
  const [claimSuccess, setClaimSuccess] = useState('');

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
            className="inline-flex items-center gap-2 bg-rose-500 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-rose-600 transition-colors"
          >
            <Search size={15} />
            I Lost Something
          </Link>
          <Link
            to="/report/found"
            className="inline-flex items-center gap-2 bg-teal-500 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-teal-600 transition-colors"
          >
            <Package size={15} />
            I Found Something
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
            <SlidersHorizontal size={13} />
            Filter
            {hasActiveFilters && (
              <span className="ml-auto inline-block w-2 h-2 rounded-full bg-yellow-400" />
            )}
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
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 border border-gray-200 rounded-lg py-2 transition-colors"
              >
                <X size={13} />
                Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* Items grid */}
        <section className="flex-1 min-w-0">

          {/* Success banner */}
          {claimSuccess && (
            <div className="mb-4 flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{claimSuccess}</span>
            </div>
          )}

          <p className="text-xs text-gray-400 font-semibold mb-4">
            {loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
          </p>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 size={28} className="text-gray-400 animate-spin" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center py-20 gap-2">
              <AlertCircle size={32} className="text-gray-400" />
              <p className="text-sm font-semibold text-gray-600">{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center py-20 gap-3">
              {activeTab === 'found'
                ? <Package size={40} className="text-gray-300" strokeWidth={1.25} />
                : <Search  size={40} className="text-gray-300" strokeWidth={1.25} />
              }
              <p className="text-sm font-semibold text-gray-600">No {activeTab} items yet</p>
              <p className="text-xs text-gray-400">
                {hasActiveFilters ? 'Try adjusting your filters.' : 'Nothing has been reported yet.'}
              </p>
            </div>
          )}

          {/* Grid */}
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

      {/* Claim Modal */}
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