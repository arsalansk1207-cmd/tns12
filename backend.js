// ═══════════════════════════════════════════════════════════════════
// TNS ARM WRESTLING — FULL BACKEND v2.0
// localStorage-based (drop-in Firebase replacement when ready)
// ═══════════════════════════════════════════════════════════════════

const TNS_DB = (function () {
  const K = {
    USERS: 'tns_users', SESSION: 'tns_session', POSTS: 'tns_posts',
    COMMENTS: 'tns_comments', VOTES: 'tns_votes', BOOKMARKS: 'tns_bookmarks',
    FOLLOWS: 'tns_follows', TRANSACTIONS: 'tns_transactions',
    REGISTRATIONS: 'tns_registrations', REPORTS: 'tns_reports',
    NOTIFICATIONS: 'tns_notifications', SETTINGS: 'tns_settings',
  };

  function get(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
  function set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error('TNS_DB save error', e); } }
  function getArr(key) { const v = get(key); return Array.isArray(v) ? v : []; }

  function seed() {
    if (getArr(K.USERS).length) return;
    const seedUsers = [
      { id: 'u1', name: 'Nitin Shinde', username: 'tns_coach', email: 'coach@tns.com', password: 'tns123', city: 'Pune', weight: '80kg', hand: 'Right', level: 'coach', xp: 9800, bio: 'Founder TNS Arm Wrestling. 7x Maharashtra Champion.', avatar: '💪', badge: 'coach', joined: '2017-01-01T00:00:00Z', verified: true, profilePic: null, postCount: 10, winCount: 42 },
      { id: 'u2', name: 'Rahul Kale', username: 'iron_rahul', email: 'rahul@tns.com', password: 'tns123', city: 'Pune', weight: '90kg', hand: 'Right', level: 'elite', xp: 5600, bio: 'Elite arm wrestler. Competing since 2019.', avatar: '🔥', badge: 'elite', joined: '2019-03-15T00:00:00Z', verified: false, profilePic: null, postCount: 5, winCount: 18 },
      { id: 'u3', name: 'Priya Desai', username: 'priya_d', email: 'priya@tns.com', password: 'tns123', city: 'Mumbai', weight: '55kg', hand: 'Left', level: 'pro', xp: 2300, bio: 'Pro wrestler, Mumbai chapter.', avatar: '⚡', badge: 'pro', joined: '2020-06-20T00:00:00Z', verified: false, profilePic: null, postCount: 3, winCount: 7 },
    ];
    set(K.USERS, seedUsers);
    const now = Date.now();
    const seedPosts = [
      { id: 'p1', authorId: 'u1', title: 'Welcome to TNS Community! 🎉', body: 'This is the official TNS Arm Wrestling community hub. Share your training, ask questions, post match videos and connect with arm wrestlers across India. Keep it respectful, keep it fire! 💪', category: 'General', votes: 42, commentCount: 2, pinned: true, image: null, ts: new Date(now - 86400000 * 2).toISOString() },
      { id: 'p2', authorId: 'u2', title: 'Back lever training for forearm power — my routine', body: 'Been doing this 3x week for 3 months. Hammer curls 5x10, wrist roller 4x failure, pronator twists with resistance band. My pull has improved massively. Who else trains back lever?', category: 'Training & Strength', votes: 28, commentCount: 1, pinned: false, image: null, ts: new Date(now - 86400000).toISOString() },
      { id: 'p3', authorId: 'u3', title: 'First competition experience — nervous but loved it!', body: 'Just competed in my first local TNS event. Lost all my matches but the atmosphere was electric. Everyone was super supportive. Already excited for the next one!', category: 'Match Videos', votes: 35, commentCount: 1, pinned: false, image: null, ts: new Date(now - 3600000 * 5).toISOString() },
      { id: 'p4', authorId: 'u1', title: 'Beginner tip: Stop yanking, start hooking', body: 'Biggest mistake beginners make is going all-out yank from the start. Learn the hook technique first. Inside position, wrist curled, elbow in. This protects your arm and gives you way more control.', category: 'Technique', votes: 67, commentCount: 1, pinned: false, image: null, ts: new Date(now - 3600000 * 12).toISOString() },
    ];
    set(K.POSTS, seedPosts);
    const seedComments = [
      { id: 'c1', postId: 'p1', authorId: 'u2', body: 'Super excited for this! TNS community is gonna be 🔥', votes: 5, ts: new Date(now - 86400000).toISOString() },
      { id: 'c2', postId: 'p1', authorId: 'u3', body: 'Finally an Indian arm wrestling community online!', votes: 8, ts: new Date(now - 86400000 + 3600000).toISOString() },
      { id: 'c3', postId: 'p2', authorId: 'u1', body: 'Solid routine. Also add wrist curls behind the back for supination strength.', votes: 12, ts: new Date(now - 3600000 * 20).toISOString() },
      { id: 'c4', postId: 'p3', authorId: 'u2', body: 'First comp is always the best! Welcome to the family.', votes: 9, ts: new Date(now - 3600000 * 4).toISOString() },
      { id: 'c5', postId: 'p4', authorId: 'u3', body: 'This is exactly what I needed to hear. My wrist was killing me from bad technique!', votes: 7, ts: new Date(now - 3600000 * 8).toISOString() },
    ];
    set(K.COMMENTS, seedComments);
  }

  // AUTH
  function getSession() { return get(K.SESSION); }
  function getCurrentUser() {
    const s = getSession();
    if (!s) return null;
    return getArr(K.USERS).find(u => u.id === s.userId) || null;
  }

  function register(data) {
    const users = getArr(K.USERS);
    if (users.find(u => u.username.toLowerCase() === data.username.toLowerCase()))
      return { ok: false, error: 'Username already taken.' };
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase()))
      return { ok: false, error: 'Email already registered.' };
    const initials = (data.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const user = {
      id: 'u' + Date.now(), name: data.name, username: data.username, email: data.email,
      password: data.password, weight: data.weight || '', hand: data.hand || 'Right',
      city: data.city || 'Pune', phone: data.phone || '', level: 'beginner', xp: 0,
      bio: '', avatar: initials, badge: 'beginner', joined: new Date().toISOString(),
      verified: false, profilePic: null, postCount: 0, winCount: 0,
    };
    users.push(user);
    set(K.USERS, users);
    set(K.SESSION, { userId: user.id });
    return { ok: true, user };
  }

  function login(usernameOrEmail, password) {
    const user = getArr(K.USERS).find(u =>
      (u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
        u.email.toLowerCase() === usernameOrEmail.toLowerCase()) && u.password === password
    );
    if (!user) return { ok: false, error: 'Invalid username or password.' };
    if (user.banned) return { ok: false, error: 'Account suspended. Contact support.' };
    set(K.SESSION, { userId: user.id });
    return { ok: true, user };
  }

  function logout() { localStorage.removeItem(K.SESSION); }

  function updateProfile(data) {
    const user = getCurrentUser();
    if (!user) return { ok: false };
    const users = getArr(K.USERS);
    const idx = users.findIndex(u => u.id === user.id);
    if (idx < 0) return { ok: false };
    ['name', 'bio', 'city', 'weight', 'hand', 'phone', 'profilePic', 'avatar', 'instagram', 'youtube'].forEach(k => {
      if (data[k] !== undefined) users[idx][k] = data[k];
    });
    set(K.USERS, users);
    return { ok: true, user: users[idx] };
  }

  function changePassword(oldPw, newPw) {
    const user = getCurrentUser();
    if (!user) return { ok: false };
    if (user.password !== oldPw) return { ok: false, error: 'Current password is incorrect.' };
    const users = getArr(K.USERS);
    const idx = users.findIndex(u => u.id === user.id);
    users[idx].password = newPw;
    set(K.USERS, users);
    return { ok: true };
  }

  function getUser(id) { return getArr(K.USERS).find(u => u.id === id) || null; }
  function getUserByUsername(username) { return getArr(K.USERS).find(u => u.username.toLowerCase() === username.toLowerCase()) || null; }
  function getAllUsers() { return getArr(K.USERS); }

  // POSTS
  function getPosts(opts = {}) {
    let posts = getArr(K.POSTS);
    if (opts.category) posts = posts.filter(p => p.category === opts.category);
    if (opts.authorId) posts = posts.filter(p => p.authorId === opts.authorId);
    if (opts.search) { const q = opts.search.toLowerCase(); posts = posts.filter(p => p.title.toLowerCase().includes(q) || (p.body || '').toLowerCase().includes(q)); }
    if (opts.sort === 'top') posts.sort((a, b) => b.votes - a.votes);
    else if (opts.sort === 'new') posts.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    else {
      const now = Date.now();
      posts.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1; if (!a.pinned && b.pinned) return 1;
        const sA = a.votes + Math.max(0, (172800000 - (now - new Date(a.ts))) / 3600000);
        const sB = b.votes + Math.max(0, (172800000 - (now - new Date(b.ts))) / 3600000);
        return sB - sA;
      });
    }
    return posts;
  }

  function getPost(id) { return getArr(K.POSTS).find(p => p.id === id) || null; }

  function createPost(data) {
    const user = getCurrentUser();
    if (!user) return { ok: false, error: 'Not logged in' };
    const posts = getArr(K.POSTS);
    const post = { id: 'p' + Date.now(), authorId: user.id, title: data.title, body: data.body || '', category: data.category || 'General', image: data.image || null, votes: 0, commentCount: 0, pinned: false, ts: new Date().toISOString() };
    posts.unshift(post);
    set(K.POSTS, posts);
    const users = getArr(K.USERS);
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) { users[idx].postCount = (users[idx].postCount || 0) + 1; users[idx].xp = (users[idx].xp || 0) + 10; set(K.USERS, users); }
    return { ok: true, post };
  }

  function deletePost(postId) {
    const user = getCurrentUser();
    if (!user) return { ok: false };
    const posts = getArr(K.POSTS);
    const post = posts.find(p => p.id === postId);
    if (!post) return { ok: false };
    if (post.authorId !== user.id && !isAdmin()) return { ok: false, error: 'Not authorized' };
    set(K.POSTS, posts.filter(p => p.id !== postId));
    return { ok: true };
  }

  function pinPost(postId, pinned) {
    if (!isAdmin()) return { ok: false };
    const posts = getArr(K.POSTS);
    const idx = posts.findIndex(p => p.id === postId);
    if (idx >= 0) { posts[idx].pinned = pinned; set(K.POSTS, posts); }
    return { ok: true };
  }

  // COMMENTS
  function getComments(postId) { return getArr(K.COMMENTS).filter(c => c.postId === postId).sort((a, b) => new Date(a.ts) - new Date(b.ts)); }

  function addComment(postId, body) {
    const user = getCurrentUser();
    if (!user) return { ok: false, error: 'Not logged in' };
    const comments = getArr(K.COMMENTS);
    const comment = { id: 'c' + Date.now(), postId, authorId: user.id, body, votes: 0, ts: new Date().toISOString() };
    comments.push(comment);
    set(K.COMMENTS, comments);
    const posts = getArr(K.POSTS);
    const pidx = posts.findIndex(p => p.id === postId);
    if (pidx >= 0) { posts[pidx].commentCount = (posts[pidx].commentCount || 0) + 1; set(K.POSTS, posts); }
    const users = getArr(K.USERS);
    const uidx = users.findIndex(u => u.id === user.id);
    if (uidx >= 0) { users[uidx].xp = (users[uidx].xp || 0) + 2; set(K.USERS, users); }
    return { ok: true, comment };
  }

  function deleteComment(commentId) {
    const user = getCurrentUser();
    if (!user) return { ok: false };
    const comments = getArr(K.COMMENTS);
    const c = comments.find(x => x.id === commentId);
    if (!c) return { ok: false };
    if (c.authorId !== user.id && !isAdmin()) return { ok: false };
    set(K.COMMENTS, comments.filter(x => x.id !== commentId));
    const posts = getArr(K.POSTS);
    const pidx = posts.findIndex(p => p.id === c.postId);
    if (pidx >= 0) { posts[pidx].commentCount = Math.max(0, (posts[pidx].commentCount || 1) - 1); set(K.POSTS, posts); }
    return { ok: true };
  }

  // VOTES
  function vote(type, id, dir) {
    const user = getCurrentUser();
    if (!user) return { ok: false };
    const votes = getArr(K.VOTES);
    const key = type + '_' + id + '_' + user.id;
    const existing = votes.find(v => v.key === key);
    const itemKey = type === 'post' ? K.POSTS : K.COMMENTS;
    const items = getArr(itemKey);
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return { ok: false };
    if (existing) {
      if (existing.dir === dir) { items[idx].votes -= dir; votes.splice(votes.indexOf(existing), 1); }
      else { items[idx].votes += dir * 2; existing.dir = dir; }
    } else { items[idx].votes += dir; votes.push({ key, dir, ts: new Date().toISOString() }); }
    set(itemKey, items);
    set(K.VOTES, votes);
    return { ok: true, votes: items[idx].votes };
  }

  function getVote(type, id) {
    const user = getCurrentUser();
    if (!user) return 0;
    const v = getArr(K.VOTES).find(x => x.key === type + '_' + id + '_' + user.id);
    return v ? v.dir : 0;
  }

  // BOOKMARKS
  function toggleBookmark(postId) {
    const user = getCurrentUser();
    if (!user) return false;
    const bkms = getArr(K.BOOKMARKS);
    const key = postId + '_' + user.id;
    const idx = bkms.indexOf(key);
    if (idx >= 0) { bkms.splice(idx, 1); set(K.BOOKMARKS, bkms); return false; }
    bkms.push(key); set(K.BOOKMARKS, bkms); return true;
  }
  function isBookmarked(postId) { const user = getCurrentUser(); if (!user) return false; return getArr(K.BOOKMARKS).includes(postId + '_' + user.id); }
  function getBookmarkedPosts() {
    const user = getCurrentUser();
    if (!user) return [];
    const bkms = getArr(K.BOOKMARKS).filter(k => k.endsWith('_' + user.id)).map(k => k.replace('_' + user.id, ''));
    return getArr(K.POSTS).filter(p => bkms.includes(p.id));
  }

  // FOLLOWS
  function toggleFollow(targetId) {
    const user = getCurrentUser();
    if (!user || user.id === targetId) return false;
    const follows = getArr(K.FOLLOWS);
    const key = user.id + '_' + targetId;
    const idx = follows.indexOf(key);
    if (idx >= 0) { follows.splice(idx, 1); set(K.FOLLOWS, follows); return false; }
    follows.push(key); set(K.FOLLOWS, follows); return true;
  }
  function isFollowing(targetId) { const user = getCurrentUser(); if (!user) return false; return getArr(K.FOLLOWS).includes(user.id + '_' + targetId); }
  function getFollowerCount(userId) { return getArr(K.FOLLOWS).filter(k => k.endsWith('_' + userId)).length; }
  function getFollowingCount(userId) { return getArr(K.FOLLOWS).filter(k => k.startsWith(userId + '_')).length; }
  function getFollowingPosts() {
    const user = getCurrentUser(); if (!user) return [];
    const following = getArr(K.FOLLOWS).filter(k => k.startsWith(user.id + '_')).map(k => k.split('_')[1]);
    return getPosts().filter(p => following.includes(p.authorId));
  }

  // REPORTS
  function reportContent(type, id, reason) {
    const user = getCurrentUser();
    const reports = getArr(K.REPORTS);
    reports.push({ id: 'r' + Date.now(), type, targetId: id, reason, reporterId: user ? user.id : 'anon', ts: new Date().toISOString(), resolved: false });
    set(K.REPORTS, reports);
    return { ok: true };
  }
  function getReports() { return getArr(K.REPORTS); }
  function resolveReport(reportId) {
    const reports = getArr(K.REPORTS);
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx >= 0) { reports[idx].resolved = true; set(K.REPORTS, reports); }
    return { ok: true };
  }

  // NOTIFICATIONS
  function addNotification(userId, type, message, refId = null) {
    const notifs = getArr(K.NOTIFICATIONS);
    notifs.unshift({ id: 'n' + Date.now(), userId, type, message, refId, read: false, ts: new Date().toISOString() });
    if (notifs.length > 100) notifs.splice(100);
    set(K.NOTIFICATIONS, notifs);
  }
  function getNotifications() { const user = getCurrentUser(); if (!user) return []; return getArr(K.NOTIFICATIONS).filter(n => n.userId === user.id); }
  function markNotificationsRead() { const user = getCurrentUser(); if (!user) return; const notifs = getArr(K.NOTIFICATIONS); notifs.forEach(n => { if (n.userId === user.id) n.read = true; }); set(K.NOTIFICATIONS, notifs); }
  function getUnreadCount() { const user = getCurrentUser(); if (!user) return 0; return getArr(K.NOTIFICATIONS).filter(n => n.userId === user.id && !n.read).length; }

  // TRANSACTIONS
  function createTransaction(data) {
    const user = getCurrentUser();
    if (!user) return { ok: false, error: 'Not logged in' };
    const txns = getArr(K.TRANSACTIONS);
    const txn = {
      id: 'txn' + Date.now(), userId: user.id, userName: user.name, userEmail: user.email,
      type: data.type, itemName: data.itemName, itemId: data.itemId || null,
      amount: data.amount, currency: 'INR', upiRef: null, status: 'pending',
      ts: new Date().toISOString(), paidAt: null,
    };
    txns.unshift(txn);
    set(K.TRANSACTIONS, txns);
    return { ok: true, txn };
  }

  function confirmPayment(txnId, upiRef) {
    const txns = getArr(K.TRANSACTIONS);
    const idx = txns.findIndex(t => t.id === txnId);
    if (idx < 0) return { ok: false };
    txns[idx].status = 'paid'; txns[idx].upiRef = upiRef; txns[idx].paidAt = new Date().toISOString();
    set(K.TRANSACTIONS, txns);
    const reg = getArr(K.REGISTRATIONS);
    reg.push({ userId: txns[idx].userId, itemId: txns[idx].itemId, type: txns[idx].type, txnId, ts: new Date().toISOString() });
    set(K.REGISTRATIONS, reg);
    return { ok: true, txn: txns[idx] };
  }

  function getUserTransactions() { const user = getCurrentUser(); if (!user) return []; return getArr(K.TRANSACTIONS).filter(t => t.userId === user.id).sort((a, b) => new Date(b.ts) - new Date(a.ts)); }
  function getAllTransactions() { return getArr(K.TRANSACTIONS).sort((a, b) => new Date(b.ts) - new Date(a.ts)); }
  function isRegistered(itemId) { const user = getCurrentUser(); if (!user) return false; return getArr(K.REGISTRATIONS).some(r => r.userId === user.id && r.itemId === itemId); }
  function getTransaction(txnId) { return getArr(K.TRANSACTIONS).find(t => t.id === txnId) || null; }

  // ADMIN
  function isAdmin() { const user = getCurrentUser(); return user && (user.level === 'admin' || user.level === 'coach'); }
  function isSuperAdmin() { const user = getCurrentUser(); return user && user.username === 'tns_admin'; }

  function banUser(userId) {
    if (!isAdmin()) return { ok: false };
    const users = getArr(K.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { ok: false };
    users[idx].banned = !users[idx].banned;
    set(K.USERS, users);
    return { ok: true, banned: users[idx].banned };
  }

  function setUserLevel(userId, level) {
    if (!isAdmin()) return { ok: false };
    const users = getArr(K.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { ok: false };
    users[idx].level = level; users[idx].badge = level;
    set(K.USERS, users);
    return { ok: true };
  }

  function getAdminStats() {
    const users = getArr(K.USERS); const posts = getArr(K.POSTS);
    const txns = getArr(K.TRANSACTIONS); const reports = getArr(K.REPORTS);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return {
      totalUsers: users.length,
      newUsersToday: users.filter(u => new Date(u.joined) >= today).length,
      totalPosts: posts.length,
      newPostsToday: posts.filter(p => new Date(p.ts) >= today).length,
      totalRevenue: txns.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount, 0),
      pendingPayments: txns.filter(t => t.status === 'pending').length,
      openReports: reports.filter(r => !r.resolved).length,
      levelBreakdown: { beginner: users.filter(u => u.level === 'beginner').length, amateur: users.filter(u => u.level === 'amateur').length, pro: users.filter(u => u.level === 'pro').length, elite: users.filter(u => u.level === 'elite').length, coach: users.filter(u => u.level === 'coach').length },
    };
  }

  function getLeaderboard(limit = 10) { return getArr(K.USERS).filter(u => !u.banned).sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, limit); }

  function getSettings() { return get(K.SETTINGS) || { adminPin: 'TNS2024', upiId: 'tnsarmwrestling@upi', upiName: 'TNS Arm Wrestling' }; }
  function saveSettings(data) { set(K.SETTINGS, { ...getSettings(), ...data }); return { ok: true }; }

  function generateReceipt(txnId) {
    const txn = getTransaction(txnId);
    if (!txn) return null;
    const user = getUser(txn.userId) || {};
    return { receiptNumber: 'TNS-' + txn.id.replace('txn', '').slice(-8).toUpperCase(), ...txn, userName: user.name || txn.userName, userEmail: user.email || txn.userEmail, generatedAt: new Date().toISOString() };
  }

  function _timeAgo(ts) {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  seed();

  return {
    register, login, logout, getSession, getCurrentUser, updateProfile, changePassword,
    getUser, getUserByUsername, getAllUsers, isAdmin, isSuperAdmin,
    getPosts, getPost, createPost, deletePost, pinPost,
    getComments, addComment, deleteComment,
    vote, getVote,
    toggleBookmark, isBookmarked, getBookmarkedPosts,
    toggleFollow, isFollowing, getFollowerCount, getFollowingCount, getFollowingPosts,
    reportContent, getReports, resolveReport,
    addNotification, getNotifications, markNotificationsRead, getUnreadCount,
    createTransaction, confirmPayment, getUserTransactions, getAllTransactions, isRegistered, getTransaction, generateReceipt,
    banUser, setUserLevel, getAdminStats,
    getLeaderboard, getSettings, saveSettings, _timeAgo,
  };
})();
