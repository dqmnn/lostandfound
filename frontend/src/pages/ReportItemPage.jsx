import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportLostItem, reportFoundItem } from '../api/items';
import Navbar from '../components/Navbar';

const CATEGORIES = [
  'Electronics',
  'Light Electronics',
  'ID/Cards',
  'Accessories',
  'Clothing',
  'Books',
  'Stationery',
  'Other',
];

const LOCATIONS = [
  'Main Library', 'Science Block', 'Cafeteria', 'Sports Complex',
  'Admin Block', 'Lecture Hall', 'Student Centre', 'Parking Lot', 'Other',
];

// Minimum reward amounts (KES) per category
const REWARD_BANDS = {
  'Electronics':       { min: 500 },
  'Light Electronics': { min: 200 },
  'ID/Cards':          { min: 100 },
  'Accessories':       { min: 150 },
  'Clothing':          { min: 100 },
  'Books':             { min: 100 },
  'Stationery':        { min: 50  },
  'Other':             { min: 50  },
};

// Category descriptions shown below the select
const CATEGORY_INFO = {
  'Electronics':       { emoji: '💻', examples: 'Laptops, tablets, smartphones, cameras' },
  'Light Electronics': { emoji: '🎧', examples: 'Earphones, chargers, calculators, flash disks, power banks' },
  'ID/Cards':          { emoji: '🪪', examples: 'Student IDs, national IDs, ATM/bank cards, library cards' },
  'Accessories':       { emoji: '👜', examples: 'Bags, watches, jewellery, sunglasses, belts' },
  'Clothing':          { emoji: '👕', examples: 'Jackets, hoodies, shoes, scarves, caps' },
  'Books':             { emoji: '📚', examples: 'Textbooks, notebooks, novels, course files' },
  'Stationery':        { emoji: '✏️', examples: 'Pens, rulers, geometry sets, staplers, files' },
  'Other':             { emoji: '📦', examples: 'Anything that does not fit the above categories' },
};

export default function ReportItemPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const isLost   = type === 'lost';

  const [form, setForm] = useState({
    title:              '',
    category:           '',
    locationGeneral:    '',
    photo:              '',
    rewardAmount:       '',
    locationExact:      '',
    privateDescription: '',
    privatePhoto:       '',
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  if (type !== 'lost' && type !== 'found') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-3">Invalid report type.</p>
          <Link to="/feed" className="text-blue-600 text-sm font-semibold hover:underline">← Back to Feed</Link>
        </div>
      </div>
    );
  }

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };

      // When category changes on a lost report, auto-bump reward up to
      // the new minimum if the field is empty or currently below it.
      if (name === 'category' && isLost) {
        const band = REWARD_BANDS[value];
        if (band && (prev.rewardAmount === '' || Number(prev.rewardAmount) < band.min)) {
          updated.rewardAmount = String(band.min);
        }
      }

      return updated;
    });
  };

  // Derived: is the entered reward below the category minimum?
  const activeBand   = REWARD_BANDS[form.category];
  const rewardTooLow = isLost
    && activeBand
    && form.rewardAmount !== ''
    && Number(form.rewardAmount) < activeBand.min;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!form.title.trim())    return setError('Title is required.');
    if (!form.category)        return setError('Please select a category.');
    if (!form.locationGeneral) return setError('Please select a general location.');
    if (isLost && form.rewardAmount === '') return setError('Please enter a reward amount.');

    // Reward band enforcement
    if (isLost && activeBand && Number(form.rewardAmount) < activeBand.min) {
      return setError(
        `Minimum reward for ${form.category} is KES ${activeBand.min.toLocaleString()}.`
      );
    }

    setLoading(true);
    try {
      const payload = {
        title:              form.title.trim(),
        category:           form.category,
        locationGeneral:    form.locationGeneral,
        photo:              form.photo.trim(),
        locationExact:      form.locationExact.trim(),
        privateDescription: form.privateDescription.trim(),
        privatePhoto:       form.privatePhoto.trim(),
      };
      if (isLost) payload.rewardAmount = Number(form.rewardAmount) || 0;

      isLost ? await reportLostItem(payload) : await reportFoundItem(payload);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-10">

        {/* Type banner */}
        <div className={`rounded-2xl border p-4 mb-8 flex items-start gap-3 ${
          isLost ? 'bg-rose-50 border-rose-200' : 'bg-teal-50 border-teal-200'
        }`}>
          <span className="text-2xl">{isLost ? '🔎' : '📦'}</span>
          <div>
            <p className={`text-sm font-bold mb-0.5 ${isLost ? 'text-rose-700' : 'text-teal-700'}`}>
              {isLost ? 'Lost Item Report' : 'Found Item Report'}
            </p>
            <p className="text-xs text-gray-500">
              {isLost
                ? 'Public fields appear on the feed. Private fields are only shown to admins during verification.'
                : 'Public fields appear on the feed so owners can recognise their item. Private details help admins verify claims.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-6">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* ── Public section ───────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Public Information — visible on the Global Feed
              </p>
            </div>

            <div className="flex flex-col gap-4">

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Title <span className="text-yellow-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder={isLost ? 'e.g. Black Laptop Bag' : 'e.g. Found ID Card'}
                  maxLength={80}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="text-xs text-gray-400 mt-1 italic">
                  Keep it generic — no serial numbers or personal info here.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">

                {/* Category */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Category <span className="text-yellow-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  {/* Category description — shown once a category is picked */}
                  {form.category && CATEGORY_INFO[form.category] && (
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                      {CATEGORY_INFO[form.category].emoji}{' '}
                      {CATEGORY_INFO[form.category].examples}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    General Location <span className="text-yellow-500">*</span>
                  </label>
                  <select
                    name="locationGeneral"
                    value={form.locationGeneral}
                    onChange={handleChange}
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Select…</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Generic Photo URL
                </label>
                <input
                  type="url"
                  name="photo"
                  value={form.photo}
                  onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="text-xs text-gray-400 mt-1 italic">
                  A general photo only — do not reveal identifying marks.
                </p>
              </div>

              {/* Reward Amount — lost items only */}
              {isLost && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Reward Amount (KES) <span className="text-yellow-500">*</span>
                  </label>

                  <input
                    type="number"
                    name="rewardAmount"
                    value={form.rewardAmount}
                    onChange={handleChange}
                    placeholder={activeBand ? `Min. KES ${activeBand.min}` : 'Select a category first'}
                    min={activeBand ? activeBand.min : 0}
                    className={`w-full text-sm border rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                      rewardTooLow
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-blue-300'
                    }`}
                  />

                  {/* State 1: no category selected yet */}
                  {!form.category && (
                    <p className="text-xs text-gray-400 mt-1.5 italic">
                      Select a category above to see the minimum reward.
                    </p>
                  )}

                  {/* State 2: category selected, reward is valid — show the minimum as a quiet hint */}
                  {activeBand && !rewardTooLow && form.rewardAmount !== '' && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <span>🏆</span>
                      Minimum for{' '}
                      <strong className="text-gray-500 font-semibold">{form.category}</strong>:
                      KES {activeBand.min.toLocaleString()}
                    </p>
                  )}

                  {/* State 3: category selected, field empty — show the minimum as a nudge */}
                  {activeBand && form.rewardAmount === '' && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <span>🏆</span>
                      Minimum reward for{' '}
                      <strong className="font-semibold">{form.category}</strong>
                      {' '}is KES {activeBand.min.toLocaleString()}.
                    </p>
                  )}

                  {/* State 4: reward entered is below the minimum — red warning */}
                  {rewardTooLow && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <span>⚠</span>
                      Minimum reward for{' '}
                      <strong className="font-semibold">{form.category}</strong>
                      {' '}is KES {activeBand.min.toLocaleString()}.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Private section ───────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Private Details — admin eyes only
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-xs text-purple-700 mb-4">
              🔒 Never shown publicly. Admins use this to verify ownership claims before approving them.
            </div>

            <div className="flex flex-col gap-4">

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Exact Location {isLost ? 'Lost' : 'Found'}
                </label>
                <input
                  type="text"
                  name="locationExact"
                  value={form.locationExact}
                  onChange={handleChange}
                  placeholder={isLost
                    ? 'e.g. 2nd floor, desk near the window'
                    : 'e.g. Left on seat 14B in Lecture Hall 3'}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Identifying Details
                </label>
                <textarea
                  name="privateDescription"
                  value={form.privateDescription}
                  onChange={handleChange}
                  rows={3}
                  placeholder={isLost
                    ? 'Serial number, IMEI, distinguishing marks, what was inside, etc.'
                    : 'Any details that would help verify ownership — contents, marks noticed, etc.'}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Private Photo URL
                </label>
                <input
                  type="url"
                  name="privatePhoto"
                  value={form.privatePhoto}
                  onChange={handleChange}
                  placeholder="https://example.com/private-closeup.jpg"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="text-xs text-gray-400 mt-1 italic">
                  Close-up showing identifying marks — kept private.
                </p>
              </div>
            </div>
          </div>

          {/* ── Submit ───────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading || (isLost && !!rewardTooLow)}
            className={`w-full text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isLost ? 'bg-rose-500 hover:bg-rose-600' : 'bg-teal-500 hover:bg-teal-600'
            }`}
          >
            {loading
              ? 'Submitting…'
              : isLost
                ? '✕ Submit Lost Item Report'
                : '✓ Submit Found Item Report'}
          </button>

        </form>
      </main>
    </div>
  );
}