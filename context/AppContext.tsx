
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { Patient, Session, Payment, SessionPackage, AttendanceStatus, PackageStatus, PatientStatus, User, UserRole, UserStatus, PaymentStatus, ServiceType, Profissional } from '../types';
import { supabase, mapToCamelCase, mapToSnakeCase, getUserProfile } from '../services/supabase';

interface AppContextType {
  currentUser: User | null;
  activeProfissional: Profissional | null;
  activeTab: string;
  isAuthenticated: boolean;
  preSelectedPatientId: string | null;
  loading: boolean;
  allPatients: Patient[];
  visiblePatients: Patient[];
  visibleSessions: Session[];
  visiblePayments: Payment[];
  visiblePackages: SessionPackage[];
  profissionais: Profissional[];
  users: User[];
  setActiveTab: (tab: string) => void;
  setActiveProfissional: (profissional: Profissional | null) => void;
  setPreSelectedPatientId: (id: string | null) => void;
  login: (email: string, password?: string) => Promise<{ success: boolean, message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean, message?: string }>;
  logout: () => Promise<void>;
  addPatient: (patient: Omit<Patient, 'id' | 'profissionalId'>) => Promise<void>;
  updatePatient: (patient: Patient) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addSession: (session: Omit<Session, 'id' | 'profissionalId'>) => Promise<{ success: boolean, message?: string }>;
  updateSession: (session: Session) => Promise<{ success: boolean, message?: string }>;
  rescheduleSession: (oldSessionId: string, newSlot: { date: string, time: string, notes?: string }) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'profissionalId'>) => Promise<Payment | null>;
  updatePayment: (payment: Payment) => Promise<void>;
  addPackage: (pkg: Omit<SessionPackage, 'id' | 'profissionalId'>) => Promise<void>;
  updatePackage: (pkg: SessionPackage) => Promise<void>;
  addUser: (user: Omit<User, 'id'> & {password: string}) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addProfissional: (prof: Omit<Profissional, 'id' | 'criadoEm'>) => Promise<void>;
  updateProfissional: (prof: Profissional) => Promise<void>;
  deleteProfissional: (id: string) => Promise<void>;
  getAvailableCredits: (patientId: string, type: ServiceType) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeProfissional, setActiveProfissional] = useState<Profissional | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [preSelectedPatientId, setPreSelectedPatientId] = useState<string | null>(null);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async (user: User) => {
    try {
      const professionalIds = user.professionalAccess || [];
      const isAdmin = user.role === UserRole.ADMIN;
      
      const profQuery = supabase.from('profissionais').select('*');
      if (!isAdmin) profQuery.in('id', professionalIds);
      const { data: profData } = await profQuery;
      if (profData) setProfissionais(profData.map(p => mapToCamelCase(p) as Profissional));

      const fetchPiece = async (table: string, setter: (val: any) => void) => {
        let q = supabase.from(table).select('*');
        if (!isAdmin) q = q.in('profissional_id', professionalIds);
        const { data, error } = await q;
        if (error) return;
        if (data) setter(data.map(d => mapToCamelCase(d)));
      };

      await Promise.allSettled([
        fetchPiece('patients', setPatients),
        fetchPiece('sessions', setSessions),
        fetchPiece('payments', setPayments),
        fetchPiece('session_packages', setPackages),
        (async () => {
          const { data } = await supabase.from('profiles').select('*');
          if (data) setUsers(data.map(u => mapToCamelCase(u) as User));
        })()
      ]);
    } catch (e) { 
      console.error("Erro ao carregar dados:", e); 
    }
  };

  const handleSession = useCallback(async (session: any) => {
    try {
      if (session?.user) {
        let profile = await getUserProfile(session.user.id);
        
        if (!profile) {
          profile = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
            email: session.user.email || '',
            phone: session.user.user_metadata?.phone || '',
            role: session.user.user_metadata?.role || UserRole.STANDARD,
            status: UserStatus.ACTIVE,
            professionalAccess: session.user.user_metadata?.professional_access || []
          };
        }

        const formattedProfile: User = { 
          ...profile, 
          professionalAccess: Array.isArray(profile.professionalAccess) ? profile.professionalAccess : [] 
        };
        
        setCurrentUser(formattedProfile);
        setAuthenticated(true);
        await fetchAllData(formattedProfile);
      } else {
        setCurrentUser(null);
        setAuthenticated(false);
      }
    } catch (e) { 
      console.error("Erro no processamento da sessão:", e); 
      setAuthenticated(false);
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const setupAuth = async () => {
      try {
        if (!supabase || !supabase.auth) {
            if (mounted) setLoading(false);
            return { unsubscribe: () => {} };
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) await handleSession(session);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          if (event === 'SIGNED_OUT') { 
            setCurrentUser(null); 
            setAuthenticated(false); 
            setLoading(false); 
          }
          else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            await handleSession(session); 
          }
        });

        return subscription;
      } catch (err) {
        console.error("Auth setup error:", err);
        if (mounted) setLoading(false);
        return { unsubscribe: () => {} };
      }
    };
    
    const authSubscriptionPromise = setupAuth();
    
    return () => {
      mounted = false;
      authSubscriptionPromise.then(sub => sub && typeof sub.unsubscribe === 'function' && sub.unsubscribe());
    };
  }, [handleSession]);

  const visiblePatients = useMemo(() => patients.filter(p => p.profissionalId === activeProfissional?.id), [patients, activeProfissional]);
  const visibleSessions = useMemo(() => sessions.filter(s => s.profissionalId === activeProfissional?.id), [sessions, activeProfissional]);
  const visiblePayments = useMemo(() => payments.filter(p => p.profissionalId === activeProfissional?.id), [payments, activeProfissional]);
  const visiblePackages = useMemo(() => packages.filter(p => p.profissionalId === activeProfissional?.id), [packages, activeProfissional]);

  const getAvailableCredits = useCallback((patientId: string, type: ServiceType): number => {
    if (!activeProfissional) return 0;
    const consumedStatuses = [
      AttendanceStatus.COMPLETED, 
      AttendanceStatus.ABSENT_WITHOUT_NOTICE, 
      AttendanceStatus.SCHEDULED,
      AttendanceStatus.CONFIRMED
    ];
    
    const isPackageRequest = type === ServiceType.PACKAGE;
    
    const relevantPackages = visiblePackages.filter(pkg => 
      pkg.patientId === patientId && 
      pkg.status === PackageStatus.ACTIVE &&
      (isPackageRequest ? pkg.totalSessions > 1 : pkg.totalSessions === 1)
    );
    
    const totalGranted = relevantPackages.reduce((acc, curr) => acc + curr.totalSessions, 0);
    
    const totalConsumed = visibleSessions.filter(s => 
      s.patientId === patientId && 
      s.packageId && 
      relevantPackages.some(pkg => pkg.id === s.packageId) &&
      consumedStatuses.includes(s.status)
    ).length;

    let remaining = Math.max(0, totalGranted - totalConsumed);
    
    if (!isPackageRequest) {
      const paidPaymentsWithoutPackage = visiblePayments.filter(p => 
        p.patientId === patientId && 
        p.serviceType === ServiceType.SINGLE && 
        p.status === PaymentStatus.PAID &&
        !visiblePackages.some(pkg => pkg.paymentId === p.id)
      ).length;
      
      const consumedWithoutPackage = visibleSessions.filter(s => 
        s.patientId === patientId && 
        s.serviceType === ServiceType.SINGLE && 
        !s.packageId &&
        consumedStatuses.includes(s.status)
      ).length;
      
      remaining += Math.max(0, paidPaymentsWithoutPackage - consumedWithoutPackage);
    }
    
    return remaining;
  }, [activeProfissional, visiblePackages, visiblePayments, visibleSessions]);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: password! });
      if (error) {
        setLoading(false);
        let message = error.message;
        if (message === 'Invalid login credentials') message = 'E-mail ou senha incorretos.';
        return { success: false, message };
      }
      if (data.session) await handleSession(data.session);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, message: err.message || 'Erro inesperado durante o login.' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { 
        data: { 
          name, 
          role: UserRole.STANDARD, 
          status: UserStatus.INACTIVE, 
          professional_access: [] 
        } 
      } 
    });
    if (error) return { success: false, message: error.message };
    return { success: true };
  };

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (supabase && supabase.auth) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error("Erro durante logout de rede:", e);
    } finally {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase.auth.token') || key.includes('sb-'))) {
          localStorage.removeItem(key);
        }
      }
      setCurrentUser(null);
      setAuthenticated(false);
      setActiveProfissional(null);
      setLoading(false);
      window.location.replace('/');
    }
  }, []);

  const addPatient = async (patientData: Omit<Patient, 'id' | 'profissionalId'>) => {
    if (!activeProfissional) throw new Error("Sem profissional");
    const { data, error } = await supabase.from('patients').insert([mapToSnakeCase({ ...patientData, dateOfBirth: patientData.dateOfBirth || null, profissionalId: activeProfissional.id })]).select();
    if (error) throw error;
    if (data && data[0]) setPatients(prev => [...prev, mapToCamelCase(data[0]) as Patient]);
  };

  const updatePatient = async (updated: Patient) => {
    const { id, ...rest } = updated;
    const { data, error } = await supabase.from('patients').update(mapToSnakeCase({ ...rest, dateOfBirth: rest.dateOfBirth || null })).eq('id', id).select();
    if (error) throw error;
    if (data && data[0]) setPatients(prev => prev.map(p => p.id === id ? mapToCamelCase(data[0]) as Patient : p));
  };

  const deletePatient = async (id: string) => {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const addSession = async (sessionData: Omit<Session, 'id' | 'profissionalId'>) => {
    if (!activeProfissional) return { success: false, message: "Sem profissional" };
    const { data, error } = await supabase.from('sessions').insert([mapToSnakeCase({ ...sessionData, profissionalId: activeProfissional.id })]).select();
    if (error) return { success: false, message: 'Erro ao salvar' };
    if (data && data[0]) {
      const newSession = mapToCamelCase(data[0]) as Session;
      setSessions(prev => [...prev, newSession]);
    }
    return { success: true };
  };

  const updateSession = async (updated: Session) => {
    const { id, profissionalId, ...rest } = updated;
    const { data, error } = await supabase.from('sessions').update(mapToSnakeCase(rest)).eq('id', id).select();
    
    if (error) {
      console.error("Erro ao atualizar sessão:", error);
      return { success: false, message: error.message };
    }
    
    if (data && data[0]) {
      const newS = mapToCamelCase(data[0]) as Session;
      setSessions(prev => prev.map(s => s.id === id ? newS : s));
      return { success: true };
    }
    
    return { success: false, message: "Sessão não encontrada para atualização." };
  };

  const rescheduleSession = async (oldSessionId: string, newSlot: { date: string, time: string, notes?: string }) => {
    const old = sessions.find(s => s.id === oldSessionId);
    if (!old) return;
    await updateSession({ ...old, status: AttendanceStatus.RESCHEDULED });
    const { id: _, profissionalId: __, ...base } = old;
    await addSession({ ...base, date: newSlot.date, time: newSlot.time, status: AttendanceStatus.SCHEDULED, notes: newSlot.notes || `Reagendado.` });
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'profissionalId'>) => {
    if (!activeProfissional) throw new Error("Sem profissional");
    const { data, error } = await supabase.from('payments').insert([mapToSnakeCase({ ...paymentData, profissionalId: activeProfissional.id })]).select();
    if (error) throw error;
    if (data && data[0]) {
      const newP = mapToCamelCase(data[0]) as Payment;
      setPayments(prev => [...prev, newP]);
      return newP;
    }
    return null;
  };

  const updatePayment = async (updated: Payment) => {
    const { id, ...rest } = updated;
    const { data, error } = await supabase.from('payments').update(mapToSnakeCase({ ...rest, profissionalId: activeProfissional?.id })).eq('id', id).select();
    if (error) throw error;
    if (data && data[0]) setPayments(prev => prev.map(p => p.id === id ? mapToCamelCase(data[0]) as Payment : p));
  };

  const addPackage = async (pkgData: Omit<SessionPackage, 'id' | 'profissionalId'>) => {
    if (!activeProfissional) throw new Error("Sem profissional");
    const { data, error } = await supabase.from('session_packages').insert([mapToSnakeCase({ ...pkgData, profissionalId: activeProfissional.id })]).select();
    if (error) throw error;
    if (data && data[0]) setPackages(prev => [...prev, mapToCamelCase(data[0]) as SessionPackage]);
  };

  const updatePackage = async (updated: SessionPackage) => {
    const { id, ...rest } = updated;
    const { data, error } = await supabase.from('session_packages').update(mapToSnakeCase(rest)).eq('id', id).select();
    if (error) throw error;
    if (data && data[0]) setPackages(prev => prev.map(p => p.id === id ? mapToCamelCase(data[0]) as SessionPackage : p));
  };

  const addUser = async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({ email: userData.email, password: userData.password, options: { data: { name: userData.name, role: userData.role, status: userData.status, phone: userData.phone, professional_access: userData.professional_access || [] } } });
    if (error) throw error;
    if (data.user) {
      const { data: uData } = await supabase.from('profiles').select('*');
      if (uData) setUsers(uData.map(u => mapToCamelCase(u) as User));
    }
  };

  const updateUser = async (userToUpdate: User) => {
    const { id, password, ...rest } = userToUpdate;
    const { data, error } = await supabase.from('profiles').update(mapToSnakeCase(rest)).eq('id', id).select();
    if (error) throw error;
    if (data && data[0]) {
      const updated = mapToCamelCase(data[0]) as User;
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
      if (id === currentUser?.id) setCurrentUser(updated);
    }
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addProfissional = async (profData: Omit<Profissional, 'id' | 'criadoEm'>) => {
    const { data, error } = await supabase.from('profissionais').insert([mapToSnakeCase(profData)]).select();
    if (error) throw error;
    if (data && data[0]) setProfissionais(prev => [...prev, mapToCamelCase(data[0]) as Profissional]);
  };

  const updateProfissional = async (profToUpdate: Profissional) => {
    const { id, criadoEm, ...rest } = profToUpdate;
    const payload = mapToSnakeCase(rest);
    const { data, error } = await supabase.from('profissionais').update(payload).eq('id', id).select();
    if (error) throw error;
    if (data && data[0]) {
      const updated = mapToCamelCase(data[0]) as Profissional;
      setProfissionais(prev => prev.map(p => p.id === id ? updated : p));
      if (id === activeProfissional?.id) setActiveProfissional(updated);
    }
  };

  const deleteProfissional = async (id: string) => {
    const { error } = await supabase.from('profissionais').delete().eq('id', id);
    if (error) throw error;
    setProfissionais(prev => prev.filter(p => p.id !== id));
    if (id === activeProfissional?.id) setActiveProfissional(null);
  };

  return (
    <AppContext.Provider value={{ 
      currentUser, activeTab, setActiveTab, activeProfissional, setActiveProfissional, 
      preSelectedPatientId, setPreSelectedPatientId, isAuthenticated, loading, login, register, logout, 
      addPatient, updatePatient, deletePatient, addSession, updateSession, rescheduleSession, addPayment, 
      updatePayment, addPackage, updatePackage, addUser, updateUser, deleteUser, addProfissional, updateProfissional, deleteProfissional, getAvailableCredits, 
      allPatients: patients, visiblePatients, visibleSessions, visiblePayments, visiblePackages, profissionais, users
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser usado dentro de um AppProvider');
  return context;
};
