export function Glassmorphism() {
  const people = [
    { name: "Aria Chen", initials: "AC", role: "Designer @ Figma", trust: 9, tags: ["Friend", "Work"], ring: "#22d3ee" },
    { name: "Marcus Webb", initials: "MW", role: "Startup founder", trust: 7, tags: ["Online"], ring: "#a78bfa" },
    { name: "Priya Sharma", initials: "PS", role: "Doctor, met in 2021", trust: 5, tags: ["Family"], ring: "#fbbf24" },
    { name: "Jake Monroe", initials: "JM", role: "College roommate", trust: 3, tags: ["Friend"], ring: "#f87171" },
  ];
  const events = [
    { name: "Aria Chen", type: "Birthday", days: "Tomorrow", icon: "🎂" },
    { name: "Marcus Webb", type: "Meeting", days: "In 4 days", icon: "📅" },
  ];

  return (
    <div style={{
      width: 390, minHeight: 844, background: "linear-gradient(160deg, #0c0f2e 0%, #0a0b1a 40%, #130d2e 100%)",
      fontFamily: "'Inter', system-ui, sans-serif", overflowY: "auto", position: "relative",
    }}>
      {/* Ambient glow blobs */}
      <div style={{ position: "absolute", top: 60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 200, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
        <span>9:41</span><span>●●●●  WiFi  🔋</span>
      </div>

      {/* Header */}
      <div style={{ padding: "18px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#6366f1", boxShadow: "0 0 8px #6366f1" }} />
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, color: "#fff" }}>PEOPLE</span>
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 }}>4 connections</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["⚙", "🔒"].map((ic, i) => (
            <div key={i} style={{
              width: 36, height: 36, borderRadius: 12,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15
            }}>{ic}</div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ margin: "0 16px 14px", padding: "0 14px", height: 44, borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>🔍</span>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>Search name, notes…</span>
      </div>

      {/* Coming Up strip */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: "rgba(255,255,255,0.35)", margin: "0 20px 8px", textTransform: "uppercase" }}>COMING UP</div>
        <div style={{ display: "flex", gap: 10, paddingLeft: 16, overflowX: "auto", paddingBottom: 4 }}>
          {events.map((ev, i) => (
            <div key={i} style={{
              minWidth: 180, padding: "10px 14px", borderRadius: 14,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,102,241,0.3)",
              backdropFilter: "blur(16px)", display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{ev.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{ev.name}</div>
                <div style={{ fontSize: 11, color: "#818cf8", marginTop: 2 }}>{ev.type} · {ev.days}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tag filters */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px", marginBottom: 12, overflowX: "auto" }}>
        {["All", "Friend", "Work", "Family", "Online"].map((t, i) => (
          <div key={t} style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
            background: i === 0 ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${i === 0 ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.08)"}`,
            color: i === 0 ? "#a5b4fc" : "rgba(255,255,255,0.45)",
          }}>{t}</div>
        ))}
      </div>

      {/* Contact Cards */}
      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 100 }}>
        {people.map((p, i) => (
          <div key={i} style={{
            borderRadius: 18, padding: "14px 16px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", gap: 13,
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}>
            {/* Avatar with trust ring */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 23,
                border: `2.5px solid ${p.ring}`,
                boxShadow: `0 0 10px ${p.ring}55`,
                padding: 2, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 19,
                  background: `linear-gradient(135deg, ${p.ring}33, ${p.ring}11)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: p.ring,
                }}>{p.initials}</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 8,
                  background: `${p.ring}18`, border: `1px solid ${p.ring}44`, fontSize: 11, color: p.ring, fontWeight: 600,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: 3, background: p.ring }} />
                  {p.trust}
                </div>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {p.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.07)", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{t}</span>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.role}</div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 16 }}>›</span>
          </div>
        ))}
      </div>

      {/* FAB */}
      <div style={{
        position: "fixed", bottom: 32, right: 24, width: 58, height: 58, borderRadius: 29,
        background: "linear-gradient(135deg, #6366f1, #818cf8)",
        boxShadow: "0 8px 24px rgba(99,102,241,0.55), 0 0 0 1px rgba(99,102,241,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#fff",
      }}>+</div>
    </div>
  );
}
