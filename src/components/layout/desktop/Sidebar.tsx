import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";

export function Sidebar() {
  return (
    <div className="flex h-full">
      <LeftSidebar />
      <RightSidebar />
    </div>
  );
}