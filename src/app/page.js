"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Fuse from "fuse.js";

const DEPT_MAP = {
  AIML: "AI & Machine Learning",
  CE: "Computer Engineering",
  CL: "Civil Engineering",
  CS: "Computer Science",
  DCE: "DEPSTAR Computer Engineering",
  DCS: "DEPSTAR Computer Science",
  DIT: "DEPSTAR IT",
  EC: "Electronics & Comm.",
  EE: "Electrical Engineering",
  IT: "Information Technology",
  ME: "Mechanical Engineering",
};

function getDept(id) {
  const match = id.match(/^25([A-Z]+)\d+$/);
  if (match) return DEPT_MAP[match[1]] || match[1];
  return "";
}

function getInitials(name) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
  return parts[0]?.[0] || "?";
}

function titleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Home() {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("name"); // "name" = search by name, "id" = search by ID
  const inputRef = useRef(null);

  useEffect(() => {
    fetch("/data.json")
      .then((r) => r.json())
      .then(setData);
  }, []);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fuseName = useMemo(
    () =>
      new Fuse(data, {
        keys: ["name"],
        threshold: 0.35,
        distance: 200,
        minMatchCharLength: 2,
        includeScore: true,
      }),
    [data]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.trim();

    if (mode === "id") {
      // ID lookup: exact match only
      const exact = data.find(
        (d) => d.id.toLowerCase() === q.toLowerCase()
      );
      if (exact) return [{ item: exact, exact: true }];
      return [];
    } else {
      // Name lookup: check all query words in any order
      const qLower = q.toLowerCase();
      const queryWords = qLower.split(/\s+/).filter(Boolean);

      // Match if ALL query words appear somewhere in the name (any order)
      const wordMatches = data.filter((d) => {
        const nameLower = d.name.toLowerCase();
        return queryWords.every((w) => nameLower.includes(w));
      });

      if (wordMatches.length > 0 && wordMatches.length <= 50) {
        return wordMatches.map((item) => ({
          item,
          exact: qLower === item.name.toLowerCase(),
        }));
      }

      // Also try: if single word, do substring match
      if (queryWords.length === 1) {
        const subMatches = data.filter((d) =>
          d.name.toLowerCase().includes(qLower)
        );
        if (subMatches.length > 0 && subMatches.length <= 50) {
          return subMatches.map((item) => ({
            item,
            exact: qLower === item.name.toLowerCase(),
          }));
        }
      }

      // Fall back to Fuse.js fuzzy search
      return fuseName
        .search(q)
        .slice(0, 30)
        .map((r) => ({ item: r.item, exact: false, score: r.score }));
    }
  }, [query, mode, data, fuseName]);

  const switchMode = useCallback(
    (newMode) => {
      setMode(newMode);
      setQuery("");
      inputRef.current?.focus();
    },
    []
  );

  const deptCount = useMemo(() => {
    const depts = new Set(data.map((d) => getDept(d.id)));
    return depts.size;
  }, [data]);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo-mark">
          <span>CHARUSAT Student ID Lookup</span>
        </div>
        <h1 className="hero-title">
          Find anyone,
          <br />
          instantly.
        </h1>
        <p className="hero-subtitle">
          Can&apos;t remember a friend&apos;s ID? Or want to find who someone is from their
          ID? This is a tool for that.
        </p>
      </header>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-number">{data.length.toLocaleString()}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{deptCount}</div>
          <div className="stat-label">Departments</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">2025</div>
          <div className="stat-label">Batch</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "name" ? "active" : ""}`}
            onClick={() => switchMode("name")}
          >
            🔤 Search by Name
          </button>
          <button
            className={`mode-btn ${mode === "id" ? "active" : ""}`}
            onClick={() => switchMode("id")}
          >
            🔢 Search by ID
          </button>
        </div>

        <div className="search-wrapper">
          <span className="search-icon">⌕</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder={
              mode === "name"
                ? "Type a name to search..."
                : "Enter an ID like 25CS001..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        <div className="search-hint">
          {mode === "name"
            ? "Fuzzy search enabled — partial names work too"
            : "Enter an exact student ID"}
        </div>
      </div>

      {/* Results */}
      <div className="results-section">
        {query.trim() && (
          <div className="results-header">
            <span className="results-count">
              <strong>{results.length}</strong>{" "}
              {results.length === 1 ? "result" : "results"} found
            </span>
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">¯\_(ツ)_/¯</div>
            <div className="empty-title">No matches found</div>
            <div className="empty-desc">
              Try a different spelling or switch search mode
            </div>
          </div>
        )}

        <div className="result-list">
          {results.map(({ item, exact }, i) => (
            <div
              key={item.id}
              className={`result-card ${exact ? "exact-match" : ""}`}
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            >
              <div className="result-avatar">{getInitials(item.name)}</div>
              <div className="result-info">
                <div className="result-name">{titleCase(item.name)}</div>
                <div className="result-dept">{getDept(item.id)}</div>
              </div>
              <div className="result-id-badge">{item.id}</div>
              {exact && <span className="exact-badge">Exact</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
