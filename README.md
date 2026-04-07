# TNS Arm Wrestling — Website v2
**Pune's First Arm Wrestling Club**

---

## 📁 File Structure

```
tns2ap-v2/
├── index.html          ← Homepage
├── training.html       ← Training programs + UPI payment
├── events.html         ← Events + UPI payment registration
├── community.html      ← Reddit-style community feed
├── tnarmy.html         ← TNS Army page
├── auth.html           ← Sign In / Register
├── profile.html        ← User profile, payment history, receipts
├── system-panel.html   ← Admin panel (coach/admin login only)
├── privacy.html        ← Privacy policy
├── terms.html          ← Terms of use
│
├── backend.js          ← localStorage backend (works offline, no server needed)
├── firebase-backend.js ← Firebase backend (real-time, for production)
│
├── TNS-Logo-6.png      ← Logo
├── TNS-Arm-wrestling-*.jpg ← Gallery images
└── README.md           ← This file
```

---

## 🚀 Quick Start (Run Locally)

1. Extract the zip
2. Open `index.html` in any browser
3. That's it — no server needed for the localStorage version

**Test credentials:**
- Coach/Admin: `tns_coach` / `tns123`
- Elite user: `iron_rahul` / `tns123`
- Pro user: `priya_d` / `tns123`

---

## 🌐 Hosting on Your Domain (tnsarmwrestling.com)

### Option A — Static Hosting (Netlify, Vercel, GitHub Pages)
1. Upload all files to [netlify.com](https://netlify.com) (drag & drop)
2. Set custom domain to `tnsarmwrestling.com`
3. Done — free SSL, free hosting

### Option B — cPanel / Traditional Hosting
1. Log into cPanel → File Manager
2. Navigate to `public_html`
3. Upload all files (not the folder, just the contents)
4. Visit your domain — it works

### Option C — Cloudflare Pages
1. Push files to GitHub
2. Connect repo at pages.cloudflare.com
3. Set domain → instant global CDN

---

## 🔥 Switch to Firebase (Live Community)

The localStorage backend works great for testing, but community posts
are device-specific. For real cross-user live posts, use Firebase.

### Step 1 — Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add Project** → name it "tns-arm-wrestling"
3. Disable Google Analytics (optional) → Create Project

### Step 2 — Enable Services
In Firebase Console:
- **Authentication** → Sign-in method → Email/Password → Enable
- **Firestore Database** → Create database → Start in **test mode** (change rules before going live)
- **Storage** → Get started → Test mode

### Step 3 — Get Config
- Project Settings (gear icon) → Your apps → Web app → Register
- Copy the `firebaseConfig` object

### Step 4 — Update firebase-backend.js
Open `firebase-backend.js`, find this section and fill in your values:
```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",           // ← paste your values
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

### Step 5 — Add Firebase Scripts to Each HTML Page
In `<head>` of every HTML file, add BEFORE `backend.js`:
```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>
```

### Step 6 — Replace backend.js with firebase-backend.js
On every HTML file, change:
```html
<script src="backend.js"></script>
```
To:
```html
<script src="firebase-backend.js"></script>
```

### Step 7 — Firestore Security Rules
In Firebase Console → Firestore → Rules, paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all profiles, write only their own
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    // Posts: anyone can read, logged-in can create, author/admin can delete
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.authorId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.level in ['coach','admin']);
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow delete: if request.auth != null &&
          (resource.data.authorId == request.auth.uid ||
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.level in ['coach','admin']);
      }
    }
    match /votes/{voteId} { allow read, write: if request.auth != null; }
    match /bookmarks/{bId} { allow read, write: if request.auth != null; }
    match /follows/{fId} { allow read, write: if request.auth != null; }
    match /transactions/{tId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.level in ['coach','admin']);
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /registrations/{rId} { allow read, write: if request.auth != null; }
    match /reports/{rId} { allow read, write: if request.auth != null; }
    match /config/{doc} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.level in ['coach','admin'];
    }
  }
}
```

---

## 💳 Payment Gateway Setup (Razorpay)

Razorpay is the best payment gateway for India — supports UPI, cards, net banking.

### Step 1 — Create Razorpay Account
1. Go to [razorpay.com](https://razorpay.com) → Sign Up
2. Complete KYC with your business documents
3. Dashboard → Settings → API Keys → Generate Test Key

### Step 2 — Add Razorpay Script
In each page's `<head>`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Step 3 — Update Key in firebase-backend.js
```javascript
const PAYMENT_CONFIG = {
  razorpayKeyId: "rzp_live_XXXXXXXXXXXXXXXX", // ← your live key
  ...
};
```

### Step 4 — Use Razorpay in Payment Buttons
Replace the manual UPI modal with:
```javascript
const txnRes = await TNS_DB.createTransaction({
  type: 'training',
  itemName: 'Beginner Program',
  itemId: 'beginner_program',
  amount: 1500
});

TNS_DB.openRazorpayPayment({
  txnId: txnRes.txn.id,
  amount: 1500,
  itemName: 'Beginner Program',
  onSuccess: (response) => {
    // Payment done! Show success.
    window.location.href = 'profile.html?tab=history';
  },
  onFail: () => {
    alert('Payment cancelled');
  }
});
```

### Test Cards (in test mode)
- Card: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits
- UPI: `success@razorpay`

---

## 👤 Profile Page

The profile page (`profile.html`) has:
- Profile picture upload (crops to circle automatically)
- Bio, city, weight class, hand, Instagram/YouTube
- XP progress bar with level milestones
- All my posts
- Payment history + downloadable receipt
- Password change

**URL Parameters:**
- `profile.html` — Default overview tab
- `profile.html?tab=history` — Go directly to payment history
- `profile.html?tab=edit` — Go directly to edit profile

---

## 🔧 Admin Panel

Visit `system-panel.html`

**Login:** Use your coach or admin account credentials.

**Features:**
- Dashboard with stats + charts
- Users table — change level, ban/unban
- Posts — pin/unpin, delete
- Payments — confirm pending, export CSV
- Reports — review flagged content
- Settings — UPI ID, admin PIN

**To make someone admin:**
In the Users tab, change their level to "Coach" or "Admin"

---

## 🎨 Color Theme

The site uses a consistent dark theme with yellow accent:

```css
--red:    #f5c518;  /* YELLOW — primary accent (buttons, highlights) */
--red2:   #ffd84d;  /* lighter yellow — hover state */
--dark:   #08080f;  /* page background */
--card:   #111118;  /* card background */
--card2:  #18181f;  /* secondary card */
--text:   #f0f0f8;  /* main text */
--muted:  #7a7a9a;  /* secondary text */
--border: rgba(255,255,255,0.07);
--font:   'Outfit', sans-serif;
--display:'Teko', sans-serif;
```

> Note: The variable is called `--red` for historical reasons but it's actually yellow (#f5c518).

---

## 📱 Mobile Design

- Nav collapses to hamburger menu on screens < 768px
- Community page has bottom navigation bar on mobile
- All cards stack vertically on mobile
- Profile page is fully responsive
- Payment modals are mobile-optimized

---

## ❓ Common Issues

**Q: Community posts reset when I open in another browser**
A: That's localStorage — it's per-device. Switch to Firebase for shared data.

**Q: Profile picture not saving**
A: Works in localStorage. In Firebase version, requires Storage to be enabled.

**Q: Nav appears twice**
A: Each page now has exactly one nav. If you see it twice, open the HTML and search for duplicate `<nav` tags and remove one.

**Q: Payment shows UPI manual mode**
A: Razorpay is not set up yet. UPI manual mode works fine — users pay and enter transaction ID. You confirm in Admin → Payments.

**Q: Admin panel won't let me in**
A: You need a user account with level "coach" or "admin". Default test: `tns_coach` / `tns123`

---

## 📞 Need Help?

Raise issues at your GitHub repo or WhatsApp: +91 73878 78771

---

*Built for TNS Arm Wrestling, Pune. Est. 2017.*
