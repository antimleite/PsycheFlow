
import { Patient, PatientStatus, Session, AttendanceStatus, Payment, PaymentStatus, ServiceType, Profissional, ProfissionalStatus } from './types';

export const mockProfissionais: Profissional[] = [
  {
    id: 'prof1',
    // Fixed: renamed nome_completo to nomeCompleto
    nomeCompleto: 'Dr. Carlos Andrade',
    // Fixed: renamed registro_profissional to registroProfissional
    registroProfissional: 'CRP 06/12345',
    telefone: '(11) 91234-5678',
    email: 'carlos.andrade@psycheflow.com',
    especialidade: 'Terapia Cognitivo-Comportamental',
    status: ProfissionalStatus.ACTIVE,
    // Fixed: renamed criado_em to criadoEm
    criadoEm: '2023-01-10',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: 'prof2',
    // Fixed: renamed nome_completo to nomeCompleto
    nomeCompleto: 'Dra. Beatriz Lima',
    // Fixed: renamed registro_profissional to registroProfissional
    registroProfissional: 'CRP 06/54321',
    telefone: '(11) 98765-4321',
    email: 'beatriz.lima@psycheflow.com',
    especialidade: 'Psicanálise',
    status: ProfissionalStatus.ACTIVE,
    // Fixed: renamed criado_em to criadoEm
    criadoEm: '2023-02-15',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

export const mockPatients: Patient[] = [
  {
    id: 'p1',
    profissionalId: 'prof1',
    name: 'Sara Oliveira',
    email: 'sara.o@exemplo.com',
    phone: '(11) 98888-0101',
    dateOfBirth: '1988-05-12',
    status: PatientStatus.ACTIVE,
    registrationDate: '2023-10-15',
    notes: 'Lidando com ansiedade leve e estresse no ambiente de trabalho.'
  },
  {
    id: 'p2',
    profissionalId: 'prof1',
    name: 'Ricardo Silva',
    email: 'r.silva@exemplo.com',
    phone: '(11) 97777-0102',
    dateOfBirth: '1992-08-24',
    status: PatientStatus.ACTIVE,
    registrationDate: '2023-11-20',
    notes: 'Terapia cognitivo-comportamental para insônia.'
  },
  {
    id: 'p3',
    profissionalId: 'prof2',
    name: 'Emanuela Gomes',
    email: 'emanuela.g@exemplo.com',
    phone: '(11) 96666-0103',
    dateOfBirth: '1975-03-05',
    status: PatientStatus.INACTIVE,
    registrationDate: '2023-09-01',
    notes: 'Faltou a várias consultas, precisa de acompanhamento urgente.'
  },
  {
    id: 'p4',
    profissionalId: 'prof2',
    name: 'Fernanda Costa',
    email: 'fernanda.c@exemplo.com',
    phone: '(11) 95555-0104',
    dateOfBirth: '1995-11-30',
    status: PatientStatus.ACTIVE,
    registrationDate: '2024-01-05',
    notes: 'Questões de relacionamento e comunicação.'
  }
];

export const mockSessions: Session[] = [
  {
    id: 's1',
    profissionalId: 'prof1',
    patientId: 'p1',
    date: '2024-05-15',
    time: '10:00',
    duration: 50,
    status: AttendanceStatus.COMPLETED,
    notes: 'A sessão correu bem. A paciente discutiu mecanismos de enfrentamento.'
  },
  {
    id: 's2',
    profissionalId: 'prof1',
    patientId: 'p2',
    date: '2024-05-15',
    time: '14:00',
    duration: 50,
    status: AttendanceStatus.SCHEDULED,
    notes: ''
  },
  {
    id: 's3',
    profissionalId: 'prof2',
    patientId: 'p4',
    date: '2024-05-16',
    time: '11:00',
    duration: 50,
    status: AttendanceStatus.SCHEDULED,
    notes: 'Primeira sessão.'
  }
];

export const mockPayments: Payment[] = [
  {
    id: 'pay1',
    profissionalId: 'prof1',
    patientId: 'p1',
    amount: 250,
    date: '2024-05-15',
    status: PaymentStatus.PAID,
    serviceType: ServiceType.SINGLE
  },
  {
    id: 'pay2',
    profissionalId: 'prof2',
    patientId: 'p4',
    amount: 800,
    date: '2024-05-10',
    status: PaymentStatus.PAID,
    serviceType: ServiceType.PACKAGE
  }
];
