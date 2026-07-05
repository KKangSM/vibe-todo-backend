import express from "express";
import Memo from "../models/Memo.js";

const router = express.Router();

// 수정/생성 시 허용하는 필드
const FIELDS = ["title", "content"];

// 메모 목록 조회 (최신순)
router.get("/", async (req, res) => {
  try {
    const items = await Memo.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error("메모 목록 조회 실패:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 메모 생성
router.post("/", async (req, res) => {
  try {
    const data = {};
    FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });

    const item = await Memo.create(data);

    res.status(201).json(item);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("메모 생성 실패:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 메모 수정 (전달된 필드만)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updates = {};
    FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const item = await Memo.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ message: "메모를 찾을 수 없습니다." });
    }

    res.json(item);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ message: "올바르지 않은 id입니다." });
    }

    console.error("메모 수정 실패:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 메모 삭제
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Memo.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ message: "메모를 찾을 수 없습니다." });
    }

    res.json({ message: "삭제되었습니다.", id });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "올바르지 않은 id입니다." });
    }

    console.error("메모 삭제 실패:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

export default router;
