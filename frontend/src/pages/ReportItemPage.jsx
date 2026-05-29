/* import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportLostItem, reportFoundItem } from '../api/items';

const CATEGORIES = ['Electronics', 'ID/Cards', 'Clothing', 'Books', 'Other'];
const LOCATIONS  = [
  'Main Library', 'Science Block', 'Cafeteria', 'Sports Complex',
  'Admin Block', 'Lecture Hall', 'Student Centre', 'Parking Lot', 'Other',
];

export default function ReportItemPage() {
  const { type }  = useParams();
  const navigate  = useNavigate();
  const isLost    = type === 'lost';

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

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!form.title.trim())           return setError('Title is required.');
    if (!form.category)               return setError('Please select a category.');
    if (!form.locationGeneral)        return setError('Please select a general location.');
    if (isLost && form.rewardAmount === '') return setError('Please enter a reward amount (can be 0).');

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

      {/* Header 
      <header className="bg-white shadow-sm px-8 py-4 flex items-center gap-4">
        <Link
          to="/feed"
          className="text-sm font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back to Feed
        </Link>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-bold text-gray-800">
          {isLost ? 'Report a Lost Item' : 'Report a Found Item'}
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">

        {/* Type banner 
        <div className={`rounded-2xl border p-4 mb-8 flex items-start gap-3 ${
          isLost
            ? 'bg-rose-50 border-rose-200'
            : 'bg-teal-50 border-teal-200'
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

          {/* Public section 
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Public Information — visible on the Global Feed
              </p>
            </div>

            <div className="flex flex-col gap-4">

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
                <p className="text-xs text-gray-400 mt-1 italic">Keep it generic — no serial numbers or personal info here.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                </div>

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

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Generic Photo URL</label>
                <input
                  type="url"
                  name="photo"
                  value={form.photo}
                  onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="text-xs text-gray-400 mt-1 italic">A general photo only — do not reveal identifying marks.</p>
              </div>

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
                    placeholder="e.g. 500 — enter 0 for no reward"
                    min="0"
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Private section 
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
                  placeholder={isLost ? 'e.g. 2nd floor, desk near the window' : 'e.g. Left on seat 14B in Lecture Hall 3'}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Identifying Details</label>
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
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Private Photo URL</label>
                <input
                  type="url"
                  name="privatePhoto"
                  value={form.privatePhoto}
                  onChange={handleChange}
                  placeholder="https://example.com/private-closeup.jpg"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="text-xs text-gray-400 mt-1 italic">Close-up showing identifying marks — kept private.</p>
              </div>
            </div>
          </div>

          {/* Submit 
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isLost
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'bg-teal-500 hover:bg-teal-600'
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
} */




import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportLostItem, reportFoundItem } from '../api/items';
import Navbar from '../components/Navbar';

const CATEGORIES = ['Electronics', 'ID/Cards', 'Clothing', 'Books', 'Other'];
const LOCATIONS  = [
  'Main Library', 'Science Block', 'Cafeteria', 'Sports Complex',
  'Admin Block', 'Lecture Hall', 'Student Centre', 'Parking Lot', 'Other',
];

export default function ReportItemPage() {
  const { type }  = useParams();
  const navigate  = useNavigate();
  const isLost    = type === 'lost';

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

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!form.title.trim())           return setError('Title is required.');
    if (!form.category)               return setError('Please select a category.');
    if (!form.locationGeneral)        return setError('Please select a general location.');
    if (isLost && form.rewardAmount === '') return setError('Please enter a reward amount (can be 0).');

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
          isLost
            ? 'bg-rose-50 border-rose-200'
            : 'bg-teal-50 border-teal-200'
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

          {/* Public section */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Public Information — visible on the Global Feed
              </p>
            </div>

            <div className="flex flex-col gap-4">

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
                <p className="text-xs text-gray-400 mt-1 italic">Keep it generic — no serial numbers or personal info here.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                </div>

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

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Generic Photo URL</label>
                <input
                  type="url"
                  name="photo"
                  value={form.photo}
                  onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="text-xs text-gray-400 mt-1 italic">A general photo only — do not reveal identifying marks.</p>
              </div>

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
                    placeholder="e.g. 500 — enter 0 for no reward"
                    min="0"
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Private section */}
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
                  placeholder={isLost ? 'e.g. 2nd floor, desk near the window' : 'e.g. Left on seat 14B in Lecture Hall 3'}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Identifying Details</label>
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
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Private Photo URL</label>
                <input
                  type="url"
                  name="privatePhoto"
                  value={form.privatePhoto}
                  onChange={handleChange}
                  placeholder="https://example.com/private-closeup.jpg"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="text-xs text-gray-400 mt-1 italic">Close-up showing identifying marks — kept private.</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isLost
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'bg-teal-500 hover:bg-teal-600'
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