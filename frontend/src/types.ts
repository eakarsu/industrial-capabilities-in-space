export interface User { id: number; email: string; name: string; }

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
