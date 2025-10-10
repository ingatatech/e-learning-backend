import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Document } from "../database/models/DocumentModel";
import { excludePassword } from "../utils/excludePassword";
import { Not } from "typeorm";
import { sendDocumentReviewNotification } from "../services/SessionOtp";
import { uploadDoc } from "../services/cloudinary";

interface CustomRequest extends Request {
  user?: { id: number; roleName: string };
}

export const createDocument = async (req: CustomRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    const instructorId = req.user!.id;

    const docRepo = AppDataSource.getRepository(Document);
    const doc = docRepo.create({ title, content, instructorId });
    await docRepo.save(doc);

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to create document", error: err });
  }
};


export const uploadDocumentFile = async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) return res.status(400).json({ message: "No file uploaded" });

  try {
      const allowedMimeTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Only PDF, DOC, and DOCX files are allowed" });
      }

     const result = await uploadDoc(file.path);


    // Save file info to DB
    const docRepo = AppDataSource.getRepository(Document);
    const newDoc = docRepo.create({
      title: req.body.title,
      instructorId: req.body.instructorId,
      fileUrl: result.secure_url,
    });

    await docRepo.save(newDoc);

    res.status(200).json({ message: "Document uploaded successfully", newDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload document", error: err });
  }
};


export const getInstructorDocuments = async (req: CustomRequest, res: Response) => {
  try {
    const instructorId = req.user!.id;
    const docRepo = AppDataSource.getRepository(Document);

    const docs = await docRepo.find({
      where: { instructor: {id: instructorId} },
      order: { updatedAt: "DESC" },
    });

    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch documents", error: err });
  }
};

export const getSubmittedDocuments = async (req: CustomRequest, res: Response) => {
  try {
    const docRepo = AppDataSource.getRepository(Document);

    const docs = await docRepo.find({
      where: { status: Not("draft") },
      relations: ["instructor"],
      order: { updatedAt: "DESC" },
    });

    const sanitized = docs.map((doc) => ({
      ...doc,
      instructor: excludePassword(doc.instructor),
    }));

    res.status(200).json(sanitized);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch documents", error: err });
  }
};

export const getDocument = async (req: CustomRequest, res: Response) => {
  try {
    const docId = req.params.docId;
    const docRepo = AppDataSource.getRepository(Document);

    const doc = await docRepo.findOne({
      where: { id: Number(docId) },
    });

    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch document", error: err });
  }
};

export const updateDocument = async (req: CustomRequest, res: Response) => {
  try {
    const { docId } = req.params;
    const updates = req.body;
    const docRepo = AppDataSource.getRepository(Document);

    await docRepo.update(docId, { ...updates, lastEditedAt: new Date() });
    const updated = await docRepo.findOneBy({ id: Number(docId) });

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update document", error: err });
  }
};

export const changeDocumentStatus = async (req: CustomRequest, res: Response) => {
  try {
    const { docId } = req.params;
    const { status, reviewNotes } = req.body;
    const reviewerId = req.user!.id;

    const docRepo = AppDataSource.getRepository(Document);
    await docRepo.update(docId, {
      status,
      reviewNotes,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    });

    // Fetch the updated document with instructor relation
    const updated = await docRepo.findOne({
      where: { id: Number(docId) },
      relations: ["instructor"],
    });

    if (!updated) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Send email if approved or rejected
    if (status === "approved" || status === "rejected") {
      await sendDocumentReviewNotification(
        updated.instructor.email,
        status,
        updated.title,
        reviewNotes
      );
    }

    const sanitized = {
      ...updated,
      instructor: excludePassword(updated.instructor),
    }
    res.status(200).json(sanitized);
  } catch (err) {
    res.status(500).json({ message: "Failed to change document status", error: err });
  }
};

export const deleteDocument = async (req: CustomRequest, res: Response) => {
  try {
    const { docId } = req.params;
    const docRepo = AppDataSource.getRepository(Document);
    await docRepo.delete(docId);
    res.status(200).json({ message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete document", error: err });
  }
};

export const submitDocument = async (req: CustomRequest, res: Response) => {
  try {
    const { docId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const docRepo = AppDataSource.getRepository(Document);
    const document = await docRepo.findOne({ where: { id: +docId } });

    if (!document) return res.status(404).json({ message: "Document not found" });

    if (document.instructorId !== userId)
      return res.status(403).json({ message: "You can only submit your own documents" });

    document.status = "submitted";
    document.submittedAt = new Date();

    await docRepo.save(document);

    res.status(200).json({ message: "Document submitted for review", document });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit document", error: err instanceof Error ? err.message : String(err) });
  }
};
