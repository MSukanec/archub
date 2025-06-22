import { CustomPageBody } from "./CustomPageBody";

interface CustomPageLayoutProps {
  wide?: boolean;
  children: React.ReactNode;
}

export function CustomPageLayout({
  wide = false,
  children,
}: CustomPageLayoutProps) {
  return (
    <div className="flex justify-center bg-[var(--layout-bg)]">
      <div 
        className={`py-6 px-4 min-h-screen mx-auto ${
          wide ? "max-w-full w-full" : "max-w-7xl w-full"
        }`}
      >
        <CustomPageBody padding="none">
          {children}
        </CustomPageBody>
      </div>
    </div>
  );
}