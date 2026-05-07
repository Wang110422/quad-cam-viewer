import { io, Socket } from "socket.io-client";

// URL backend AI – có thể đổi qua biến môi trường VITE_SOCKET_URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;
  private refCount = 0;

  /**
   * Kết nối socket dùng chung cho toàn ứng dụng.
   * Mỗi consumer (mỗi camera tile) gọi connect() khi mount
   * và release() khi unmount. Socket chỉ thực sự đóng khi
   * không còn ai dùng nữa.
   */
  connect(): Socket {
    if (!this.socket || this.socket.disconnected) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
      });
    }
    this.refCount += 1;
    return this.socket;
  }

  /** Giảm refcount; chỉ đóng socket khi không còn tile nào dùng. */
  release() {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0 && this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /** Đóng socket ngay (force). Tránh dùng khi nhiều tile đang share. */
  disconnect() {
    this.refCount = 0;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  /** Gửi 1 frame ảnh (base64) lên backend AI để nhận diện. */
  emitFrame(frameData: string, id: number) {
    if (this.socket?.connected) {
      this.socket.emit("send_frame", { image: frameData, id });
    }
  }

  /** Báo backend bắt đầu xử lý video cho camera vừa thêm/sửa. */
  emitVideo(video_name: string, cam_id: number) {
    // Đảm bảo có socket trước khi emit (trường hợp gọi trước khi tile mount)
    if (!this.socket || this.socket.disconnected) {
      this.connect();
    }
    const doEmit = () => this.socket?.emit("send_video", { video_name, camera_id: cam_id });
    if (this.socket?.connected) doEmit();
    else this.socket?.once("connect", doEmit);
  }
}

export const socketService = new SocketService();
