// Firebase Auth Hook - Copie para src/hooks/useAuth.tsx no novo projeto
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';

// Tipos
interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  status: 'pending' | 'approved' | 'rejected';
  credits: number;
  storage_used: number;
  storage_limit: number;
  auth_provider: string;
  created_at: Date;
  updated_at: Date;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, whatsapp?: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider de autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar perfil do usuário no Firestore
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        return { id: profileSnap.id, ...profileSnap.data() } as Profile;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  };

  // Criar perfil inicial no Firestore
  const createProfile = async (
    userId: string, 
    email: string, 
    fullName: string, 
    whatsapp?: string,
    authProvider: string = 'email'
  ): Promise<void> => {
    const profileRef = doc(db, 'profiles', userId);
    
    const newProfile: Omit<Profile, 'id'> = {
      email,
      full_name: fullName,
      avatar_url: null,
      whatsapp: whatsapp || null,
      status: 'pending', // Mude para 'approved' se não precisar de aprovação
      credits: 100, // Créditos iniciais
      storage_used: 0,
      storage_limit: 1073741824, // 1GB em bytes
      auth_provider: authProvider,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await setDoc(profileRef, {
      ...newProfile,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  };

  // Observar mudanças de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userProfile = await fetchProfile(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Cadastro com email/senha
  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    whatsapp?: string
  ): Promise<UserCredential> => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Atualizar displayName no Firebase Auth
      await updateProfile(credential.user, { displayName: fullName });
      
      // Criar perfil no Firestore
      await createProfile(credential.user.uid, email, fullName, whatsapp, 'email');
      
      // Buscar perfil criado
      const newProfile = await fetchProfile(credential.user.uid);
      setProfile(newProfile);
      
      toast.success('Conta criada com sucesso!');
      return credential;
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      // Mensagens de erro amigáveis
      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'Este email já está em uso.',
        'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
        'auth/invalid-email': 'Email inválido.',
      };
      
      toast.error(errorMessages[error.code] || 'Erro ao criar conta.');
      throw error;
    }
  };

  // Login com email/senha
  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      
      const userProfile = await fetchProfile(credential.user.uid);
      setProfile(userProfile);
      
      toast.success('Login realizado com sucesso!');
      return credential;
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-email': 'Email inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      };
      
      toast.error(errorMessages[error.code] || 'Erro ao fazer login.');
      throw error;
    }
  };

  // Login com Google
  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const credential = await signInWithPopup(auth, provider);
      
      // Verificar se já existe perfil
      let userProfile = await fetchProfile(credential.user.uid);
      
      // Se não existe, criar
      if (!userProfile) {
        await createProfile(
          credential.user.uid,
          credential.user.email || '',
          credential.user.displayName || 'Usuário',
          undefined,
          'google'
        );
        userProfile = await fetchProfile(credential.user.uid);
      }
      
      setProfile(userProfile);
      toast.success('Login realizado com sucesso!');
      return credential;
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Login cancelado.');
      } else {
        toast.error('Erro ao fazer login com Google.');
      }
      throw error;
    }
  };

  // Logout
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setProfile(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout.');
      throw error;
    }
  };

  // Recuperar senha
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      console.error('Erro ao recuperar senha:', error);
      
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'Email não encontrado.',
        'auth/invalid-email': 'Email inválido.',
      };
      
      toast.error(errorMessages[error.code] || 'Erro ao enviar email.');
      throw error;
    }
  };

  // Atualizar perfil manualmente
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      const updatedProfile = await fetchProfile(user.uid);
      setProfile(updatedProfile);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar autenticação
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}
