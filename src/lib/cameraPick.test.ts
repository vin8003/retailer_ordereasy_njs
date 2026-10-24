import { describe, expect, it } from "vitest";
import { nextCamera, orderCameras } from "./cameraPick";

const cams = [
    { id: "a", label: "camera2 1, facing front" },
    { id: "b", label: "camera2 0, facing back" },
    { id: "c", label: "camera2 2, facing back" },
];

describe("orderCameras", () => {
    it("puts rear cameras before the front one", () => {
        expect(orderCameras(cams).map((c) => c.id)).toEqual(["b", "c", "a"]);
    });
});

describe("nextCamera", () => {
    it("is null with fewer than two cameras", () => {
        expect(nextCamera([cams[1]], "b")).toBeNull();
    });
    it("moves to the next rear lens, then the front, then wraps", () => {
        expect(nextCamera(cams, "b")?.id).toBe("c");
        expect(nextCamera(cams, "c")?.id).toBe("a");
        expect(nextCamera(cams, "a")?.id).toBe("b");
    });
    it("never returns the camera already open, even if it is unknown", () => {
        expect(nextCamera(cams, null)?.id).toBe("b");
    });
});
