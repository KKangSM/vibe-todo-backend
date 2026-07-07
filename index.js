import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";
import todoRouter from "./routers/todo.js";
import scheduleRouter from "./routers/schedule.js";
import diaryRouter from "./routers/diary.js";
import memoRouter from "./routers/memo.js";

// ESM에는 __dirname이 없어 직접 계산
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 프론트엔드(화면) 폴더 — 백엔드가 함께 서빙해서 앱을 하나로 합침
const FRONTEND_DIR = path.join(__dirname, "..", "todo-firebase");

// 이 PC의 기본 DNS(127.0.0.1)가 응답하지 않아 Atlas의 SRV 조회가 실패함 → 공개 DNS로 강제
dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/todo";

// 미들웨어
// 다른 도메인(배포된 React 앱 등)에서의 브라우저 요청을 허용 (CORS)
app.use(cors());
app.use(express.json());

// 프론트엔드 정적 파일 서빙 → "/" 접속 시 index.html(화면)이 뜸
app.use(express.static(FRONTEND_DIR));

// 헬스체크 라우트
app.get("/health", (req, res) => {
  res.json({ message: "todo-backend server is running" });
});

// 기능별 라우터
app.use("/todos", todoRouter); // 할 일
app.use("/schedule", scheduleRouter); // 한줄일정
app.use("/diary", diaryRouter); // 일기장
app.use("/memos", memoRouter); // 메모장

// MongoDB 연결 후 서버 실행
const start = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("몽고디비 연결 성공");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

start();
