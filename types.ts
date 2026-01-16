
export enum AttendanceStatus {
  SCHEDULED = 'Agendada',
  CONFIRMED = 'Confirmada',
  COMPLETED = 'Realizada',
  ABSENT = 'Falta',
  ABSENT_WITHOUT_NOTICE = 'Falta s/ Aviso',
  RESCHEDULED = 'Reagendada',
  CANCELLED = 'Cancelada'
}

export enum PaymentStatus {
  PAID = 'Pago',
  PARTIAL = 'Parcial',
  OPEN = 'Em aberto',
  CANCELLED = 'Cancelado'
}

export enum PatientStatus {
  ACTIVE = 'Ativo',
  INACTIVE = 'Inativo',
  WAITING = 'Em espera'
}

export enum ServiceType {
  SINGLE = 'Atendimento Avulso',
  PACKAGE = 'Pacote de atendimentos'
}

export enum PaymentMethod {
  CASH = 'Espécie',
  DEBIT = 'Débito',
  CREDIT = 'Crédito',
  PIX = 'PIX'
}

export enum PackageStatus {
  ACTIVE = 'Ativo',
  FINISHED = 'Finalizado',
  EXPIRED = 'Expirado'
}

export enum UserRole {
  ADMIN = 'Administrador',
  STANDARD = 'Padrão'
}

export enum UserStatus {
  ACTIVE = 'Ativo',
  INACTIVE = 'Inativo',
  SUSPENDED = 'Suspenso'
}

export enum ProfissionalStatus {
  ACTIVE = 'Ativo',
  INACTIVE = 'Inativo'
}

export enum AgeGroup {
  ADULT = 'Adulto',
  CHILD = 'Criança',
  ADOLESCENT = 'Adolescente'
}

export interface Profissional {
  id: string;
  nomeCompleto: string;
  registroProfissional: string;
  telefone: string;
  email: string;
  especialidade?: string;
  status: ProfissionalStatus;
  criadoEm: string;
  avatar?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  professionalAccess: string[]; 
}

export interface Patient {
  id: string;
  profissionalId: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  dateOfBirth: string;
  status: PatientStatus;
  registrationDate: string;
  notes: string;
  ageGroup?: AgeGroup;
  guardianName?: string;
}

export interface Session {
  id: string;
  profissionalId: string;
  patientId: string;
  date: string;
  time: string;
  duration: number;
  status: AttendanceStatus;
  notes: string;
  serviceType?: ServiceType;
  packageId?: string;
}

export interface SessionPackage {
  id: string;
  profissionalId: string;
  patientId: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  expiryDate?: string;
  status: PackageStatus;
  paymentId?: string;
}

export interface Payment {
  id: string;
  profissionalId: string;
  patientId: string;
  sessionId?: string; 
  amount: number;
  date: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  serviceType: ServiceType;
  notes?: string;
}
