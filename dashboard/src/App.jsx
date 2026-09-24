import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const API_URL =
  "https://findly-v3-api.berrchidcity99.workers.dev";

const menu = [
  { icon: "🏠", label: "Overview", active: true },
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

function App() {
  const [bots, setBots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  async function fetchApi(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || "API error");
    }

    return result.data || [];
  }

  useEffect(() => {
    async function loadDashboard() {
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

        setBots(botsData);
        setCategories(categoriesData);
        setUsers(usersData);
        setContent(contentData);
      } catch (error) {
        console.error(error);
        setApiError(error.message || "Failed to load API");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">F</div>
          <div>
            <strong>FINDLY</strong>
            <span>ADMIN</span>
          </div>
        </div>

        <nav>
          {menu.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${
                item.active ? "active" : ""
              }`}
              type="button"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="owner-badge">
            <span>👑</span>
            <div>
              <strong>Owner</strong>
              <small>Full Access</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <h1>Overview</h1>
            <p>FINDLY control center</p>
          </div>

          <div className="header-actions">
            <button className="icon-button" type="button">
              🔔
            </button>

            <div className="profile">
              <div className="avatar">F</div>
              <div>
                <strong>FINDLY Owner</strong>
                <small>Administrator</small>
              </div>
            </div>
          </div>
        </header>

        {apiError && (
          <div className="error-box">
            API Error: {apiError}
          </div>
        )}

        <section className="stats">
          <StatCard
            icon="🤖"
            label="Bots"
            value={loading ? "…" : bots.length}
          />

          <StatCard
            icon="🗂️"
            label="Categories"
            value={loading ? "…" : categories.length}
          />

          <StatCard
            icon="👥"
            label="Users"
            value={loading ? "…" : users.length}
          />

          <StatCard
            icon="🗃️"
            label="Content"
            value={loading ? "…" : content.length}
          />
        </section>

        <section className="grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Bots</h2>
                <p>Connected FINDLY bots</p>
              </div>

              <button className="secondary-button" type="button">
                View All
              </button>
            </div>

            <div className="bot-list">
              {loading && (
                <div className="empty">
                  Loading...
                </div>
              )}

              {!loading && bots.length === 0 && (
                <div className="empty">
                  No bots found
                </div>
              )}

              {!loading &&
                bots.map((bot) => (
                  <div className="bot-row" key={bot.id}>
                    <div className="bot-icon">
                      {bot.icon || "🤖"}
                    </div>

                    <div className="bot-info">
                      <strong>{bot.name}</strong>
                      <span>
                        {bot.telegram_username ||
                          bot.slug}
                      </span>
                    </div>

                    <div
                      className={`status ${
                        bot.is_active
                          ? "online"
                          : "offline"
                      }`}
                    >
                      <span />
                      {bot.is_active
                        ? "Active"
                        : "Paused"}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Categories</h2>
                <p>Current FINDLY network</p>
              </div>

              <button className="secondary-button" type="button">
                Manage
              </button>
            </div>

            <div className="category-list">
              {categories.map((category) => (
                <div
                  className="category-row"
                  key={category.id}
                >
                  <span className="category-icon">
                    {category.icon || "📁"}
                  </span>

                  <div>
                    <strong>{category.name}</strong>
                    <small>{category.slug}</small>
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
              ))}

              {!loading && categories.length === 0 && (
                <div className="empty">
                  No categories found
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="panel system-panel">
          <div className="panel-header">
            <div>
              <h2>System Status</h2>
              <p>Current FINDLY infrastructure</p>
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
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function SystemItem({ label, value }) {
  return (
    <div className="system-item">
      <div>
        <strong>{label}</strong>
        <small>{value}</small>
      </div>

      <span className="system-dot" />
    </div>
  );
}

export default App;
