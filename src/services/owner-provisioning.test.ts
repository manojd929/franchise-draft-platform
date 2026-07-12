import { describe, expect, it } from "vitest";

import { UserRole } from "@/generated/prisma/enums";

import { classifyExistingProfileForOwnerProvision } from "./owner-provisioning";

const REQUESTER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "22222222-2222-2222-2222-222222222222";

describe("classifyExistingProfileForOwnerProvision", () => {
  it("rejects the organizer trying to grant themselves an owner login", () => {
    const result = classifyExistingProfileForOwnerProvision(
      { id: REQUESTER_ID, role: UserRole.ADMIN },
      REQUESTER_ID,
    );
    expect(result.kind).toBe("reject-self");
    if (result.kind === "reject-self") {
      expect(result.message.toLowerCase()).toContain("organizer");
    }
  });

  it("rejects granting an owner login to another organizer's admin account", () => {
    const result = classifyExistingProfileForOwnerProvision(
      { id: OTHER_ID, role: UserRole.ADMIN },
      REQUESTER_ID,
    );
    expect(result.kind).toBe("reject-admin");
    if (result.kind === "reject-admin") {
      expect(result.message.toLowerCase()).toContain("admin");
    }
  });

  it("returns link-as-is for an existing OWNER profile owned by someone else", () => {
    const result = classifyExistingProfileForOwnerProvision(
      { id: OTHER_ID, role: UserRole.OWNER },
      REQUESTER_ID,
    );
    expect(result).toEqual({ kind: "link-as-is" });
  });

  it("returns link-and-promote for a VIEWER profile", () => {
    const result = classifyExistingProfileForOwnerProvision(
      { id: OTHER_ID, role: UserRole.VIEWER },
      REQUESTER_ID,
    );
    expect(result).toEqual({ kind: "link-and-promote" });
  });

  it("prefers the self-reject over the admin-reject when both would match", () => {
    // The organizer is themselves an ADMIN. Self-check must fire first so
    // the error tells them the correct thing to do (use a different email),
    // not that "admins cannot be owners".
    const result = classifyExistingProfileForOwnerProvision(
      { id: REQUESTER_ID, role: UserRole.ADMIN },
      REQUESTER_ID,
    );
    expect(result.kind).toBe("reject-self");
  });

  it("is a pure function — repeated calls with identical input return identical output", () => {
    const input = { id: OTHER_ID, role: UserRole.VIEWER };
    const first = classifyExistingProfileForOwnerProvision(input, REQUESTER_ID);
    const second = classifyExistingProfileForOwnerProvision(input, REQUESTER_ID);
    expect(first).toEqual(second);
  });
});
