import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Define the breadcrumb item type
export type BankBreadcrumb = {
  id: string
  name: string
}

// Define the store state type
interface BankNavigationState {
  // Current bank ID (null means we're at root level)
  currentBankId: string | null
  
  // Breadcrumb navigation path
  breadcrumbs: BankBreadcrumb[]
  
  // Actions
  setCurrentBank: (bankId: string | null, bankName?: string) => void
  navigateTo: (bankId: string, bankName: string) => void
  navigateToRoot: () => void
  navigateToBreadcrumb: (index: number) => void
  resetNavigation: () => void
}

// Create the store with persistence
export const useBankNavigation = create(
  persist<BankNavigationState>(
    (set, get) => ({
      // Initial state
      currentBankId: null,
      breadcrumbs: [],
      
      // Set the current bank without modifying breadcrumbs
      setCurrentBank: (bankId, bankName) => set({
        currentBankId: bankId
      }),
      
      // Navigate to a specific bank, adding it to breadcrumbs
      navigateTo: (bankId, bankName) => set((state) => ({
        currentBankId: bankId,
        breadcrumbs: [...state.breadcrumbs, { id: bankId, name: bankName }]
      })),
      
      // Navigate to root level
      navigateToRoot: () => set({
        currentBankId: null,
        breadcrumbs: []
      }),
      
      // Navigate to a specific breadcrumb by index
      navigateToBreadcrumb: (index) => {
        const { breadcrumbs } = get();
        
        if (index === -1) {
          // Navigate to root
          set({
            currentBankId: null,
            breadcrumbs: []
          });
          return;
        }
        
        // Navigate to specific breadcrumb
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        const lastBreadcrumb = newBreadcrumbs[newBreadcrumbs.length - 1];
        
        set({
          currentBankId: lastBreadcrumb?.id || null,
          breadcrumbs: newBreadcrumbs
        });
      },
      
      // Reset navigation state
      resetNavigation: () => set({
        currentBankId: null,
        breadcrumbs: []
      })
    }),
    {
      // Persistence configuration
      name: 'bank-navigation-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
