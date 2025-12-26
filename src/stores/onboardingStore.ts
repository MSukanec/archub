import { create } from 'zustand';

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  formData: {
    first_name: string;
    last_name: string;
    country: string;
    birthdate: string;
    organization_name: string;
    theme: 'light' | 'dark';
    default_currency_id: string;
    secondary_currency_ids: string[];
    default_wallet_id: string;
    secondary_wallet_ids: string[];
    discovered_by: string;
    discovered_by_other_text: string;
    main_use: string;
    user_role: string;
    user_role_other: string;
    team_size: string;
    last_user_type: 'professional' | 'provider' | 'worker' | 'visitor' | null;
  };
  setCurrentStep: (step: number) => void;
  updateFormData: (data: Partial<OnboardingState['formData']>) => void;
  resetOnboarding: () => void;
  goNextStep: () => void;
  goPrevStep: () => void;
}

const initialFormData = {
  first_name: '',
  last_name: '',
  country: '',
  birthdate: '',
  organization_name: '',
  theme: 'light' as const,
  default_currency_id: '',
  secondary_currency_ids: [] as string[],
  default_wallet_id: '',
  secondary_wallet_ids: [] as string[],
  discovered_by: '',
  discovered_by_other_text: '',
  main_use: '',
  user_role: '',
  user_role_other: '',
  team_size: '',
  last_user_type: null as OnboardingState['formData']['last_user_type'],
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 1,
  totalSteps: 4,
  formData: initialFormData,
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  updateFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  
  resetOnboarding: () => set({
    currentStep: 1,
    formData: initialFormData
  }),
  
  goNextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, state.totalSteps)
  })),
  
  goPrevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 1)
  })),
}));