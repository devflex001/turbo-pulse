/**
 * Dispatch a global event that the SupportChatWidget listens for.
 * Lets any component (sidebar, header menu, footer, etc.) open the
 * WhatsApp-style support chat without prop drilling or shared state.
 */
export function openSupportChat() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("open-support-chat"));
}
