import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Document } from "../database/models/DocumentModel";
import { excludePassword } from "../utils/excludePassword";
import { Not } from "typeorm";
import { sendDocumentReviewNotification } from "../services/SessionOtp";
import { uploadDoc, uploadDocImage, uploadDocVideo } from "../services/cloudinary";
import crypto from "crypto";
import qs from "querystring";
import axios from "axios";
import { DocumentMedia } from "../database/models/DocumentMediaModel";


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
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint", // PPT
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", 
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res
        .status(400)
        .json({ message: "Only PDF, DOC, DOCX, PPT, and PPTX files are allowed" });
    }

    const docRepo = AppDataSource.getRepository(Document);
    const newDoc = docRepo.create({
      title: req.body.title,
      instructorId: req.body.instructorId,
      fileUrl: file.path,
      fileType: file.mimetype,
      publicId: file.filename.trim(),
    });

    await docRepo.save(newDoc);
    res.status(200).json({ message: "Document uploaded successfully", newDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload document", error: err });
  }
};

export const uploadDocumentMedia = async (req: Request, res: Response) => {
  const file = req.file;
  const { id, type } = req.body; // type: "image" or "video"

  if (!file) return res.status(400).json({ message: "No file uploaded" });
  if (!id) return res.status(400).json({ message: "Document ID required" });

  try {
    const docRepo = AppDataSource.getRepository(Document);
    const mediaRepo = AppDataSource.getRepository(DocumentMedia);

    const document = await docRepo.findOne({ where: { id }});
    if (!document) return res.status(404).json({ message: "Document not found" });

    // Upload to Cloudinary
    const result =  type === "image" ? await uploadDocImage(file.path) : await uploadDocVideo(file.path); 

    const newMedia = mediaRepo.create({
      documentId: document.id,
      type: type || "image",
      url: result.secure_url,
    });

    await mediaRepo.save(newMedia);

    res.status(200).json({ message: "Media uploaded successfully", media: newMedia });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload media", error: err });
  }
};

export const downloadFile = async (req: CustomRequest, res: Response) => {
  const fileId = Number(req.params.id);
  const fileRepo = AppDataSource.getRepository(Document);

  try {
    const file = await fileRepo.findOne({ where: { id: fileId } });
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }


    // If path is a Cloudinary URL, redirect there
    if (file.fileUrl!.startsWith("http")) {
      const timestamp = Math.floor(Date.now() / 1000);
      const publicId = file.publicId || file.fileUrl!.split("/").pop()?.split(".")[0];

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
      const apiKey = process.env.CLOUDINARY_API_KEY!;
      const apiSecret = process.env.CLOUDINARY_API_SECRET!;

      const paramsToSign = `attachment=true&public_id=${publicId}&timestamp=${timestamp}&type=upload`;
      const signature = crypto
        .createHash("sha1")
        .update(paramsToSign + apiSecret)
        .digest("hex");

      const query = qs.stringify({
        attachment: true,
        timestamp,
        public_id: publicId,
        type: "upload",
        api_key: apiKey,
        signature,
      });

      const resourceType = "raw";


      const downloadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/download?${query}`;

      const cloudinaryResponse = await axios.get(downloadUrl, {
        responseType: "stream",
      });

      res.setHeader("Content-Disposition", `attachment; filename="${file.title}"`);
      res.setHeader("Content-Type", file.fileType);
      cloudinaryResponse.data.pipe(res);
    } else {
      // fallback for local files (if any)
      res.download(file.fileUrl!, file.title);
    }

  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}


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
    const docMediaRepo = AppDataSource.getRepository(DocumentMedia);
    const medias = await docMediaRepo.find({ where: { documentId: Number(docId) } });

    if (medias.length > 0) {
      await docMediaRepo.remove(medias);
    }
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
