```markdown
# Smart Campus Lost & Found — Current State

> Last updated after Stage 2 completion. Ready to begin Stage 3.

---

## 1. Current Progress

### ✅ Stage 1 — Auth & Roles (COMPLETE)
- User registration, login, JWT generation, and password hashing (bcryptjs).
- Role-based access (`user` | `admin`) and `isBanned` enforcement.
- Frontend AuthContext, ProtectedRoute, and Axios interceptor established.

### ✅ Stage 2 — Items CRUD (COMPLETE)
- **Unified Item Model:** Created `Item.js` handling both lost and found items via a `type` enum, replacing the dual-model approach. Strict separation of public/private fields.
- **Backend Routes & Controllers:** `/api/items` established with full CRUD, auth middleware, and query filtering (category, location, date).
- **Frontend Pages:** 
  - `GlobalFeedPage.jsx`: Tabbed interface (Lost/Found), sticky filter sidebar, color-coded item cards (teal for found, rose for lost).
  - `ReportItemPage.jsx`: Single dynamic form handling both types via URL params, with explicit UI divisions for private vs. public data.
- **Navigation:** Master `Navbar.jsx` implemented with dynamic role badges and conditional rendering.

### 🔜 Stage 3 — Private Dashboard (NEXT)
- My Lost Reports & My Found Reports tabs.
- My Active Claims tab.
- Admin Panel tab (conditional render for admins only).

### ⬜ Remaining Stages
- Stage 4 — Claims & Admin Review
- Stage 5 — OTP Handshake (Mock Payments)
- Stage 6 — M-Pesa Daraja Integration (STK Push + B2C)

---

## 2. Current File Structure

```text
smart-lost-and-found/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── itemController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── adminMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   └── Item.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── itemRoutes.js
│   └── server.js
└── frontend/
    └── src/
        ├── api/
        │   ├── axios.js
        │   └── items.js
        ├── components/
        │   ├── Navbar.jsx
        │   └── ProtectedRoute.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── GlobalFeedPage.jsx
        │   ├── ReportItemPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   └── DashboardPage.jsx
        ├── App.jsx
        └── main.jsx

```

---

## 3. Finalized Schemas & Routes

### Item Schema (`backend/models/Item.js`)

*Note: Uses a single schema for both Lost and Found.*

```javascript
{
  type: { type: String, enum: ['lost', 'found'], required: true },
  postedBy: { type: ObjectId, ref: 'User', required: true },
  
  // Public
  title: { type: String, required: true },
  category: { type: String, enum: ['Electronics', 'ID/Cards', 'Clothing', 'Books', 'Other'] },
  locationGeneral: { type: String, enum: ['Main Library', 'Science Block', 'Cafeteria', 'Sports Complex', 'Admin Block', 'Lecture Hall', 'Student Centre', 'Parking Lot', 'Other'] },
  dateReported: { type: Date, default: Date.now },
  photo: { type: String, default: '' },
  rewardAmount: { type: Number, default: 0 },
  
  // Private
  locationExact: { type: String, default: '' },
  privateDescription: { type: String, default: '' },
  privatePhoto: { type: String, default: '' },
  
  status: { type: String, enum: ['unclaimed', 'searching', 'pending_review', 'claim_pending', 'awaiting_payment', 'claim_approved', 'ready_for_handoff', 'awaiting_handoff', 'resolved', 'disputed'] },
  matchedItemId: { type: ObjectId, ref: 'Item', default: null }
} // timestamps: true

```

### Item Routes — `/api/items`

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/items` | Private | Create a new item (Lost or Found) |
| GET | `/api/items` | Public | Get all items (Supports query filters: `type`, `category`, `locationGeneral`, `dateFrom`, `dateTo`) |
| GET | `/api/items/:id` | Public/Private | Get single item (Private fields stripped unless requested by owner/admin) |
| PUT | `/api/items/:id` | Private | Update item status/details |

---

## 4. Key Technical Decisions & Styling

* **Unified Item Schema:** Instead of separate `LostItem` and `FoundItem` models, a single `Item` model is used with a `type` enum. This drastically simplifies the `GlobalFeedPage` and API endpoints.
* **Privacy by Default:** Private fields (`locationExact`, `privateDescription`) are explicitly separated in the schema and forms. They are never rendered on the `GlobalFeedPage`.
* **Dynamic Forms:** `ReportItemPage.jsx` handles both types via the `:type` URL parameter, conditionally rendering the reward field only for lost items.
* **Styling (Tailwind v3):**
* Teal accents (`text-teal-600`) for Found items.
* Rose accents (`text-rose-500`) for Lost items.
* Role badges rendered dynamically in `Navbar.jsx` (Purple for Admin, Blue for User).



---

## 5. Handoff Notes

**For the next AI agent:**
Stage 1 and Stage 2 are 100% complete and functionally verified. Do not rewrite authentication or the base Item CRUD logic.

Your immediate task is to begin **Stage 3 — Private Dashboard**. You will need to build out `DashboardPage.jsx` to fetch and render items specific to the logged-in user (`req.user._id`), separated into distinct tabs (My Lost, My Found). Admins require an additional tab to view the system overview. Use the existing `api/items.js` patterns for your Axios requests.

```

```