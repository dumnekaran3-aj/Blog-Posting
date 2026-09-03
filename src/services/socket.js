import { io as ioClient } from "socket.io-client";

let socket = null;

// api.js '/api' suffix ke saath baseURL rakhta hai (REST ke liye), lekin
// Socket.io seedha server root pe attach hota hai — isliye yahan '/api'
// hata dete hain
const getOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

// connectSocket
// ---------------
// Login hote hi (ya page reload pe agar already logged in ho) call hota hai.
// No token argument needed — the httpOnly 'token' cookie goes automatically
// with the handshake (withCredentials: true), same as every REST call via
// api.js. Previously this required an explicit token argument that nothing
// in the app ever actually passed (the JWT is httpOnly, unreadable by JS by
// design), so every connection attempt silently no-op'd and real-time
// features never worked at all.
export const connectSocket = () => {
  if (socket?.connected) return socket;

  if (socket) socket.disconnect();

  socket = ioClient(getOrigin(), {
    withCredentials: true,
    transports: ["websocket"],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;