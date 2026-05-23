import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { RequestBuilder } from "./RequestBuilder";
import { ResponseViewer } from "./ResponseViewer";
import { Sidebar } from "./Sidebar";

interface LayoutState {
  sidebarWidth: number;
  responseHeight: number;
}

const STORAGE_KEY = "getman.layout.v2";
const defaultLayout: LayoutState = {
  sidebarWidth: 304,
  responseHeight: 360
};

export function ResizableWorkspace() {
  const [layout, setLayout] = useState<LayoutState>(() => readLayout());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const style = useMemo(
    () =>
      ({
        "--sidebar-width": `${layout.sidebarWidth}px`,
        "--response-height": `${layout.responseHeight}px`
      }) as CSSProperties,
    [layout]
  );

  const startResize = (target: "sidebar" | "response-height", event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const start = layout;

    const onPointerMove = (moveEvent: PointerEvent) => {
      setLayout((current) => {
        if (target === "sidebar") {
          return {
            ...current,
            sidebarWidth: clamp(start.sidebarWidth + moveEvent.clientX - startX, 236, 460)
          };
        }

        return {
          ...current,
          responseHeight: clamp(start.responseHeight - (moveEvent.clientY - startY), 220, 680)
        };
      });
    };

    const onPointerUp = () => {
      document.body.classList.remove("is-resizing");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    document.body.classList.add("is-resizing");
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <main className="workspace-layout" style={style}>
      <Sidebar />
      <div className="resize-handle resize-sidebar" onPointerDown={(event) => startResize("sidebar", event)} />
      <section className="main-split">
        <RequestBuilder />
        <div className="resize-handle resize-response-y" onPointerDown={(event) => startResize("response-height", event)} />
        <ResponseViewer />
      </section>
    </main>
  );
}

function readLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultLayout;
    }

    const parsed = JSON.parse(raw) as Partial<LayoutState>;
    return {
      sidebarWidth: clamp(parsed.sidebarWidth ?? defaultLayout.sidebarWidth, 236, 460),
      responseHeight: clamp(parsed.responseHeight ?? defaultLayout.responseHeight, 220, 680)
    };
  } catch {
    return defaultLayout;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
