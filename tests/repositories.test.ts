import { describe, expect, it } from "vitest";
import { ArtifactRecord, WorkflowSession } from "../src/domain/types.js";
import { recordId } from "../src/utils/ids.js";
import { nowIso } from "../src/utils/time.js";
import { testContext } from "./helpers.js";

describe("repositories", () => {
  it("saves and fetches sessions", async () => {
    const { workflows, db } = await testContext();
    const timestamp = nowIso();
    const session: WorkflowSession = {
      id: "wf_test",
      title: "Test",
      problemStatement: "Problem",
      constraints: ["A"],
      desiredOutcomes: ["B"],
      state: "DISCOVERY",
      currentSpecVersion: null,
      currentPlanVersion: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await workflows.save(session);
    expect(await workflows.findById("wf_test")).toMatchObject({ id: "wf_test", constraints: ["A"] });
    await db.close();
  });

  it("saves artifacts and fetches latest and by version", async () => {
    const { workflows, artifacts, db } = await testContext();
    const timestamp = nowIso();
    await workflows.save({
      id: "wf_test",
      title: "Test",
      problemStatement: "Problem",
      constraints: [],
      desiredOutcomes: [],
      state: "DISCOVERY",
      currentSpecVersion: null,
      currentPlanVersion: null,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    const artifact = (version: number): ArtifactRecord => ({
      id: recordId("art"),
      sessionId: "wf_test",
      type: "spec",
      version,
      format: "markdown",
      content: `spec ${version}`,
      metadataJson: "{}",
      createdAt: timestamp
    });
    await artifacts.save(artifact(1));
    await artifacts.save(artifact(2));
    expect((await artifacts.latest("wf_test", "spec"))?.version).toBe(2);
    expect((await artifacts.byVersion("wf_test", "spec", 1))?.content).toBe("spec 1");
    await db.close();
  });
});
