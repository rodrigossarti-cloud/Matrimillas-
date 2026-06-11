import { useState, useEffect, useCallback } from "react";

// ── Configuración JSONBin ─────────────────────────────────────
// JSONBin.io es gratis y no requiere cuenta para leer/escribir bins públicos
const JSONBIN_API = "https://api.jsonbin.io/v3/b";
const API_KEY = "$2a$10$PLACEHOLDER"; // Se reemplaza con tu key real

async function loadRoom(roomId) {
  try {
    const res = await fetch(`${JSONBIN_API}/${roomId}/latest`, {
      headers: { "X-Master-Key": API_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.record;
  } catch { return null; }
}

async function saveRoom(binId, data) {
  try {
    await fetch(`${JSONBIN_API}/${binId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify(data)
    });
  } catch (e) { console.error(e); }
}

async function createRoom(data) {
  const res = await fetch(JSONBIN_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": API_KEY,
      "X-Bin-Private": "false"
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  return json.metadata?.id;
}

// ── Datos iniciales ───────────────────────────────────────────
const INITIAL_TASKS = [
  { id: 1, name: "Lavar los platos", points: 10, emoji: "🍽️" },
  { id: 2, name: "Cocinar la cena", points: 15, emoji: "👨‍🍳" },
  { id: 3, name: "Hacer las compras", points: 20, emoji: "🛒" },
  { id: 4, name: "Limpiar el baño", points: 25, emoji: "🚿" },
  { id: 5, name: "Pasar la aspiradora", points: 15, emoji: "🧹" },
];

const COLORS = {
  A: { bg: "bg-pink-100", text: "text-pink-600", border: "border-pink-300", btn: "bg-pink-500 hover:bg-pink-600" },
  B: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-300", btn: "bg-blue-500 hover:bg-blue-600" },
};

// ── Pantalla Lobby ────────────────────────────────────────────
function LobbyScreen({ onJoin }) {
  const [mode, setMode] = useState(null);
  const [name, setName] = useState("");
  const [binId, setBinId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return setError("Escribí tu nombre primero");
    setLoading(true);
    try {
      const room = {
        players: { A: { name: name.trim(), emoji: "💖", score: 0 }, B: null },
        tasks: INITIAL_TASKS,
        pending: [],
        history: [],
        createdAt: Date.now(),
      };
      const id = await createRoom(room);
      if (!id) throw new Error("No se pudo crear");
      onJoin({ binId: id, playerId: "A", playerName: name.trim() });
    } catch {
      setError("Error al crear la sala, revisá tu conexión");
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim()) return setError("Escribí tu nombre primero");
    if (!binId.trim()) return setError("Ingresá el código de sala");
    setLoading(true);
    setError("");
    try {
      const room = await loadRoom(binId.trim());
      if (!room) { setLoading(false); return setError("Código incorrecto, revisalo"); }
      if (room.players.B) { setLoading(false); return setError("La sala ya está completa"); }
      room.players.B = { name: name.trim(), emoji: "💙", score: 0 };
      await saveRoom(binId.trim(), room);
      onJoin({ binId: binId.trim(), playerId: "B", playerName: name.trim() });
    } catch {
      setError("Error al unirse, revisá el código");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 flex flex-col items-center justify-center px-6">
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">💞</div>
        <h1 className="text-4xl font-black text-purple-700 tracking-tight">Matrimillas</h1>
        <p className="text-gray-400 mt-1 text-sm">El amor también suma puntos</p>
      </div>

      {!mode && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => setMode("create")} className="bg-purple-500 text-white font-black py-4 rounded-2xl text-lg shadow-md">✨ Crear sala</button>
          <button onClick={() => setMode("join")} className="bg-white text-purple-600 font-black py-4 rounded-2xl text-lg border-2 border-purple-200 shadow-sm">🔗 Unirse con código</button>
        </div>
      )}

      {mode && (
        <div className="bg-white rounded-3xl p-6 shadow-lg w-full max-w-xs">
          <button onClick={() => { setMode(null); setError(""); }} className="text-gray-300 text-sm mb-4">← Volver</button>
          <h2 className="font-black text-gray-700 mb-4 text-lg">{mode === "create" ? "✨ Nueva sala" : "🔗 Unirse a sala"}</h2>

          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tu nombre</label>
          <input value={name} onChange={e => { setName(e.target.value); setError(""); }}
            placeholder="Ej: Belén"
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm mt-1 mb-3 focus:outline-none focus:border-purple-400" />

          {mode === "join" && (
            <>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Código de sala</label>
              <input value={binId} onChange={e => { setBinId(e.target.value); setError(""); }}
                placeholder="Pegá el código acá"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm mt-1 mb-3 focus:outline-none focus:border-purple-400 font-mono text-xs" />
            </>
          )}

          {error && <p className="text-red-400 text-xs mb-3 font-semibold">⚠️ {error}</p>}

          <button onClick={mode === "create" ? handleCreate : handleJoin} disabled={loading}
            className="w-full bg-purple-500 text-white font-black py-3 rounded-xl text-sm disabled:opacity-50">
            {loading ? "Cargando..." : mode === "create" ? "Crear sala" : "Unirme"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Pantalla Espera ───────────────────────────────────────────
function WaitingScreen({ binId, onReady }) {
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const checkReady = useCallback(async () => {
    setChecking(true);
    const room = await loadRoom(binId);
    if (room?.players?.B) onReady(room);
    setChecking(false);
  }, [binId, onReady]);

  useEffect(() => {
    const interval = setInterval(checkReady, 4000);
    return () => clearInterval(interval);
  }, [checkReady]);

  const copyCode = () => {
    navigator.clipboard?.writeText(binId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4 animate-pulse">⏳</div>
      <h2 className="text-2xl font-black text-purple-700 mb-2">Esperando a tu pareja</h2>
      <p className="text-gray-400 text-sm mb-6">Mandále este código:</p>
      <div onClick={copyCode} className="bg-white border-4 border-purple-300 rounded-3xl px-6 py-5 shadow-lg cursor-pointer active:scale-95 transition-transform w-full max-w-xs">
        <div className="text-xs font-black text-purple-600 font-mono break-all">{binId}</div>
        <div className="text-xs text-gray-300 mt-2">{copied ? "✅ ¡Copiado!" : "Tocá para copiar"}</div>
      </div>
      <p className="text-gray-300 text-xs mt-6">Revisando cada 4 segundos...</p>
      <button onClick={checkReady} disabled={checking} className="mt-3 text-purple-400 font-bold text-sm disabled:opacity-40">
        {checking ? "Revisando..." : "Revisar ahora"}
      </button>
    </div>
  );
}

// ── Juego principal ───────────────────────────────────────────
function Game({ binId, playerId }) {
  const [room, setRoom] = useState(null);
  const [tab, setTab] = useState("home");
  const [newTask, setNewTask] = useState({ name: "", points: "", emoji: "⭐" });
  const [toast, setToast] = useState(null);

  const otherId = playerId === "A" ? "B" : "A";

  const sync = useCallback(async () => {
    const r = await loadRoom(binId);
    if (r) setRoom(r);
  }, [binId]);

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 4000);
    return () => clearInterval(interval);
  }, [sync]);

  const update = async (updater) => {
    const r = await loadRoom(binId);
    if (!r) return;
    const updated = updater(r);
    await saveRoom(binId, updated);
    setRoom(updated);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const claimTask = async (task) => {
    await update(r => ({
      ...r,
      pending: [...r.pending, {
        id: Date.now(),
        taskId: task.id,
        taskName: task.name,
        taskEmoji: task.emoji,
        points: task.points,
        claimedBy: playerId,
        claimedByName: r.players[playerId].name,
      }]
    }));
    showToast(`✅ Reclamaste "${task.name}" — esperá que te aprueben`);
  };

  const approveTask = async (claimId) => {
    await update(r => {
      const claim = r.pending.find(c => c.id === claimId);
      if (!claim) return r;
      return {
        ...r,
        players: {
          ...r.players,
          [claim.claimedBy]: { ...r.players[claim.claimedBy], score: r.players[claim.claimedBy].score + claim.points }
        },
        pending: r.pending.filter(c => c.id !== claimId),
        history: [{ ...claim, status: "approved", ts: Date.now() }, ...r.history],
      };
    });
    showToast("🎉 ¡Aprobado! Se sumaron los puntos.");
  };

  const rejectTask = async (claimId) => {
    await update(r => {
      const claim = r.pending.find(c => c.id === claimId);
      return {
        ...r,
        pending: r.pending.filter(c => c.id !== claimId),
        history: [{ ...claim, status: "rejected", ts: Date.now() }, ...r.history],
      };
    });
    showToast("❌ Tarea rechazada.");
  };

  const addTask = async () => {
    if (!newTask.name.trim() || !newTask.points) return;
    const task = { id: Date.now(), name: newTask.name.trim(), points: parseInt(newTask.points), emoji: newTask.emoji };
    await update(r => ({ ...r, tasks: [...r.tasks, task] }));
    setNewTask({ name: "", points: "", emoji: "⭐" });
    showToast("✅ Tarea agregada");
  };

  const removeTask = async (id) => {
    await update(r => ({ ...r, tasks: r.tasks.filter(t => t.id !== id) }));
  };

  if (!room) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="text-center text-purple-300">
        <div className="text-5xl animate-spin mb-3">💞</div>
        <div className="font-bold">Conectando...</div>
      </div>
    </div>
  );

  const me = room.players[playerId];
  const them = room.players[otherId];
  const myPending = room.pending.filter(c => c.claimedBy === otherId);
  const myColor = COLORS[playerId];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 font-sans">

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl max-w-xs text-center">
          {toast}
        </div>
      )}

      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-purple-700">💞 Matrimillas</h1>
            <p className="text-xs text-gray-300">Sync cada 4 seg</p>
          </div>
          <div className={`text-xs px-3 py-1.5 rounded-full font-black border-2 ${myColor.bg} ${myColor.text} ${myColor.border}`}>
            {me.emoji} {me.name}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 pb-28">

        {/* Scoreboard */}
        <div className="flex gap-3 mb-5">
          {(["A", "B"]).map(pid => (
            <div key={pid} className={`flex-1 rounded-2xl p-4 border-2 text-center ${COLORS[pid].bg} ${COLORS[pid].border}`}>
              <div className="text-3xl">{room.players[pid]?.emoji || "👤"}</div>
              <div className={`text-xs font-black uppercase tracking-widest ${COLORS[pid].text} mt-1`}>{room.players[pid]?.name || "Esperando..."}</div>
              <div className={`text-4xl font-black ${COLORS[pid].text}`}>{room.players[pid]?.score ?? 0}</div>
              <div className="text-xs text-gray-400">pts</div>
              {pid === playerId && <div className="text-xs text-gray-300 mt-1">← vos</div>}
            </div>
          ))}
        </div>

        {myPending.length > 0 && (
          <div className="bg-amber-400 rounded-2xl p-3 mb-4 flex items-center gap-2 shadow">
            <span className="text-2xl">🔔</span>
            <div className="flex-1">
              <div className="font-black text-white text-sm">{myPending.length} tarea{myPending.length > 1 ? "s" : ""} para aprobar</div>
              <div className="text-amber-100 text-xs">{them?.name} espera tu validación</div>
            </div>
            <button onClick={() => setTab("approve")} className="bg-white text-amber-500 font-black text-xs px-3 py-1.5 rounded-xl">Ver</button>
          </div>
        )}

        {tab === "home" && (
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
              Tareas — jugás como <span className={myColor.text}>{me.name}</span>
            </h2>
            <div className="flex flex-col gap-3">
              {room.tasks.map(task => (
                <div key={task.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 border border-gray-100">
                  <span className="text-3xl">{task.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 text-sm">{task.name}</div>
                    <div className="text-xs text-gray-400">Requiere aprobación</div>
                  </div>
                  <div className="text-right mr-1">
                    <div className={`text-lg font-black ${myColor.text}`}>+{task.points}</div>
                    <div className="text-xs text-gray-400">pts</div>
                  </div>
                  <button onClick={() => claimTask(task)} className={`${myColor.btn} text-white font-bold text-xs px-3 py-2 rounded-xl transition-all`}>
                    ¡Lo hice!
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "approve" && (
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">🔔 Para aprobar</h2>
            {myPending.length === 0 ? (
              <div className="text-center py-10 text-gray-300">
                <div className="text-5xl mb-2">✅</div>
                <div className="font-bold">Todo al día</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myPending.map(claim => (
                  <div key={claim.id} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{claim.taskEmoji}</span>
                      <div>
                        <div className="font-bold text-gray-800">{claim.taskName}</div>
                        <div className="text-xs text-gray-400">{claim.claimedByName} dice que lo hizo</div>
                      </div>
                      <div className={`ml-auto text-xl font-black ${COLORS[claim.claimedBy].text}`}>+{claim.points}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveTask(claim.id)} className="flex-1 bg-green-500 text-white font-black py-2 rounded-xl text-sm">✅ Confirmar</button>
                      <button onClick={() => rejectTask(claim.id)} className="flex-1 bg-red-100 text-red-500 font-black py-2 rounded-xl text-sm">❌ Rechazar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {room.pending.filter(c => c.claimedBy === playerId).length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">⏳ Esperando que te aprueben</h3>
                {room.pending.filter(c => c.claimedBy === playerId).map(claim => (
                  <div key={claim.id} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100 mb-2">
                    <span className="text-2xl">{claim.taskEmoji}</span>
                    <div className="flex-1 text-sm font-semibold text-gray-500">{claim.taskName}</div>
                    <div className={`font-black ${myColor.text}`}>+{claim.points}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "tasks" && (
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">⚙️ Tareas</h2>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 mb-4">
              <div className="font-bold text-purple-700 mb-3 text-sm">➕ Nueva tarea</div>
              <div className="flex gap-2 mb-2">
                <input value={newTask.emoji} onChange={e => setNewTask(t => ({ ...t, emoji: e.target.value }))} className="w-14 border-2 border-gray-200 rounded-xl text-center text-xl p-2" maxLength={2} />
                <input value={newTask.name} onChange={e => setNewTask(t => ({ ...t, name: e.target.value }))} placeholder="Nombre de la tarea" className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
              </div>
              <div className="flex gap-2">
                <input type="number" value={newTask.points} onChange={e => setNewTask(t => ({ ...t, points: e.target.value }))} placeholder="Puntos" className="w-24 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                <button onClick={addTask} className="flex-1 bg-purple-500 text-white font-black rounded-xl text-sm py-2">Agregar</button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {room.tasks.map(task => (
                <div key={task.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 border border-gray-100">
                  <span className="text-2xl">{task.emoji}</span>
                  <div className="flex-1 text-sm font-semibold text-gray-700">{task.name}</div>
                  <div className="font-black text-purple-500">{task.points} pts</div>
                  <button onClick={() => removeTask(task.id)} className="text-red-300 hover:text-red-500 text-lg ml-1">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "history" && (
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">📜 Historial</h2>
            {room.history.length === 0 ? (
              <div className="text-center py-10 text-gray-300">
                <div className="text-5xl mb-2">📋</div>
                <div className="font-bold">Todavía no hay actividad</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {room.history.map((entry, i) => (
                  <div key={i} className={`bg-white rounded-2xl p-3 flex items-center gap-3 border ${entry.status === "approved" ? "border-green-100" : "border-red-100"}`}>
                    <span className="text-2xl">{entry.taskEmoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-700">{entry.taskName}</div>
                      <div className="text-xs text-gray-400">{entry.claimedByName}</div>
                    </div>
                    <div className={`font-black text-sm ${entry.status === "approved" ? "text-green-500" : "text-red-400"}`}>
                      {entry.status === "approved" ? `+${entry.points}` : "Rechazada"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40">
        <div className="max-w-md mx-auto px-4 py-2 flex gap-1">
          {[
            { id: "home", emoji: "🏠", label: "Tareas" },
            { id: "approve", emoji: "🔔", label: "Aprobar", badge: myPending.length },
            { id: "tasks", emoji: "⚙️", label: "Editar" },
            { id: "history", emoji: "📜", label: "Historial" },
          ].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all relative ${tab === item.id ? "bg-purple-50 text-purple-600" : "text-gray-400"}`}>
              <span className="text-xl">{item.emoji}</span>
              <span className="text-xs font-semibold mt-0.5">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute top-0 right-1 bg-amber-400 text-white text-xs font-black w-4 h-4 rounded-full flex items-center justify-center">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [waiting, setWaiting] = useState(false);

  const handleJoin = ({ binId, playerId, playerName }) => {
    setSession({ binId, playerId, playerName });
    if (playerId === "A") setWaiting(true);
  };

  const handleReady = () => setWaiting(false);

  if (!session) return <LobbyScreen onJoin={handleJoin} />;
  if (waiting) return <WaitingScreen binId={session.binId} onReady={handleReady} />;
  return <Game binId={session.binId} playerId={session.playerId} />;
}
