import { describe, expect, it } from "vitest";
import { buildWorkspaceTree } from "./tree.js";

describe("buildWorkspaceTree", () => {
  const workspace = {
    id: "ws-1",
    name: "Personal",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  it("nests collections recursively", () => {
    const tree = buildWorkspaceTree(
      workspace,
      [
        {
          id: "c-root",
          workspaceId: "ws-1",
          userId: "u-1",
          parentId: null,
          name: "Root",
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
        },
        {
          id: "c-child",
          workspaceId: "ws-1",
          userId: "u-1",
          parentId: "c-root",
          name: "Nested",
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
        },
      ],
      [],
    );

    expect(tree.tree).toHaveLength(1);
    expect(tree.tree[0]?.children).toHaveLength(1);
    expect(tree.tree[0]?.children[0]?.name).toBe("Nested");
  });

  it("places root secrets outside the tree", () => {
    const createdAt = new Date("2024-02-01T00:00:00.000Z");
    const tree = buildWorkspaceTree(
      workspace,
      [],
      [
        {
          id: "s-1",
          workspaceId: "ws-1",
          collectionId: null,
          title: "Root secret",
          secretType: "password",
          tags: ["prod"],
          createdAt,
          updatedAt: createdAt,
        },
      ],
    );

    expect(tree.rootSecrets).toHaveLength(1);
    expect(tree.rootSecrets[0]?.id).toBe("s-1");
  });
});
