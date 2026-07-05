import express from "express";
import Schedule from "../models/Schedule.js";

const router = express.Router();

// 한줄일정 목록 조회 (날짜 오름차순 → 생성 순)
router.get("/", async (req, res) => {
  try {
    const items = await Schedule.find().sort({ date: 1, createdAt: 1 });
    res.json(items);
  } catch (error) {
    console.error("일정 목록 조회 실패:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 한줄일정 생성
router.post("/", async (req, res) => {
  try {
    const { text, date } = req.body;

    const item = await Schedule.create({ text, date });

    res.status(201).json(item);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("일정 생성 실패:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 한줄일정 삭제
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Schedule.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
    }

    res.json({ message: "삭제되었습니다.", id });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "올바르지 않은 id입니다." });
    }

    console.error("일정 삭제 실패:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

export default router;
