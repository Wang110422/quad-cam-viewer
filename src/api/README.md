# Backend API contract

Frontend gọi API qua `src/api/*` (axios). Bật/tắt mock bằng `VITE_USE_MOCK`
trong `.env`. Khi `VITE_USE_MOCK=false`, mọi request đi tới `VITE_API_BASE_URL`.

## Models

Xem `src/types/models.ts`.

```ts
Room {
  id, name, class_name, floor, building,
  total_students, present, absent,
  status: 'live' | 'ended' | 'upcoming',
  startTime, endTime,            // ISO 8601
  cam_id,                        // FK Camera (1-1, nullable)
  supervisor,
  violations?: Violation[]       // 1-N
}

Camera {
  id, name, room_id, note, video,
  room?: Room                    // 1-1
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
```

## Endpoints kỳ vọng

### Rooms — `src/api/rooms.api.ts`
- `GET    /rooms`
- `GET    /rooms/:id`
- `GET    /rooms/:id/violations`
- `POST   /rooms`              body: `Omit<Room,'id'>`
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

## Auth

Axios interceptor tự gắn `Authorization: Bearer <localStorage.auth_token>` nếu có.
