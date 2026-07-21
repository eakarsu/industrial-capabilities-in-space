export interface User { id: number; email: string; name: string; role?: 'OPERATOR' | 'QUALITY' | 'APPROVER' | 'ADMIN'; }

export interface MaterialLot {
  id: number; base_id: number; lot_code: string; material_type: string;
  quantity_received_kg: number; quantity_available_kg: number; purity_pct: number;
  status: string; storage_location: string; source_system: string; source_record_id: string;
  certificate_url: string; received_at: string; version: number;
}

export interface ManufacturingInspection {
  id: number; quality_score: number; measured_mass_kg: number; dimensional_variance_pct: number;
  defect_count: number; findings: string; evidence_url: string;
  rules: Array<{ rule: string; passed: boolean; actual: unknown; limit: string }>;
  blockers: string[]; decision?: string; decision_reason?: string;
}

export interface ManufacturingWorkOrder {
  id: number; base_id: number; base_name: string; work_order_code: string; part_number: string;
  revision: string; description: string; required_material_type: string; material_required_kg: number;
  min_purity_pct: number; expected_mass_kg: number; mass_tolerance_pct: number;
  temperature_min_c: number; temperature_max_c: number; max_vibration_mm_s: number;
  status: string; version: number; allocated_kg?: number; latest_blockers?: string[];
  allocations?: Array<Record<string, unknown>>; telemetry?: Array<Record<string, unknown>>;
  inspections?: ManufacturingInspection[]; changeOrders?: Array<Record<string, unknown>>;
  events?: Array<Record<string, unknown>>;
}

export interface Mission {
  id: number; name: string; objective: string; crew_size: number;
  launch_date: string; landing_date: string; return_date: string;
  status: string; agency: string; budget_billions: number; current_phase: string;
}

export interface Base {
  id: number; name: string; location: string; established_date: string;
  power_kw: number; crew_count: number; status: string; coordinates: string;
  altitude_m: number; total_regolith_kg: number; mission_id: number; mission_name: string;
}

export interface MiningOperation {
  id: number; base_id: number; base_name: string; site_name: string; method: string;
  regolith_kg_per_hour: number; depth_cm: number; started_at: string; ended_at: string;
  status: string; total_extracted_kg: number; energy_kw_consumed: number; notes: string;
}

export interface Resource {
  id: number; base_id: number; base_name: string; resource_type: string;
  quantity_kg: number; purity_pct: number; extraction_date: string;
  storage_location: string; market_value_per_kg: number; status: string;
}

export interface PrintJob {
  id: number; base_id: number; base_name: string; structure_name: string;
  structure_type: string; material_used_kg: number; dimensions: string;
  mass_kg: number; status: string; started_at: string; completed_at: string;
  success: boolean; quality_score: number; notes: string;
}

export interface Equipment {
  id: number; base_id: number; base_name: string; name: string;
  equipment_type: string; status: string; last_maintenance: string;
  efficiency_pct: number; operating_hours: number; fault_count: number; next_service_at: string;
}
