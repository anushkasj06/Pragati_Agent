/**
 * NotificationBell — dropdown notification center used in both
 * SellerLayout topbar and DashboardLayout topbar.
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle, Clock, XCircle, X, CheckCheck } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

const TYPE_CONFIG = {
  success:  { color:"#22C55E", bg:"rgba(34,197,94,0.1)",  Icon:CheckCircle },
  pending:  { color:"#F59E0B", bg:"rgba(245,158,11,0.1)", Icon:Clock       },
  rejected: { color:"#EF4444", bg:"rgba(239,68,68,0.1)",  Icon:XCircle     },
  info:     { color:"#6F2DBD", bg:"rgba(0, 0, 0, 1)", Icon:Bell        },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell({ dark = false }) {
  const { notifications, unreadCount, markAllRead, markRead, clearAll, notificationsEnabled, setNotificationsEnabled } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const btnStyle = dark ? {
    width:38, height:38, borderRadius:10, cursor:"pointer", position:"relative",
    background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
    display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.8)",
  } : {
    width:38, height:38, borderRadius:10, cursor:"pointer", position:"relative",
    background:"#F8F4FF", border:"1px solid #E9E5F5",
    display:"flex", alignItems:"center", justifyContent:"center", color:"#6F2DBD",
  };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => { setOpen(!open); if (!open && unreadCount) markAllRead(); }}
        style={btnStyle}>
        <Bell style={{ width:17, height:17 }}/>
        {unreadCount > 0 && (
          <motion.span initial={{ scale:0 }} animate={{ scale:1 }}
            style={{ position:"absolute", top:6, right:6, width:8, height:8,
              borderRadius:"50%", background:"#EF4444",
              border:`2px solid ${dark ? "#120B2E" : "#fff"}` }}/>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, y:-8, scale:0.96 }}
            animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-8, scale:0.96 }}
            transition={{ duration:0.15 }}
            style={{ position:"absolute", right:0, top:"calc(100% + 8px)", width:360,
              background:"#fff", border:"1px solid #E9E5F5", borderRadius:18,
              boxShadow:"0 12px 40px rgba(111,45,189,0.14)", zIndex:200, overflow:"hidden" }}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"14px 18px", borderBottom:"1px solid #E9E5F5" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#1A1A2E" }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{ marginLeft:8, fontSize:11, fontWeight:700, padding:"2px 8px",
                    borderRadius:20, color:"#fff", background:"#EF4444" }}>{unreadCount}</span>
                )}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  style={{ padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:600,
                    color: notificationsEnabled ? "#6F2DBD" : "#9CA3AF", background: notificationsEnabled ? "#F8F4FF" : "transparent", border:"1px solid #E9E5F5",
                    cursor:"pointer" }}>
                  {notificationsEnabled ? "Enabled" : "Disabled"}
                </button>
                {notifications.length > 0 && (
                  <button onClick={clearAll}
                    style={{ padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:600,
                      color:"#9CA3AF", background:"transparent", border:"1px solid #E9E5F5",
                      cursor:"pointer" }}>Clear all</button>
                )}
                <button onClick={() => setOpen(false)}
                  style={{ width:26, height:26, borderRadius:7, background:"#F8F4FF",
                    border:"none", cursor:"pointer", display:"flex", alignItems:"center",
                    justifyContent:"center", color:"#9CA3AF" }}>
                  <X style={{ width:13, height:13 }}/>
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ maxHeight:380, overflowY:"auto" }}>
              {!notificationsEnabled ? (
                <div style={{ padding:"32px 20px", textAlign:"center" }}>
                  <Bell style={{ width:28, height:28, color:"#E9E5F5", margin:"0 auto 10px" }}/>
                  <p style={{ fontSize:13, color:"#9CA3AF", margin:0 }}>Notifications are disabled. Turn them on from the header.</p>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding:"32px 20px", textAlign:"center" }}>
                  <Bell style={{ width:28, height:28, color:"#E9E5F5", margin:"0 auto 10px" }}/>
                  <p style={{ fontSize:13, color:"#9CA3AF", margin:0 }}>No notifications yet</p>
                </div>
              ) : notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const Icon = cfg.Icon;
                return (
                  <div key={n._id || n.id || n.timestamp} onClick={() => markRead(n.id)}
                    style={{ display:"flex", gap:12, padding:"13px 18px",
                      borderBottom:"1px solid #F8F4FF", cursor:"pointer",
                      background: n.read ? "#fff" : "#F8F4FF",
                      transition:"background 0.15s" }}>
                    <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
                      background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon style={{ width:17, height:17, color:cfg.color }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:n.read?500:700, color:"#1A1A2E",
                        lineHeight:1.4, marginBottom:3 }}>{n.title}</div>
                      <div style={{ fontSize:12, color:"#4B5563", lineHeight:1.45 }}>{n.message}</div>
                      <div style={{ fontSize:11, color:"#9CA3AF", marginTop:4 }}>{timeAgo(n.timestamp)}</div>
                    </div>
                    {!n.read && (
                      <div style={{ width:7, height:7, borderRadius:"50%",
                        background:"#6F2DBD", flexShrink:0, marginTop:5 }}/>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
