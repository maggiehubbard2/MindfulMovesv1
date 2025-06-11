declare module 'emoji-mart-native' {
  interface EmojiData {
    id: string;
    name: string;
    native: string;
    unified: string;
    keywords: string[];
    shortcodes: string;
  }

  interface CustomStyles {
    search?: {
      backgroundColor?: string;
      borderRadius?: number;
      padding?: number;
      margin?: number;
      borderWidth?: number;
      borderColor?: string;
      color?: string;
      fontSize?: number;
      height?: number;
      display?: string;
    };
    category?: {
      backgroundColor?: string;
      color?: string;
      padding?: number;
      height?: number;
    };
    emoji?: {
      fontSize?: number;
      padding?: number;
      width?: number;
      height?: number;
    };
    skinTone?: {
      backgroundColor?: string;
      color?: string;
      padding?: number;
      height?: number;
    };
    preview?: {
      backgroundColor?: string;
      color?: string;
      height?: number;
    };
  }

  interface PickerProps {
    onSelect: (emoji: EmojiData) => void;
    showPreview?: boolean;
    showSkinTones?: boolean;
    theme?: 'light' | 'dark';
    style?: any;
    custom?: CustomStyles;
  }

  export const Picker: React.FC<PickerProps>;
} 