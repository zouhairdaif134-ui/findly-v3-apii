import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const API_URL =
  "https://findly-v3-api.berrchidcity99.workers.dev";

const MENU = [
  ["🏠", "Overview"],
  ["🤖", "Bots"],
  ["🗂️", "Categories"],
  ["🔘", "Menus"],
  ["🗃️", "Content"],
  ["👥", "Users"],
  ["🔔", "Notifications"],
  ["📊", "Analytics"],
  ["💰", "Monetization"],
  ["🤖", "AI"],
  ["👤", "Admins"],
  ["📝", "Activity Log"],
  ["⚙️", "Settings"]
];

const EMPTY_BOT = {
  name: "",
  slug: "",
  bot_type: "child",
  telegram_username: "",
  description: "",
  icon: "🤖",
  is_active: true,
  sort_order: 0
};

const EMPTY_CATEGORY = {
  name: "",
  slug: "",
  icon: "📁",
  description: "",
  is_active: true,
  sort_order: 0
};

const EMPTY_MENU = {
  bot_id: "",
  parent_id: "",
  label: "",
  icon: "🔘",
  action_type: "category",
  action_value: "",
  is_active: true,
  sort_order: 0
};

const EMPTY_CONTENT = {
  bot_id: "",
  category_id: "",
  content_type: "general",
  title: "",
  description: "",
  image_url: "",
  external_url: "",
  metadata: "{}",
  is_active: true,
  published_at: ""
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
  const [updatePasswordError, setUpdatePasswordError] = useState("");

  const [activeSection, setActiveSection] = useState("Overview");

  const [bots, setBots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menus, setMenus] = useState([]);
  const [users, setUsers] = useState([]);
  const [content, setContent] = useState([]);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [botModal, setBotModal] = useState(null);
  const [botForm, setBotForm] = useState({ ...EMPTY_BOT });
  const [botSaving, setBotSaving] = useState(false);
  const [botError, setBotError] = useState("");

  const [categoryModal, setCategoryModal] = useState(null);
  const [categoryForm, setCategoryForm] =
    useState({ ...EMPTY_CATEGORY });
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const [menuModal, setMenuModal] = useState(null);
  const [menuForm, setMenuForm] = useState({ ...EMPTY_MENU });
  const [menuSaving, setMenuSaving] = useState(false);
  const [menuError, setMenuError] = useState("");
  const [menuBotFilter, setMenuBotFilter] = useState("");

  const [contentModal, setContentModal] = useState(null);
  const [contentForm, setContentForm] =
    useState({ ...EMPTY_CONTENT });
  const [contentSaving, setContentSaving] = useState(false);
  const [contentError, setContentError] = useState("");
  const [contentBotFilter, setContentBotFilter] = useState("");
  const [contentCategoryFilter, setContentCategoryFilter] =
    useState("");

  const [userBotFilter, setUserBotFilter] = useState("");

  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState("");
  const [telegramError, setTelegramError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const {
          data: { session: currentSession }
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(currentSession);
        }
      } catch (error) {
        if (mounted) {
          setLoginError(
            error.message || "Failed to restore session."
          );
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;

        if (event === "PASSWORD_RECOVERY") {
          setRecoveryMode(true);
          setResetMode(false);
          setLoginError("");
        }

        setSession(currentSession);
        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || recoveryMode) {
      setBots([]);
      setCategories([]);
      setMenus([]);
      setUsers([]);
      setContent([]);
      return;
    }

    loadDashboard();
  }, [session, recoveryMode]);

  useEffect(() => {
    if (
      session &&
      !recoveryMode &&
      activeSection === "Menus" &&
      menuBotFilter
    ) {
      loadMenus(menuBotFilter);
    }
  }, [menuBotFilter, activeSection]);

  async function login(event) {
    event.preventDefault();

    try {
      setLoginLoading(true);
      setLoginError("");
      setResetMessage("");

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

      if (error) throw error;

      setPassword("");
    } catch (error) {
      setLoginError(error.message || "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function sendResetEmail(event) {
    event.preventDefault();

    try {
      setResetLoading(true);
      setLoginError("");
      setResetMessage("");

      if (!email.trim()) {
        throw new Error("Enter your email address.");
      }

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: window.location.origin
          }
        );

      if (error) throw error;

      setResetMessage(
        "If the account exists, a password reset email has been sent."
      );
    } catch (error) {
      setLoginError(
        error.message || "Unable to send reset email."
      );
    } finally {
      setResetLoading(false);
    }
  }

  async function updatePassword(event) {
    event.preventDefault();

    try {
      setUpdatePasswordLoading(true);
      setUpdatePasswordError("");

      if (newPassword.length < 8) {
        throw new Error(
          "Password must contain at least 8 characters."
        );
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const { error } =
        await supabase.auth.updateUser({
          password: newPassword
        });

      if (error) throw error;

      await supabase.auth.signOut();

      setSession(null);
      setRecoveryMode(false);
      setResetMode(false);
      setNewPassword("");
      setConfirmPassword("");
      setPassword("");

      setResetMessage(
        "Password updated successfully. You can now sign in."
      );
    } catch (error) {
      setUpdatePasswordError(
        error.message || "Unable to update password."
      );
    } finally {
      setUpdatePasswordLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function fetchApi(endpoint, options = {}) {
    if (!session?.access_token) {
      throw new Error("Authentication session is missing.");
    }

    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers: {
          Authorization:
            `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      }
    );

    const result =
      await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.error?.message ||
          `API request failed (${response.status})`
      );
    }

    return result.data ?? [];
  }

  async function loadDashboard() {
    if (!session?.access_token || recoveryMode) return;

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
      setCategories(categoriesData || []);
      setUsers(usersData || []);
      setContent(contentData || []);

      if (menuBotFilter) {
        await loadMenus(menuBotFilter);
      }
    } catch (error) {
      setApiError(
        error.message || "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMenus(botId) {
    if (!botId) {
      setMenus([]);
      return;
    }

    try {
      const slug = getBotSlug(botId);

      if (!slug) {
        setMenus([]);
        return;
      }

      const data = await fetchApi(
        `/api/menus?bot=${encodeURIComponent(slug)}`
      );

      setMenus(data || []);
    } catch (error) {
      setApiError(
        error.message || "Failed to load menus."
      );
    }
  }

  function getBotSlug(id) {
    return (
      bots.find((bot) => bot.id === id)?.slug || ""
    );
  }

  function getBotName(id) {
    return (
      bots.find((bot) => bot.id === id)?.name ||
      "Unknown bot"
    );
  }

  function getCategoryName(id) {
    return (
      categories.find(
        (category) => category.id === id
      )?.name || "No category"
    );
  }

  async function setupTelegramWebhook() {
    try {
      setTelegramLoading(true);
      setTelegramMessage("");
      setTelegramError("");

      const masterBot =
        bots.find((bot) => bot.bot_type === "master") ||
        bots.find((bot) => bot.slug === "findly");

      if (!masterBot) {
        throw new Error(
          "FINDLY master bot was not found in the database."
        );
      }

      const result = await fetchApi(
        `/api/telegram/webhook/${encodeURIComponent(
          masterBot.slug
        )}`,
        {
          method: "POST"
        }
      );

      setTelegramMessage(
        `Webhook connected successfully for ${masterBot.slug}.`
      );

      console.log("Telegram webhook:", result);
    } catch (error) {
      setTelegramError(
        error.message ||
          "Unable to connect Telegram webhook."
      );
    } finally {
      setTelegramLoading(false);
    }
  }

  async function saveBot(event) {
    event.preventDefault();

    try {
      setBotSaving(true);
      setBotError("");

      if (!botForm.name.trim()) {
        throw new Error("Bot name is required.");
      }

      if (!botForm.slug.trim()) {
        throw new Error("Bot slug is required.");
      }

      const payload = {
        ...botForm,
        name: botForm.name.trim(),
        slug: botForm.slug.trim(),
        telegram_username:
          botForm.telegram_username.trim() || null,
        description:
          botForm.description.trim() || null,
        icon: botForm.icon.trim() || "🤖",
        sort_order:
          Number(botForm.sort_order) || 0
      };

      if (botModal === "create") {
        await fetchApi("/api/bots", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi(`/api/bots/${botModal.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      }

      setBotModal(null);
      await loadDashboard();
    } catch (error) {
      setBotError(
        error.message || "Unable to save bot."
      );
    } finally {
      setBotSaving(false);
    }
  }

  async function toggleBot(bot) {
    try {
      setApiError("");

      await fetchApi(`/api/bots/${bot.id}`, {
        method: "PUT",
        body: JSON.stringify({
          is_active: !bot.is_active
        })
      });

      await loadDashboard();
    } catch (error) {
      setApiError(
        error.message || "Unable to update bot."
      );
    }
  }

  async function saveCategory(event) {
    event.preventDefault();

    try {
      setCategorySaving(true);
      setCategoryError("");

      if (!categoryForm.name.trim()) {
        throw new Error("Category name is required.");
      }

      if (!categoryForm.slug.trim()) {
        throw new Error("Category slug is required.");
      }

      const payload = {
        ...categoryForm,
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim(),
        icon: categoryForm.icon.trim() || "📁",
        description:
          categoryForm.description.trim() || null,
        sort_order:
          Number(categoryForm.sort_order) || 0
      };

      if (categoryModal === "create") {
        await fetchApi("/api/categories", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi(
          `/api/categories/${categoryModal.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload)
          }
        );
      }

      setCategoryModal(null);
      await loadDashboard();
    } catch (error) {
      setCategoryError(
        error.message || "Unable to save category."
      );
    } finally {
      setCategorySaving(false);
    }
  }

  async function toggleCategory(category) {
    try {
      await fetchApi(
        `/api/categories/${category.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            is_active: !category.is_active
          })
        }
      );

      await loadDashboard();
    } catch (error) {
      setApiError(
        error.message || "Unable to update category."
      );
    }
  }

  async function saveMenu(event) {
    event.preventDefault();

    try {
      setMenuSaving(true);
      setMenuError("");

      if (!menuForm.bot_id) {
        throw new Error("Select a bot.");
      }

      if (!menuForm.label.trim()) {
        throw new Error("Menu label is required.");
      }

      const payload = {
        ...menuForm,
        parent_id: menuForm.parent_id || null,
        label: menuForm.label.trim(),
        icon: menuForm.icon.trim() || "🔘",
        action_type:
          menuForm.action_type.trim() || "category",
        action_value:
          menuForm.action_value.trim() || null,
        sort_order:
          Number(menuForm.sort_order) || 0
      };

      if (menuModal === "create") {
        await fetchApi("/api/menus", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi(`/api/menus/${menuModal.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      }

      setMenuModal(null);
      setMenuBotFilter(payload.bot_id);
      await loadMenus(payload.bot_id);
    } catch (error) {
      setMenuError(
        error.message || "Unable to save menu."
      );
    } finally {
      setMenuSaving(false);
    }
  }

  async function toggleMenu(item) {
    try {
      await fetchApi(`/api/menus/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({
          is_active: !item.is_active
        })
      });

      await loadMenus(item.bot_id);
    } catch (error) {
      setApiError(
        error.message || "Unable to update menu."
      );
    }
  }

  async function saveContent(event) {
    event.preventDefault();

    try {
      setContentSaving(true);
      setContentError("");

      if (!contentForm.bot_id) {
        throw new Error("Select a bot.");
      }

      if (!contentForm.title.trim()) {
        throw new Error("Content title is required.");
      }

      let metadata = {};

      try {
        metadata = JSON.parse(
          contentForm.metadata || "{}"
        );
      } catch {
        throw new Error(
          "Metadata must contain valid JSON."
        );
      }

      const payload = {
        ...contentForm,
        bot_id: contentForm.bot_id,
        category_id:
          contentForm.category_id || null,
        content_type:
          contentForm.content_type.trim() || "general",
        title: contentForm.title.trim(),
        description:
          contentForm.description.trim() || null,
        image_url:
          contentForm.image_url.trim() || null,
        external_url:
          contentForm.external_url.trim() || null,
        metadata,
        published_at:
          contentForm.published_at || null
      };

      if (contentModal === "create") {
        await fetchApi("/api/content", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi(
          `/api/content/${contentModal.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload)
          }
        );
      }

      setContentModal(null);
      await loadDashboard();
    } catch (error) {
      setContentError(
        error.message || "Unable to save content."
      );
    } finally {
      setContentSaving(false);
    }
  }

  async function toggleContent(item) {
    try {
      await fetchApi(
        `/api/content/${item.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            is_active: !item.is_active
          })
        }
      );

      await loadDashboard();
    } catch (error) {
      setApiError(
        error.message || "Unable to update content."
      );
    }
  }

  function openCreateBot() {
    setBotForm({ ...EMPTY_BOT });
    setBotError("");
    setBotModal("create");
  }

  function openEditBot(bot) {
    setBotForm({
      name: bot.name || "",
      slug: bot.slug || "",
      bot_type: bot.bot_type || "child",
      telegram_username:
        bot.telegram_username || "",
      description: bot.description || "",
      icon: bot.icon || "🤖",
      is_active: bot.is_active !== false,
      sort_order: bot.sort_order ?? 0
    });

    setBotError("");
    setBotModal(bot);
  }

  function openCreateCategory() {
    setCategoryForm({ ...EMPTY_CATEGORY });
    setCategoryError("");
    setCategoryModal("create");
  }

  function openEditCategory(category) {
    setCategoryForm({
      name: category.name || "",
      slug: category.slug || "",
      icon: category.icon || "📁",
      description: category.description || "",
      is_active: category.is_active !== false,
      sort_order: category.sort_order ?? 0
    });

    setCategoryError("");
    setCategoryModal(category);
  }

  function openCreateMenu() {
    if (!bots.length) {
      setApiError(
        "Create a bot before creating a menu item."
      );
      return;
    }

    const botId =
      menuBotFilter || bots[0]?.id || "";

    setMenuForm({
      ...EMPTY_MENU,
      bot_id: botId
    });

    setMenuError("");
    setMenuModal("create");
  }

  function openEditMenu(item) {
    setMenuForm({
      bot_id: item.bot_id || "",
      parent_id: item.parent_id || "",
      label: item.label || "",
      icon: item.icon || "🔘",
      action_type:
        item.action_type || "category",
      action_value: item.action_value || "",
      is_active: item.is_active !== false,
      sort_order: item.sort_order ?? 0
    });

    setMenuError("");
    setMenuModal(item);
  }

  function openCreateContent() {
    if (!bots.length) {
      setApiError(
        "Create a bot before creating content."
      );
      return;
    }

    setContentForm({
      ...EMPTY_CONTENT,
      bot_id:
        contentBotFilter ||
        bots[0]?.id ||
        ""
    });

    setContentError("");
    setContentModal("create");
  }

  function openEditContent(item) {
    setContentForm({
      bot_id: item.bot_id || "",
      category_id: item.category_id || "",
      content_type:
        item.content_type || "general",
      title: item.title || "",
      description: item.description || "",
      image_url: item.image_url || "",
      external_url: item.external_url || "",
      metadata: JSON.stringify(
        item.metadata || {},
        null,
        2
      ),
      is_active: item.is_active !== false,
      published_at:
        item.published_at
          ? toDateTimeLocal(item.published_at)
          : ""
    });

    setContentError("");
    setContentModal(item);
  }

  const visibleContent = content.filter((item) => {
    if (
      contentBotFilter &&
      item.bot_id !== contentBotFilter
    ) {
      return false;
    }

    if (
      contentCategoryFilter &&
      item.category_id !== contentCategoryFilter
    ) {
      return false;
    }

    return true;
  });

  const visibleUsers = users.filter((user) => {
    if (!userBotFilter) return true;
    return true;
  });

  const activeBots =
    bots.filter((bot) => bot.is_active).length;

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>FINDLY</h1>
          <p>Loading secure dashboard...</p>
        </div>
      </div>
    );
  }

  if (recoveryMode) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Set new password</h1>
          <p>
            Choose a new password for your FINDLY
            owner account.
          </p>

          <form
            className="auth-form"
            onSubmit={updatePassword}
          >
            <div className="auth-field">
              <label>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                minLength={8}
                required
              />
            </div>

            <div className="auth-field">
              <label>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                minLength={8}
                required
              />
            </div>

            {updatePasswordError && (
              <div className="auth-error">
                {updatePasswordError}
              </div>
            )}

            <button
              className="auth-button"
              disabled={updatePasswordLoading}
            >
              {updatePasswordLoading
                ? "Updating..."
                : "Update password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <LoginPage
        email={email}
        password={password}
        resetMode={resetMode}
        loading={loginLoading || resetLoading}
        error={loginError}
        message={resetMessage}
        onEmail={setEmail}
        onPassword={setPassword}
        onLogin={login}
        onReset={sendResetEmail}
        onToggleReset={() => {
          setResetMode(!resetMode);
          setLoginError("");
          setResetMessage("");
        }}
      />
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🔎</div>
          <div>
            <strong>FINDLY</strong>
            <span>MASTER ADMIN</span>
          </div>
        </div>

        <nav>
          {MENU.map(([icon, label]) => (
            <button
              key={label}
              className={
                "nav-item " +
                (activeSection === label
                  ? "active"
                  : "")
              }
              onClick={() =>
                setActiveSection(label)
              }
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="owner-badge">
            <div className="avatar">👑</div>
            <div>
              <strong>FINDLY Owner</strong>
              <small>Full control</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <h1>{activeSection}</h1>
            <p>
              FINDLY master control center
            </p>
          </div>

          <div className="header-actions">
            <button
              className="icon-button"
              onClick={loadDashboard}
              title="Refresh"
            >
              ↻
            </button>

            <div className="profile">
              <div className="avatar">👑</div>
              <div>
                <strong>Owner</strong>
                <small>
                  {session.user?.email}
                </small>
              </div>
            </div>

            <button
              className="secondary-button"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </header>

        {apiError && (
          <div className="error-box">
            {apiError}
          </div>
        )}

        {loading && (
          <div className="loading-bar">
            Loading FINDLY data...
          </div>
        )}

        {activeSection === "Overview" && (
          <Overview
            bots={bots}
            categories={categories}
            users={users}
            content={content}
            activeBots={activeBots}
          />
        )}

        {activeSection === "Bots" && (
          <BotsSection
            bots={bots}
            onCreate={openCreateBot}
            onEdit={openEditBot}
            onToggle={toggleBot}
          />
        )}

        {activeSection === "Categories" && (
          <CategoriesSection
            categories={categories}
            onCreate={openCreateCategory}
            onEdit={openEditCategory}
            onToggle={toggleCategory}
          />
        )}

        {activeSection === "Menus" && (
          <MenusSection
            bots={bots}
            menus={menus}
            filter={menuBotFilter}
            setFilter={setMenuBotFilter}
            onCreate={openCreateMenu}
            onEdit={openEditMenu}
            onToggle={toggleMenu}
          />
        )}

        {activeSection === "Content" && (
          <ContentSection
            bots={bots}
            categories={categories}
            content={visibleContent}
            botFilter={contentBotFilter}
            categoryFilter={contentCategoryFilter}
            setBotFilter={setContentBotFilter}
            setCategoryFilter={setContentCategoryFilter}
            onCreate={openCreateContent}
            onEdit={openEditContent}
            onToggle={toggleContent}
          />
        )}

        {activeSection === "Users" && (
          <UsersSection
            users={visibleUsers}
            bots={bots}
            filter={userBotFilter}
            setFilter={setUserBotFilter}
          />
        )}

        {activeSection === "Settings" && (
          <SettingsSection
            bots={bots}
            telegramLoading={telegramLoading}
            telegramMessage={telegramMessage}
            telegramError={telegramError}
            onSetupWebhook={setupTelegramWebhook}
          />
        )}

        {[
          "Notifications",
          "Analytics",
          "Monetization",
          "AI",
          "Admins",
          "Activity Log"
        ].includes(activeSection) && (
          <ComingSoon section={activeSection} />
        )}
      </main>

      {botModal && (
        <BotModal
          mode={botModal}
          form={botForm}
          saving={botSaving}
          error={botError}
          onChange={(key, value) =>
            setBotForm((current) => ({
              ...current,
              [key]: value
            }))
          }
          onClose={() => {
            if (!botSaving) {
              setBotModal(null);
            }
          }}
          onSubmit={saveBot}
        />
      )}

      {categoryModal && (
        <CategoryModal
          mode={categoryModal}
          form={categoryForm}
          saving={categorySaving}
          error={categoryError}
          onChange={(key, value) =>
            setCategoryForm((current) => ({
              ...current,
              [key]: value
            }))
          }
          onClose={() => {
            if (!categorySaving) {
              setCategoryModal(null);
            }
          }}
          onSubmit={saveCategory}
        />
      )}

      {menuModal && (
        <MenuModal
          mode={menuModal}
          form={menuForm}
          bots={bots}
          menus={menus}
          saving={menuSaving}
          error={menuError}
          onChange={(key, value) =>
            setMenuForm((current) => ({
              ...current,
              [key]: value
            }))
          }
          onClose={() => {
            if (!menuSaving) {
              setMenuModal(null);
            }
          }}
          onSubmit={saveMenu}
        />
      )}

      {contentModal && (
        <ContentModal
          mode={contentModal}
          form={contentForm}
          bots={bots}
          categories={categories}
          saving={contentSaving}
          error={contentError}
          onChange={(key, value) =>
            setContentForm((current) => ({
              ...current,
              [key]: value
            }))
          }
          onClose={() => {
            if (!contentSaving) {
              setContentModal(null);
            }
          }}
          onSubmit={saveContent}
        />
      )}
    </div>
  );
}

/* =========================
   LOGIN
========================= */

function LoginPage({
  email,
  password,
  resetMode,
  loading,
  error,
  message,
  onEmail,
  onPassword,
  onLogin,
  onReset,
  onToggleReset
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>FINDLY</h1>

        <p>
          Master Admin Dashboard
        </p>

        <form
          className="auth-form"
          onSubmit={
            resetMode ? onReset : onLogin
          }
        >
          <div className="auth-field">
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                onEmail(e.target.value)
              }
              autoComplete="email"
              required
            />
          </div>

          {!resetMode && (
            <div className="auth-field">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  onPassword(e.target.value)
                }
                autoComplete="current-password"
                required
              />
            </div>
          )}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-success">
              {message}
            </div>
          )}

          <button
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : resetMode
              ? "Send reset email"
              : "Sign in"}
          </button>

          <button
            type="button"
            className="auth-link"
            onClick={onToggleReset}
          >
            {resetMode
              ? "Back to sign in"
              : "Forgot password?"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================
   OVERVIEW
========================= */

function Overview({
  bots,
  categories,
  users,
  content,
  activeBots
}) {
  return (
    <>
      <div className="stats">
        <StatCard
          icon="🤖"
          label="Total Bots"
          value={bots.length}
        />

        <StatCard
          icon="🟢"
          label="Active Bots"
          value={activeBots}
        />

        <StatCard
          icon="👥"
          label="Telegram Users"
          value={users.length}
        />

        <StatCard
          icon="🗃️"
          label="Content Items"
          value={content.length}
        />
      </div>

      <div className="grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Bots Network</h2>
              <p>
                Master and child FINDLY bots
              </p>
            </div>
          </div>

          {bots.length === 0 ? (
            <div className="empty">
              No bots found.
            </div>
          ) : (
            <div className="bot-list">
              {bots.map((bot) => (
                <div
                  className="bot-row"
                  key={bot.id}
                >
                  <div className="bot-icon">
                    {bot.icon || "🤖"}
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

                  <StatusBadge
                    active={bot.is_active}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Categories</h2>
              <p>
                Global FINDLY categories
              </p>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="empty">
              No categories found.
            </div>
          ) : (
            <div className="category-list">
              {categories
                .slice(0, 8)
                .map((category) => (
                  <div
                    className="category-row"
                    key={category.id}
                  >
                    <div className="category-icon">
                      {category.icon || "📁"}
                    </div>

                    <div>
                      <strong>
                        {category.name}
                      </strong>

                      <small>
                        {category.slug}
                      </small>
                    </div>

                    {category.is_active ? (
                      <span className="active-label">
                        Active
                      </span>
                    ) : (
                      <span className="inactive-label">
                        Paused
                      </span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>

      <SystemPanel
        bots={bots}
        activeBots={activeBots}
      />
    </>
  );
}

/* =========================
   BOTS
========================= */

function BotsSection({
  bots,
  onCreate,
  onEdit,
  onToggle
}) {
  return (
    <>
      <ManagementToolbar
        title="Bots Management"
        description="Manage the FINDLY master and child bot network."
        actionLabel="+ Add Bot"
        onAction={onCreate}
      />

      <section className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bot</th>
                <th>Type</th>
                <th>Telegram</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {bots.map((bot) => (
                <tr key={bot.id}>
                  <td>
                    <div className="table-entity">
                      <div className="table-icon">
                        {bot.icon || "🤖"}
                      </div>

                      <div>
                        <strong>
                          {bot.name}
                        </strong>

                        <small>
                          {bot.slug}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="type-badge">
                      {bot.bot_type}
                    </span>
                  </td>

                  <td>
                    {bot.telegram_username ||
                      "—"}
                  </td>

                  <td>
                    <StatusBadge
                      active={bot.is_active}
                    />
                  </td>

                  <td>
                    <div className="row-actions">
                      <button
                        className="table-button"
                        onClick={() =>
                          onEdit(bot)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="table-button"
                        onClick={() =>
                          onToggle(bot)
                        }
                      >
                        {bot.is_active
                          ? "Pause"
                          : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {bots.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty">
                      No bots found.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* =========================
   CATEGORIES
========================= */

function CategoriesSection({
  categories,
  onCreate,
  onEdit,
  onToggle
}) {
  return (
    <>
      <ManagementToolbar
        title="Categories"
        description="Manage global FINDLY categories."
        actionLabel="+ Add Category"
        onAction={onCreate}
      />

      <section className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <div className="table-entity">
                      <div className="table-icon">
                        {category.icon || "📁"}
                      </div>

                      <div>
                        <strong>
                          {category.name}
                        </strong>

                        <small>
                          {category.description ||
                            "—"}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <code>
                      {category.slug}
                    </code>
                  </td>

                  <td>
                    {category.sort_order}
                  </td>

                  <td>
                    <StatusBadge
                      active={
                        category.is_active
                      }
                    />
                  </td>

                  <td>
                    <div className="row-actions">
                      <button
                        className="table-button"
                        onClick={() =>
                          onEdit(category)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="table-button"
                        onClick={() =>
                          onToggle(category)
                        }
                      >
                        {category.is_active
                          ? "Pause"
                          : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {categories.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty">
                      No categories found.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* =========================
   MENUS
========================= */

function MenusSection({
  bots,
  menus,
  filter,
  setFilter,
  onCreate,
  onEdit,
  onToggle
}) {
  return (
    <>
      <ManagementToolbar
        title="Menu Builder"
        description="Control Telegram navigation dynamically."
        actionLabel="+ Add Menu Item"
        onAction={onCreate}
      >
        <select
          className="toolbar-select"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >
          <option value="">
            Select bot
          </option>

          {bots.map((bot) => (
            <option
              key={bot.id}
              value={bot.id}
            >
              {bot.name}
            </option>
          ))}
        </select>
      </ManagementToolbar>

      <section className="panel">
        {!filter ? (
          <div className="empty large-empty">
            Select a bot to manage its menu.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Menu Item</th>
                  <th>Action</th>
                  <th>Value</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {menus.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.icon || "🔘"}{" "}
                      {item.label}
                    </td>

                    <td>
                      <span className="type-badge">
                        {item.action_type}
                      </span>
                    </td>

                    <td>
                      {item.action_value ||
                        "—"}
                    </td>

                    <td>
                      {item.sort_order}
                    </td>

                    <td>
                      <StatusBadge
                        active={
                          item.is_active
                        }
                      />
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          className="table-button"
                          onClick={() =>
                            onEdit(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="table-button"
                          onClick={() =>
                            onToggle(item)
                          }
                        >
                          {item.is_active
                            ? "Pause"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {menus.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty">
                        No menu items found.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

/* =========================
   CONTENT
========================= */

function ContentSection({
  bots,
  categories,
  content,
  botFilter,
  categoryFilter,
  setBotFilter,
  setCategoryFilter,
  onCreate,
  onEdit,
  onToggle
}) {
  return (
    <>
      <ManagementToolbar
        title="Content"
        description="Manage content served by FINDLY bots."
        actionLabel="+ Add Content"
        onAction={onCreate}
      >
        <select
          className="toolbar-select"
          value={botFilter}
          onChange={(e) =>
            setBotFilter(e.target.value)
          }
        >
          <option value="">
            All bots
          </option>

          {bots.map((bot) => (
            <option
              key={bot.id}
              value={bot.id}
            >
              {bot.name}
            </option>
          ))}
        </select>

        <select
          className="toolbar-select"
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(
              e.target.value
            )
          }
        >
          <option value="">
            All categories
          </option>

          {categories.map((category) => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>
          ))}
        </select>
      </ManagementToolbar>

      <section className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Content</th>
                <th>Bot</th>
                <th>Category</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {content.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="content-title">
                      <strong>
                        {item.title}
                      </strong>

                      <small>
                        {item.description ||
                          "—"}
                      </small>
                    </div>
                  </td>

                  <td>
                    {bots.find(
                      (bot) =>
                        bot.id === item.bot_id
                    )?.name || "—"}
                  </td>

                  <td>
                    {categories.find(
                      (category) =>
                        category.id ===
                        item.category_id
                    )?.name || "—"}
                  </td>

                  <td>
                    <span className="type-badge">
                      {item.content_type}
                    </span>
                  </td>

                  <td>
                    <StatusBadge
                      active={
                        item.is_active
                      }
                    />
                  </td>

                  <td>
                    <div className="row-actions">
                      <button
                        className="table-button"
                        onClick={() =>
                          onEdit(item)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="table-button"
                        onClick={() =>
                          onToggle(item)
                        }
                      >
                        {item.is_active
                          ? "Pause"
                          : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {content.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <div className="empty">
                      No content found.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* =========================
   USERS
========================= */

function UsersSection({
  users,
  bots,
  filter,
  setFilter
}) {
  return (
    <>
      <ManagementToolbar
        title="Telegram Users"
        description="Users registered through FINDLY Telegram bots."
      >
        <select
          className="toolbar-select"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >
          <option value="">
            All bots
          </option>

          {bots.map((bot) => (
            <option
              key={bot.id}
              value={bot.id}
            >
              {bot.name}
            </option>
          ))}
        </select>
      </ManagementToolbar>

      <section className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Telegram ID</th>
                <th>Language</th>
                <th>Last Seen</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="content-title">
                      <strong>
                        {user.first_name ||
                          user.username ||
                          "Telegram User"}
                      </strong>

                      <small>
                        {user.username
                          ? `@${user.username}`
                          : "—"}
                      </small>
                    </div>
                  </td>

                  <td>
                    {user.telegram_user_id}
                  </td>

                  <td>
                    {user.language_code ||
                      "—"}
                  </td>

                  <td>
                    {formatDate(
                      user.last_seen_at
                    )}
                  </td>

                  <td>
                    <StatusBadge
                      active={
                        user.is_active
                      }
                    />
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty">
                      No users found.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* =========================
   SETTINGS / TELEGRAM
========================= */

function SettingsSection({
  bots,
  telegramLoading,
  telegramMessage,
  telegramError,
  onSetupWebhook
}) {
  const master =
    bots.find(
      (bot) => bot.bot_type === "master"
    ) ||
    bots.find(
      (bot) => bot.slug === "findly"
    );

  return (
    <>
      <section className="panel system-panel">
        <div className="panel-header">
          <div>
            <h2>Telegram Integration</h2>
            <p>
              Connect the existing FINDLY master
              Telegram bot to the Cloudflare Worker.
            </p>
          </div>
        </div>

        <div className="system-grid">
          <SystemItem
            label="Master Bot"
            value={
              master?.telegram_username ||
              master?.slug ||
              "Not configured"
            }
          />

          <SystemItem
            label="Backend"
            value="Cloudflare Worker"
          />

          <SystemItem
            label="Webhook"
            value={
              telegramMessage
                ? "Connected"
                : "Ready"
            }
          />

          <SystemItem
            label="Token"
            value="Server secret"
          />
        </div>

        <div
          style={{
            marginTop: "18px"
          }}
        >
          <button
            className="primary-button"
            onClick={onSetupWebhook}
            disabled={
              telegramLoading || !master
            }
          >
            {telegramLoading
              ? "Connecting..."
              : "Connect Telegram Webhook"}
          </button>
        </div>

        {telegramMessage && (
          <div
            className="auth-success"
            style={{
              marginTop: "15px"
            }}
          >
            {telegramMessage}
          </div>
        )}

        {telegramError && (
          <div
            className="auth-error"
            style={{
              marginTop: "15px"
            }}
          >
            {telegramError}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Architecture</h2>
            <p>
              Telegram credentials remain server-side.
            </p>
          </div>
        </div>

        <div className="empty">
          Dashboard → Cloudflare API → Telegram
          <br />
          Telegram token → Cloudflare Secret
          <br />
          Webhook secret → Cloudflare Secret
        </div>
      </section>
    </>
  );
}

/* =========================
   MODALS
========================= */

function BotModal({
  mode,
  form,
  saving,
  error,
  onChange,
  onClose,
  onSubmit
}) {
  return (
    <Modal
      title={
        mode === "create"
          ? "Create Bot"
          : "Edit Bot"
      }
      subtitle="Configure a FINDLY bot."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={onSubmit}
      >
        <div className="form-grid">
          <FormField
            label="Name"
            value={form.name}
            onChange={(v) =>
              onChange("name", v)
            }
            required
          />

          <FormField
            label="Slug"
            value={form.slug}
            onChange={(v) =>
              onChange("slug", v)
            }
            required
          />

          <FormField
            label="Bot Type"
            value={form.bot_type}
            onChange={(v) =>
              onChange("bot_type", v)
            }
            required
          />

          <FormField
            label="Telegram Username"
            value={
              form.telegram_username
            }
            onChange={(v) =>
              onChange(
                "telegram_username",
                v
              )
            }
            placeholder="@FindlySearch2026Bot"
          />

          <FormField
            label="Icon"
            value={form.icon}
            onChange={(v) =>
              onChange("icon", v)
            }
          />

          <FormField
            label="Sort Order"
            type="number"
            value={form.sort_order}
            onChange={(v) =>
              onChange(
                "sort_order",
                v
              )
            }
          />
        </div>

        <FormField
          label="Description"
          value={form.description}
          onChange={(v) =>
            onChange(
              "description",
              v
            )
          }
          textarea
        />

        <CheckboxField
          checked={form.is_active}
          onChange={(v) =>
            onChange(
              "is_active",
              v
            )
          }
          label="Bot is active"
        />

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <ModalActions
          saving={saving}
          onClose={onClose}
          label={
            mode === "create"
              ? "Create Bot"
              : "Save Changes"
          }
        />
      </form>
    </Modal>
  );
}

function CategoryModal({
  mode,
  form,
  saving,
  error,
  onChange,
  onClose,
  onSubmit
}) {
  return (
    <Modal
      title={
        mode === "create"
          ? "Create Category"
          : "Edit Category"
      }
      subtitle="Manage a FINDLY category."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={onSubmit}
      >
        <div className="form-grid">
          <FormField
            label="Name"
            value={form.name}
            onChange={(v) =>
              onChange("name", v)
            }
            required
          />

          <FormField
            label="Slug"
            value={form.slug}
            onChange={(v) =>
              onChange("slug", v)
            }
            required
          />

          <FormField
            label="Icon"
            value={form.icon}
            onChange={(v) =>
              onChange("icon", v)
            }
          />

          <FormField
            label="Sort Order"
            type="number"
            value={form.sort_order}
            onChange={(v) =>
              onChange(
                "sort_order",
                v
              )
            }
          />
        </div>

        <FormField
          label="Description"
          value={form.description}
          onChange={(v) =>
            onChange(
              "description",
              v
            )
          }
          textarea
        />

        <CheckboxField
          checked={form.is_active}
          onChange={(v) =>
            onChange(
              "is_active",
              v
            )
          }
          label="Category is active"
        />

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <ModalActions
          saving={saving}
          onClose={onClose}
          label={
            mode === "create"
              ? "Create Category"
              : "Save Changes"
          }
        />
      </form>
    </Modal>
  );
}

function MenuModal({
  mode,
  form,
  bots,
  menus,
  saving,
  error,
  onChange,
  onClose,
  onSubmit
}) {
  const parents = menus.filter(
    (item) =>
      item.id !== mode?.id &&
      item.bot_id === form.bot_id &&
      !item.parent_id
  );

  return (
    <Modal
      title={
        mode === "create"
          ? "Create Menu Item"
          : "Edit Menu Item"
      }
      subtitle="Build Telegram navigation."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={onSubmit}
      >
        <div className="form-grid">
          <SelectField
            label="Bot"
            value={form.bot_id}
            onChange={(v) =>
              onChange("bot_id", v)
            }
            options={bots.map((bot) => ({
              value: bot.id,
              label: bot.name
            }))}
          />

          <FormField
            label="Label"
            value={form.label}
            onChange={(v) =>
              onChange("label", v)
            }
            placeholder="🎬 Movies"
            required
          />

          <FormField
            label="Icon"
            value={form.icon}
            onChange={(v) =>
              onChange("icon", v)
            }
          />

          <SelectField
            label="Parent"
            value={form.parent_id}
            onChange={(v) =>
              onChange(
                "parent_id",
                v
              )
            }
            options={[
              {
                value: "",
                label: "Root menu"
              },
              ...parents.map((item) => ({
                value: item.id,
                label:
                  `${item.icon || "🔘"} ${item.label}`
              }))
            ]}
          />

          <SelectField
            label="Action Type"
            value={form.action_type}
            onChange={(v) =>
              onChange(
                "action_type",
                v
              )
            }
            options={[
              "category",
              "bot",
              "url",
              "command",
              "callback",
              "external"
            ].map((value) => ({
              value,
              label: value
            }))}
          />

          <FormField
            label="Action Value"
            value={form.action_value}
            onChange={(v) =>
              onChange(
                "action_value",
                v
              )
            }
          />

          <FormField
            label="Sort Order"
            type="number"
            value={form.sort_order}
            onChange={(v) =>
              onChange(
                "sort_order",
                v
              )
            }
          />
        </div>

        <CheckboxField
          checked={form.is_active}
          onChange={(v) =>
            onChange(
              "is_active",
              v
            )
          }
          label="Menu item is active"
        />

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <ModalActions
          saving={saving}
          onClose={onClose}
          label={
            mode === "create"
              ? "Create Menu Item"
              : "Save Changes"
          }
        />
      </form>
    </Modal>
  );
}

function ContentModal({
  mode,
  form,
  bots,
  categories,
  saving,
  error,
  onChange,
  onClose,
  onSubmit
}) {
  return (
    <Modal
      title={
        mode === "create"
          ? "Create Content"
          : "Edit Content"
      }
      subtitle="Manage FINDLY content."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={onSubmit}
      >
        <div className="form-grid">
          <SelectField
            label="Bot"
            value={form.bot_id}
            onChange={(v) =>
              onChange("bot_id", v)
            }
            options={bots.map((bot) => ({
              value: bot.id,
              label: bot.name
            }))}
          />

          <SelectField
            label="Category"
            value={form.category_id}
            onChange={(v) =>
              onChange(
                "category_id",
                v
              )
            }
            options={[
              {
                value: "",
                label: "No category"
              },
              ...categories.map(
                (category) => ({
                  value: category.id,
                  label:
                    `${category.icon || "📁"} ${category.name}`
                })
              )
            ]}
          />

          <FormField
            label="Content Type"
            value={form.content_type}
            onChange={(v) =>
              onChange(
                "content_type",
                v
              )
            }
          />

          <FormField
            label="Title"
            value={form.title}
            onChange={(v) =>
              onChange("title", v)
            }
            required
          />

          <FormField
            label="Image URL"
            value={form.image_url}
            onChange={(v) =>
              onChange(
                "image_url",
                v
              )
            }
          />

          <FormField
            label="External URL"
            value={form.external_url}
            onChange={(v) =>
              onChange(
                "external_url",
                v
              )
            }
          />

          <FormField
            label="Published At"
            type="datetime-local"
            value={form.published_at}
            onChange={(v) =>
              onChange(
                "published_at",
                v
              )
            }
          />
        </div>

        <FormField
          label="Description"
          value={form.description}
          onChange={(v) =>
            onChange(
              "description",
              v
            )
          }
          textarea
        />

        <FormField
          label="Metadata JSON"
          value={form.metadata}
          onChange={(v) =>
            onChange(
              "metadata",
              v
            )
          }
          textarea
        />

        <CheckboxField
          checked={form.is_active}
          onChange={(v) =>
            onChange(
              "is_active",
              v
            )
          }
          label="Content is active"
        />

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <ModalActions
          saving={saving}
          onClose={onClose}
          label={
            mode === "create"
              ? "Create Content"
              : "Save Changes"
          }
        />
      </form>
    </Modal>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          <button
            className="modal-close"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function ModalActions({
  saving,
  onClose,
  label
}) {
  return (
    <div className="modal-actions">
      <button
        className="secondary-button"
        type="button"
        onClick={onClose}
        disabled={saving}
