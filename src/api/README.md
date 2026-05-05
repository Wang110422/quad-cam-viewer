# Backend API contract

Frontend gọi API qua `src/api/*` (axios thuần — KHÔNG còn mock).
Set `VITE_API_BASE_URL` trong `.env` để trỏ về backend thật.

## Models

Xem chi tiết kèm comment endpoint trong `src/types/models.ts`.

```ts
Room {
  id, name, class_name, floor, building,
  total_students, present, absent,
  status: 'live' | 'ended' | 'upcoming',  // mặc định 'upcoming' khi tạo
  startTime, endTime,            // ISO 8601
  cam_id,                        // FK Camera (1-1, nullable)
  supervisor,
  violations?: Violation[]       // 1-N
}

Camera {                          // KHÔNG có field status
  id, name, room_id, note, video,
  room?: Room                    // 1-1, BE nên hydrate
}

Violation {
  id, studentId, studentName,
  room_id,                       // FK Room (N-1)
  time, reason, image, videoUrl,
  frameLogs: FrameLog[],         // 1-N
  videoLogs: VideoLog[]          // 1-N
}

FrameLog { frameId, behavior, confidence }
VideoLog { videoId, behavior, startTime, endTime }

Supervisor {
  id, name, email, phone, gender, dob, address, department, assignedRoom
}
```

## Endpoints

### Rooms — `src/api/rooms.api.ts`
- `GET    /rooms`
- `GET    /rooms/:id`
- `GET    /rooms/:id/violations`
- `POST   /rooms`              body: `Omit<Room,'id'|'violations'>`
- `PATCH  /rooms/:id`          body: `Partial<Room>`
- `DELETE /rooms/:id`

### Cameras — `src/api/cameras.api.ts`
- `GET    /cameras`            kèm room (1-1)
- `GET    /cameras/:id`
- `POST   /cameras`            body: `Omit<Camera,'id'|'room'>`
- `PATCH  /cameras/:id`
- `DELETE /cameras/:id`
- `POST   /cameras/:id/video`  multipart `video` → `{ url }`

### Violations — `src/api/violations.api.ts`
- `GET    /violations?room_id=`
- `GET    /violations/:id`
- `GET    /violations/:id/frames`
- `GET    /violations/:id/videos`
- `POST   /violations`
- `DELETE /violations/:id`

### Supervisors — `src/api/supervisors.api.ts`
- `GET    /supervisors`
- `POST   /supervisors`
- `PATCH  /supervisors/:id`
- `DELETE /supervisors/:id`

## Nghiệp vụ trạng thái phòng (FE đảm nhận, BE có thể mirror)

- Tạo phòng mới → `status = "upcoming"`.
- Khi gắn camera vào phòng → phòng đó `→ "live"`.
- Khi video camera phát hết → phòng `→ "ended"`.
- Khi camera được chuyển từ phòng `ended` sang phòng khác → phòng cũ `→ "upcoming"`.

## Auth

Axios interceptor tự gắn `Authorization: Bearer <localStorage.auth_token>` nếu có.
