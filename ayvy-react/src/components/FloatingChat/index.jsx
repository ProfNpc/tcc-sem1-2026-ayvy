import { useEffect, useRef, useState } from "react";
import { useCart } from "../../context/CartContext";
import "./style.css";

/**
 * Chat flutuante (UI). Mensagens enviadas ficam na lista; sem resposta automática por enquanto.
 * @param {{ shopName: string, shopAvatar?: string, defaultOpen?: boolean, onOpenChange?: (open: boolean) => void }} props
 */
export default function FloatingChat({
  shopName,
  shopAvatar,
  defaultOpen = false,
  onOpenChange,
}) {
  const { drawerOpen: cartDrawerOpen } = useCart();
  const isControlled = onOpenChange != null;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? defaultOpen : internalOpen;

  function setOpenState(next) {
    if (isControlled) {
      onOpenChange(next);
    } else {
      setInternalOpen(next);
    }
  }
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages]);

  function handleSend(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from: "user", text, at: new Date() },
    ]);
    setDraft("");
  }

  if (cartDrawerOpen) {
    return null;
  }

  return (
    <div className="floating-chat-root">
      {open && (
        <div className="floating-chat-panel" role="dialog" aria-label={`Chat com ${shopName}`}>
          <header className="floating-chat-header">
            {shopAvatar ? (
              <img src={shopAvatar} alt="" className="floating-chat-avatar" />
            ) : (
              <span className="floating-chat-avatar-placeholder">
                <i className="fas fa-store" />
              </span>
            )}
            <div>
              <strong>{shopName}</strong>
              <span className="floating-chat-sub">Conversa com a loja</span>
            </div>
            <button
              type="button"
              className="floating-chat-close"
              onClick={() => setOpenState(false)}
              aria-label="Fechar chat"
            >
              <i className="fas fa-times" />
            </button>
          </header>

          <div className="floating-chat-messages" ref={listRef}>
            {messages.length === 0 ? (
              <p className="floating-chat-empty">
                Envie uma mensagem para {shopName}. O lojista responderá em breve.
              </p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="floating-chat-bubble floating-chat-bubble--user">
                  {m.text}
                </div>
              ))
            )}
          </div>

          <form className="floating-chat-form" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Digite uma mensagem..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
            />
            <button type="submit" aria-label="Enviar">
              <i className="fas fa-paper-plane" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`floating-chat-toggle ${open ? "is-open" : ""}`}
        onClick={() => setOpenState(!open)}
        aria-expanded={open}
        aria-label={open ? "Fechar chat" : "Abrir chat"}
      >
        <i className="fas fa-comment-dots" />
        <span>Chat</span>
      </button>
    </div>
  );
}
