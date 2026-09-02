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
// Same token se already connected ho to naya connection nahi banate.
export const connectSocket = (token) => {
  if (!token) return null;
  if (socket?.connected && socket.auth?.token === token) return socket;

  if (socket) socket.disconnect();

  socket = ioClient(getOrigin(), {
    auth: { token },
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