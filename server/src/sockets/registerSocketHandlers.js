export function registerSocketHandlers(io){io.on("connection",socket=>{socket.emit("server:ready",{socketId:socket.id,message:"Connected to Royal Treasury."});});}
