export function AmoledMinimal() {
  const people = [
    { name: "Aria Chen", initials: "AC", role: "Designer @ Figma", trust: 9, trustLabel: "High", tags: ["Friend", "Work"], ring: "#10b981" },
    { name: "Marcus Webb", initials: "MW", role: "Startup founder", trust: 7, trustLabel: "High", tags: ["Online"], ring: "#10b981" },
    { name: "Priya Sharma", initials: "PS", role: "Doctor, met in 2021", trust: 5, trustLabel: "Mid", tags: ["Family"], ring: "#f59e0b" },
    { name: "Jake Monroe", initials: "JM", role: "College roommate", trust: 3, trustLabel: "Low", tags: ["Friend"], ring: "#ef4444" },
  ];

  return (
    <div style={{
      width: 390, minHeight: 844, background: "#000000",
      fontFamily: "'Inter', system-ui, sans-serif", overflowY: "auto",
    }}>
      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 22px 0", fontSize: 11, color: "#444" }}>
        <span style={{ fontWeight: 600, color: "#666" }}>9:41</span><span>●●●● 🔋</span>
      </div>

      {/* Header */}
      <div style={{ padding: "20px 22px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, color: "#ffffff", marginBottom: 3 }}>PEOPLE</div>
          <div style={{ fontSize: 13, color: "#555" }}>4 in your circle</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["⚙️", "🔒"].map((ic, i) => (
            <div key={i} style={{
              width: 38, height: 38, borderRadius: 12,
              background: "#111", border: "1px solid #222",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>{ic}</div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ margin: "4px 18px 16px", padding: "0 14px", height: 46, borderRadius: 14, background: "#0f0f0f", border: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14, color: "#444" }}>⌕</span>
        <span style={{ fontSize: 14, color: "#333" }}>Search…</span>
      </div>

      {/* Coming Up */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#444", margin: "0 22px 8px", textTransform: "uppercase" }}>COMING UP</div>
        <div style={{ display: "flex", gap: 10, paddingLeft: 18, overflowX: "auto" }}>
          {[
            { name: "Aria Chen", label: "Birthday", days: "Tomorrow", color: "#c084fc" },
            { name: "Marcus Webb", label: "Meeting", days: "In 4 days", color: "#f59e0b" },
          ].map((ev, i) => (
            <div key={i} style={{
              minWidth: 185, padding: "11px 14px", borderRadius: 14,
              background: "#0d0d0d", border: `1px solid ${ev.color}30`,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ev.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                {i === 0 ? "🎂" : "📅"}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{ev.name}</div>
                <div style={{ fontSize: 11, color: ev.color, marginTop: 2 }}>{ev.label} · {ev.days}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", gap: 8, padding: "0 18px", marginBottom: 14, overflowX: "auto" }}>
        {["All", "Friend", "Work", "Family"].map((t, i) => (
          <div key={t} style={{
            padding: "5px 16px", borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
            background: i === 0 ? "#f59e0b" : "#111",
            border: `1px solid ${i === 0 ? "#f59e0b" : "#1e1e1e"}`,
            color: i === 0 ? "#000" : "#555",
          }}>{t}</div>
        ))}
      </div>

      {/* People */}
      <div style={{ display: "flex", flexDirection: "column", padding: "0 18px", gap: 1, paddingBottom: 100 }}>
        {people.map((p, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 16px", borderRadius: 16, background: "#0a0a0a", marginBottom: 6,
            border: "1px solid #141414",
          }}>
            {/* Avatar ring */}
            <div style={{
              width: 50, height: 50, borderRadius: 25, flexShrink: 0,
              border: `2.5px solid ${p.ring}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#111",
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: p.ring }}>{p.initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f0" }}>{p.name}</span>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "2px 8px 2px 6px", borderRadius: 8,
                  background: "#111", border: `1px solid ${p.ring}33`, fontSize: 11, color: p.ring, fontWeight: 700,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: 3, background: p.ring }} />{p.trust}
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, marginBottom: 3 }}>
                {p.tags.map(t => (
                  <span key={t} style={{
                    fontSize: 10, color: "#333", background: "#111",
                    padding: "2px 7px", borderRadius: 5, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600,
                    border: "1px solid #1f1f1f",
                  }}>{t}</span>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{p.role}</span>
            </div>
            <span style={{ color: "#2a2a2a", fontSize: 18, flexShrink: 0 }}>›</span>
          </div>
        ))}
      </div>

      {/* FAB */}
      <div style={{
        position: "fixed", bottom: 34, right: 24, width: 58, height: 58, borderRadius: 29,
        background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, color: "#000", fontWeight: 700,
        boxShadow: "0 6px 20px rgba(245,158,11,0.5)",
      }}>+</div>
    </div>
  );
}
