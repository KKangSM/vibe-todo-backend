import mongoose from "mongoose";

// 할일(Todo) 스키마 정의
const todoSchema = new mongoose.Schema(
  {
    // 할일 내용 (필수)
    title: {
      type: String,
      required: [true, "할일 내용을 입력해주세요."],
      trim: true,
      maxlength: [200, "할일은 200자를 넘을 수 없습니다."],
    },
    // 완료 여부
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    // createdAt, updatedAt 자동 생성
    timestamps: true,
  }
);

export default todoSchema;
