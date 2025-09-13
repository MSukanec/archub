import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { useSidebarStore } from "@/stores/sidebarStore";

export function Sidebar() {
  const { isHovered, setHovered } = useSidebarStore();

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  return (
    <div 
      className="flex h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <LeftSidebar />
      <RightSidebar isHovered={isHovered} />
    </div>
  );
}