import { create } from 'zustand';

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  formData: {
    first_name: string;
    last_name: string;
    organization_name: string;
    theme: 'light' | 'dark';
    discovered_by: string;
    discovered_by_other_text: string;
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
  organization_name: '',
  theme: 'light' as const,
  discovered_by: '',
  discovered_by_other_text: '',
  last_user_type: null as OnboardingState['formData']['last_user_type'],
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 1,
  totalSteps: 3,
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