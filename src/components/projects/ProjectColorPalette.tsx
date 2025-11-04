import { Check } from "lucide-react";

const PRESET_COLORS = [
  { hex: '#007aff', name: 'Ocean' },
  { hex: '#34c759', name: 'Grass' },
  { hex: '#ffcc00', name: 'Amber' },
  { hex: '#ff3b30', name: 'Coral' },
  { hex: '#af52de', name: 'Violet' },
  { hex: '#5e5ce6', name: 'Slate' },
  { hex: '#00c7be', name: 'Mint' },
  { hex: '#84cc16', name: 'Lime' },
];

type Props = {
  selectedColor: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
};

export default function ProjectColorPalette({ selectedColor, onColorChange, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((colorOption) => (
        <button
          key={colorOption.hex}
          type="button"
          onClick={() => !disabled && onColorChange(colorOption.hex)}
          disabled={disabled}
          className="relative w-10 h-10 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ backgroundColor: colorOption.hex }}
          title={colorOption.name}
          data-testid={`color-option-${colorOption.name.toLowerCase()}`}
        >
          {selectedColor === colorOption.hex && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Check className="w-5 h-5 text-white drop-shadow-md" strokeWidth={3} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
