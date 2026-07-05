import express from "express";
import Todo from "../models/Todo.js";

const router = express.Router();

// 할일 목록 조회 (최신순)
router.get("/", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    console.error("할일 목록 조회 실패:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 할일 생성
router.post("/", async (req, res) => {
  try {
    const { title } = req.body;

    const todo = await Todo.create({ title });

    res.status(201).json(todo);
  } catch (error) {
    // 유효성 검사 실패 등
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("할일 생성 실패:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 할일 수정
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    // 전달된 필드만 수정
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (completed !== undefined) updates.completed = completed;

    const todo = await Todo.findByIdAndUpdate(id, updates, {
      new: true, // 수정된 문서를 반환
      runValidators: true, // 스키마 유효성 검사 실행
    });

    if (!todo) {
      return res.status(404).json({ message: "할일을 찾을 수 없습니다." });
    }

    res.json(todo);
  } catch (error) {
    // 유효성 검사 실패 등
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    // 잘못된 형식의 id
    if (error.name === "CastError") {
      return res.status(400).json({ message: "올바르지 않은 id입니다." });
    }

    console.error("할일 수정 실패:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 할일 삭제
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      return res.status(404).json({ message: "할일을 찾을 수 없습니다." });
    }

    res.json({ message: "삭제되었습니다.", id });
  } catch (error) {
    // 잘못된 형식의 id
    if (error.name === "CastError") {
      return res.status(400).json({ message: "올바르지 않은 id입니다." });
    }

    console.error("할일 삭제 실패:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

export default router;
