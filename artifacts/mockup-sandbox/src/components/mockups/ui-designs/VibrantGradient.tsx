export function VibrantGradient() {
  const people = [
    { name: "Aria Chen", initials: "AC", role: "Designer @ Figma", trust: 9, tags: ["Friend", "Work"], ring: "#34d399", accent: "#34d399" },
    { name: "Marcus Webb", initials: "MW", role: "Startup founder", trust: 7, tags: ["Online"], ring: "#60a5fa", accent: "#60a5fa" },
    { name: "Priya Sharma", initials: "PS", role: "Doctor, met in 2021", trust: 5, tags: ["Family"], ring: "#fbbf24", accent: "#fbbf24" },
    { name: "Jake Monroe", initials: "JM", role: "College roommate", trust: 3, tags: ["Friend"], ring: "#f87171", accent: "#f87171" },
  ];

  const tagColors: Record<string, { bg: string; text: string }> = {
    Friend: { bg: "#1d4ed840", text: "#93c5fd" },
    Work: { bg: "#065f4640", text: "#6ee7b7" },
    Family: { bg: "#78350f40", text: "#fcd34d" },
    Online: { bg: "#4c1d9540", text: "#c4b5fd" },
  };

  return (
    <div style={{
      width: 390, minHeight: 844, background: "#0d1117",
      fontFamily: "'Inter', system-ui, sans-serif", overflowY: "auto",
    }}>
      {/* Top gradient band */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #3b82f6)", width: "100%" }} />

      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px 0", fontSize: 11, color: "#4b5563" }}>
        <span style={{ fontWeight: 700, color: "#6b7280" }}>9:41</span><span>●●●● 🔋</span>
      </div>

      {/* Header */}
      <div style={{ padding: "16px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
            }}>
              <span style={{ fontSize: 12 }}>👥</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 4, color: "#f9fafb" }}>PEOPLE</span>
          </div>
          <div style={{ fontSize: 12, color: "#4b5563", marginLeft: 36 }}>4 connections</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["⚙", "🔒"].map((ic, i) => (
            <div key={i} style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#161b22", border: "1px solid #21262d",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
            }}>{ic}</div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ margin: "0 16px 12px", padding: "0 14px", height: 44, borderRadius: 12, background: "#161b22", border: "1px solid #21262d", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: "#4b5563" }}>🔍</span>
        <span style={{ fontSize: 14, color: "#374151" }}>Search name, tags, notes…</span>
      </div>

      {/* Coming Up */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 20px 8px" }}>
          <div style={{ width: 3, height: 14, borderRadius: 2, background: "linear-gradient(180deg, #6366f1, #8b5cf6)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: "#6366f1", textTransform: "uppercase" }}>COMING UP</span>
        </div>
        <div style={{ display: "flex", gap: 10, paddingLeft: 16, overflowX: "auto" }}>
          {[
            { name: "Aria Chen", label: "Birthday", days: "Tomorrow", color: "#c084fc", icon: "🎂" },
            { name: "Marcus Webb", label: "Meeting", days: "In 4 days", color: "#60a5fa", icon: "📅" },
          ].map((ev, i) => (
            <div key={i} style={{
              minWidth: 182, padding: "10px 14px", borderRadius: 14,
              background: "linear-gradient(135deg, #161b22, #161b22)",
              border: `1px solid ${ev.color}40`,
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: `inset 0 0 20px ${ev.color}08`,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: `linear-gradient(135deg, ${ev.color}22, ${ev.color}0a)`,
                border: `1px solid ${ev.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>{ev.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{ev.name}</div>
                <div style={{ fontSize: 11, color: ev.color, marginTop: 2 }}>{ev.label} · {ev.days}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px", marginBottom: 12, overflowX: "auto" }}>
        {[
          { label: "All", active: true },
          { label: "Friend" },
          { label: "Work" },
          { label: "Family" },
          { label: "Online" },
        ].map((t, i) => (
          <div key={t.label} style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
            background: t.active ? "rgba(99,102,241,0.15)" : "#161b22",
            border: `1px solid ${t.active ? "rgba(99,102,241,0.5)" : "#21262d"}`,
            color: t.active ? "#818cf8" : "#4b5563",
          }}>{t.label}</div>
        ))}
      </div>

      {/* Cards */}
      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 100 }}>
        {people.map((p, i) => (
          <div key={i} style={{
            borderRadius: 16, padding: "14px 15px",
            background: "#161b22", border: "1px solid #21262d",
            display: "flex", alignItems: "center", gap: 12,
            borderLeft: `3px solid ${p.ring}`,
            boxShadow: `0 2px 16px rgba(0,0,0,0.4), inset 0 0 30px ${p.ring}04`,
          }}>
            {/* Avatar with glowing ring */}
            <div style={{
              width: 48, height: 48, borderRadius: 24, flexShrink: 0,
              border: `2.5px solid ${p.ring}`,
              boxShadow: `0 0 12px ${p.ring}44, 0 0 4px ${p.ring}22 inset`,
              background: `${p.ring}14`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 700, color: p.ring,
            }}>{p.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#f0f6fc" }}>{p.name}</span>
                <div style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "2px 8px", borderRadius: 8,
                  background: `${p.ring}18`, border: `1px solid ${p.ring}44`,
                  fontSize: 11, fontWeight: 700, color: p.ring,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: 3, background: p.ring }} />{p.trust}
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, marginBottom: 4 }}>
                {p.tags.map(t => {
                  const tc = tagColors[t] ?? { bg: "#1f2937", text: "#9ca3af" };
                  return (
                    <span key={t} style={{
                      fontSize: 10, fontWeight: 700,
                      background: tc.bg, color: tc.text,
                      padding: "2px 8px", borderRadius: 6,
                      textTransform: "uppercase", letterSpacing: 0.6,
                    }}>{t}</span>
                  );
                })}
              </div>
              <span style={{ fontSize: 12, color: "#4b5563", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.role}</span>
            </div>
            <span style={{ color: "#2d333b", fontSize: 18, flexShrink: 0 }}>›</span>
          </div>
        ))}
      </div>

      {/* FAB */}
      <div style={{
        position: "fixed", bottom: 34, right: 24, width: 58, height: 58, borderRadius: 29,
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        boxShadow: "0 8px 24px rgba(99,102,241,0.5), 0 0 0 1px rgba(139,92,246,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, color: "#fff",
      }}>+</div>
    </div>
  );
}
