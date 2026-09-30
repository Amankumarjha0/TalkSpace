import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Message from "../models/message.model.js";
import { getAttachmentContentDisposition } from "../utils/contentDisposition.js";
import { getMessagePreview } from "../utils/messagePreview.js";

test("message schema supports attachment-only messages and deletion state", () => {
  const message = new Message({
    conversationId: new mongoose.Types.ObjectId(),
    senderId: new mongoose.Types.ObjectId(),
    receiverId: new mongoose.Types.ObjectId(),
    attachments: [{
      url: "https://res.cloudinary.com/example/raw/upload/file.pdf",
      publicId: "talkspace/messages/file",
      resourceType: "raw",
      originalName: "file.pdf",
      mimeType: "application/pdf",
      size: 1024,
    }],
  });

  assert.equal(message.validateSync(), undefined);
  assert.equal(message.message, "");
  assert.deepEqual(message.deletedFor, []);
  assert.equal(message.deletedForEveryone, false);
  assert.deepEqual(message.attachments[0].revealedFor, []);
});

test("message previews prefer text and describe image and document attachments", () => {
  assert.equal(getMessagePreview({ message: "hello", attachments: [] }), "hello");
  assert.equal(getMessagePreview({ message: "", attachments: [{ resourceType: "image" }] }), "Photo");
  assert.equal(getMessagePreview({ message: "", attachments: [{ resourceType: "raw" }] }), "File");
  assert.equal(getMessagePreview({ message: "", attachments: [{}, {}] }), "2 attachments");
});

test("attachment download disposition preserves file extensions and encodes filenames", () => {
  assert.match(getAttachmentContentDisposition("resume.docx"), /filename="resume\.docx"/);
  assert.match(getAttachmentContentDisposition("slides.pptx"), /filename\*=UTF-8''slides\.pptx/);
  assert.match(getAttachmentContentDisposition("report final.pdf"), /filename\*=UTF-8''report%20final\.pdf/);
  assert.doesNotMatch(getAttachmentContentDisposition('bad"name.pdf'), /filename="bad"name\.pdf"/);
});