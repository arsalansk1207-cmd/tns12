// ═══════════════════════════════════════════════════════════════════
// TNS ARM WRESTLING — FIREBASE BACKEND
// Drop-in replacement for backend.js
// 
// SETUP:
//  1. Create Firebase project at console.firebase.google.com
//  2. Enable: Authentication (Email/Password), Firestore, Storage
//  3. Copy your firebaseConfig below
//  4. Replace <script src="backend.js"> with <script src="firebase-backend.js"> on all pages
//  5. Add Firebase SDK scripts to each HTML page (see INSTALL INSTRUCTIONS below)
//
// INSTALL IN EACH HTML <head>:
//   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>
//   <script src="firebase-backend.js"></script>
// ═══════════════════════════════════════════════════════════════════

// ─── YOUR FIREBASE CONFIG (replace with yours) ────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBxrHEPoSLZZG3vPQ_u3vCeps41I7-Ju4I",
  authDomain: "tns-armwrestling.firebaseapp.com",
  databaseURL: "https://tns-armwrestling-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tns-armwrestling",
  storageBucket: "tns-armwrestling.firebasestorage.app",
  messagingSenderId: "954501685834",
  appId: "1:954501685834:web:bfb4cb63c16d33d32a7cb3"
};

// ─── RAZORPAY / PAYMENT GATEWAY CONFIG ───────────────────────────
const PAYMENT_CONFIG = {
  // Razorpay (recommended for India):
  // 1. Sign up at razorpay.com
  // 2. Get your Key ID from Dashboard > Settings > API Keys
  razorpayKeyId: "rzp_test_XXXXXXXXXXXXXXXX", // Replace with your key
  
  // UPI fallback (manual confirmation until gateway set up):
  upiId:   "tnsarmwrestling@upi",
  upiName: "TNS Arm Wrestling",
  
  // Currency
  currency: "INR",
};

// ─── INIT ─────────────────────────────────────────────────────────
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();
const storage = firebase.storage();

// ─── SESSION CACHE (to avoid extra Firestore reads) ───────────────
let _currentUserCache = null;
let _sessionReady = false;

auth.onAuthStateChanged(async (firebaseUser) => {
  if (firebaseUser) {
    const doc = await db.collection('users').doc(firebaseUser.uid).get();
    _currentUserCache = doc.exists ? { id: firebaseUser.uid, ...doc.data() } : null;
  } else {
    _currentUserCache = null;
  }
  _sessionReady = true;
  // Dispatch event so pages can react
  document.dispatchEvent(new Event('tns-auth-ready'));
});

function waitReady() {
  if (_sessionReady) return Promise.resolve();
  return new Promise(res => document.addEventListener('tns-auth-ready', res, { once: true }));
}

// ═══════════════════════════════════════════════════════════════════
// TNS_DB — Same API as backend.js, Firebase-powered
// ═══════════════════════════════════════════════════════════════════
const TNS_DB = (function () {

  // ─── AUTH ──────────────────────────────────────────────────────
  function getSession() {
    return auth.currentUser ? { userId: auth.currentUser.uid } : null;
  }

  function getCurrentUser() {
    return _currentUserCache;
  }

  async function register(data) {
    try {
      const cred = await auth.createUserWithEmailAndPassword(data.email, data.password);
      const uid = cred.user.uid;
      const initials = (data.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const user = {
        id: uid,
        name: data.name,
        username: data.username,
        email: data.email,
        weight: data.weight || '',
        hand: data.hand || 'Right',
        city: data.city || 'Pune',
        phone: data.phone || '',
        level: 'beginner',
        xp: 0,
        bio: '',
        avatar: initials,
        badge: 'beginner',
        joined: new Date().toISOString(),
        verified: false,
        profilePic: null,
        postCount: 0,
        winCount: 0,
      };
      // Check username uniqueness
      const existing = await db.collection('users').where('username', '==', data.username).get();
      if (!existing.empty) {
        await cred.user.delete();
        return { ok: false, error: 'Username already taken.' };
      }
      await db.collection('users').doc(uid).set(user);
      _currentUserCache = user;
      return { ok: true, user };
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') return { ok: false, error: 'Email already registered.' };
      return { ok: false, error: e.message };
    }
  }

  async function login(usernameOrEmail, password) {
    try {
      let email = usernameOrEmail;
      // If not email format, look up by username
      if (!usernameOrEmail.includes('@')) {
        const snap = await db.collection('users').where('username', '==', usernameOrEmail).get();
        if (snap.empty) return { ok: false, error: 'User not found.' };
        email = snap.docs[0].data().email;
      }
      const cred = await auth.signInWithEmailAndPassword(email, password);
      const doc = await db.collection('users').doc(cred.user.uid).get();
      const user = { id: cred.user.uid, ...doc.data() };
      if (user.banned) { await auth.signOut(); return { ok: false, error: 'Account suspended.' }; }
      _currentUserCache = user;
      return { ok: true, user };
    } catch (e) {
      return { ok: false, error: 'Invalid username or password.' };
    }
  }

  async function loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      const uid = result.user.uid;
      const email = result.user.email;
      const name = result.user.displayName || email.split('@')[0];
      
      // Check if user exists in Firestore
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) {
        _currentUserCache = { id: uid, ...doc.data() };
        return { ok: true, user: _currentUserCache };
      }
      
      // Create new user from Google account
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const username = name.replace(/\s+/g, '').toLowerCase() + '_' + Math.random().toString(36).slice(2, 8);
      
      const user = {
        id: uid,
        name: name,
        username: username,
        email: email,
        weight: '',
        hand: 'Right',
        city: 'Pune',
        phone: result.user.phoneNumber || '',
        level: 'beginner',
        xp: 0,
        bio: '',
        avatar: initials,
        badge: 'beginner',
        joined: new Date().toISOString(),
        verified: false,
        profilePic: result.user.photoURL || null,
        postCount: 0,
        winCount: 0,
      };
      
      await db.collection('users').doc(uid).set(user);
      _currentUserCache = user;
      return { ok: true, user, isNewUser: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async function logout() {
    _currentUserCache = null;
    await auth.signOut();
  }

  async function updateProfile(data) {
    const user = getCurrentUser();
    if (!user) return { ok: false };
    const allowed = ['name', 'bio', 'city', 'weight', 'hand', 'phone', 'profilePic', 'avatar', 'instagram', 'youtube'];
    const update = {};
    allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k]; });
    await db.collection('users').doc(user.id).update(update);
    _currentUserCache = { ..._currentUserCache, ...update };
    return { ok: true, user: _currentUserCache };
  }

  async function uploadProfilePic(dataUrl) {
    const user = getCurrentUser();
    if (!user) return { ok: false };
    // Convert dataUrl to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ref = storage.ref(`avatars/${user.id}/profile.jpg`);
    await ref.put(blob);
    const url = await ref.getDownloadURL();
    await updateProfile({ profilePic: url });
    return { ok: true, url };
  }

  async function changePassword(oldPw, newPw) {
    const user = auth.currentUser;
    if (!user) return { ok: false };
    try {
      const cred = firebase.auth.EmailAuthProvider.credential(user.email, oldPw);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(newPw);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Current password is incorrect.' };
    }
  }

  async function getUser(id) {
    if (_currentUserCache && _currentUserCache.id === id) return _currentUserCache;
    const doc = await db.collection('users').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async function getUserByUsername(username) {
    const snap = await db.collection('users').where('username', '==', username).limit(1).get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }

  async function getAllUsers() {
    const snap = await db.collection('users').orderBy('joined', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  function isAdmin() {
    const u = getCurrentUser();
    return u && (u.level === 'admin' || u.level === 'coach');
  }

  // ─── POSTS ─────────────────────────────────────────────────────
  async function getPosts(opts = {}) {
    let q = db.collection('posts');
    if (opts.category) q = q.where('category', '==', opts.category);
    if (opts.authorId) q = q.where('authorId', '==', opts.authorId);
    if (opts.sort === 'top') q = q.orderBy('votes', 'desc');
    else if (opts.sort === 'new') q = q.orderBy('ts', 'desc');
    else q = q.orderBy('ts', 'desc'); // default newest
    const snap = await q.limit(50).get();
    let posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (opts.search) {
      const s = opts.search.toLowerCase();
      posts = posts.filter(p => p.title.toLowerCase().includes(s) || (p.body || '').toLowerCase().includes(s));
    }
    // Pinned first
    posts.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return posts;
  }

  async function getPost(id) {
    const doc = await db.collection('posts').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async function createPost(data) {
    const user = getCurrentUser();
    if (!user) return { ok: false, error: 'Not logged in' };
    const post = {
      authorId: user.id,
      title: data.title,
      body: data.body || '',
      category: data.category || 'General',
      image: data.image || null,
      votes: 0,
      commentCount: 0,
      pinned: false,
      ts: new Date().toISOString(),
    };
    const ref = await db.collection('posts').add(post);
    // Update user stats
    await db.collection('users').doc(user.id).update({
      postCount: firebase.firestore.FieldValue.increment(1),
      xp: firebase.firestore.FieldValue.increment(10),
    });
    _currentUserCache = { ..._currentUserCache, postCount: (_currentUserCache.postCount || 0) + 1, xp: (_currentUserCache.xp || 0) + 10 };
    return { ok: true, post: { id: ref.id, ...post } };
  }

  async function deletePost(postId) {
    const user = getCurrentUser();
    if (!user) return { ok: false };
    const post = await getPost(postId);
    if (!post) return { ok: false };
    if (post.authorId !== user.id && !isAdmin()) return { ok: false };
    await db.collection('posts').doc(postId).delete();
    return { ok: true };
  }

  async function pinPost(postId, pinned) {
    if (!isAdmin()) return { ok: false };
    await db.collection('posts').doc(postId).update({ pinned });
    return { ok: true };
  }

  // ─── COMMENTS ──────────────────────────────────────────────────
  async function getComments(postId) {
    const snap = await db.collection('posts').doc(postId).collection('comments').orderBy('ts').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function addComment(postId, body) {
    const user = getCurrentUser();
    if (!user) return { ok: false, error: 'Not logged in' };
    const comment = { postId, authorId: user.id, body, votes: 0, ts: new Date().toISOString() };
    const ref = await db.collection('posts').doc(postId).collection('comments').add(comment);
    await db.collection('posts').doc(postId).update({ commentCount: firebase.firestore.FieldValue.increment(1) });
    await db.collection('users').doc(user.id).update({ xp: firebase.firestore.FieldValue.increment(2) });
    return { ok: true, comment: { id: ref.id, ...comment } };
  }

  async function deleteComment(commentId, postId) {
    const user = getCurrentUser();
    if (!user) return { ok: false };
    await db.collection('posts').doc(postId).collection('comments').doc(commentId).delete();
    await db.collection('posts').doc(postId).update({ commentCount: firebase.firestore.FieldValue.increment(-1) });
    return { ok: true };
  }

  // ─── VOTES ─────────────────────────────────────────────────────
  async function vote(type, id, dir) {
    const user = getCurrentUser();
    if (!user) return { ok: false };
    const voteRef = db.collection('votes').doc(`${type}_${id}_${user.id}`);
    const voteDoc = await voteRef.get();
    const collRef = type === 'post' ? db.collection('posts').doc(id) : db.collection('posts').doc('_').collection('comments').doc(id);
    
    if (voteDoc.exists) {
      const prev = voteDoc.data().dir;
      if (prev === dir) {
        await voteRef.delete();
        await collRef.update({ votes: firebase.firestore.FieldValue.increment(-dir) });
      } else {
        await voteRef.update({ dir });
        await collRef.update({ votes: firebase.firestore.FieldValue.increment(dir * 2) });
      }
    } else {
      await voteRef.set({ type, targetId: id, dir, userId: user.id, ts: new Date().toISOString() });
      await collRef.update({ votes: firebase.firestore.FieldValue.increment(dir) });
    }
    const updated = await collRef.get();
    return { ok: true, votes: updated.data().votes };
  }

  async function getVote(type, id) {
    const user = getCurrentUser();
    if (!user) return 0;
    const doc = await db.collection('votes').doc(`${type}_${id}_${user.id}`).get();
    return doc.exists ? doc.data().dir : 0;
  }

  // ─── BOOKMARKS ─────────────────────────────────────────────────
  async function toggleBookmark(postId) {
    const user = getCurrentUser();
    if (!user) return false;
    const ref = db.collection('bookmarks').doc(`${postId}_${user.id}`);
    const doc = await ref.get();
    if (doc.exists) { await ref.delete(); return false; }
    await ref.set({ postId, userId: user.id, ts: new Date().toISOString() });
    return true;
  }

  async function isBookmarked(postId) {
    const user = getCurrentUser();
    if (!user) return false;
    const doc = await db.collection('bookmarks').doc(`${postId}_${user.id}`).get();
    return doc.exists;
  }

  async function getBookmarkedPosts() {
    const user = getCurrentUser();
    if (!user) return [];
    const snap = await db.collection('bookmarks').where('userId', '==', user.id).get();
    const ids = snap.docs.map(d => d.data().postId);
    if (!ids.length) return [];
    const posts = await Promise.all(ids.map(id => getPost(id)));
    return posts.filter(Boolean);
  }

  // ─── FOLLOWS ───────────────────────────────────────────────────
  async function toggleFollow(targetId) {
    const user = getCurrentUser();
    if (!user || user.id === targetId) return false;
    const ref = db.collection('follows').doc(`${user.id}_${targetId}`);
    const doc = await ref.get();
    if (doc.exists) { await ref.delete(); return false; }
    await ref.set({ followerId: user.id, followingId: targetId, ts: new Date().toISOString() });
    return true;
  }

  async function isFollowing(targetId) {
    const user = getCurrentUser();
    if (!user) return false;
    const doc = await db.collection('follows').doc(`${user.id}_${targetId}`).get();
    return doc.exists;
  }

  async function getFollowerCount(userId) {
    const snap = await db.collection('follows').where('followingId', '==', userId).get();
    return snap.size;
  }

  async function getFollowingCount(userId) {
    const snap = await db.collection('follows').where('followerId', '==', userId).get();
    return snap.size;
  }

  async function getFollowingPosts() {
    const user = getCurrentUser();
    if (!user) return [];
    const snap = await db.collection('follows').where('followerId', '==', user.id).get();
    const ids = snap.docs.map(d => d.data().followingId);
    if (!ids.length) return [];
    const all = await getPosts({ sort: 'new' });
    return all.filter(p => ids.includes(p.authorId));
  }

  // ─── REPORTS ───────────────────────────────────────────────────
  async function reportContent(type, id, reason) {
    const user = getCurrentUser();
    await db.collection('reports').add({ type, targetId: id, reason, reporterId: user ? user.id : 'anon', ts: new Date().toISOString(), resolved: false });
    return { ok: true };
  }

  async function getReports() {
    const snap = await db.collection('reports').orderBy('ts', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function resolveReport(reportId) {
    await db.collection('reports').doc(reportId).update({ resolved: true });
    return { ok: true };
  }

  // ─── TRANSACTIONS / PAYMENT ────────────────────────────────────
  async function createTransaction(data) {
    const user = getCurrentUser();
    if (!user) return { ok: false, error: 'Not logged in' };
    const txn = {
      userId: user.id, userName: user.name, userEmail: user.email,
      type: data.type, itemName: data.itemName, itemId: data.itemId || null,
      amount: data.amount, currency: 'INR', upiRef: null, status: 'pending',
      ts: new Date().toISOString(), paidAt: null,
    };
    const ref = await db.collection('transactions').add(txn);
    return { ok: true, txn: { id: ref.id, ...txn } };
  }

  // ── RAZORPAY PAYMENT ──────────────────────────────────────────
  // Call this to open Razorpay checkout (requires Razorpay script loaded)
  // <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  async function openRazorpayPayment(opts) {
    // opts: { txnId, amount, itemName, onSuccess, onFail }
    const user = getCurrentUser();
    if (!user) return;
    
    // You would normally create an order on your server first.
    // For now this opens Razorpay directly — add server-side order creation for production.
    const options = {
      key: PAYMENT_CONFIG.razorpayKeyId,
      amount: opts.amount * 100, // Razorpay uses paise
      currency: 'INR',
      name: 'TNS Arm Wrestling',
      description: opts.itemName,
      image: 'TNS-Logo-6.png',
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone || '',
      },
      theme: { color: '#f5c518' },
      handler: async function (response) {
        // Payment successful
        await confirmPayment(opts.txnId, response.razorpay_payment_id);
        if (opts.onSuccess) opts.onSuccess(response);
      },
      modal: {
        ondismiss: function () { if (opts.onFail) opts.onFail(); }
      }
    };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) { if (opts.onFail) opts.onFail(response); });
    rzp.open();
  }

  async function confirmPayment(txnId, upiRef) {
    await db.collection('transactions').doc(txnId).update({
      status: 'paid', upiRef, paidAt: new Date().toISOString()
    });
    const txnDoc = await db.collection('transactions').doc(txnId).get();
    const txn = { id: txnId, ...txnDoc.data() };
    // Add registration
    if (txn.itemId) {
      await db.collection('registrations').add({
        userId: txn.userId, itemId: txn.itemId, type: txn.type, txnId, ts: new Date().toISOString()
      });
    }
    return { ok: true, txn };
  }

  async function getUserTransactions() {
    const user = getCurrentUser();
    if (!user) return [];
    const snap = await db.collection('transactions').where('userId', '==', user.id).orderBy('ts', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function getAllTransactions() {
    const snap = await db.collection('transactions').orderBy('ts', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function isRegistered(itemId) {
    const user = getCurrentUser();
    if (!user) return false;
    const snap = await db.collection('registrations').where('userId', '==', user.id).where('itemId', '==', itemId).get();
    return !snap.empty;
  }

  async function getTransaction(txnId) {
    const doc = await db.collection('transactions').doc(txnId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async function generateReceipt(txnId) {
    const txn = await getTransaction(txnId);
    if (!txn) return null;
    return { receiptNumber: 'TNS-' + txnId.slice(-8).toUpperCase(), ...txn, generatedAt: new Date().toISOString() };
  }

  // ─── ADMIN ─────────────────────────────────────────────────────
  async function banUser(userId) {
    if (!isAdmin()) return { ok: false };
    const doc = await db.collection('users').doc(userId).get();
    const banned = !doc.data().banned;
    await db.collection('users').doc(userId).update({ banned });
    return { ok: true, banned };
  }

  async function setUserLevel(userId, level) {
    if (!isAdmin()) return { ok: false };
    await db.collection('users').doc(userId).update({ level, badge: level });
    return { ok: true };
  }

  async function getAdminStats() {
    const [users, posts, txns, reports] = await Promise.all([
      db.collection('users').get(),
      db.collection('posts').get(),
      db.collection('transactions').get(),
      db.collection('reports').where('resolved', '==', false).get(),
    ]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const usersData = users.docs.map(d => d.data());
    const txnsData = txns.docs.map(d => d.data());
    return {
      totalUsers: users.size,
      newUsersToday: usersData.filter(u => new Date(u.joined) >= today).length,
      totalPosts: posts.size,
      newPostsToday: 0, // needs index - skip for now
      totalRevenue: txnsData.filter(t => t.status === 'paid').reduce((s, t) => s + (t.amount || 0), 0),
      pendingPayments: txnsData.filter(t => t.status === 'pending').length,
      openReports: reports.size,
      levelBreakdown: ['beginner','amateur','pro','elite','coach'].reduce((acc, l) => {
        acc[l] = usersData.filter(u => u.level === l).length; return acc;
      }, {}),
    };
  }

  async function getLeaderboard(limit = 10) {
    const snap = await db.collection('users').orderBy('xp', 'desc').limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // ─── SETTINGS ──────────────────────────────────────────────────
  async function getSettings() {
    const doc = await db.collection('config').doc('settings').get();
    return doc.exists ? doc.data() : { upiId: 'tnsarmwrestling@upi', upiName: 'TNS Arm Wrestling' };
  }

  async function saveSettings(data) {
    await db.collection('config').doc('settings').set(data, { merge: true });
    return { ok: true };
  }

  // ─── HELPERS ───────────────────────────────────────────────────
  function _timeAgo(ts) {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ─── REAL-TIME LISTENER (for community live feed) ──────────────
  // Usage: const unsub = TNS_DB.listenToPosts(callback)
  function listenToPosts(callback, opts = {}) {
    let q = db.collection('posts').orderBy('ts', 'desc').limit(30);
    if (opts.category) q = q.where('category', '==', opts.category);
    return q.onSnapshot(snap => {
      const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(posts);
    });
  }

  function listenToComments(postId, callback) {
    return db.collection('posts').doc(postId).collection('comments')
      .orderBy('ts').onSnapshot(snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
  }

  return {
    // Auth
    getSession, getCurrentUser, register, login, loginWithGoogle, logout, updateProfile, uploadProfilePic, changePassword,
    getUser, getUserByUsername, getAllUsers, isAdmin, waitReady,
    // Posts
    getPosts, getPost, createPost, deletePost, pinPost,
    // Comments
    getComments, addComment, deleteComment,
    // Votes
    vote, getVote,
    // Bookmarks
    toggleBookmark, isBookmarked, getBookmarkedPosts,
    // Follows
    toggleFollow, isFollowing, getFollowerCount, getFollowingCount, getFollowingPosts,
    // Reports
    reportContent, getReports, resolveReport,
    // Transactions
    createTransaction, confirmPayment, openRazorpayPayment,
    getUserTransactions, getAllTransactions, isRegistered, getTransaction, generateReceipt,
    // Admin
    banUser, setUserLevel, getAdminStats,
    // Leaderboard
    getLeaderboard,
    // Settings
    getSettings, saveSettings,
    // Real-time
    listenToPosts, listenToComments,
    // Helpers
    _timeAgo,
    // Config
    PAYMENT_CONFIG,
  };
})();
