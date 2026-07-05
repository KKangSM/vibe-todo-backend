import mongoose from "mongoose";

// 일기장(Diary) 스키마 정의
const diarySchema = new mongoose.Schema(
  {
    // 제목 (필수)
    title: {
      type: String,
      required: [true, "제목을 입력해주세요."],
      trim: true,
      maxlength: [80, "제목은 80자를 넘을 수 없습니다."],
    },
    // 오늘의 기분
    mood: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "200자를 넘을 수 없습니다."],
    },
    // 감사한 일
    thanks: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "200자를 넘을 수 없습니다."],
    },
    // 내용
    content: {
      type: String,
      default: "",
      maxlength: [2000, "내용은 2000자를 넘을 수 없습니다."],
    },
  },
  {
    // createdAt, updatedAt 자동 생성
    timestamps: true,
  }
);

export default diarySchema;
