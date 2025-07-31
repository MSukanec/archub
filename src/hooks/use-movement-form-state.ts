import { useReducer, useMemo } from 'react'

type MovementFormType = 'normal' | 'conversion' | 'transfer' | 'aportes' | 'aportes_propios' | 'retiros_propios' | 'materiales' | 'subcontratos'

interface MovementFormState {
  selectedTypeId: string
  selectedCategoryId: string  
  selectedSubcategoryId: string
  movementType: MovementFormType
}

type MovementFormAction = 
  | { type: 'SET_SELECTION'; payload: { typeId: string; categoryId: string; subcategoryId: string } }
  | { type: 'SET_MOVEMENT_TYPE'; payload: MovementFormType }
  | { type: 'RESET' }

const initialState: MovementFormState = {
  selectedTypeId: '',
  selectedCategoryId: '',
  selectedSubcategoryId: '',
  movementType: 'normal'
}

function movementFormReducer(state: MovementFormState, action: MovementFormAction): MovementFormState {
  switch (action.type) {
    case 'SET_SELECTION':
      return {
        ...state,
        selectedTypeId: action.payload.typeId,
        selectedCategoryId: action.payload.categoryId,
        selectedSubcategoryId: action.payload.subcategoryId
      }
    case 'SET_MOVEMENT_TYPE':
      return {
        ...state,
        movementType: action.payload
      }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export function useMovementFormState(organizationConcepts: any[] = []) {
  const [state, dispatch] = useReducer(movementFormReducer, initialState)
  
  const detectFormType = useMemo(() => {
    return (typeId: string, categoryId: string, subcategoryId: string): MovementFormType => {
      if (!typeId || !organizationConcepts.length) return 'normal'
      
      // Buscar el concepto tipo
      const selectedConcept = organizationConcepts.find(concept => concept.id === typeId)
      if (selectedConcept?.view_mode === 'conversion') return 'conversion'
      if (selectedConcept?.view_mode === 'transfer') return 'transfer'
      
      if (!categoryId) return 'normal'
      
      // Buscar la categoría para tipos especiales
      let selectedCategory = null
      for (const concept of organizationConcepts) {
        const foundCategory = concept.children?.find((cat: any) => cat.id === categoryId)
        if (foundCategory) {
          selectedCategory = foundCategory
          break
        }
      }
      
      if (!selectedCategory) return 'normal'
      
      const viewMode = (selectedCategory.view_mode ?? "normal").trim()
      
      // Detectar subcontratos por UUID específico
      if (subcategoryId === 'f40a8fda-69e6-4e81-bc8a-464359cd8498') {
        return 'subcontratos'
      }
      
      if (viewMode === "aportes") return 'aportes'
      if (viewMode === "aportes_propios") return 'aportes_propios'
      if (viewMode === "retiros_propios") return 'retiros_propios'
      if (viewMode === "materiales" || selectedCategory.name?.toLowerCase().includes('material')) {
        return 'materiales'
      }
      
      return 'normal'
    }
  }, [organizationConcepts])

  const handleSelectionChange = (typeId: string, categoryId: string, subcategoryId: string) => {
    const detectedType = detectFormType(typeId, categoryId, subcategoryId)
    
    dispatch({ 
      type: 'SET_SELECTION', 
      payload: { typeId, categoryId, subcategoryId } 
    })
    
    dispatch({ 
      type: 'SET_MOVEMENT_TYPE', 
      payload: detectedType 
    })
  }

  const reset = () => {
    dispatch({ type: 'RESET' })
  }

  return {
    state,
    handleSelectionChange,
    reset,
    detectFormType
  }
}