```markdown
# Smart Campus Lost & Found — Current State

> Last updated after Stage 1 completion. Ready to begin Stage 2.

---

## 1. Current Progress

### ✅ Stage 1 — Auth & Roles (COMPLETE)
- User registration with input validation (express-validator)
- User login with JWT token generation
- Password hashing via bcryptjs pre-save hook (async, no `next` parameter)
- Role field (`user` | `admin`) — default is `user`, admin is manually promoted
- `isBanned` field supported and enforced on login and protected routes
- `protect` middleware — verifies JWT, attaches `req.user`, blocks banned users
- `adminOnly` middleware — blocks non-admin users from admin routes
- User management routes: getMe, getAllUsers, promoteToAdmin, banUser, unbanUser
- Frontend: Landing page, Login page, Register page, Dashboard placeholder
- Frontend: AuthContext (global auth state), ProtectedRoute (redirect guard)
- Frontend: Axios instance with JWT interceptor and global 401 handler
- Full local test confirmed: register → login → dashboard → logout all working

### 🔜 Stage 2 — Items CRUD (NEXT)
- Item model (Lost & Found)
- Post a Lost Item form
- Post a Found Item form
- Global Feed pages (Lost tab + Found tab)
- Search and filter by category, general location, date range

### ⬜ Remaining Stages
- Stage 3 — Private Dashboard (My Lost Reports, My Found Reports, My Active Claims, Admin Panel tab)
- Stage 4 — Claims & Admin Review
- Stage 5 — OTP Handshake (Mock Payments)
- Stage 6 — M-Pesa Daraja Integration (STK Push + B2C)

---

## 2. Current File Structure

```
smart-lost-and-found/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── adminMiddleware.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
└── README.md
```

---

## 3. Finalized Schemas & Routes

### User Schema (`backend/models/User.js`)

```js
{
  _id,
  name:         String, required, trimmed
  email:        String, required, unique, lowercase, trimmed
  passwordHash: String, required   // hashed by async pre-save hook (no `next`)
  phone:        String, required   // M-Pesa format: 2547XXXXXXXX
  role:         String, enum: ['user', 'admin'], default: 'user'
  isBanned:     Boolean, default: false
  createdAt:    Date  (timestamps: true)
  updatedAt:    Date  (timestamps: true)
}
```

**Instance method:** `user.matchPassword(plainPassword)` — returns boolean via bcrypt.compare

**Pre-save hook:** Hashes `passwordHash` field only when it is modified. Uses `async function()` with NO `next` parameter — Mongoose resolves via the promise.

---

### Auth Routes — `/api/auth`

| Method | Endpoint            | Access  | Description                        |
|--------|---------------------|---------|------------------------------------|
| POST   | `/api/auth/register` | Public  | Register new user, returns JWT + user object |
| POST   | `/api/auth/login`    | Public  | Login, returns JWT + user object   |

**Register request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@university.ac.ke",
  "password": "password123",
  "phone": "254712345678"
}
```

**Login request body:**
```json
{
  "email": "jane@university.ac.ke",
  "password": "password123"
}
```

**Both return:**
```json
{
  "token": "<jwt>",
  "user": {
    "_id": "...",
    "name": "Jane Doe",
    "email": "jane@university.ac.ke",
    "phone": "254712345678",
    "role": "user"
  }
}
```

---

### User Routes — `/api/users`

| Method | Endpoint                  | Access         | Description                  |
|--------|---------------------------|----------------|------------------------------|
| GET    | `/api/users/me`            | Private        | Get logged-in user's profile |
| GET    | `/api/users`               | Private/Admin  | Get all users                |
| PUT    | `/api/users/promote/:id`   | Private/Admin  | Promote user to admin        |
| PUT    | `/api/users/ban/:id`       | Private/Admin  | Ban a user                   |
| PUT    | `/api/users/unban/:id`     | Private/Admin  | Unban a user                 |

**Auth header format for all protected routes:**
```
Authorization: Bearer <jwt_token>
```

---

### Environment Variables

**`backend/.env`**
```
PORT=5000
MONGO_URI=mongodb+srv://<your-atlas-uri>
JWT_SECRET=<your_long_random_secret>
JWT_EXPIRES_IN=7d
```

**`frontend/.env`**
```
VITE_API_URL=http://localhost:5000
```

---

## 4. Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Backend module system | **CommonJS (`require`/`module.exports`)** | Consistency — do NOT mix with ES module `import/export` syntax in backend files |
| Frontend styling | **Tailwind CSS v3** | Utility-first, no inline style objects anywhere in frontend |
| React file extensions | **`.jsx` for all React components and pages** | Strict convention — never `.js` for files containing JSX |
| React setup | **Vite + React** | Faster dev server than CRA |
| Auth storage | **localStorage** (`token` + `user` keys) | Simple for campus project scope; token auto-attached via Axios interceptor |
| Password field naming | **`passwordHash`** | The schema field is named `passwordHash` — the pre-save hook hashes the value before storing. Always pass the plain password to `User.create({ passwordHash: plainPassword })` |
| Mongoose async middleware | **No `next` in async hooks** | Using `async function()` without `next` — Mongoose uses the resolved/rejected promise. Calling `next()` inside an async hook throws `TypeError: next is not a function` |
| Admin access | **Role field on User model** | No separate admin login — admin is a `user` with `role: 'admin'`, promoted manually via API |
| JWT expiry | **7 days** | Reasonable for a campus project; no refresh token implemented yet |

---

## 5. Handoff Notes

**For the next AI agent continuing this project:**

Stage 1 is fully complete and tested. The backend and frontend are both running locally without errors. The next task is **Stage 2 — Items CRUD**, which covers:

1. Creating the `Item` Mongoose model (see schema below from the master blueprint)
2. Building POST routes to report a Lost item and a Found item
3. Building GET routes for the Global Feed (all found items, all lost items) with search/filter support (category, general location, date range)
4. Building the frontend forms for reporting items and the Global Feed page with Lost/Found tabs

**Item schema fields to implement (from blueprint):**
- `type`: `"lost"` | `"found"`
- `postedBy`: User `_id`
- Public: `title`, `category`, `locationGeneral`, `dateReported`, `photo`, `rewardAmount`
- Private: `locationExact`, `privateDescription`, `privatePhoto`
- `status`: for found items starts as `"unclaimed"`, for lost items starts as `"searching"`
- `matchedItemId`: reference to paired item (null initially)
- `timestamps`

**Categories (from blueprint):** `"Electronics"` | `"ID/Cards"` | `"Clothing"` | `"Books"` | `"Other"`

**General locations (from blueprint):** `"Main Library"` | `"Science Block"` | `"Cafeteria"` | other campus locations

The master blueprint document (`smart_lost_and_found_blueprint.md`) contains the full system reference and must be reviewed before continuing.
```