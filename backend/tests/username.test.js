import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/user.model.js";
import Friendship from "../models/friendship.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { displayNameFromEmail, isValidUsername, normalizeUsername, usernameFromIdentity } from "../utils/username.js";
import { getPairKey } from "../utils/pairKey.js";

test("username normalization trims and lowercases", () => {
  assert.equal(normalizeUsername("  Aman.Jha_7  "), "aman.jha_7");
});

test("username format accepts only 3-20 lowercase letters, digits, dots and underscores", () => {
  assert.equal(isValidUsername("aman.jha_7"), true);
  assert.equal(isValidUsername("ab"), false);
  assert.equal(isValidUsername("invalid-name"), false);
  assert.equal(isValidUsername("a".repeat(21)), false);
});

test("legacy username generation sanitizes identity and avoids generic display names", () => {
  assert.equal(usernameFromIdentity("Aman Kumar", "person@example.com"), "aman_kumar");
  assert.equal(usernameFromIdentity("New User", "new.person@example.com"), "new.person");
  assert.equal(displayNameFromEmail("new.user@example.com"), "TalkSpace User");
});

test("pair keys are stable regardless of argument order", () => {
  assert.equal(getPairKey("user_b", "user_a"), "user_a_user_b");
});

test("username has a unique sparse MongoDB index", () => {
  const index = User.schema.indexes().find(([keys]) => keys.username === 1);
  assert.ok(index);
  assert.equal(index[1].unique, true);
  assert.equal(index[1].sparse, true);
});

test("friendship and conversation pair keys are unique", () => {
  const friendshipIndex = Friendship.schema.indexes().find(([keys]) => keys.pairKey === 1);
  const conversationIndex = Conversation.schema.indexes().find(([keys]) => keys.pairKey === 1);
  assert.equal(friendshipIndex?.[1].unique, true);
  assert.equal(conversationIndex?.[1].unique, true);
  assert.equal(conversationIndex?.[1].sparse, true);
});

test("chat and message query indexes cover activity ordering", () => {
  const conversationIndex = Conversation.schema.indexes().find(([keys]) => keys.participants === 1 && keys.updatedAt === -1);
  const messageIndex = Message.schema.indexes().find(([keys]) => keys.conversationId === 1 && keys.createdAt === 1);
  assert.ok(conversationIndex);
  assert.ok(messageIndex);
});