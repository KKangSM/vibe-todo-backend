import mongoose from "mongoose";

// 한줄일정(Schedule) 스키마 정의
const scheduleSchema = new mongoose.Schema(
  {
    // 일정 내용 (필수)
    text: {
      type: String,
      required: [true, "일정 내용을 입력해주세요."],
      trim: true,
      maxlength: [200, "일정은 200자를 넘을 수 없습니다."],
    },
    // 날짜 "YYYY-MM-DD" (필수)
    date: {
      type: String,
      required: [true, "날짜를 선택해주세요."],
    },
  },
  {
    // createdAt, updatedAt 자동 생성
    timestamps: true,
  }
);

export default scheduleSchema;
