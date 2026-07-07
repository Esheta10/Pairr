import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const DEFAULT_API_BASE = "https://pairr-h11h.onrender.com/api";
const DEFAULT_PHOTO =
  "https://static.vecteezy.com/system/resources/thumbnails/051/498/303/small/social-media-chatting-online-default-male-blank-profile-picture-head-and-body-icon-people-standing-icon-grey-background-free-vector.jpg";
const FEED_LIMIT = 10;

function toPayload(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((key) => {
    if (data[key] === "") delete data[key];
  });
  if (data.age) data.age = Number(data.age);
  if (data.skills) {
    data.skills = data.skills.split(",").map((skill) => skill.trim()).filter(Boolean);
  }
  return data;
}

function App() {
  const [apiBase, setApiBase] = useState(localStorage.getItem("Pairr.apiBase") || DEFAULT_API_BASE);
  const [accessToken, setAccessToken] = useState(localStorage.getItem("Pairr.accessToken") || "");
  const [authMode, setAuthMode] = useState("login");
  const [activeView, setActiveView] = useState("feed");
  const [toast, setToast] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [feed, setFeed] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [discoverUser, setDiscoverUser] = useState(null);
  const [discoverMessage, setDiscoverMessage] = useState("Search by user id to view a profile and send interest or ignore.");
  const signedIn = Boolean(accessToken);

  function notify(message, type = "success") {
    setToast({ message, type });
    window.clearTimeout(notify.timeout);
    notify.timeout = window.setTimeout(() => setToast(null), 3800);
  }

  function saveToken(token) {
    setAccessToken(token || "");
    if (token) localStorage.setItem("Pairr.accessToken", token);
    else localStorage.removeItem("Pairr.accessToken");
  }

  async function refreshToken() {
    try {
      const payload = await apiRequest("/auth/refresh-token", { method: "GET" }, false);
      if (payload.accessToken) {
        saveToken(payload.accessToken);
        return true;
      }
    } catch {
      saveToken("");
    }
    return false;
  }

  async function apiRequest(path, options = {}, retry = true) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const response = await fetch(`${apiBase}${path}`, { ...options, headers, credentials: "include" });
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    if (response.status === 401 && retry && path !== "/auth/refresh-token") {
      const refreshed = await refreshToken();
      if (refreshed) return apiRequest(path, options, false);
    }
    if (!response.ok) throw new Error(payload.message || `Request failed with ${response.status}`);
    return payload;
  }

  async function loadProfile() {
    const data = await apiRequest("/profile/view");
    setProfile(data);
    return data;
  }

  async function loadRequests() {
    const data = await apiRequest("/user/requests/received");
    setRequests(data.connectionRequests || []);
  }

  async function loadConnections() {
    const data = await apiRequest("/user/connections");
    setConnections(data.data || []);
  }

  async function loadFeed(page = 1, append = false) {
    const data = await apiRequest(`/user/feed?page=${page}&limit=${FEED_LIMIT}`);
    const newUsers = data.newUsers || [];
    setFeed((current) => (append ? [...current, ...newUsers] : newUsers));
    setFeedPage(data.page || page);
    setFeedHasMore(Boolean(data.hasMore));
  }

  async function loadMoreFeed() {
    setFeedLoadingMore(true);
    try {
      await loadFeed(feedPage + 1, true);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setFeedLoadingMore(false);
    }
  }

  async function loadDashboard() {
    try {
      await loadProfile();
      await Promise.allSettled([loadRequests(), loadConnections(), loadFeed()]);
    } catch (error) {
      notify(error.message, "error");
    }
  }

  useEffect(() => {
    if (signedIn) loadDashboard();
  }, [signedIn]);

  const navItems = useMemo(() => [
    ["feed", "Feed"],
    // ["discover", "Discover"],
    ["requests", "Requests"],
    ["connections", "Connections"],
    ["profile", "Profile"],
    ["settings", "Settings"],
  ], []);

  async function handleLogin(event) {
    event.preventDefault();
    try {
      const payload = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(toPayload(event.currentTarget)),
      });
      saveToken(payload.accessToken);
      notify(payload.message || "Logged in");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    try {
      const payload = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify(toPayload(event.currentTarget)),
      });
      notify(payload.message || "Account created. You can login now.");
      setAuthMode("login");
      event.currentTarget.reset();
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function handleLogout() {
    try {
      await apiRequest("/auth/logout");
    } catch {
      // Local logout should still clear UI state.
    }
    saveToken("");
    setProfile(null);
    notify("Logged out");
  }

  async function findUser(event) {
    event.preventDefault();
    const userId = new FormData(event.currentTarget).get("userId").trim();
    setDiscoverUser(null);
    setDiscoverMessage("Searching...");
    try {
      const payload = await apiRequest(`/user/${encodeURIComponent(userId)}`);
      setDiscoverUser({ ...payload.user, _id: userId });
      setDiscoverMessage("");
    } catch (error) {
      setDiscoverMessage(error.message);
      notify(error.message, "error");
    }
  }

  async function sendRequest(status, userId) {
    try {
      const payload = await apiRequest(`/request/send/${status}/${userId}`, { method: "POST" });
      notify(payload.message || "Request updated");
      setFeed((current) => current.filter((person) => person._id !== userId));
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function reviewRequest(status, requestId) {
    try {
      const payload = await apiRequest(`/request/review/${status}/${requestId}`, { method: "POST" });
      notify(payload.message || "Request reviewed");
      await Promise.allSettled([loadRequests(), loadConnections()]);
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function updateProfile(event) {
    event.preventDefault();
    try {
      const payload = await apiRequest("/profile/edit", {
        method: "PATCH",
        body: JSON.stringify(toPayload(event.currentTarget)),
      });
      notify(payload.message || "Profile saved");
      await loadProfile();
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    try {
      const payload = await apiRequest("/profile/password", {
        method: "PATCH",
        body: JSON.stringify(toPayload(event.currentTarget)),
      });
      notify(payload.message || "Password updated");
      event.currentTarget.reset();
    } catch (error) {
      notify(error.message, "error");
    }
  }

  if (!signedIn) {
    return (
      <main className="app-shell">
        <section className="auth-panel">
          <Brand large />
          <div className="auth-card">
            <div className="segmented-control" role="tablist" aria-label="Authentication mode">
              <button className={`segment ${authMode === "login" ? "active" : ""}`} onClick={() => setAuthMode("login")} type="button">Login</button>
              <button className={`segment ${authMode === "signup" ? "active" : ""}`} onClick={() => setAuthMode("signup")} type="button">Sign up</button>
            </div>
            {authMode === "login" ? <LoginForm onSubmit={handleLogin} /> : <SignupForm onSubmit={handleSignup} />}
          </div>
        </section>
        <Toast toast={toast} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <aside className="sidebar">
          <Brand />
          <nav className="nav-list" aria-label="Main views">
            {navItems.map(([id, label]) => (
              <button key={id} className={`nav-item ${activeView === id ? "active" : ""}`} onClick={() => setActiveView(id)} type="button">{label}</button>
            ))}
          </nav>
          <button className="secondary-action logout-button" onClick={handleLogout} type="button">Logout</button>
        </aside>

        <section className="content">
          <header className="topbar">
            <div />
            <div className="current-user">
              <div>
                <p className="eyebrow">Signed in as</p>
                <p className="current-user-name">{[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "You"}</p>
              </div>
              <img className="current-user-avatar" src={profile?.photoURL || DEFAULT_PHOTO} alt="Your profile" />
            </div>
          </header>
          <Toast toast={toast} />

          {activeView === "feed" && (
            <FeedView
              feed={feed}
              onRefresh={loadFeed}
              onSendRequest={sendRequest}
              notify={notify}
              onLoadMore={loadMoreFeed}
              hasMore={feedHasMore}
              loadingMore={feedLoadingMore}
            />
          )}
          {activeView === "discover" && (
            <DiscoverView discoverUser={discoverUser} message={discoverMessage} onFindUser={findUser} onRefreshProfile={() => loadProfile().then(() => notify("Profile refreshed")).catch((error) => notify(error.message, "error"))} onSendRequest={sendRequest} />
          )}
          {activeView === "requests" && <RequestsView requests={requests} onRefresh={loadRequests} onReview={reviewRequest} notify={notify} />}
          {activeView === "connections" && <ConnectionsView connections={connections} onRefresh={loadConnections} notify={notify} />}
          {activeView === "profile" && <ProfileView profile={profile} onRefresh={loadProfile} onSubmit={updateProfile} notify={notify} />}
          {activeView === "settings" && <SettingsView onSubmit={updatePassword} />}
        </section>
      </section>
    </main>
  );
}

function Brand({ large = false }) {
  return (
    <div className={`brand-lockup ${large ? "" : "compact"}`}>
      <div className="brand-mark">P</div>
      <div>
        <p className="eyebrow">{large ? "Developer connections" : "Signed in"}</p>
        {large ? <h1>Pairr</h1> : <h2>Pairr</h2>}
      </div>
    </div>
  );
}

function LoginForm({ onSubmit }) {
  return (
    <form className="form" onSubmit={onSubmit}>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      <button className="primary-action" type="submit">Login</button>
    </form>
  );
}

function SignupForm({ onSubmit }) {
  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="field-grid">
        <label>First name<input name="firstName" autoComplete="given-name" required /></label>
        <label>Last name<input name="lastName" autoComplete="family-name" required /></label>
      </div>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete="new-password" required /></label>
      <div className="field-grid">
        <label>Age<input name="age" type="number" min="18" max="120" /></label>
        <label>Gender<select name="gender"><option value="">Choose</option><option>Male</option><option>Female</option><option>Others</option></select></label>
      </div>
      <label>Skills<input name="skills" placeholder="React, Node.js, MongoDB" /></label>
      <button className="primary-action" type="submit">Create account</button>
    </form>
  );
}

function FeedView({ feed, onRefresh, onSendRequest, notify, onLoadMore, hasMore, loadingMore }) {
  async function refresh() {
    try {
      await onRefresh();
      notify("Feed refreshed");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <SectionHeading eyebrow="Discover" title="Your feed" action={<button className="secondary-action" onClick={refresh} type="button">Refresh</button>} />
      <div className="list-grid">
        {feed.length ? feed.map((person) => (
          <PersonCard
            key={person._id}
            person={person}
            actions={
              <>
                <button className="primary-action" onClick={() => onSendRequest("interested", person._id)} type="button">Interested</button>
                <button className="danger-action" onClick={() => onSendRequest("ignore", person._id)} type="button">Ignore</button>
              </>
            }
          />
        )) : <EmptyState message="No new profiles right now. Check back later." />}
      </div>
      {feed.length > 0 && hasMore && (
        <div className="load-more-row">
          <button className="secondary-action" onClick={onLoadMore} disabled={loadingMore} type="button">
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </section>
  );
}

function DiscoverView({ discoverUser, message, onFindUser, onRefreshProfile, onSendRequest }) {
  return (
    <section>
      <SectionHeading eyebrow="Browse" title="Find a developer" action={<button className="secondary-action" onClick={onRefreshProfile} type="button">Refresh me</button>} />
      <form className="search-row" onSubmit={onFindUser}>
        <input name="userId" placeholder="Paste a user id" required />
        <button className="primary-action" type="submit">Find</button>
      </form>
      {discoverUser ? (
        <PersonCard person={discoverUser} actions={<><button className="primary-action" onClick={() => onSendRequest("interested", discoverUser._id)} type="button">Interested</button><button className="danger-action" onClick={() => onSendRequest("ignore", discoverUser._id)} type="button">Ignore</button></>} />
      ) : <EmptyState message={message} />}
    </section>
  );
}

function RequestsView({ requests, onRefresh, onReview, notify }) {
  async function refresh() {
    try { await onRefresh(); notify("Requests refreshed"); } catch (error) { notify(error.message, "error"); }
  }
  return (
    <section>
      <SectionHeading eyebrow="Inbox" title="Pending requests" action={<button className="secondary-action" onClick={refresh} type="button">Refresh</button>} />
      <div className="list-grid">
        {requests.length ? requests.map((request) => (
          <PersonCard key={request._id} person={request.fromUserId || {}} actions={<><button className="primary-action" onClick={() => onReview("accept", request._id)} type="button">Accept</button><button className="danger-action" onClick={() => onReview("reject", request._id)} type="button">Reject</button></>} />
        )) : <EmptyState message="No pending requests right now." />}
      </div>
    </section>
  );
}

function ConnectionsView({ connections, onRefresh, notify }) {
  async function refresh() {
    try { await onRefresh(); notify("Connections refreshed"); } catch (error) { notify(error.message, "error"); }
  }
  return (
    <section>
      <SectionHeading eyebrow="Network" title="Your connections" action={<button className="secondary-action" onClick={refresh} type="button">Refresh</button>} />
      <div className="list-grid">
        {connections.length ? connections.map((person) => <PersonCard key={person._id} person={person} />) : <EmptyState message="No accepted connections yet." />}
      </div>
    </section>
  );
}

function ProfileView({ profile, onRefresh, onSubmit, notify }) {
  async function refresh() {
    try { await onRefresh(); notify("Profile refreshed"); } catch (error) { notify(error.message, "error"); }
  }
  return (
    <section>
      <SectionHeading eyebrow="Account" title="Edit profile" action={<button className="secondary-action" onClick={refresh} type="button">Refresh</button>} />
      <form className="editor-grid" onSubmit={onSubmit} key={profile?._id || "profile"}>
        <label>Photo URL<input name="photoURL" defaultValue={profile?.photoURL || ""} /></label>
        <label>Age<input name="age" type="number" min="18" max="120" defaultValue={profile?.age || ""} /></label>
        <label>Gender<select name="gender" defaultValue={profile?.gender || ""}><option value="">Choose</option><option>Male</option><option>Female</option><option>Others</option></select></label>
        <label className="wide">About<textarea name="about" rows="4" defaultValue={profile?.about || ""}></textarea></label>
        <label className="wide">Skills<input name="skills" placeholder="React, Node.js, MongoDB" defaultValue={Array.isArray(profile?.skills) ? profile.skills.join(", ") : ""} /></label>
        <button className="primary-action" type="submit">Save profile</button>
      </form>
    </section>
  );
}

function SettingsView({ onSubmit }) {
  return (
    <section>
      <SectionHeading eyebrow="Security" title="Change password" />
      <form className="editor-grid" onSubmit={onSubmit}>
        <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
        <label>New password<input name="newPassword" type="password" autoComplete="new-password" required /></label>
        <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" required /></label>
        <button className="primary-action" type="submit">Update password</button>
      </form>
    </section>
  );
}

function SectionHeading({ eyebrow, title, action }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>;
}

function EmptyState({ message }) {
  return <div className="profile-card empty-state"><p>{message}</p></div>;
}

function PersonCard({ person, actions }) {
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(" ") || "Unknown developer";
  const skills = Array.isArray(person.skills) ? person.skills : [];
  return (
    <article className="profile-card">
      <div className="card-photo">
        <img className="card-media" src={person.photoURL || DEFAULT_PHOTO} alt={fullName} />
        <div className="card-scrim">
          <h3>{fullName}</h3>
          <p className="card-meta">{person.age || "Age not set"}{person.gender ? ` · ${person.gender}` : ""}</p>
        </div>
      </div>
      <div className="card-body">
        {(person.about || person.email) && <p>{person.about || person.email}</p>}
        {skills.length > 0 && <div className="badge-list">{skills.map((skill) => <span className="badge" key={skill}>{skill}</span>)}</div>}
        {actions && <div className="card-actions">{actions}</div>}
      </div>
    </article>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`toast ${toast.type === "error" ? "error" : ""}`} role="status">{toast.message}</div>;
}

createRoot(document.getElementById("root")).render(<App />);