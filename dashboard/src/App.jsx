import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const API_URL =
  "https://findly-v3-api.berrchidcity99.workers.dev";

const menu = [
  { icon: "🏠", label: "Overview" },
  { icon: "🤖", label: "Bots" },
  { icon: "🗂️", label: "Categories" },
  { icon: "🔘", label: "Menus" },
  { icon: "🗃️", label: "Content" },
  { icon: "👥", label: "Users" },
  { icon: "🔔", label: "Notifications" },
  { icon: "📊", label: "Analytics" },
  { icon: "💰", label: "Monetization" },
  { icon: "🤖", label: "AI" },
  { icon: "👤", label: "Admins" },
  { icon: "📝", label: "Activity Log" },
  { icon: "⚙️", label: "Settings" }
];

const emptyBot = {
  name: "",
  slug: "",
  bot_type: "child",
  telegram_username: "",
  description: "",
  icon: "🤖",
  is_active: true,
  sort_order: 0
};

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [resetMode, setResetMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatePasswordLoading, setUpdatePasswordLoading] =
    useState(false);
  const [updatePasswordError, setUpdatePasswordError] =
    useState("");

  const [activeSection, setActiveSection] =
    useState("Overview");

  const [bots, setBots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [content, setContent] = useState([]);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [botModal, setBotModal] = useState(null);
  const [botForm, setBotForm] = useState({
    ...emptyBot
  });
  const [botSaving, setBotSaving] = useState(false);
  const [botFormError, setBotFormError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(session);
        }
      } catch (error) {
        console.error(error);

        if (mounted) {
          setLoginError(
            error.message ||
              "Failed to restore session"
          );
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) {
          return;
        }

        if (event === "PASSWORD_RECOVERY") {
          setRecoveryMode(true);
          setResetMode(false);
          setLoginError("");
          setUpdatePasswordError("");
        }

        setSession(session);
        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    try {
      setLoginLoading(true);
      setLoginError("");

      const cleanEmail = email.trim();

      const { error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

      if (error) {
        throw error;
      }

      setPassword("");
      setResetMode(false);
      setResetMessage("");
    } catch (error) {
      console.error(error);

      setLoginError(
        error.message || "Login failed"
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function handlePasswordReset(event) {
    event.preventDefault();

    try {
      setResetLoading(true);
      setLoginError("");
      setResetMessage("");

      const cleanEmail = email.trim();

      if (!cleanEmail) {
        throw new Error(
          "Please enter your email address."
        );
      }

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              window.location.origin
          }
        );

      if (error) {
        throw error;
      }

      setResetMessage(
        "If an account exists for this email, a password reset link has been sent."
      );
    } catch (error) {
      console.error(error);

      setLoginError(
        error.message ||
          "Unable to send password reset email."
      );
    } finally {
      setResetLoading(false);
    }
  }

  async function handleUpdatePassword(event) {
    event.preventDefault();

    try {
      setUpdatePasswordLoading(true);
      setUpdatePasswordError("");

      if (newPassword.length < 8) {
        throw new Error(
          "Password must be at least 8 characters."
        );
      }

      if (newPassword !== confirmPassword) {
        throw new Error(
          "Passwords do not match."
        );
      }

      const { error } =
        await supabase.auth.updateUser({
          password: newPassword
        });

      if (error) {
        throw error;
      }

      await supabase.auth.signOut();

      setSession(null);
      setRecoveryMode(false);
      setResetMode(false);
      setNewPassword("");
      setConfirmPassword("");
      setPassword("");
      setLoginError("");

      setResetMessage(
        "Your password has been updated successfully. You can now sign in with your new password."
      );
    } catch (error) {
      console.error(error);

      setUpdatePasswordError(
        error.message ||
          "Unable to update password."
      );
    } finally {
      setUpdatePasswordLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setApiError("");

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(error);

      setApiError(
        error.message || "Logout failed"
      );
    }
  }

  async function fetchApi(
    endpoint,
    options = {}
  ) {
    if (!session?.access_token) {
      throw new Error(
        "Authentication session is missing"
      );
    }

    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers: {
          Authorization:
            `Bearer ${session.access_token}`,
          "Content-Type":
            "application/json",
          ...(options.headers || {})
        }
      }
    );

    const result =
      await response.json().catch(
        () => null
      );

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.error?.message ||
          `API ${response.status}`
      );
    }

    return result.data || [];
  }

  async function loadDashboard() {
    if (
      !session?.access_token ||
      recoveryMode
    ) {
      return;
    }

    try {
      setLoading(true);
      setApiError("");

      const [
        botsData,
        categoriesData,
        usersData,
        contentData
      ] = await Promise.all([
        fetchApi("/api/bots"),
        fetchApi("/api/categories"),
        fetchApi("/api/users"),
        fetchApi("/api/content")
      ]);

      setBots(botsData || []);
      setCategories(
        categoriesData || []
      );
      setUsers(usersData || []);
      setContent(contentData || []);
    } catch (error) {
      console.error(error);

      setApiError(
        error.message ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session || recoveryMode) {
      setBots([]);
      setCategories([]);
      setUsers([]);
      setContent([]);
      setLoading(false);
      return;
    }

    loadDashboard();
  }, [session, recoveryMode]);

  function openCreateBot() {
    setBotForm({
      ...emptyBot
    });

    setBotFormError("");
    setBotModal("create");
  }

  function openEditBot(bot) {
    setBotForm({
      name: bot.name || "",
      slug: bot.slug || "",
      bot_type:
        bot.bot_type || "child",
      telegram_username:
        bot.telegram_username || "",
      description:
        bot.description || "",
      icon: bot.icon || "🤖",
      is_active:
        bot.is_active !== false,
      sort_order:
        bot.sort_order ?? 0
    });

    setBotFormError("");
    setBotModal(bot);
  }

  function closeBotModal() {
    if (botSaving) {
      return;
    }

    setBotModal(null);
    setBotFormError("");
  }

  function updateBotField(
    field,
    value
  ) {
    setBotForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function saveBot(event) {
    event.preventDefault();

    try {
      setBotSaving(true);
      setBotFormError("");
      setApiError("");

      if (
        !botForm.name.trim() ||
        !botForm.slug.trim() ||
        !botForm.bot_type.trim()
      ) {
        throw new Error(
          "Name, slug and bot type are required."
        );
      }

      const payload = {
        ...botForm,
        name: botForm.name.trim(),
        slug: botForm.slug.trim(),
        telegram_username:
          botForm.telegram_username.trim() ||
          null,
        description:
          botForm.description.trim() ||
          null,
        icon:
          botForm.icon.trim() ||
          "🤖",
        sort_order:
          Number(botForm.sort_order) || 0
      };

      if (botModal === "create") {
        await fetchApi(
          "/api/bots",
          {
            method: "POST",
            body: JSON.stringify(
              payload
            )
          }
        );
      } else {
        await fetchApi(
          `/api/bots/${botModal.id}`,
          {
            method: "PUT",
            body: JSON.stringify(
              payload
            )
          }
        );
      }

      setBotModal(null);
      await loadDashboard();
    } catch (error) {
      console.error(error);

      setBotFormError(
        error.message ||
          "Unable to save bot."
      );
    } finally {
      setBotSaving(false);
    }
  }

  async function toggleBot(bot) {
    try {
      setApiError("");

      await fetchApi(
        `/api/bots/${bot.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            is_active:
              !bot.is_active
          })
        }
      );

      await loadDashboard();
    } catch (error) {
      console.error(error);

      setApiError(
        error.message ||
          "Unable to update bot."
      );
    }
  }

  if (authLoading) {
    return (
      <div className="auth-page">
        <section className="auth-card">
          <h1>FINDLY ADMIN</h1>
          <p>
            Checking secure session...
          </p>
        </section>
      </div>
    );
  }

  if (recoveryMode) {
    return (
      <div className="auth-page">
        <section className="auth-card">
          <h1>
            Set New Password
          </h1>

          <p>
            Create a new secure
            password for your FINDLY
            Admin account.
          </p>

          <form
            className="auth-form"
            onSubmit={
              handleUpdatePassword
            }
          >
            <div className="auth-field">
              <label htmlFor="new-password">
                New Password
              </label>

              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirm-password">
                Confirm Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="password-requirements">
              <strong>
                Password requirements
              </strong>

              <span>
                • At least 8 characters
              </span>

              <span>
                • Both password fields must match
              </span>
            </div>

            {updatePasswordError && (
              <div className="auth-error">
                {
                  updatePasswordError
                }
              </div>
            )}

            <button
              className="auth-button"
              type="submit"
              disabled={
                updatePasswordLoading
              }
            >
              {updatePasswordLoading
                ? "Updating password..."
                : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-page">
        <section className="auth-card">
          <h1>FINDLY ADMIN</h1>

          {!resetMode ? (
            <>
              <p>
                Sign in to access the
                control center.
              </p>

              <form
                className="auth-form"
                onSubmit={handleLogin}
              >
                <div className="auth-field">
                  <label htmlFor="email">
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="password">
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                {loginError && (
                  <div className="auth-error">
                    {loginError}
                  </div>
                )}

                {resetMessage && (
                  <div className="auth-success">
                    {resetMessage}
                  </div>
                )}

                <button
                  className="auth-button"
                  type="submit"
                  disabled={
                    loginLoading
                  }
                >
                  {loginLoading
                    ? "Signing in..."
                    : "Sign In"}
                </button>

                <button
                  className="auth-link"
                  type="button"
                  onClick={() => {
                    setResetMode(
                      true
                    );
                    setLoginError(
                      ""
                    );
                    setResetMessage(
                      ""
                    );
                  }}
                >
                  Forgot Password?
                </button>
              </form>
            </>
          ) : (
            <>
              <p>
                Enter your email and
                we'll send you a secure
                password reset link.
              </p>

              <form
                className="auth-form"
                onSubmit={
                  handlePasswordReset
                }
              >
                <div className="auth-field">
                  <label htmlFor="reset-email">
                    Email
                  </label>

                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>

                {loginError && (
                  <div className="auth-error">
                    {loginError}
                  </div>
                )}

                {resetMessage && (
                  <div className="auth-success">
                    {resetMessage}
                  </div>
                )}

                <button
                  className="auth-button"
                  type="submit"
                  disabled={
                    resetLoading
                  }
                >
                  {resetLoading
                    ? "Sending..."
                    : "Send Reset Email"}
                </button>

                <button
                  className="auth-link"
                  type="button"
                  onClick={() => {
                    setResetMode(
                      false
                    );
                    setLoginError(
                      ""
                    );
                    setResetMessage(
                      ""
                    );
                  }}
                >
                  Back to Sign In
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            F
          </div>

          <div>
            <strong>FINDLY</strong>
            <span>ADMIN</span>
          </div>
        </div>

        <nav>
          {menu.map((item) => (
            <button
              key={item.label}
              className={
                "nav-item " +
                (activeSection ===
                item.label
                  ? "active"
                  : "")
              }
              type="button"
              onClick={() =>
                setActiveSection(
                  item.label
                )
              }
            >
              <span>
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="owner-badge">
            <span>👑</span>

            <div>
              <strong>
                Owner
              </strong>

              <small>
                Full Access
              </small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <h1>
              {activeSection}
            </h1>

            <p>
              {activeSection ===
              "Bots"
                ? "Manage FINDLY bots"
                : "FINDLY control center"}
            </p>
          </div>

          <div className="header-actions">
            <button
              className="icon-button"
              type="button"
            >
              🔔
            </button>

            <div className="profile">
              <div className="avatar">
                F
              </div>

              <div>
                <strong>
                  FINDLY Owner
                </strong>

                <small>
                  {session.user.email}
                </small>
              </div>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {apiError && (
          <div className="error-box">
            API Error: {apiError}
          </div>
        )}

        {activeSection ===
        "Bots" ? (
          <BotsSection
            bots={bots}
            loading={loading}
            onRefresh={
              loadDashboard
            }
            onCreate={
              openCreateBot
            }
            onEdit={
              openEditBot
            }
            onToggle={
              toggleBot
            }
          />
        ) : (
          <Overview
            bots={bots}
            categories={
              categories
            }
            users={users}
            content={content}
            loading={loading}
            onBots={() =>
              setActiveSection(
                "Bots"
              )
            }
          />
        )}
      </main>

      {botModal && (
        <BotModal
          mode={botModal}
          form={botForm}
          saving={botSaving}
          error={botFormError}
          onChange={
            updateBotField
          }
          onClose={
            closeBotModal
          }
          onSubmit={
            saveBot
          }
        />
      )}
    </div>
  );
}

function Overview({
  bots,
  categories,
  users,
  content,
  loading,
  onBots
}) {
  return (
    <>
      <section className="stats">
        <StatCard
          icon="🤖"
          label="Bots"
          value={
            loading
              ? "…"
              : bots.length
          }
        />

        <StatCard
          icon="🗂️"
          label="Categories"
          value={
            loading
              ? "…"
              : categories.length
          }
        />

        <StatCard
          icon="👥"
          label="Users"
          value={
            loading
              ? "…"
              : users.length
          }
        />

        <StatCard
          icon="🗃️"
          label="Content"
          value={
            loading
              ? "…"
              : content.length
          }
        />
      </section>

      <section className="grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Bots</h2>
              <p>
                Connected FINDLY bots
              </p>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={onBots}
            >
              Manage
            </button>
          </div>

          <div className="bot-list">
            {loading && (
              <div className="empty">
                Loading...
              </div>
            )}

            {!loading &&
              bots.length ===
                0 && (
                <div className="empty">
                  No bots found
                </div>
              )}

            {!loading &&
              bots.map((bot) => (
                <div
                  className="bot-row"
                  key={bot.id}
                >
                  <div className="bot-icon">
                    {bot.icon ||
                      "🤖"}
                  </div>

                  <div className="bot-info">
                    <strong>
                      {bot.name}
                    </strong>

                    <span>
                      {bot.telegram_username ||
                        bot.slug}
                    </span>
                  </div>

                  <BotStatus
                    bot={bot}
                  />
                </div>
              ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>
                Categories
              </h2>

              <p>
                Current FINDLY network
              </p>
            </div>
          </div>

          <div className="category-list">
            {categories.map(
              (category) => (
                <div
                  className="category-row"
                  key={
                    category.id
                  }
                >
                  <span className="category-icon">
                    {category.icon ||
                      "📁"}
                  </span>

                  <div>
                    <strong>
                      {
                        category.name
                      }
                    </strong>

                    <small>
                      {
                        category.slug
                      }
                    </small>
                  </div>

                  <span
                    className={
                      category.is_active
                        ? "active-label"
                        : "inactive-label"
                    }
                  >
                    {category.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
              )
            )}

            {!loading &&
              categories.length ===
                0 && (
                <div className="empty">
                  No categories found
                </div>
              )}
          </div>
        </div>
      </section>

      <SystemPanel />
    </>
  );
}

function BotsSection({
  bots,
  loading,
  onRefresh,
  onCreate,
  onEdit,
  onToggle
}) {
  return (
    <>
      <section className="bots-toolbar">
        <div>
          <strong>
            {bots.length} bots
          </strong>

          <span>
            Manage FINDLY bots directly from the control center.
          </span>
        </div>

        <div className="toolbar-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={onCreate}
          >
            + Add Bot
          </button>
        </div>
      </section>

      <section className="panel bots-panel">
        <div className="panel-header">
          <div>
            <h2>All Bots</h2>

            <p>
              Live records from the FINDLY database.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty">
            Loading bots...
          </div>
        ) : bots.length ===
          0 ? (
          <div className="empty">
            No bots found.
          </div>
        ) : (
          <div className="bots-table-wrap">
            <table className="bots-table">
              <thead>
                <tr>
                  <th>
                    Bot
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Telegram
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Order
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {bots.map(
                  (bot) => (
                    <tr
                      key={
                        bot.id
                      }
                    >
                      <td>
                        <div className="table-bot">
                          <div className="bot-icon">
                            {bot.icon ||
                              "🤖"}
                          </div>

                          <div>
                            <strong>
                              {
                                bot.name
                              }
                            </strong>

                            <small>
                              {
                                bot.slug
                              }
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="type-badge">
                          {
                            bot.bot_type
                          }
                        </span>
                      </td>

                      <td>
                        {bot.telegram_username ||
                          "—"}
                      </td>

                      <td>
                        <BotStatus
                          bot={
                            bot
                          }
                        />
                      </td>

                      <td>
                        {
                          bot.sort_order ??
                          0
                        }
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            className="table-button"
                            type="button"
                            onClick={() =>
                              onEdit(
                                bot
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="table-button"
                            type="button"
                            onClick={() =>
                              onToggle(
                                bot
                              )
                            }
                          >
                            {bot.is_active
                              ? "Pause"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function BotModal({
  mode,
  form,
  saving,
  error,
  onChange,
  onClose,
  onSubmit
}) {
  const editing =
    mode !== "create";

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2>
              {editing
                ? "Edit Bot"
                : "Add Bot"}
            </h2>

            <p>
              {editing
                ? "Update this bot configuration."
                : "Create a new FINDLY bot."}
            </p>
          </div>

          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <form
          className="bot-form"
          onSubmit={onSubmit}
        >
          <div className="form-grid">
            <FormField
              label="Name"
              value={form.name}
              onChange={(value) =>
                onChange(
                  "name",
                  value
                )
              }
              placeholder="FINDLY Movies"
              required
            />

            <FormField
              label="Slug"
              value={form.slug}
              onChange={(value) =>
                onChange(
                  "slug",
                  value
                )
              }
              placeholder="movies"
              required
            />

            <FormField
              label="Bot Type"
              value={
                form.bot_type
              }
              onChange={(value) =>
                onChange(
                  "bot_type",
                  value
                )
              }
              placeholder="child"
              required
            />

            <FormField
              label="Telegram Username"
              value={
                form.telegram_username
              }
              onChange={(value) =>
                onChange(
                  "telegram_username",
                  value
                )
              }
              placeholder="@FindlyMoviesBot"
            />

            <FormField
              label="Icon"
              value={form.icon}
              onChange={(value) =>
                onChange(
                  "icon",
                  value
                )
              }
              placeholder="🎬"
            />

            <FormField
              label="Sort Order"
              type="number"
              value={
                form.sort_order
              }
              onChange={(value) =>
                onChange(
                  "sort_order",
                  value
                )
              }
              placeholder="0"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="bot-description">
              Description
            </label>

            <textarea
              id="bot-description"
              value={
                form.description
              }
              onChange={(event) =>
                onChange(
                  "description",
                  event.target.value
                )
              }
              placeholder="What this bot does..."
              rows={4}
            />
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={
                form.is_active
              }
              onChange={(event) =>
                onChange(
                  "is_active",
                  event.target
                    .checked
                )
              }
            />

            <span>
              Bot is active
            </span>
          </label>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={
                onClose
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Create Bot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false
}) {
  return (
    <div className="auth-field">
      <label>
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        required={required}
      />
    </div>
  );
}

function BotStatus({ bot }) {
  return (
    <div
      className={
        "status " +
        (bot.is_active
          ? "online"
          : "offline")
      }
    >
      <span />

      {bot.is_active
        ? "Active"
        : "Paused"}
    </div>
  );
}

function SystemPanel() {
  return (
    <section className="panel system-panel">
      <div className="panel-header">
        <div>
          <h2>
            System Status
          </h2>

          <p>
            Current FINDLY infrastructure
          </p>
        </div>
      </div>

      <div className="system-grid">
        <SystemItem
          label="Cloudflare API"
          value="Connected"
        />

        <SystemItem
          label="Supabase"
          value="Connected"
        />

        <SystemItem
          label="Database"
          value="Connected"
        />

        <SystemItem
          label="API Version"
          value="3.0.0"
        />
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}

function SystemItem({
  label,
  value
}) {
  return (
    <div className="system-item">
      <div>
        <strong>
          {label}
        </strong>

        <small>
          {value}
        </small>
      </div>

      <span className="system-dot" />
    </div>
  );
}

export default App;
