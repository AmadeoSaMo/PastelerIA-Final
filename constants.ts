
import { Unit } from './types';

export const UNIT_OPTIONS = [
  { value: Unit.g, label: 'Gramos (g)' },
  { value: Unit.kg, label: 'Kilogramos (kg)' },
  { value: Unit.ml, label: 'Mililitros (ml)' },
  { value: Unit.L, label: 'Litros (L)' },
  { value: Unit.unit, label: 'Unidades (u)' },
];

export const ALLERGENS = [
  { id: 'gluten', label: 'Gluten', icon: '🌾' },
  { id: 'crustaceans', label: 'Crustáceos', icon: '🦀' },
  { id: 'eggs', label: 'Huevos', icon: '🥚' },
  { id: 'fish', label: 'Pescado', icon: '🐟' },
  { id: 'peanuts', label: 'Cacahuetes', icon: '🥜' },
  { id: 'soy', label: 'Soja', icon: '🌱' },
  { id: 'milk', label: 'Leche', icon: '🥛' },
  { id: 'nuts', label: 'Frutos de Cáscara', icon: '🌰' },
  { id: 'celery', label: 'Apio', icon: '🥬' },
  { id: 'mustard', label: 'Mostaza', icon: '🌭' },
  { id: 'sesame', label: 'Sésamo', icon: '🥯' },
  { id: 'sulphites', label: 'Sulfitos', icon: '🍷' },
  { id: 'lupin', label: 'Altramuces', icon: '🌸' },
  { id: 'molluscs', label: 'Moluscos', icon: '🐙' },
];
