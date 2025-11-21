// Import types from shared schema to use in extensions
import type {
  Subcontract,
  SubcontractBid,
} from '../../../../shared/schema';

// Re-export types from shared schema
export type {
  Subcontract,
  InsertSubcontract,
  SubcontractTask,
  InsertSubcontractTask,
  SubcontractBid,
  InsertSubcontractBid,
  MovementSubcontract,
  InsertMovementSubcontract,
} from '../../../../shared/schema';

// Additional feature-specific types
export interface SubcontractWithContact extends Subcontract {
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    company_name?: string;
    email?: string;
  };
}

export interface SubcontractBidWithContact extends SubcontractBid {
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    company_name?: string;
  };
  currencies?: {
    id: string;
    code: string;
    name: string;
  };
}
